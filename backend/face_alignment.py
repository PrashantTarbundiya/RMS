"""
face_alignment.py — 5-Point Canonical Facial Landmark Alignment

Implements the standard Kazemi & Sullivan / Umeyama similarity transform to normalize
facial crops to canonical 112x112 coordinates before feature extraction in ArcFace & FaceNet512.

Reference:
  Deng et al., ArcFace: Additive Angular Margin Loss for Deep Face Recognition (CVPR 2019)
  ISO/IEC 19794-5 Biometric Data Interchange Formats
"""

import cv2
import numpy as np


# Standard 112x112 ArcFace Canonical Landmark Coordinates (in pixels)
# Reference: InsightFace / ArcFace canonical 5-point template
ARCFACE_REFERENCE_POINTS_112 = np.array([
    [38.2946, 51.6963],   # Left eye pupil/center
    [73.5318, 51.5014],   # Right eye pupil/center
    [56.0252, 71.7366],   # Nose tip
    [41.5493, 92.3655],   # Left mouth corner
    [70.7299, 92.2041]    # Right mouth corner
], dtype=np.float32)

# Extended template for 160x160 (FaceNet standard)
FACENET_REFERENCE_POINTS_160 = ARCFACE_REFERENCE_POINTS_112 * (160.0 / 112.0)


def extract_5_points_from_mediapipe(landmarks, img_w, img_h):
    """
    Extract 5 canonical facial landmark points from MediaPipe FaceLandmarker result.

    Key indices:
      - 468: Left eye pupil (fallback: midpoint of 33 and 133)
      - 473: Right eye pupil (fallback: midpoint of 263 and 362)
      - 1: Nose tip
      - 61: Left mouth corner
      - 291: Right mouth corner

    Returns:
        np.ndarray of shape (5, 2) with float32 pixel coordinates.
    """
    num_pts = len(landmarks)

    # Left eye
    if num_pts > 468:
        lx = landmarks[468].x * img_w
        ly = landmarks[468].y * img_h
    else:
        lx = (landmarks[33].x + landmarks[133].x) * 0.5 * img_w
        ly = (landmarks[33].y + landmarks[133].y) * 0.5 * img_h

    # Right eye
    if num_pts > 473:
        rx = landmarks[473].x * img_w
        ry = landmarks[473].y * img_h
    else:
        rx = (landmarks[263].x + landmarks[362].x) * 0.5 * img_w
        ry = (landmarks[263].y + landmarks[362].y) * 0.5 * img_h

    # Nose tip
    nx = landmarks[1].x * img_w
    ny = landmarks[1].y * img_h

    # Left mouth corner
    lmx = landmarks[61].x * img_w
    lmy = landmarks[61].y * img_h

    # Right mouth corner
    rmx = landmarks[291].x * img_w
    rmy = landmarks[291].y * img_h

    return np.array([
        [lx, ly],
        [rx, ry],
        [nx, ny],
        [lmx, lmy],
        [rmx, rmy]
    ], dtype=np.float32)


def align_face_5point(image, five_points, output_size=(112, 112)):
    """
    Align a face image to canonical reference coordinates using a 5-point similarity transform.

    Args:
        image: BGR numpy image array.
        five_points: np.ndarray of shape (5, 2) in image pixel coordinates.
        output_size: (width, height), standard is (112, 112).

    Returns:
        np.ndarray of shape (height, width, 3) representing the aligned canonical face crop.
    """
    if image is None or image.size == 0:
        return np.zeros((output_size[1], output_size[0], 3), dtype=np.uint8)

    target_pts = ARCFACE_REFERENCE_POINTS_112
    if output_size != (112, 112):
        scale_x = output_size[0] / 112.0
        scale_y = output_size[1] / 112.0
        target_pts = ARCFACE_REFERENCE_POINTS_112 * np.array([scale_x, scale_y], dtype=np.float32)

    src_pts = np.asarray(five_points, dtype=np.float32)
    if src_pts.shape != (5, 2):
        raise ValueError(f"five_points must have shape (5, 2), got {src_pts.shape}")

    # Estimate optimal similarity transformation matrix (rotation, scale, translation)
    # cv2.estimateAffinePartial2D computes the least-squares Umeyama solution
    M, inliers = cv2.estimateAffinePartial2D(src_pts, target_pts)

    if M is None:
        # Fallback to simple crop/resize if points are degenerate
        return cv2.resize(image, output_size, interpolation=cv2.INTER_LINEAR)

    aligned = cv2.warpAffine(
        image,
        M,
        output_size,
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REFLECT
    )
    return aligned


def align_face_from_bbox(image, bbox, output_size=(112, 112)):
    """
    Fallback alignment when 5 landmarks are unavailable (e.g. extreme occlusions).
    Applies standard 20% margin crop and resizes to target output size.
    """
    if image is None or image.size == 0:
        return np.zeros((output_size[1], output_size[0], 3), dtype=np.uint8)

    h_img, w_img = image.shape[:2]
    x, y, w, h = bbox['x'], bbox['y'], bbox['w'], bbox['h']

    margin_x = int(w * 0.20)
    margin_y = int(h * 0.20)

    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(w_img, x + w + margin_x)
    y2 = min(h_img, y + h + margin_y)

    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return cv2.resize(image, output_size)

    return cv2.resize(crop, output_size, interpolation=cv2.INTER_LINEAR)

