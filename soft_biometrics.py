import os
import urllib.request
import cv2
import numpy as np
import math
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODEL_PATH = "face_landmarker.task"
if not os.path.exists(MODEL_PATH):
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

# Important indices from MediaPipe Face Mesh
NOSE_TIP = 1
CHIN = 152
FOREHEAD = 10
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
MOUTH_LEFT = 61
MOUTH_RIGHT = 291

def _distance(landmarks, p1_idx, p2_idx):
    """Calculate 3D Euclidean distance between two landmarks."""
    p1 = landmarks[p1_idx]
    p2 = landmarks[p2_idx]
    return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2 + 1e-6)

def extract_soft_biometrics(image, num_features=10):
    default_features = np.zeros(num_features, dtype=np.float32)
    
    if image is None or image.size == 0:
        return default_features
        
    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
    
    detection_result = landmarker.detect(mp_image)
    if not detection_result.face_landmarks:
        return default_features
        
    landmarks = detection_result.face_landmarks[0]
    
    # Calculate absolute facial distances
    eye_to_eye = _distance(landmarks, LEFT_EYE_OUTER, RIGHT_EYE_OUTER)
    nose_to_chin = _distance(landmarks, NOSE_TIP, CHIN)
    forehead_to_nose = _distance(landmarks, FOREHEAD, NOSE_TIP)
    mouth_width = _distance(landmarks, MOUTH_LEFT, MOUTH_RIGHT)
    
    left_eye_to_nose = _distance(landmarks, LEFT_EYE_OUTER, NOSE_TIP)
    right_eye_to_nose = _distance(landmarks, RIGHT_EYE_OUTER, NOSE_TIP)
    
    left_mouth_to_chin = _distance(landmarks, MOUTH_LEFT, CHIN)
    right_mouth_to_chin = _distance(landmarks, MOUTH_RIGHT, CHIN)
    
    left_eye_to_mouth = _distance(landmarks, LEFT_EYE_OUTER, MOUTH_LEFT)
    right_eye_to_mouth = _distance(landmarks, RIGHT_EYE_OUTER, MOUTH_RIGHT)
    
    base_anchor = nose_to_chin if nose_to_chin > 0 else 1.0
    
    features = [
        eye_to_eye / base_anchor,
        forehead_to_nose / base_anchor,
        mouth_width / base_anchor,
        left_eye_to_nose / base_anchor,
        right_eye_to_nose / base_anchor,
        left_mouth_to_chin / base_anchor,
        right_mouth_to_chin / base_anchor,
        (left_eye_to_nose + right_eye_to_nose) / base_anchor,
        left_eye_to_mouth / base_anchor,
        right_eye_to_mouth / base_anchor,
    ]
    
    feat_array = np.array(features, dtype=np.float32)
    norm = np.linalg.norm(feat_array)
    if norm > 0:
        feat_array = feat_array / norm
        
    return feat_array
