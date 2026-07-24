"""
liveness.py — Anti-spoofing liveness detection for RMS Face AI.

Evaluates whether a detected face ROI is a live person or a presentation attack
(printed photo, screen replay, video replay). Uses an ensemble of classical
heuristic checks to reject spoofs before ML inference occurs.

Checks implemented:
  1. Edge Density (Laplacian Variance) — rejects flat/blurry printed photos
  2. Specular Glare Detection — rejects faces with screen glass reflections
  3. Color Variance Analysis (HSV) — rejects uniform color reproduction
  4. Moiré / Screen FFT Detection — rejects screen sub-pixel grid patterns
  5. Multi-frame Micro-movement — rejects static photos/screens (optional)

Security posture: FAIL-CLOSED. Any error or ambiguity results in rejection.
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger('rms-liveness')

# ─── Thresholds (calibrated for real webcam/phone cameras) ──────────────
# Previously these were too aggressive and caused real faces to be rejected.
# Now calibrated to reject obvious spoofs while accepting live webcam input.

LAPLACIAN_THRESHOLD = 10.0       # Minimum edge density
BRIGHT_RATIO_THRESHOLD = 0.40    # Max fraction of blown-out pixels — glasses + white walls
SAT_VARIANCE_THRESHOLD = 5.0     # Min std-dev of HSV Saturation — low lighting
HUE_VARIANCE_THRESHOLD = 3.0     # Min std-dev of HSV Hue — uniform lighting
MOIRE_PEAK_THRESHOLD = 0.60      # Max moiré periodicity score — monitor reflections in glasses
MICRO_MOVEMENT_THRESHOLD = 2.0   # Min pixel displacement across multi-frame

# Minimum number of FAILED checks required to declare spoof
# (voting system — a single borderline check doesn't reject)
MIN_FAILED_CHECKS_FOR_SPOOF = 2


def evaluate_liveness(face_roi_bgr, threshold=None, frames=None):
    """
    Evaluates the liveness of a face ROI using multiple anti-spoofing checks.

    Uses a VOTING system: the face is rejected only if at least
    MIN_FAILED_CHECKS_FOR_SPOOF checks fail. This prevents false
    rejections from a single borderline heuristic while still catching
    obvious presentation attacks (printed photos, screen replays).

    Args:
        face_roi_bgr: BGR numpy array of the cropped face region.
        threshold: Optional override for the Laplacian threshold.
        frames: Optional list of additional BGR face ROIs captured ~200ms apart
                 for multi-frame micro-movement analysis.

    Returns:
        (is_live: bool, liveness_score: float, reason: str, details: dict)

    Security: FAIL-CLOSED on errors. Voting on normal operation.
    """
    if face_roi_bgr is None or face_roi_bgr.size == 0:
        return False, 0.0, "Invalid face ROI", {}

    lap_threshold = threshold if threshold is not None else LAPLACIAN_THRESHOLD
    details = {}
    failed_checks = []

    try:
        gray = cv2.cvtColor(face_roi_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]

        # Minimum size guard — very small crops produce unreliable results
        if h < 40 or w < 40:
            return False, 0.0, "Face ROI too small for liveness analysis", {}

        # ── Check 1: Edge Density (Laplacian Variance) ──────────────────
        # Real faces have rich texture detail. Blurry prints or low-res
        # screen displays have lower edge density.
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        details['laplacian_variance'] = round(float(laplacian_var), 2)
        details['laplacian_threshold'] = lap_threshold

        if laplacian_var < lap_threshold:
            failed_checks.append(
                f"Failed edge density (Variance: {laplacian_var:.2f} < {lap_threshold})"
            )

        # ── Check 2: Specular Glare Detection ───────────────────────────
        # Phone/tablet glass produces specular highlights (bright spots).
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        bright_pixels = float(np.sum(hist[240:]))
        total_pixels = float(h * w)
        bright_ratio = bright_pixels / total_pixels
        details['bright_ratio'] = round(bright_ratio, 4)
        details['bright_threshold'] = BRIGHT_RATIO_THRESHOLD

        if bright_ratio > BRIGHT_RATIO_THRESHOLD:
            failed_checks.append(
                f"Failed glare test (Bright Ratio: {bright_ratio:.2%} > {BRIGHT_RATIO_THRESHOLD:.2%})"
            )

        # ── Check 3: Color Variance Analysis (HSV) ──────────────────────
        # Real faces have natural variance in saturation and hue.
        hsv = cv2.cvtColor(face_roi_bgr, cv2.COLOR_BGR2HSV)
        sat_std = float(np.std(hsv[:, :, 1]))
        hue_std = float(np.std(hsv[:, :, 0]))
        details['saturation_std'] = round(sat_std, 2)
        details['hue_std'] = round(hue_std, 2)
        details['sat_threshold'] = SAT_VARIANCE_THRESHOLD
        details['hue_threshold'] = HUE_VARIANCE_THRESHOLD

        if sat_std < SAT_VARIANCE_THRESHOLD and hue_std < HUE_VARIANCE_THRESHOLD:
            failed_checks.append(
                f"Failed color variance (Sat σ: {sat_std:.2f}, Hue σ: {hue_std:.2f})"
            )

        # ── Check 4: Moiré / Screen FFT Detection ──────────────────────
        moire_score = _detect_moire_pattern(gray)
        details['moire_score'] = round(moire_score, 4)
        details['moire_threshold'] = MOIRE_PEAK_THRESHOLD

        if moire_score > MOIRE_PEAK_THRESHOLD:
            failed_checks.append(
                f"Failed moiré/screen detection (Score: {moire_score:.4f} > {MOIRE_PEAK_THRESHOLD})"
            )

        # ── Check 5: Multi-frame Micro-movement (optional) ─────────────
        if frames and len(frames) >= 2:
            movement = _check_micro_movement(face_roi_bgr, frames)
            details['micro_movement'] = round(movement, 2)
            details['movement_threshold'] = MICRO_MOVEMENT_THRESHOLD
            details['frames_analyzed'] = len(frames) + 1

            if movement < MICRO_MOVEMENT_THRESHOLD:
                failed_checks.append(
                    f"Failed micro-movement (Movement: {movement:.2f}px < {MICRO_MOVEMENT_THRESHOLD}px)"
                )

        # ── Check 6: Anti-Spoof CNN Vote (if model is available) ──────
        try:
            from antispoof_model import predict_antispoof, is_antispoof_model_available
            if is_antispoof_model_available():
                cnn_is_real, cnn_confidence, cnn_available = predict_antispoof(face_roi_bgr)
                details['antispoof_cnn'] = {
                    'is_real': cnn_is_real,
                    'confidence': round(cnn_confidence, 4),
                    'available': cnn_available,
                }
                if not cnn_is_real:
                    failed_checks.append(
                        f"Failed anti-spoof CNN (Confidence: {cnn_confidence:.4f})"
                    )
        except ImportError:
            pass  # Module not available — classical checks remain active

        # ── Voting Decision ─────────────────────────────────────────────
        details['failed_checks'] = failed_checks
        details['failed_count'] = len(failed_checks)
        details['min_failed_for_spoof'] = MIN_FAILED_CHECKS_FOR_SPOOF

        composite_score = _compute_composite_score(
            laplacian_var, lap_threshold,
            bright_ratio, sat_std, hue_std, moire_score
        )
        details['composite_score'] = round(composite_score, 2)

        if len(failed_checks) >= MIN_FAILED_CHECKS_FOR_SPOOF:
            # Multiple checks failed — likely a spoof
            reason = f"Spoof: {len(failed_checks)} checks failed — {'; '.join(failed_checks[:3])}"
            logger.warning(f"[LIVENESS] {reason}")
            return False, composite_score, reason, details

        # Passed — either all checks passed, or only 1 borderline check failed
        if failed_checks:
            logger.info(f"[LIVENESS] Passed with warnings: {failed_checks}")
        return True, composite_score, "Pass", details

    except Exception as e:
        # FAIL-CLOSED: any error during evaluation = rejection
        logger.error(f"Liveness evaluation failed (REJECTED — fail-closed): {e}")
        return False, 0.0, f"Liveness evaluation error (rejected): {str(e)}", {}


def _detect_moire_pattern(gray):
    """
    Detect moiré patterns characteristic of screen displays using 2D FFT.
    
    Screens have a periodic sub-pixel grid that creates distinctive PERIODIC
    peaks in the Fourier magnitude spectrum. Real faces have random
    high-frequency texture noise but NOT periodic peaks.
    
    Key insight: We detect PERIODICITY (regular repeating peaks), not just
    raw high-frequency energy — natural skin texture has high-freq content
    but it's random/aperiodic, while screen grids are strictly periodic.
    
    Returns a score (0.0–1.0) where higher = more likely screen display.
    """
    # Resize to standard size for consistent FFT analysis
    resized = cv2.resize(gray, (128, 128))
    
    # Apply window function to reduce spectral leakage
    window = np.outer(np.hanning(128), np.hanning(128))
    windowed = resized.astype(np.float64) * window

    # 2D FFT
    f_transform = np.fft.fft2(windowed)
    f_shift = np.fft.fftshift(f_transform)
    magnitude = np.abs(f_shift)
    
    # Avoid log(0)
    magnitude = np.log1p(magnitude)
    
    center_y, center_x = 64, 64
    y_grid, x_grid = np.ogrid[-center_y:128-center_y, -center_x:128-center_x]
    dist_from_center = np.sqrt(x_grid**2 + y_grid**2)
    
    # Focus on the mid-to-high frequency band (radius 20-55)
    # This is where screen pixel grid patterns typically appear
    mid_high_mask = (dist_from_center > 20) & (dist_from_center < 55)
    
    mid_high_values = magnitude[mid_high_mask]
    if len(mid_high_values) == 0 or np.mean(mid_high_values) == 0:
        return 0.0
    
    # Detect periodicity via "peakiness" — ratio of strong peaks to mean
    # Screen grids produce a few very strong periodic peaks
    # Real skin texture produces many weak, evenly distributed values
    mean_val = float(np.mean(mid_high_values))
    std_val = float(np.std(mid_high_values))
    max_val = float(np.max(mid_high_values))
    
    if mean_val == 0:
        return 0.0
    
    # Coefficient of variation: high for periodic patterns, low for random noise
    cv = std_val / mean_val
    
    # Peak-to-mean ratio: high for periodic patterns
    peak_ratio = max_val / mean_val
    
    # Count number of strong peaks (> 3x mean) — periodic patterns have several
    strong_peaks = int(np.sum(mid_high_values > mean_val * 3.0))
    total_points = len(mid_high_values)
    peak_fraction = strong_peaks / total_points if total_points > 0 else 0
    
    # Combine signals: periodic patterns have high CV, high peak ratio,
    # and a small fraction of very strong peaks
    periodicity_score = 0.0
    
    # Strong periodic patterns: few dominant peaks (peak_fraction < 5%)
    # with very high amplitude (peak_ratio > 4)
    if peak_ratio > 4.0 and peak_fraction < 0.05:
        periodicity_score = min(1.0, (peak_ratio - 4.0) / 6.0)
    
    # Also flag if coefficient of variation is unusually high
    if cv > 1.5:
        periodicity_score = max(periodicity_score, min(1.0, (cv - 1.5) / 2.0))
    
    return periodicity_score


def _check_micro_movement(primary_frame, additional_frames):
    """
    Check for natural micro-movement across multiple frames.
    
    Real faces exhibit subtle position drift (head sway, micro-saccades)
    even when a person is trying to hold still. A completely static face
    (identical position across all frames) indicates a photo or screen.
    
    Returns the average pixel displacement of face landmarks across frames.
    """
    try:
        # Use template matching on the grayscale face region
        # to measure displacement between frames
        primary_gray = cv2.cvtColor(primary_frame, cv2.COLOR_BGR2GRAY)
        
        # Resize all frames to same dimensions for consistent comparison
        target_h, target_w = primary_gray.shape[:2]
        if target_h < 20 or target_w < 20:
            return 0.0
        
        displacements = []
        
        for frame in additional_frames:
            if frame is None or frame.size == 0:
                continue
            
            frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            frame_gray = cv2.resize(frame_gray, (target_w, target_h))
            
            # Compute absolute difference between frames
            diff = cv2.absdiff(primary_gray, frame_gray)
            
            # Threshold to find regions of significant change
            _, thresh = cv2.threshold(diff, 15, 255, cv2.THRESH_BINARY)
            
            # Count changed pixels as a fraction of total
            changed_fraction = float(np.sum(thresh > 0)) / float(target_h * target_w)
            
            # Also compute the centroid shift of the changed region
            moments = cv2.moments(thresh)
            if moments['m00'] > 0:
                cx = moments['m10'] / moments['m00']
                cy = moments['m01'] / moments['m00']
                # Displacement from center
                displacement = np.sqrt((cx - target_w/2)**2 + (cy - target_h/2)**2)
                displacements.append(displacement + changed_fraction * 100)
            else:
                # No change detected at all — highly suspicious
                displacements.append(0.0)
        
        if not displacements:
            return 0.0
        
        return float(np.mean(displacements))
    
    except Exception as e:
        logger.warning(f"Micro-movement check failed: {e}")
        # Fail-closed: if we can't check movement, report zero movement
        return 0.0


def _compute_composite_score(laplacian_var, lap_threshold, bright_ratio,
                              sat_std, hue_std, moire_score):
    """
    Compute a composite liveness score (0–100) from all individual signals.
    Higher = more likely to be a real face.
    """
    # Normalize each signal to 0–1 range (1 = most live-like)
    edge_score = min(1.0, laplacian_var / (lap_threshold * 5))
    glare_score = max(0.0, 1.0 - (bright_ratio / BRIGHT_RATIO_THRESHOLD))
    color_score = min(1.0, (sat_std / (SAT_VARIANCE_THRESHOLD * 3) + 
                            hue_std / (HUE_VARIANCE_THRESHOLD * 3)) / 2)
    screen_score = max(0.0, 1.0 - (moire_score / MOIRE_PEAK_THRESHOLD))
    
    # Weighted combination
    composite = (
        edge_score * 0.25 +
        glare_score * 0.15 +
        color_score * 0.25 +
        screen_score * 0.35
    ) * 100
    
    return min(100.0, max(0.0, composite))
