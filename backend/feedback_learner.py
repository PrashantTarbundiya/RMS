"""
feedback_learner.py — Online learning from operator feedback at the gate.

When the system makes a prediction, the operator can:
  1. Confirm it's correct (✅) → embedding gets a 'verified' boost
  2. Correct it (❌ + real name) → embedding is re-labeled or added

This is NOT full retraining. Each feedback update takes < 1 second.
Over time, the system becomes more accurate for the specific deployment.

Storage: feedback_log.json (append-only audit trail)
         encodings.pickle  (live updates)
"""

import os
import json
import time
import pickle
import uuid
import numpy as np
import cv2
from datetime import datetime
from scipy.spatial.distance import cosine
from add_person_utils import check_image_quality, recompute_person_embeddings

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ENCODINGS_PATH = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')
FEEDBACK_LOG_PATH = os.path.join(BACKEND_DIR, 'data', 'feedback_log.json')

# How many extra copies of a verified embedding to inject (weight boost)
VERIFIED_BOOST_COPIES = 2

# Per-person adaptive thresholds (tightened on false positives)
_adaptive_thresholds = {}


def _load_feedback_log():
    """Load the append-only feedback log."""
    if os.path.exists(FEEDBACK_LOG_PATH):
        try:
            with open(FEEDBACK_LOG_PATH, 'r') as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_feedback_log(log):
    """Save the feedback log."""
    os.makedirs(os.path.dirname(FEEDBACK_LOG_PATH), exist_ok=True)
    with open(FEEDBACK_LOG_PATH, 'w') as f:
        json.dump(log, f, indent=2)


def _load_encodings():
    """Load current encodings.pickle."""
    if not os.path.exists(ENCODINGS_PATH):
        return None
    with open(ENCODINGS_PATH, 'rb') as f:
        return pickle.load(f)


def _save_encodings(data):
    """Save updated encodings.pickle."""
    os.makedirs(os.path.dirname(ENCODINGS_PATH), exist_ok=True)
    with open(ENCODINGS_PATH, 'wb') as f:
        pickle.dump(data, f)


def generate_prediction_id():
    """Generate a unique prediction ID for tracking feedback."""
    return str(uuid.uuid4())[:12]


def store_prediction_for_feedback(prediction_id, embedding, predicted_name, distance, face_img=None):
    """
    Temporarily store the embedding and face image from a prediction so feedback can reference it.
    Uses an in-memory cache with TTL (predictions expire after 10 minutes).
    """
    _prediction_cache[prediction_id] = {
        'embedding': embedding,
        'face_img': face_img,
        'predicted_name': predicted_name,
        'distance': distance,
        'timestamp': time.time()
    }
    # Cleanup old entries (> 10 min)
    cutoff = time.time() - 600
    expired = [k for k, v in _prediction_cache.items() if v['timestamp'] < cutoff]
    for k in expired:
        del _prediction_cache[k]


# In-memory cache for pending predictions (TTL = 10 min)
_prediction_cache = {}


