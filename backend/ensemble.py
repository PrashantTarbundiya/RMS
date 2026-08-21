"""
ensemble.py — Ensemble voting logic for combining predictions from multiple face recognition models.

Combines predictions from:
  1. DeepFace (Facenet512) — distance-based matching
  2. SOTA MobileNetV2 — classification-based

Uses weighted confidence scoring with dynamic weight redistribution,
agreement bonuses, and raw weighted-score output for informative confidence.
"""


# Default model weights for ensemble voting
DEFAULT_WEIGHTS = {
    'facenet512': 0.30,   # Primary — Original highly accurate model
    'insightface': 0.35,  # Secondary — Fast ArcFace model
    'ghostfacenet': 0.15, # Edge — lightweight mobile model
    'vggface': 0.20,      # Legacy — VGG-Face deep model
}

# ─── Binary Recognition Thresholds ─────────────────────────────────────
# Two-tier threshold system for clean 100%/Unknown output
HARD_MATCH_THRESHOLD = 0.45    # Above this → 100% match (person detected!)
SOFT_MATCH_THRESHOLD = 0.30    # Between soft and hard → "Possible: Name"
# Below soft → "Unknown"

AGREEMENT_BONUS = 0.12         # Bonus when 2+ models agree on same name
FULL_AGREEMENT_BONUS = 0.18   # Bonus when 3/3 models agree
DISAGREEMENT_PENALTY = 0.10   # Penalty when models disagree

UNKNOWN_LABEL = "Unknown"

# Labels that indicate a model didn't produce a real prediction
SKIP_LABELS = frozenset({'[UNTRAINED]', 'Not Trained', 'Not Loaded', 'Error', '', 'Unknown'})


def ensemble_predict(predictions, weights=None, custom_threshold=None):
    """
    Combine predictions from multiple models using weighted voting
    with dynamic weight redistribution and binary output.

    Output behavior:
      - Score >= HARD_MATCH_THRESHOLD  -> label = name, confidence = raw score, is_recognized = True
      - SOFT <= Score < HARD           -> label = name, confidence = raw score, is_recognized = True
      - Score < SOFT_MATCH_THRESHOLD  -> label = "Unknown", confidence = raw score, is_recognized = False

    When all models agree, thresholds are relaxed (easier to match).
    When models disagree on name, thresholds are tightened.

    Args:
        predictions: dict with keys 'edge', 'deepface', each containing:
            {'label': str, 'confidence': float, 'confidence_level': str}
        weights: optional dict overriding DEFAULT_WEIGHTS
        custom_threshold: optional float overriding the default distance threshold from the user

    Returns:
        dict: {'label': str, 'confidence': float, 'method': str,
               'agreement': str, 'is_recognized': bool}
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    # Gather valid predictions (skip untrained/error models)
    valid_preds = {}

    for model_key in ['facenet512', 'insightface', 'ghostfacenet', 'vggface']:
        pred = predictions.get(model_key, {})
        label = pred.get('label', '')
        conf = pred.get('confidence', 0.0)

        if label not in SKIP_LABELS and conf >= 0:
            valid_preds[model_key] = {'label': label, 'confidence': conf}

    if not valid_preds:
        return {
            'label': UNKNOWN_LABEL,
            'confidence': 0.0,
            'method': 'no_valid_models',
            'details': predictions,
            'is_recognized': False,
        }

    # ── Dynamic Weight Redistribution ──
    # Only consider weights for models that actually voted.
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
    num_valid = len(valid_preds)

    # ── Agreement / Disagreement Adjustments ──
    num_agreeing = len(best_voters)

    if num_agreeing >= 3:
        # Full agreement — strong boost, lower threshold
        best_score = min(1.0, best_score + FULL_AGREEMENT_BONUS)
        effective_hard_threshold = HARD_MATCH_THRESHOLD - 0.10  # Easier to match
        effective_soft_threshold = SOFT_MATCH_THRESHOLD - 0.05
    elif num_agreeing >= 2:
        # Majority agreement — standard boost
        best_score = min(1.0, best_score + AGREEMENT_BONUS)
        effective_hard_threshold = HARD_MATCH_THRESHOLD
        effective_soft_threshold = SOFT_MATCH_THRESHOLD
    else:
        # No agreement — all models said different names
        if num_valid > 1:
            best_score = max(0, best_score - DISAGREEMENT_PENALTY)
            effective_hard_threshold = HARD_MATCH_THRESHOLD + 0.10  # Harder to match
            effective_soft_threshold = SOFT_MATCH_THRESHOLD + 0.05
        else:
            # Single model fallback — reasonably adjust thresholds
            effective_hard_threshold = HARD_MATCH_THRESHOLD + 0.15  # e.g., 0.60
            effective_soft_threshold = SOFT_MATCH_THRESHOLD + 0.10  # e.g., 0.40

    # ── Single High-Confidence Override ──
    # If single model and very confident, trust it
    if num_valid == 1:
        single_conf = list(valid_preds.values())[0]['confidence']
        if single_conf >= 0.80:
            best_score = max(best_score, single_conf * 0.85)

    # Note: custom_threshold is a distance threshold used by find_match_knn.
    # The ensemble uses its own confidence-based thresholds and should NOT
    # re-interpret the distance threshold. Models already gate on distance
    # before reporting their confidence to the ensemble.

    # Apply Threshold Logic — always report raw weighted score as confidence
    if best_score >= effective_hard_threshold:
        # HARD MATCH → person confirmed, show raw ensemble score
        final_label = best_label
        final_confidence = round(best_score, 3)
        is_recognized = True
    elif best_score >= effective_soft_threshold:
        # SOFT MATCH → possible match, show raw ensemble score
        final_label = best_label
        final_confidence = round(best_score, 3)
        is_recognized = True
    else:
        # BELOW THRESHOLD → Unknown, still report raw score for diagnostics
        final_label = UNKNOWN_LABEL
        final_confidence = round(best_score, 3)
        is_recognized = False


    # Determine consensus method
    if num_agreeing >= 3:
        method = 'full_agreement'
    elif num_agreeing >= 2:
        method = 'majority_vote'
    elif num_valid == 1:
        method = 'single_model'
    else:
        method = 'highest_weighted'

    return {
        'label': final_label,
        'confidence': final_confidence,
        'method': method,
        'agreement': f"{num_agreeing}/{num_valid}",
        'is_recognized': is_recognized,
        'details': predictions,
    }
