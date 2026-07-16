import os
import urllib.request
import cv2
import numpy as np
import math
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Path constants
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BACKEND_DIR, 'data', 'face_landmarker.task')
if not os.path.exists(MODEL_PATH):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    root_path = os.path.join(os.path.dirname(BACKEND_DIR), 'face_landmarker.task')
    if os.path.exists(root_path):
        import shutil
        print("[INFO] Copying Face Mesh model from root...")
        shutil.copy(root_path, MODEL_PATH)
    else:
        print("[INFO] Downloading Face Mesh model...")
        url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        urllib.request.urlretrieve(url, MODEL_PATH)

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
    num_faces=1,
)
landmarker = vision.FaceLandmarker.create_from_options(options)

# ============================================================================
# Landmark indices from MediaPipe Face Mesh (478 landmarks)
# ============================================================================
# Core facial landmarks
NOSE_TIP = 1
CHIN = 152
FOREHEAD = 10
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
MOUTH_LEFT = 61
MOUTH_RIGHT = 291

# NEW: Structural landmarks (visible even with sunglasses/side face)
JAW_LEFT = 234          # Left jaw corner
JAW_RIGHT = 454         # Right jaw corner
NOSE_BRIDGE_TOP = 6     # Top of nose bridge
NOSE_BRIDGE_MID = 197   # Mid nose bridge
CHEEKBONE_LEFT = 123    # Left cheekbone
CHEEKBONE_RIGHT = 352   # Right cheekbone
LEFT_EYE_INNER = 133    # Left eye inner corner (for eye openness check)
RIGHT_EYE_INNER = 362   # Right eye inner corner
LEFT_EYE_TOP = 159      # Left eye upper lid
LEFT_EYE_BOTTOM = 145   # Left eye lower lid
RIGHT_EYE_TOP = 386     # Right eye upper lid
RIGHT_EYE_BOTTOM = 374  # Right eye lower lid


def _distance(landmarks, p1_idx, p2_idx):
    """Calculate 3D Euclidean distance between two landmarks."""
    p1 = landmarks[p1_idx]
    p2 = landmarks[p2_idx]
    return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2 + 1e-6)


def _triangle_area(landmarks, idx1, idx2, idx3):
    """Calculate area of triangle formed by 3 landmarks using cross product."""
    p1 = landmarks[idx1]
    p2 = landmarks[idx2]
    p3 = landmarks[idx3]
    # Vectors from p1 to p2 and p1 to p3
    v1 = (p2.x - p1.x, p2.y - p1.y, p2.z - p1.z)
    v2 = (p3.x - p1.x, p3.y - p1.y, p3.z - p1.z)
    # Cross product magnitude = 2 * area
    cx = v1[1] * v2[2] - v1[2] * v2[1]
    cy = v1[2] * v2[0] - v1[0] * v2[2]
    cz = v1[0] * v2[1] - v1[1] * v2[0]
    return 0.5 * math.sqrt(cx**2 + cy**2 + cz**2 + 1e-8)


def _check_eye_visibility(landmarks):
    """
    Estimate eye visibility (0.0 = likely occluded/sunglasses, 1.0 = fully visible).
    Uses the eye aspect ratio (EAR) — if eyes appear as thin slits or are not
    detectable, the landmarks collapse and EAR → 0.
    """
    try:
        # Left eye aspect ratio
        left_v = _distance(landmarks, LEFT_EYE_TOP, LEFT_EYE_BOTTOM)
        left_h = _distance(landmarks, LEFT_EYE_OUTER, LEFT_EYE_INNER)
        left_ear = left_v / (left_h + 1e-6)

        # Right eye aspect ratio
        right_v = _distance(landmarks, RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM)
        right_h = _distance(landmarks, RIGHT_EYE_OUTER, RIGHT_EYE_INNER)
        right_ear = right_v / (right_h + 1e-6)

        avg_ear = (left_ear + right_ear) / 2.0

        # Normal open eyes: EAR ≈ 0.25-0.35
        # Sunglasses/occluded: EAR < 0.15 (landmarks collapse)
        # Map to 0-1 visibility score
        visibility = min(1.0, max(0.0, (avg_ear - 0.08) / 0.25))
        return visibility
    except Exception:
        return 0.5  # Uncertain — use default weights


