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

from org_storage import get_encodings_path, get_dataset_cleaned_dir

def get_feedback_log_path(org_id=None):
    if org_id:
        return os.path.join(BACKEND_DIR, 'data', 'orgs', org_id, 'feedback_log.json')
    return os.path.join(BACKEND_DIR, 'data', 'feedback_log.json')

# How many extra copies of a verified embedding to inject (weight boost)
VERIFIED_BOOST_COPIES = 2

# Per-person adaptive thresholds (tightened on false positives)
_adaptive_thresholds = {}


def _load_feedback_log(org_id=None):
    """Load the append-only feedback log."""
    path = get_feedback_log_path(org_id)
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_feedback_log(log, org_id=None):
    """Save the feedback log."""
    path = get_feedback_log_path(org_id)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(log, f, indent=2)


def _load_encodings(org_id=None):
    """Load current encodings.pickle."""
    path = get_encodings_path(org_id)
    if not os.path.exists(path):
        return None
    with open(path, 'rb') as f:
        return pickle.load(f)


def _save_encodings(data, org_id=None):
    """Save encodings.pickle."""
    path = get_encodings_path(org_id)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        pickle.dump(data, f)


def generate_prediction_id():
    """Generate a unique prediction ID for tracking feedback."""
    return str(uuid.uuid4())[:12]


def store_prediction_for_feedback(prediction_id, image_bgr, face_crop, predicted_name, confidence, embedding=None, org_id=None):
    """
    Store the prediction context in the log (unresolved state).
    Only recent N predictions are kept in memory to avoid bloat.
    """
    if embedding is None:
        return

    log = _load_feedback_log(org_id)
    
    # Store embedding as list for JSON serialization
    emb_list = embedding.tolist() if isinstance(embedding, np.ndarray) else embedding
    
    entry = {
        'id': prediction_id,
        'timestamp': datetime.now().isoformat(),
        'predicted_name': predicted_name,
        'confidence': confidence,
        'embedding': emb_list,
        'status': 'pending',      # pending, confirmed, corrected
        'actual_name': None,
        'action_taken': None      # 'verified_boost', 'reassigned', 'added_new', 'ignored'
    }
    
    log.append(entry)
    
    # Keep only last 1000 to prevent infinite growth
    if len(log) > 1000:
        log = log[-1000:]
        
    _save_feedback_log(log, org_id)


# In-memory cache for pending predictions (TTL = 10 min)
_prediction_cache = {}


def process_feedback(prediction_id, is_correct, correct_name=None, org_id=None):
    """
    Process operator feedback on a prediction.
    
    Args:
        prediction_id: ID of the prediction being reviewed
        is_correct: True if the prediction was correct
        correct_name: If is_correct=False, the actual person's name
        org_id: Organization context
    
    Returns:
        dict with 'success', 'message', and 'action_taken'
    """
    # Retrieve the cached prediction
    log = _load_feedback_log(org_id)
    target_entry = next((e for e in log if e['id'] == prediction_id), None)
    
    if target_entry is None:
        return {
            'success': False,
            'message': 'Prediction expired or not found.',
            'action_taken': 'none'
        }
    
    embedding = np.array(target_entry['embedding'])
    predicted_name = target_entry['predicted_name']
    
    # Load current encodings
    data = _load_encodings(org_id)
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
    
    if target_name == "FALSE_DETECTION":
        return {
            'success': True,
            'message': 'False detection ignored.',
            'action_taken': 'ignored_false_positive'
        }

    if is_correct:
        # ═══ POSITIVE FEEDBACK: Boost this embedding ═══
        if predicted_name and predicted_name != "Unknown":
            for _ in range(VERIFIED_BOOST_COPIES):
                encodings.append(embedding)
                names.append(predicted_name)
            action_taken = 'verified_boost'
            message = f'Boosted embedding for {predicted_name}'
    
    else:
        # ═══ NEGATIVE FEEDBACK: Correct the model ═══
        if correct_name and correct_name.strip():
            correct_name = correct_name.strip().replace(' ', '_')
            for _ in range(VERIFIED_BOOST_COPIES + 1):
                encodings.append(embedding)
                names.append(correct_name)
            
            if predicted_name != "Unknown":
                _adaptive_thresholds[predicted_name] = max(0.40, _adaptive_thresholds.get(predicted_name, 0.50) - 0.05)
                action_taken = 'misidentification_fixed'
            else:
                action_taken = 'false_negative_fixed'
            message = f'Re-labeled to {correct_name}.'
        else:
            if predicted_name and predicted_name != "Unknown":
                _adaptive_thresholds[predicted_name] = _adaptive_thresholds.get(predicted_name, 0.35) - 0.03
                action_taken = 'false_positive_tightened'
    
    # Save updated encodings
    data['encodings'] = encodings
    data['names'] = names
    _save_encodings(data, org_id)
    
    target_entry['status'] = 'corrected' if not is_correct else 'confirmed'
    target_entry['action_taken'] = action_taken
    _save_feedback_log(log, org_id)
    
    return {
        'success': True,
        'message': message,
        'action_taken': action_taken
    }


def get_adaptive_threshold(person_name, default=0.35):
    """Get the adaptive threshold for a person (may have been tightened by feedback)."""
    return _adaptive_thresholds.get(person_name, default)


def get_feedback_stats(org_id=None):
    """Calculate system accuracy based on operator feedback."""
    log = _load_feedback_log(org_id)
    if not log:
        return {'accuracy': 0, 'total_feedback': 0, 'confirmed': 0, 'corrected': 0}
    
    total = len(log)
    correct = sum(1 for e in log if e.get('user_correct', True))
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
