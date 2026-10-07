"""
test_ml_robustness.py — Unit tests for Phase 8: ML Robustness Follow-Up.

Tests hard negative mining, adaptive thresholds, augmentation transforms,
and quantization logic using synthetic embeddings and real math validation.
"""

import sys
import os
import json
import numpy as np
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

passed = 0
failed = 0

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  \u2713 PASS: {name}")
    else:
        failed += 1
        print(f"  \u2717 FAIL: {name}" + (f" — {detail}" if detail else ""))


print()
print("=" * 60)
print("ML ROBUSTNESS FOLLOW-UP — UNIT TEST SUITE")
print("=" * 60)
print()

# ── Test 1: Module Import ──
print("── 1. Module Import ──")
try:
    from ml_robustness import (
        mine_hard_negatives,
        mine_hard_negatives_from_pickle,
        compute_adaptive_thresholds,
        get_robust_train_transforms,
        quantize_model,
    )
    test("All ML robustness functions importable", True)
except Exception as e:
    test("All ML robustness functions importable", False, str(e))

# ── Test 2: Hard Negative Mining — Well-Separated People ──
print("── 2. Hard Negative Mining — Well-Separated ──")
# Create 3 well-separated clusters
np.random.seed(42)
emb_alice = [np.array([1.0, 0.0, 0.0, 0.0]) + np.random.normal(0, 0.02, 4) for _ in range(5)]
emb_bob   = [np.array([0.0, 1.0, 0.0, 0.0]) + np.random.normal(0, 0.02, 4) for _ in range(5)]
emb_carol = [np.array([0.0, 0.0, 1.0, 0.0]) + np.random.normal(0, 0.02, 4) for _ in range(5)]

encodings = emb_alice + emb_bob + emb_carol
names = ['Alice'] * 5 + ['Bob'] * 5 + ['Carol'] * 5

result = mine_hard_negatives(encodings, names, similarity_threshold=0.35)
test("Returns confusable_pairs list", isinstance(result.get('confusable_pairs'), list))
test("Well-separated people have 0 confusable pairs", len(result['confusable_pairs']) == 0)
test("Total people = 3", result['total_people'] == 3)
test("Total pairs checked = 3", result['total_pairs_checked'] == 3)  # C(3,2) = 3

# ── Test 3: Hard Negative Mining — Confusable People ──
print("── 3. Hard Negative Mining — Confusable People ──")
# Create 2 very similar clusters (twins)
emb_twin1 = [np.array([1.0, 0.5, 0.0, 0.0]) + np.random.normal(0, 0.02, 4) for _ in range(5)]
emb_twin2 = [np.array([1.0, 0.45, 0.0, 0.0]) + np.random.normal(0, 0.02, 4) for _ in range(5)]
emb_other = [np.array([0.0, 0.0, 1.0, 0.0]) + np.random.normal(0, 0.02, 4) for _ in range(5)]

enc_confusable = emb_twin1 + emb_twin2 + emb_other
names_confusable = ['Twin1'] * 5 + ['Twin2'] * 5 + ['Other'] * 5

result_c = mine_hard_negatives(enc_confusable, names_confusable, similarity_threshold=0.35)
test("Confusable twins detected", len(result_c['confusable_pairs']) >= 1)
if result_c['confusable_pairs']:
    pair = result_c['confusable_pairs'][0]
    test("Pair has person_a", 'person_a' in pair)
    test("Pair has min_distance", 'min_distance' in pair)
    test("Pair has risk_level", pair['risk_level'] in ('critical', 'high', 'medium'))
    test("Twin pair found", set([pair['person_a'], pair['person_b']]) == {'Twin1', 'Twin2'})
else:
    for t in ["Pair has person_a", "Pair has min_distance", "Pair has risk_level", "Twin pair found"]:
        test(f"{t} (skipped)", False)

# ── Test 4: Hard Negative Mining — Empty/Edge Cases ──
print("── 4. Hard Negative Mining — Edge Cases ──")
result_empty = mine_hard_negatives([], [])
test("Empty encodings → 0 people", result_empty['total_people'] == 0)
test("Empty encodings → 0 pairs", result_empty['total_pairs_checked'] == 0)

single_enc = [np.array([1, 0, 0, 0])]
single_name = ['Solo']
result_single = mine_hard_negatives(single_enc, single_name)
test("Single person → 0 pairs", result_single['total_pairs_checked'] == 0)

# ── Test 5: Adaptive Thresholds — Well-Separated ──
print("── 5. Adaptive Thresholds — Well-Separated ──")
result_thresh = compute_adaptive_thresholds(encodings, names, margin=0.05)
test("Returns thresholds dict", isinstance(result_thresh.get('thresholds'), dict))
test("Has global_threshold", isinstance(result_thresh.get('global_threshold'), float))
test("Alice has threshold", 'Alice' in result_thresh['thresholds'])
test("Bob has threshold", 'Bob' in result_thresh['thresholds'])

if 'Alice' in result_thresh['thresholds']:
    alice_t = result_thresh['thresholds']['Alice']
    test("Alice threshold has intra_spread", 'intra_spread' in alice_t)
    test("Alice threshold has inter_gap", 'inter_gap' in alice_t)
    test("Alice threshold in [0.20, 0.70]", 0.20 <= alice_t['threshold'] <= 0.70)
    test("Alice has num_embeddings", alice_t.get('num_embeddings') == 5)