def extract_soft_biometrics(image, num_features=20):
    """
    Extract 20-dimensional occlusion-resistant soft biometric features.

    Features 1-10:  Original eye/nose/mouth based ratios
    Features 11-20: NEW structural features (jaw, chin, cheekbone, nose bridge)
                    that work even with sunglasses and side faces.

    Occlusion-aware: When eyes are likely hidden (sunglasses), eye-dependent
    features are suppressed and structural features are boosted.
    """
    default_features = np.zeros(num_features, dtype=np.float32)

    if image is None or image.size == 0:
        return default_features

    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

    detection_result = landmarker.detect(mp_image)
    if not detection_result.face_landmarks:
        return default_features

    landmarks = detection_result.face_landmarks[0]

    # ======== Base anchor (scale normalization) ========
    nose_to_chin = _distance(landmarks, NOSE_TIP, CHIN)
    base_anchor = nose_to_chin if nose_to_chin > 0 else 1.0

    # ======== ORIGINAL FEATURES (1-10): Eye/nose/mouth ratios ========
    eye_to_eye = _distance(landmarks, LEFT_EYE_OUTER, RIGHT_EYE_OUTER)
    forehead_to_nose = _distance(landmarks, FOREHEAD, NOSE_TIP)
    mouth_width = _distance(landmarks, MOUTH_LEFT, MOUTH_RIGHT)
    left_eye_to_nose = _distance(landmarks, LEFT_EYE_OUTER, NOSE_TIP)
    right_eye_to_nose = _distance(landmarks, RIGHT_EYE_OUTER, NOSE_TIP)
    left_mouth_to_chin = _distance(landmarks, MOUTH_LEFT, CHIN)
    right_mouth_to_chin = _distance(landmarks, MOUTH_RIGHT, CHIN)
    left_eye_to_mouth = _distance(landmarks, LEFT_EYE_OUTER, MOUTH_LEFT)
    right_eye_to_mouth = _distance(landmarks, RIGHT_EYE_OUTER, MOUTH_RIGHT)

    features_eye = [
        eye_to_eye / base_anchor,                                    # 1
        forehead_to_nose / base_anchor,                              # 2
        mouth_width / base_anchor,                                   # 3
        left_eye_to_nose / base_anchor,                              # 4
        right_eye_to_nose / base_anchor,                             # 5
        left_mouth_to_chin / base_anchor,                            # 6
        right_mouth_to_chin / base_anchor,                           # 7
        (left_eye_to_nose + right_eye_to_nose) / base_anchor,       # 8
        left_eye_to_mouth / base_anchor,                             # 9
        right_eye_to_mouth / base_anchor,                            # 10
    ]

    # ======== NEW STRUCTURAL FEATURES (11-20): Sunglasses/side-face resistant ========
    jaw_width = _distance(landmarks, JAW_LEFT, JAW_RIGHT)
    nose_bridge_len = _distance(landmarks, NOSE_BRIDGE_TOP, NOSE_BRIDGE_MID)
    forehead_to_chin = _distance(landmarks, FOREHEAD, CHIN)
    cheekbone_width = _distance(landmarks, CHEEKBONE_LEFT, CHEEKBONE_RIGHT)
    chin_to_jaw_left = _distance(landmarks, CHIN, JAW_LEFT)
    chin_to_jaw_right = _distance(landmarks, CHIN, JAW_RIGHT)
    nose_to_jaw_left = _distance(landmarks, NOSE_TIP, JAW_LEFT)
    nose_to_jaw_right = _distance(landmarks, NOSE_TIP, JAW_RIGHT)

    # Lower face triangle area (nose tip → mouth left → mouth right)
    lower_face_area = _triangle_area(landmarks, NOSE_TIP, MOUTH_LEFT, MOUTH_RIGHT)

    # Face contour asymmetry (difference in jaw-to-chin distances, L vs R)
    jaw_asymmetry = abs(chin_to_jaw_left - chin_to_jaw_right)

    features_structural = [
        jaw_width / base_anchor,                                     # 11
        nose_bridge_len / base_anchor,                               # 12
        (forehead_to_chin / (jaw_width + 1e-6)),                     # 13: height-to-width ratio
        cheekbone_width / base_anchor,                               # 14
        (chin_to_jaw_left + chin_to_jaw_right) / (2 * base_anchor),  # 15: avg chin shape
        lower_face_area / (base_anchor**2 + 1e-6),                   # 16: lower face area
        nose_to_jaw_left / base_anchor,                              # 17
        nose_to_jaw_right / base_anchor,                             # 18
        jaw_asymmetry / base_anchor,                                 # 19: contour asymmetry
        forehead_to_chin / base_anchor,                              # 20: total face height
    ]

    # ======== Combine all 20 features ========
    all_features = features_eye + features_structural
    feat_array = np.array(all_features, dtype=np.float32)

    # ======== Occlusion-aware weighting ========
    eye_visibility = _check_eye_visibility(landmarks)

    if eye_visibility < 0.5:
        # Eyes likely occluded (sunglasses, etc.)
        # Suppress eye-dependent features (indices 0-1, 3-4, 7-9)
        feat_array[0] *= 0.1    # eye-to-eye
        feat_array[3] *= 0.1    # left eye-to-nose
        feat_array[4] *= 0.1    # right eye-to-nose
        feat_array[7] *= 0.1    # combined eye-to-nose
        feat_array[8] *= 0.1    # left eye-to-mouth
        feat_array[9] *= 0.1    # right eye-to-mouth
        # Boost structural features (indices 10-19)
        feat_array[10:20] *= 1.5

    # L2 normalize
    norm = np.linalg.norm(feat_array)
    if norm > 0:
        feat_array = feat_array / norm

    return feat_array
