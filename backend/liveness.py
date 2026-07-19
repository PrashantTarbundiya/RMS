import cv2
import numpy as np
import logging

logger = logging.getLogger('rms-liveness')

def evaluate_liveness(face_roi_bgr, threshold=100.0):
    """
    Evaluates the liveness of a face ROI (Region of Interest) using texture and blur analysis.
    This is a lightweight heuristic approach suitable for edge devices.
    Returns: (is_live: bool, liveness_score: float, reason: str)
    """
    if face_roi_bgr is None or face_roi_bgr.size == 0:
        return False, 0.0, "Invalid face ROI"

    try:
        gray = cv2.cvtColor(face_roi_bgr, cv2.COLOR_BGR2GRAY)
        
        # 1. Blur Detection (Laplacian Variance)
        # Spoofs (printed photos or phones) are often slightly out of focus
        # compared to a real 3D face positioned naturally in front of a camera.
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 2. Specular Reflection / Moiré Pattern Check
        # Phone screens often emit light differently and cause clipping/specular highlights.
        # We check the percentage of pixels that are extremely bright.
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        bright_pixels = np.sum(hist[240:])
        total_pixels = face_roi_bgr.shape[0] * face_roi_bgr.shape[1]
        bright_ratio = bright_pixels / total_pixels
        
        is_live = True
        reason = "Pass"
        liveness_score = laplacian_var

        if laplacian_var < threshold:
            is_live = False
            reason = f"Failed blur test (Variance: {laplacian_var:.2f} < {threshold})"
        elif bright_ratio > 0.05:  # more than 5% of face is blown out (common with screen glare)
            is_live = False
            reason = f"Failed glare test (Bright Ratio: {bright_ratio:.2%})"
            
        return is_live, liveness_score, reason

    except Exception as e:
        logger.error(f"Liveness evaluation failed: {e}")
        return True, 100.0, "Error during evaluation (bypassed)"