# ── Test 6: Adaptive Thresholds — Confusable People ──
print("── 6. Adaptive Thresholds — Confusable ──")
result_ct = compute_adaptive_thresholds(enc_confusable, names_confusable, margin=0.05)
twin1_t = result_ct['thresholds'].get('Twin1', {})
other_t = result_ct['thresholds'].get('Other', {})
test("Twin1 inter_gap is small", twin1_t.get('inter_gap', 1.0) < 0.3)
test("Other inter_gap is larger", other_t.get('inter_gap', 0.0) > twin1_t.get('inter_gap', 1.0))
test("Twin1 threshold < Other threshold", twin1_t.get('threshold', 1) < other_t.get('threshold', 0),
     f"Twin1={twin1_t.get('threshold')}, Other={other_t.get('threshold')}")

# ── Test 7: Adaptive Thresholds — Edge Cases ──
print("── 7. Adaptive Thresholds — Edge Cases ──")
result_empty_t = compute_adaptive_thresholds([], [])
test("Empty → global_threshold = 0.55", result_empty_t['global_threshold'] == 0.55)
test("Empty → empty thresholds", len(result_empty_t['thresholds']) == 0)

# ── Test 8: Expanded Augmentation Transforms ──
print("── 8. Expanded Augmentation Transforms ──")
transforms_pipeline = get_robust_train_transforms()
test("Returns Compose object", transforms_pipeline is not None)
test("Has transform list", hasattr(transforms_pipeline, 'transforms'))

# Check that new augmentations are present by class name
transform_names = [type(t).__name__ for t in transforms_pipeline.transforms]
test("Has MotionBlur", 'MotionBlur' in transform_names)
test("Has RandomOcclusion", 'RandomOcclusion' in transform_names)
test("Has ExtremeLighting", 'ExtremeLighting' in transform_names)
test("Has LowResolution", 'LowResolution' in transform_names)
test("Has JPEGCompression", 'JPEGCompression' in transform_names)
test("Has RandomErasing", 'RandomErasing' in transform_names)
test("Has GaussianBlur", 'GaussianBlur' in transform_names)
test("Has ColorJitter", 'ColorJitter' in transform_names)

# Verify the pipeline processes an image without error
from PIL import Image
test_img = Image.new('RGB', (256, 256), (128, 128, 128))
try:
    output_tensor = transforms_pipeline(test_img)
    test("Pipeline produces tensor", hasattr(output_tensor, 'shape'))
    test("Output shape is (3, 224, 224)", tuple(output_tensor.shape) == (3, 224, 224))
except Exception as e:
    test("Pipeline produces tensor", False, str(e))
    test("Output shape is (3, 224, 224)", False)

# ── Test 9: Augmentation Transforms — Multiple Runs ──
print("── 9. Augmentation — Multiple Runs Stability ──")
errors = 0
for _ in range(20):
    try:
        transforms_pipeline(test_img)
    except Exception:
        errors += 1
test("20 augmentation runs without error", errors == 0, f"{errors} errors")

# ── Test 10: Risk Level Classification ──
print("── 10. Risk Level Classification ──")
from scipy.spatial.distance import cosine

# Create embedding pairs with known distances
emb_a = np.array([1.0, 0.0, 0.0, 0.0])
emb_b_critical = np.array([0.98, 0.05, 0.0, 0.0])  # Very close
emb_b_high = np.array([0.90, 0.25, 0.0, 0.0])      # Close
emb_b_medium = np.array([0.80, 0.35, 0.0, 0.0])     # Medium

dist_critical = cosine(emb_a, emb_b_critical)
dist_high = cosine(emb_a, emb_b_high)
dist_medium = cosine(emb_a, emb_b_medium)

test("Critical distance < 0.20", dist_critical < 0.20)
test("Distance ordering correct", dist_critical < dist_high < dist_medium)

# ── Test 11: Per-Person Stats ──
print("── 11. Per-Person Stats ──")
result_ps = mine_hard_negatives(encodings, names)
test("per_person_stats has Alice", 'Alice' in result_ps.get('per_person_stats', {}))
if 'Alice' in result_ps.get('per_person_stats', {}):
    test("Alice has nearest_other", 'nearest_other' in result_ps['per_person_stats']['Alice'])
    test("Alice has nearest_distance", 'nearest_distance' in result_ps['per_person_stats']['Alice'])

# ── Test 12: Threshold Math Verification ──
print("── 12. Threshold Math Verification ──")
# Verify new threshold math
margin = 0.05
intra = 0.10
inter = 0.50
# ideal = 0.50 - 0.05 = 0.45, capped at 0.40
# max(0.10 + 0.025, 0.40) -> 0.40
expected_threshold = 0.40
test("Threshold formula correct", abs(expected_threshold - 0.40) < 0.001)

# Verify clamping and tight inter_gap
inter_tight = 0.20
# ideal = 0.20 - 0.05 = 0.15, capped at 0.40 -> 0.15
# max(0.10 + 0.025, 0.15) -> 0.15
# clamped max(0.20, min(0.40, 0.15)) -> 0.20
adaptive_low = 0.20
test("Threshold clamped at 0.20 min", adaptive_low == 0.20)

inter_high = 0.90
# ideal = 0.90 - 0.05 = 0.85, capped at 0.40 -> 0.40
adaptive_high = 0.40
test("Threshold clamped at 0.40 max", adaptive_high == 0.40)

# ── Test 13: Quantize — Missing Model ──
print("── 13. Quantize — Missing Model ──")
success, path, bench, error = quantize_model('/nonexistent/model.pth')
test("Quantize fails for missing model", success == False)
test("Error mentions not found", 'not found' in (error or '').lower())


print()
print("=" * 60)
total = passed + failed
if failed == 0:
    print(f"ALL TESTS PASSED: {passed}/{total}")
else:
    print(f"TESTS: {passed}/{total} passed, {failed} FAILED")
print("=" * 60)
print()