def process_feedback(prediction_id, is_correct, correct_name=None):
    """
    Process operator feedback on a prediction.
    
    Args:
        prediction_id: ID of the prediction being reviewed
        is_correct: True if the prediction was correct
        correct_name: If is_correct=False, the actual person's name
    
    Returns:
        dict with 'success', 'message', and 'action_taken'
    """
    # Retrieve the cached prediction
    cached = _prediction_cache.get(prediction_id)
    if cached is None:
        return {
            'success': False,
            'message': 'Prediction expired or not found. Feedback window is 10 minutes.',
            'action_taken': 'none'
        }
    
    embedding = cached['embedding']
    predicted_name = cached['predicted_name']
    distance = cached['distance']
    
    # Load current encodings
    data = _load_encodings()
    if data is None:
        return {
            'success': False,
            'message': 'No encodings file found. Train the model first.',
            'action_taken': 'none'
        }
    
    encodings = data.get('encodings', [])
    names = data.get('names', [])
    action_taken = 'none'
    message = ''
    
    target_name = correct_name if not is_correct else predicted_name
    added_to_dataset = False
    
    if target_name == "FALSE_DETECTION":
        return {
            'success': True,
            'message': 'False detection ignored. Will not train on this false positive.',
            'action_taken': 'ignored_false_positive'
        }
    
    # Check if we should add the image to the dataset for retraining
    if is_correct and face_img is not None and target_name != "Unknown":
        # Only add high quality images
        is_valid, issues = check_image_quality(face_img)
        if is_valid:
            try:
                # Save image to dataset
                person_dir = os.path.join(BACKEND_DIR, 'dataset', target_name)
                os.makedirs(person_dir, exist_ok=True)
                img_path = os.path.join(person_dir, f'feedback_{prediction_id}.jpg')
                cv2.imwrite(img_path, face_img)
                
                # Update embeddings only for this person
                recompute_person_embeddings(target_name)
                added_to_dataset = True
                print(f"✅ Feedback Learner: Added high quality feedback image for {target_name}.")
            except Exception as e:
                print(f"❌ Feedback Learner: Error saving feedback image for {target_name}: {e}")
        else:
            print(f"⚠️ Feedback Learner: Feedback image for {target_name} ignored due to quality: {issues}")

    if is_correct:
        # ═══ POSITIVE FEEDBACK: Boost this embedding ═══
        if predicted_name and predicted_name != "Unknown":
            boost_copies = VERIFIED_BOOST_COPIES if not added_to_dataset else 1
            for _ in range(boost_copies):
                encodings.append(embedding)
                names.append(predicted_name)
            action_taken = 'verified_boost'
            message = f'Boosted embedding for {predicted_name} (+{boost_copies} copies)'
        else:
            action_taken = 'acknowledged'
            message = 'Unknown prediction confirmed as correct (no person nearby)'
    
    else:
        # ═══ NEGATIVE FEEDBACK: Correct the model ═══
        if correct_name and correct_name.strip():
            correct_name = correct_name.strip().replace(' ', '_')
            
            if predicted_name == "Unknown":
                # FALSE NEGATIVE: Known person was not recognized
                # → Add this embedding to the correct person's set
                for _ in range(VERIFIED_BOOST_COPIES + 1):  # Extra boost since it was missed
                    encodings.append(embedding)
                    names.append(correct_name)
                action_taken = 'false_negative_fixed'
                message = f'Added {VERIFIED_BOOST_COPIES + 1} embeddings for {correct_name} (was missed)'
            
            else:
                # WRONG PERSON: System said A, but it's actually B
                # → Add embedding with correct label
                for _ in range(VERIFIED_BOOST_COPIES + 1):
                    encodings.append(embedding)
                    names.append(correct_name)
                
                # Tighten threshold for the wrongly predicted person
                _adaptive_thresholds[predicted_name] = _adaptive_thresholds.get(predicted_name, 0.35) - 0.02
                
                action_taken = 'misidentification_fixed'
                message = (f'Re-labeled from {predicted_name} to {correct_name}. '
                          f'Tightened threshold for {predicted_name}.')
        else:
            # FALSE POSITIVE: System said a name but no one was there / wrong
            # → Tighten the predicted person's threshold
            if predicted_name and predicted_name != "Unknown":
                _adaptive_thresholds[predicted_name] = _adaptive_thresholds.get(predicted_name, 0.35) - 0.03
                action_taken = 'false_positive_tightened'
                message = f'Tightened threshold for {predicted_name} to prevent future false positives'
            else:
                action_taken = 'acknowledged'
                message = 'Feedback recorded'
    
    # Save updated encodings
    data['encodings'] = encodings
    data['names'] = names
    _save_encodings(data)
    
    # Log the feedback (audit trail)
    log = _load_feedback_log()
    log.append({
        'prediction_id': prediction_id,
        'timestamp': datetime.now().isoformat(),
        'predicted_name': predicted_name,
        'is_correct': is_correct,
        'correct_name': correct_name,
        'distance': float(distance) if distance else None,
        'action_taken': action_taken,
        'message': message,
    })
    _save_feedback_log(log)
    
    # Remove from cache (feedback processed)
    del _prediction_cache[prediction_id]
    
    return {
        'success': True,
        'message': message,
        'action_taken': action_taken,
        'total_encodings': len(encodings)
    }


def get_adaptive_threshold(person_name, default=0.35):
    """Get the adaptive threshold for a person (may have been tightened by feedback)."""
    return _adaptive_thresholds.get(person_name, default)


def get_feedback_stats():
    """Get summary statistics from the feedback log."""
    log = _load_feedback_log()
    if not log:
        return {'total': 0, 'correct': 0, 'incorrect': 0, 'accuracy': 0}
    
    total = len(log)
    correct = sum(1 for entry in log if entry.get('is_correct', False))
    incorrect = total - correct
    
    return {
        'total': total,
        'correct': correct,
        'incorrect': incorrect,
        'accuracy': round(correct / total * 100, 1) if total > 0 else 0,
        'last_feedback': log[-1]['timestamp'] if log else None,
        'actions': {
            action: sum(1 for e in log if e.get('action_taken') == action)
            for action in set(e.get('action_taken', 'none') for e in log)
        }
    }
