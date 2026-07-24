"""
test_liveness.py — Regression test suite for liveness anti-spoofing checks.

Run with: python test_liveness.py (from /backend directory)

Tests each liveness signal independently and in combination against
synthetic attack scenarios. This test suite MUST be re-run after every
future change to liveness.py or the ensemble pipeline.

Test Categories:
  1. Unit tests for each liveness check (edge density, glare, color, moiré, movement)
  2. Integration tests for the full evaluate_liveness() pipeline
  3. Fail-closed behavior tests (error handling)
  4. Threshold boundary tests
"""

import sys
import os
import numpy as np
import cv2

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liveness import (
    evaluate_liveness, _detect_moire_pattern, _check_micro_movement,
    LAPLACIAN_THRESHOLD, BRIGHT_RATIO_THRESHOLD,
    SAT_VARIANCE_THRESHOLD, HUE_VARIANCE_THRESHOLD, MOIRE_PEAK_THRESHOLD
)

passed = 0
failed = 0
total = 0


def assert_test(condition, test_name, details=""):
    global passed, failed, total
    total += 1
    if condition:
        passed += 1
        print(f"  ✓ PASS: {test_name}")
    else:
        failed += 1
        print(f"  ✗ FAIL: {test_name} — {details}")


def create_real_face_like(h=160, w=160):
    """Create a synthetic image that mimics real face properties:
    high edge density, varied color, no moiré patterns."""
    img = np.zeros((h, w, 3), dtype=np.uint8)
    # Natural skin-like base with color variation
    for y in range(h):
        for x in range(w):
            b = int(140 + 30 * np.sin(y/20) + np.random.normal(0, 15))
            g = int(170 + 25 * np.cos(x/15) + np.random.normal(0, 15))
            r = int(200 + 20 * np.sin((x+y)/25) + np.random.normal(0, 15))
            img[y, x] = [max(0, min(255, b)), max(0, min(255, g)), max(0, min(255, r))]
    
    # Add facial features (edges)
    cv2.ellipse(img, (w//3, h//3), (12, 8), 0, 0, 360, (80, 60, 40), 2)
    cv2.ellipse(img, (2*w//3, h//3), (12, 8), 0, 0, 360, (80, 60, 40), 2)
    cv2.line(img, (w//2, h//3+10), (w//2, h//2+5), (120, 100, 80), 2)
    cv2.ellipse(img, (w//2, 2*h//3), (20, 8), 0, 0, 180, (100, 70, 70), 2)
    
    # Add texture noise
    noise = np.random.normal(0, 8, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    return img


def create_printed_photo(h=160, w=160):
    """Simulated printed photo: blurred, compressed color range."""
    img = create_real_face_like(h, w)
    img = cv2.GaussianBlur(img, (11, 11), 3.0)
    img = (img * 0.7 + 50).astype(np.uint8)
    return img


def create_screen_replay(h=160, w=160):
    """Simulated screen replay: periodic sub-pixel grid + screen glare.
    Designed to trigger EITHER glare or moiré checks."""
    img = create_real_face_like(h, w).astype(np.int16)
    # Add strong periodic sub-pixel grid (vertical stripes every 3 pixels)
    for y in range(h):
        for x in range(w):
            if x % 3 == 0:
                img[y, x, 2] = min(255, img[y, x, 2] + 60)
            elif x % 3 == 1:
                img[y, x, 1] = min(255, img[y, x, 1] + 60)
            else:
                img[y, x, 0] = min(255, img[y, x, 0] + 60)
    img = np.clip(img, 0, 255).astype(np.uint8)
    # Add larger glare spots (screen glass reflection — covering >5% of area)
    cv2.circle(img, (w//3, h//4), 22, (255, 255, 255), -1)
    cv2.circle(img, (2*w//3, h//5), 18, (248, 252, 255), -1)
    cv2.circle(img, (w//2, 3*h//4), 14, (245, 245, 255), -1)
    return img


def create_uniform_color_image(h=160, w=160):
    """Flat uniform color image."""
    img = np.full((h, w, 3), [150, 180, 200], dtype=np.uint8)
    noise = np.random.normal(0, 2, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img


def create_bright_glare_image(h=160, w=160):
    """Image with excessive specular highlights."""
    img = create_real_face_like(h, w)
    cv2.circle(img, (w//3, h//3), 25, (255, 255, 255), -1)
    cv2.circle(img, (2*w//3, h//4), 20, (252, 252, 255), -1)
    return img


print("\n" + "="*60)
print("LIVENESS REGRESSION TEST SUITE")
print("="*60)

# ── 1. Fail-Closed Behavior Tests ──
print("\n── 1. Fail-Closed Behavior Tests ──")

is_live, score, reason, details = evaluate_liveness(None)
assert_test(is_live == False, "None input → rejected", f"is_live={is_live}")

is_live, score, reason, details = evaluate_liveness(np.array([]))
assert_test(is_live == False, "Empty array → rejected", f"is_live={is_live}")

tiny = np.zeros((10, 10, 3), dtype=np.uint8)
is_live, score, reason, details = evaluate_liveness(tiny)
assert_test(is_live == False, "Too-small ROI → rejected", f"is_live={is_live}")

# ── 2. Real Face Should Pass ──
print("\n── 2. Real Face-Like Images Should Pass ──")

real_face = create_real_face_like()
is_live, score, reason, details = evaluate_liveness(real_face)
assert_test(is_live == True, "Synthetic real face passes all checks",
            f"is_live={is_live}, reason={reason}, details={details}")

# ── 3. Printed Photo Should Fail ──
print("\n── 3. Printed Photo Attack Should Fail ──")

printed = create_printed_photo()
is_live, score, reason, details = evaluate_liveness(printed)
assert_test(is_live == False, "Printed photo (blurred) rejected",
            f"is_live={is_live}, reason={reason}")

# ── 4. Screen Replay Should Fail ──
print("\n── 4. Screen Replay Attack Should Fail ──")

screen = create_screen_replay()
is_live, score, reason, details = evaluate_liveness(screen)
assert_test(is_live == False, "Screen replay (moiré+glare) rejected",
            f"is_live={is_live}, reason={reason}")

# ── 5. Uniform Color Should Fail ──
print("\n── 5. Uniform Color Image Should Fail ──")

uniform = create_uniform_color_image()
is_live, score, reason, details = evaluate_liveness(uniform)
assert_test(is_live == False, "Uniform color image rejected",
            f"is_live={is_live}, reason={reason}")

# ── 6. Excessive Glare Should Fail ──
print("\n── 6. Excessive Glare (Screen Glass) Should Fail ──")

glary = create_bright_glare_image()
is_live, score, reason, details = evaluate_liveness(glary)
assert_test(is_live == False, "Bright glare image rejected",
            f"is_live={is_live}, reason={reason}")

# ── 7. Multi-Frame Movement Tests ──
print("\n── 7. Multi-Frame Micro-Movement Tests ──")

static_frame = create_real_face_like()
static_frames = [static_frame.copy() for _ in range(3)]
movement = _check_micro_movement(static_frame, static_frames)
assert_test(movement < 2.0, "Static frames show zero/low movement",
            f"movement={movement:.2f}")

moved_frames = []
for i in range(3):
    shifted = np.roll(static_frame, shift=i*5+3, axis=1)
    shifted = np.roll(shifted, shift=i*3+2, axis=0)
    noise = np.random.normal(0, 5, shifted.shape).astype(np.int16)
    shifted = np.clip(shifted.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    moved_frames.append(shifted)

movement = _check_micro_movement(static_frame, moved_frames)
assert_test(movement >= 2.0, "Shifted frames show significant movement",
            f"movement={movement:.2f}")

# ── 8. Threshold Configuration Tests ──
print("\n── 8. Threshold Configuration Tests ──")

assert_test(LAPLACIAN_THRESHOLD == 80.0, 
            f"Laplacian threshold is 80.0 (tightened from 30.0)",
            f"actual={LAPLACIAN_THRESHOLD}")

assert_test(BRIGHT_RATIO_THRESHOLD == 0.05,
            f"Bright ratio threshold is 0.05 (tightened from 0.10)",
            f"actual={BRIGHT_RATIO_THRESHOLD}")

assert_test(SAT_VARIANCE_THRESHOLD > 0,
            f"Saturation variance threshold is set ({SAT_VARIANCE_THRESHOLD})")

assert_test(HUE_VARIANCE_THRESHOLD > 0,
            f"Hue variance threshold is set ({HUE_VARIANCE_THRESHOLD})")

assert_test(MOIRE_PEAK_THRESHOLD > 0,
            f"Moiré threshold is set ({MOIRE_PEAK_THRESHOLD})")

# ── 9. Return Shape Tests ──
print("\n── 9. Return Shape Tests ──")

is_live, score, reason, details = evaluate_liveness(create_real_face_like())
assert_test(isinstance(is_live, bool), "is_live is bool")
assert_test(isinstance(score, float), "score is float")
assert_test(isinstance(reason, str), "reason is str")
assert_test(isinstance(details, dict), "details is dict")

if is_live:
    assert_test('composite_score' in details, "Live result has composite_score")
    assert_test('laplacian_variance' in details, "Live result has laplacian_variance")

# ═══════════════════════════════════════════════════════════════════
print("\n" + "="*60)
if failed == 0:
    print(f"ALL TESTS PASSED: {passed}/{total}")
else:
    print(f"FAILURES: {failed}/{total} tests failed")
print("="*60 + "\n")

sys.exit(0 if failed == 0 else 1)
