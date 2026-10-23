"""
ensemble.py — Ensemble voting logic for combining predictions from multiple face recognition models.

Combines predictions from:
  1. DeepFace (Facenet512) — distance-based matching
  2. SOTA MobileNetV2 — classification-based

Uses weighted confidence scoring with dynamic weight redistribution,
agreement bonuses, and raw weighted-score output for informative confidence.
"""


# Default model weights for ensemble voting (Modernized: Facenet512 primary, InsightFace verifier, GhostFaceNet edge, VGG-Face deprecated)
# Default model weights for ensemble voting (Modernized: Facenet512 primary, InsightFace verifier, GhostFaceNet & VGGFace disabled)
DEFAULT_WEIGHTS = {
    'facenet512': 1.0,    # Primary — Highly accurate FaceNet512
    'insightface': 0.35,  # Optional Secondary — Fast ArcFace model
    'ghostfacenet': 0.00, # Disabled/Removed
    'vggface': 0.00,      # Disabled/Removed
}

# ─── Binary Recognition Thresholds ─────────────────────────────────────
# Two-tier threshold system for clean 100%/Unknown output
HARD_MATCH_THRESHOLD = 0.70    # Above this (>= 70%) → Authenticated match (Access Granted)
SOFT_MATCH_THRESHOLD = 0.50    # Between 50% and 70% → Diagnostic suggestion only (Unconfirmed)
# Below 50% → "Unknown" (Access Denied)

AGREEMENT_BONUS = 0.08         # Bonus when 2+ models agree on same name
FULL_AGREEMENT_BONUS = 0.12   # Bonus when 3/3 models agree
DISAGREEMENT_PENALTY = 0.12   # Penalty when models disagree

UNKNOWN_LABEL = "Unknown"

# Labels that indicate a model failed to run, was never trained, or was disabled
INACTIVE_LABELS = frozenset({'[UNTRAINED]', 'Not Trained', 'Not Loaded', 'Error', 'Disabled', ''})
SKIP_LABELS = INACTIVE_LABELS


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
        custom_threshold: optional float overriding the default confidence threshold from the user (e.g. 0.70)

    Returns:
        dict: {'label': str, 'confidence': float, 'method': str,
               'agreement': str, 'is_recognized': bool}
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    # Gather active models that actually executed inference
    active_preds = {}

    for model_key in ['facenet512', 'insightface', 'ghostfacenet', 'vggface']:
        pred = predictions.get(model_key, {})
        label = pred.get('label', '')
        conf = float(pred.get('confidence', 0.0))

        if label not in INACTIVE_LABELS:
            active_preds[model_key] = {'label': label, 'confidence': conf}

    # If NO models were trained or loaded, then and only then is it 'no_valid_models'
    if not active_preds:
        return {
            'label': UNKNOWN_LABEL,
            'confidence': 0.0,
            'method': 'no_valid_models',
            'details': predictions,
            'is_recognized': False,
        }

    num_active = len(active_preds)
    fallback_method = 'single_model' if num_active == 1 else 'ensemble'

    # Filter for models that predicted a specific identity (not Unknown, not SPOOF)
    named_preds = {k: v for k, v in active_preds.items() if v['label'] not in ('Unknown', 'SPOOF', UNKNOWN_LABEL)}

    # If all models evaluated and concluded Unknown, report Unknown with the highest candidate similarity
    if not named_preds:
        max_conf = max((p['confidence'] for p in active_preds.values()), default=0.0)
        return {
            'label': UNKNOWN_LABEL,
            'confidence': round(max_conf, 3),
            'method': fallback_method,
            'agreement': f"0/{num_active}",
            'details': predictions,
            'is_recognized': False,
        }

    # ── Dynamic Weight Redistribution ──
    # Only consider weights for models that actually predicted a candidate identity
    active_weights = {k: weights.get(k, 0.25) for k in named_preds}
    total_active_weight = sum(active_weights.values())

    # Normalize so active weights sum to 1.0
    if total_active_weight > 0:
        for k in active_weights:
            active_weights[k] /= total_active_weight

    # ── Tally Votes ──
    label_scores = {}

    for model_key, pred in named_preds.items():
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
    num_valid = len(named_preds)

    # Base threshold: use user-defined threshold if passed, else default to 0.70
    base_hard = HARD_MATCH_THRESHOLD
    if custom_threshold is not None:
        try:
            ct = float(custom_threshold)
            if ct > 1.0:
                ct /= 100.0  # normalize if passed as percentage (e.g. 70 -> 0.70)
            if 0.35 <= ct <= 0.95:
                base_hard = ct
        except (ValueError, TypeError):
            pass

    base_soft = max(0.40, base_hard - 0.20)

    # ── Agreement / Disagreement Adjustments ──
    num_agreeing = len(best_voters)

    if num_agreeing >= 3:
        # Full agreement — strong boost, lower threshold
        best_score = min(1.0, best_score + FULL_AGREEMENT_BONUS)
        effective_hard_threshold = max(0.45, base_hard - 0.10)
        effective_soft_threshold = max(0.35, base_soft - 0.05)
    elif num_agreeing >= 2:
        # Majority agreement — standard boost
        best_score = min(1.0, best_score + AGREEMENT_BONUS)
        effective_hard_threshold = base_hard
        effective_soft_threshold = base_soft
    else:
        # Single model or disagreement
        if num_valid > 1:
            best_score = max(0, best_score - DISAGREEMENT_PENALTY)
            effective_hard_threshold = min(0.90, base_hard + 0.10)
            effective_soft_threshold = base_soft + 0.05
        else:
            # Single model fallback — if it is a Tier-1 deep model (facenet512 or insightface),
            # DO NOT penalize with +0.15! Keep effective_hard_threshold at base_hard (70%)!
            solo_key = list(named_preds.keys())[0]
            if solo_key in ['facenet512', 'insightface']:
                effective_hard_threshold = base_hard
                effective_soft_threshold = base_soft
            else:
                effective_hard_threshold = min(0.85, base_hard + 0.10)
                effective_soft_threshold = base_soft + 0.05

    # ── Single High-Confidence Override ──
    if num_valid == 1:
        solo_key = list(named_preds.keys())[0]
        solo_conf = list(named_preds.values())[0]['confidence']
        if solo_key in ['facenet512', 'insightface'] and solo_conf >= 0.40:
            best_score = max(best_score, solo_conf)
        else:
            best_score = min(best_score, effective_soft_threshold - 0.05)

    # Apply Threshold Logic — always report raw weighted score as confidence
    if best_score >= effective_hard_threshold:
        # HARD MATCH → person confirmed with high confidence (>= 70%), authenticated
        final_label = best_label
        final_confidence = round(best_score, 3)
        is_recognized = True
    elif best_score >= effective_soft_threshold:
        # SOFT MATCH (50% - 69%) → possible match, but NOT confirmed for biometric authentication
        final_label = f"Uncertain: {best_label}"
        final_confidence = round(best_score, 3)
        is_recognized = False
    else:
        # BELOW THRESHOLD (< 50%) → Unknown, not recognized
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
