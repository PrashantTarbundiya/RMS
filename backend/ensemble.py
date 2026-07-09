"""
ensemble.py — Ensemble voting logic for combining predictions from multiple face recognition models.

Combines predictions from:
  1. DeepFace (Facenet512) — distance-based matching
  2. Custom CNN — classification-based
  3. SOTA MobileNetV2 — classification-based

Uses weighted confidence scoring with "Unknown" fallback when consensus is low.
"""


# Default model weights for ensemble voting
DEFAULT_WEIGHTS = {
    'deepface': 0.40,   # Strongest for few-shot (embedding-based)
    'sota': 0.35,       # Good generalization (pretrained backbone)
    'cnn': 0.25,        # Custom model (less data-efficient)
}

# Confidence thresholds
MIN_CONFIDENCE_THRESHOLD = 0.35   # Below this = "Unknown"
UNKNOWN_LABEL = "Unknown"


def ensemble_predict(predictions, weights=None):
    """
    Combine predictions from multiple models using weighted voting.
    
    Args:
        predictions: dict with keys 'cnn', 'sota', 'deepface', each containing:
            {'label': str, 'confidence': float}
        weights: optional dict overriding DEFAULT_WEIGHTS
    
    Returns:
        dict: {'label': str, 'confidence': float, 'method': str, 'details': dict}
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    
    # Gather valid predictions (skip untrained/error models)
    valid_preds = {}
    skip_labels = {'[UNTRAINED]', 'Not Trained', 'Not Loaded', 'Error', ''}
    
    for model_key in ['deepface', 'sota', 'cnn']:
        pred = predictions.get(model_key, {})
        label = pred.get('label', '')
        conf = pred.get('confidence', 0.0)
        
        if label not in skip_labels and conf > 0:
            valid_preds[model_key] = {'label': label, 'confidence': conf}
    
    if not valid_preds:
        return {
            'label': UNKNOWN_LABEL,
            'confidence': 0.0,
            'method': 'no_valid_models',
            'details': predictions,
        }
    
    # Tally votes: accumulate weighted confidence per label
    label_scores = {}
    total_weight = 0.0
    
    for model_key, pred in valid_preds.items():
        w = weights.get(model_key, 0.25)
        label = pred['label']
        weighted_conf = pred['confidence'] * w
        
        if label not in label_scores:
            label_scores[label] = {'score': 0.0, 'voters': [], 'raw_confs': []}
        
        label_scores[label]['score'] += weighted_conf
        label_scores[label]['voters'].append(model_key)
        label_scores[label]['raw_confs'].append(pred['confidence'])
        total_weight += w
    
    # Normalize scores
    if total_weight > 0:
        for label in label_scores:
            label_scores[label]['score'] /= total_weight
    
    # Find the winning label
    best_label = max(label_scores, key=lambda l: label_scores[l]['score'])
    best_score = label_scores[best_label]['score']
    best_voters = label_scores[best_label]['voters']
    
    # Apply confidence threshold
    if best_score < MIN_CONFIDENCE_THRESHOLD:
        return {
            'label': UNKNOWN_LABEL,
            'confidence': best_score,
            'method': 'below_threshold',
            'best_guess': best_label,
            'details': predictions,
        }
    
    # Determine consensus method
    if len(best_voters) >= 2:
        method = 'majority_vote'
    elif len(valid_preds) == 1:
        method = 'single_model'
    else:
        method = 'highest_weighted'
    
    return {
        'label': best_label,
        'confidence': best_score,
        'method': method,
        'agreement': f"{len(best_voters)}/{len(valid_preds)}",
        'details': predictions,
    }
