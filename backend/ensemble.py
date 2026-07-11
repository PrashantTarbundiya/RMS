"""
ensemble.py — Ensemble voting logic for combining predictions from multiple face recognition models.

Combines predictions from:
  1. DeepFace (Facenet512) — distance-based matching
  2. Custom CNN — classification-based
  3. SOTA MobileNetV2 — classification-based

Uses weighted confidence scoring with dynamic weight redistribution
and agreement bonuses for robust predictions.
"""


# Default model weights for ensemble voting
DEFAULT_WEIGHTS = {
    'sota': 0.55,        # Primary — best accuracy (pretrained MobileNetV2 backbone)
    'deepface': 0.35,    # Embedding-based (Facenet512) — solid for few-shot
    'cnn': 0.10,         # Custom CNN — currently polluted with LFW classes, low trust
}

# Confidence thresholds
MIN_CONFIDENCE_THRESHOLD = 0.25   # Below this = "Unknown" (lowered from 0.35)
AGREEMENT_BONUS = 0.10            # Bonus when 2+ models agree
UNKNOWN_LABEL = "Unknown"

# Labels that indicate a model didn't produce a real prediction
SKIP_LABELS = frozenset({'[UNTRAINED]', 'Not Trained', 'Not Loaded', 'Error', ''})


def ensemble_predict(predictions, weights=None):
    """
    Combine predictions from multiple models using weighted voting
    with dynamic weight redistribution.
    
    Key improvements over naive averaging:
      1. Weights are redistributed among only the models that voted
         (so 2 valid models get 100% of the weight, not 60%)
      2. Agreement bonus: if 2+ models agree, confidence is boosted
      3. Single high-confidence model can carry the result
    
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
    
    for model_key in ['deepface', 'sota', 'cnn']:
        pred = predictions.get(model_key, {})
        label = pred.get('label', '')
        conf = pred.get('confidence', 0.0)
        
        if label not in SKIP_LABELS and conf > 0:
            valid_preds[model_key] = {'label': label, 'confidence': conf}
    
    if not valid_preds:
        return {
            'label': UNKNOWN_LABEL,
            'confidence': 0.0,
            'method': 'no_valid_models',
            'details': predictions,
        }
    
    # ── Dynamic Weight Redistribution ──
    # Only consider weights for models that actually voted.
    # This ensures 2 valid models get the full combined weight.
    active_weights = {k: weights.get(k, 0.25) for k in valid_preds}
    total_active_weight = sum(active_weights.values())
    
    # Normalize so active weights sum to 1.0
    if total_active_weight > 0:
        for k in active_weights:
            active_weights[k] /= total_active_weight
    
    # ── Tally Votes ──
    label_scores = {}
    
    for model_key, pred in valid_preds.items():
        w = active_weights[model_key]
        label = pred['label']
        weighted_conf = pred['confidence'] * w
        
        if label not in label_scores:
            label_scores[label] = {'score': 0.0, 'voters': [], 'raw_confs': []}
        
        label_scores[label]['score'] += weighted_conf
        label_scores[label]['voters'].append(model_key)
        label_scores[label]['raw_confs'].append(pred['confidence'])
    
    # Find the winning label
    best_label = max(label_scores, key=lambda l: label_scores[l]['score'])
    best_info = label_scores[best_label]
    best_score = best_info['score']
    best_voters = best_info['voters']
    
    # ── Agreement Bonus ──
    # If 2+ models agree on the same person, boost confidence
    if len(best_voters) >= 2:
        best_score = min(1.0, best_score + AGREEMENT_BONUS)
    
    # ── Single High-Confidence Override ──
    # If only 1 model voted but it's very confident (>0.75), trust it
    if len(valid_preds) == 1:
        single_conf = list(valid_preds.values())[0]['confidence']
        if single_conf >= 0.75:
            best_score = max(best_score, single_conf * 0.85)  # Slight discount for single model
    
    # ── Apply Confidence Threshold ──
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
