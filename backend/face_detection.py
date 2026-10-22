"""
Advanced Side/Profile Face Detection using MediaPipe FaceLandmarker + Haar Multi-Pass Cascade
=============================================================================================
✅ Pass 1: MediaPipe FaceLandmarker (478 landmarks) + 3D Head Pose (solvePnP)
✅ Pass 2: Flipped Image Detection for extreme profiles
✅ Pass 3: Haar Profile Cascade (haarcascade_profileface.xml) for 90° profiles
✅ Pass 4: Haar Frontal Cascade (haarcascade_frontalface_alt2.xml) emergency fallback
✅ Real-time CLAHE lighting normalization
✅ Exact Yaw, Pitch, Roll degree estimation
✅ Fully backwards compatible with all downstream endpoints
"""

import cv2
import numpy as np
import time
import os
import urllib.request
import math

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


class SideFaceDetector:
    """Enhanced MediaPipe FaceLandmarker & Multi-Pass Cascade Face Detector.
    
    Uses 4-pass detection cascade for maximum recall across all face angles:
      Pass 1: MediaPipe FaceLandmarker (478 3D landmarks + solvePnP head pose)
      Pass 2: FaceLandmarker on horizontally flipped image
      Pass 3: OpenCV Haar Profile Cascade for 90° edge profiles
      Pass 4: OpenCV Haar Frontal Cascade as emergency fallback
    
    Includes Non-Maximum Suppression (NMS) and CLAHE illumination normalization.
    """

    # Detection thresholds
    PROFILE_THRESHOLD = 15.0         # Degrees yaw for profile classification
    STRONG_PROFILE_THRESHOLD = 35.0  # Degrees yaw for strong profile classification

    # Canonical 3D model points for 6 facial landmarks (in mm)
    MODEL_POINTS_3D = np.array([
        (0.0, 0.0, 0.0),          # Nose tip (index 1)
        (0.0, -330.0, -65.0),     # Chin (index 152)
        (-225.0, 170.0, -135.0),  # Left eye outer corner (index 33)
        (225.0, 170.0, -135.0),   # Right eye outer corner (index 263)
        (-150.0, -150.0, -125.0), # Left mouth corner (index 61)
        (150.0, -150.0, -125.0)   # Right mouth corner (index 291)
    ], dtype=np.float64)

    # Colors (BGR format)
    COLORS = {
        'left_profile': (255, 100, 0),    # Blue
        'right_profile': (0, 100, 255),   # Red-Orange
        'frontal': (0, 200, 0),           # Green
        'unknown': (128, 128, 128)        # Gray
    }

    def __init__(self, min_detection_confidence=0.45):
        """
        Initialize the Enhanced Multi-Pass Face Detector.
        
        Args:
            min_detection_confidence: Confidence threshold for face detection.
        """
        self.min_confidence = min_detection_confidence
        self.fps = 0
        self.frame_count = 0
        self.start_time = time.time()

        # CLAHE for lighting normalization
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

        # Ensure model is available
        model_path = self._ensure_model()

        # Primary FaceLandmarker detector (Tasks API)
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=10,
            min_face_detection_confidence=min_detection_confidence,
            min_face_presence_confidence=min_detection_confidence,
            min_tracking_confidence=min_detection_confidence,
        )
        self.landmarker = vision.FaceLandmarker.create_from_options(options)

        # Fallback Haar cascades
        try:
            self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        except Exception:
            self.profile_cascade = None

        try:
            self.frontal_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
        except Exception:
            self.frontal_cascade = None

        print("[INFO] SideFaceDetector initialized (4-Pass MediaPipe FaceLandmarker + solvePnP)!")

    def _ensure_model(self):
        """Ensure face_landmarker.task model is downloaded and present."""
        model_path = os.path.join(BACKEND_DIR, 'data', 'face_landmarker.task')

        if not os.path.exists(model_path):
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            root_path = os.path.join(os.path.dirname(BACKEND_DIR), 'face_landmarker.task')
            if os.path.exists(root_path):
                import shutil
                print("[INFO] Copying FaceLandmarker model from root...")
                shutil.copy(root_path, model_path)
            else:
                print("📥 Downloading FaceLandmarker model...")
                url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
                try:
                    urllib.request.urlretrieve(url, model_path)
                    print("✅ FaceLandmarker model downloaded successfully!")
                except Exception as e:
                    print(f"❌ Download failed: {e}")
                    raise

        return model_path

    def _apply_clahe(self, image):
        """Apply Contrast Limited Adaptive Histogram Equalization to the L-channel."""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        cl = self.clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    def _compute_head_pose(self, landmarks, img_w, img_h):
        """
        Compute precise 3D head pose (Yaw, Pitch, Roll) using cv2.solvePnP.
        
        Args:
            landmarks: 478 MediaPipe face landmarks.
            img_w: Image width in pixels.
            img_h: Image height in pixels.
            
        Returns:
            tuple: (yaw, pitch, roll, angle, direction, profile_confidence, soft_biometrics)
        """
        # Extract 2D pixel coordinates for the 6 canonical landmarks
        # 1: Nose tip, 152: Chin, 33: Left eye outer, 263: Right eye outer, 61: Left mouth, 291: Right mouth
        image_points = np.array([
            (landmarks[1].x * img_w, landmarks[1].y * img_h),
            (landmarks[152].x * img_w, landmarks[152].y * img_h),
            (landmarks[33].x * img_w, landmarks[33].y * img_h),
            (landmarks[263].x * img_w, landmarks[263].y * img_h),
            (landmarks[61].x * img_w, landmarks[61].y * img_h),
            (landmarks[291].x * img_w, landmarks[291].y * img_h)
        ], dtype=np.float64)

        focal_length = float(img_w)
        center = (img_w / 2.0, img_h / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        success, rvec, _ = cv2.solvePnP(
            self.MODEL_POINTS_3D, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
        )

        if success:
            rmat, _ = cv2.Rodrigues(rvec)
            angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
            pitch, yaw, roll = float(angles[0]), float(angles[1]), float(angles[2])
        else:
            pitch, yaw, roll = 0.0, 0.0, 0.0

        # Classify direction from Yaw angle
        # In canonical 3D model: positive yaw = nose moves to camera-right = subject looks LEFT
        # Negative yaw = nose moves to camera-left = subject looks RIGHT
        if yaw > self.PROFILE_THRESHOLD:
            direction = 'left_profile'
        elif yaw < -self.PROFILE_THRESHOLD:
            direction = 'right_profile'
        else:
            direction = 'frontal'

        angle = min(abs(yaw), 90.0)

        if direction in ['left_profile', 'right_profile']:
            profile_confidence = min((abs(yaw) / 45.0) * 100.0, 100.0)
        else:
            profile_confidence = max(0.0, (1.0 - abs(yaw) / self.PROFILE_THRESHOLD) * 100.0)

        soft_biometrics = {
            'yaw': round(yaw, 2),
            'pitch': round(pitch, 2),
            'roll': round(roll, 2),
            'head_pose_angle': round(angle, 2),
            'direction': direction,
            'profile_confidence': round(profile_confidence, 2)
        }

        return yaw, pitch, roll, angle, direction, profile_confidence, soft_biometrics

    def _run_face_mesh(self, image):
        """Pass 1: MediaPipe FaceLandmarker detection with 3D pose estimation."""
        h, w = image.shape[:2]
        clahe_img = self._apply_clahe(image)
        rgb_image = cv2.cvtColor(clahe_img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)

        detection_result = self.landmarker.detect(mp_image)
        faces = []

        if not detection_result.face_landmarks:
            return faces

        for landmarks in detection_result.face_landmarks:
            xs = [p.x * w for p in landmarks]
            ys = [p.y * h for p in landmarks]

            min_x, max_x = max(0, min(xs)), min(w, max(xs))
            min_y, max_y = max(0, min(ys)), min(h, max(ys))

            box_w = max_x - min_x
            box_h = max_y - min_y

            # Add 15% margin for full facial framing
            pad_x = int(box_w * 0.15)
            pad_y = int(box_h * 0.15)

            x1 = max(0, int(min_x - pad_x))
            y1 = max(0, int(min_y - pad_y))
            x2 = min(w, int(max_x + pad_x))
            y2 = min(h, int(max_y + pad_y))

            yaw, pitch, roll, angle, direction, profile_conf, soft_metrics = self._compute_head_pose(
                landmarks, w, h
            )

            # Keypoints for backward compatibility (left eye, right eye, nose tip, mouth, left ear, right ear)
            keypoint_indices = [33, 263, 1, 13, 234, 454]
            keypoints = [
                {'x': int(landmarks[idx].x * w), 'y': int(landmarks[idx].y * h)}
                for idx in keypoint_indices
            ]

            face = {
                'bbox': {
                    'x': x1,
                    'y': y1,
                    'w': max(1, x2 - x1),
                    'h': max(1, y2 - y1)
                },
                'confidence': 0.95,
                'direction': direction,
                'angle': angle,
                'angle_label': direction,  # Alias for inference.py compatibility
                'profile_confidence': profile_conf,
                'keypoints': keypoints,
                'soft_biometrics': soft_metrics,
                'yaw': round(yaw, 2),
                'pitch': round(pitch, 2),
                'roll': round(roll, 2),
                '_source': 'face_mesh'
            }
            faces.append(face)

        return faces

    def _run_face_mesh_flipped(self, image):
        """Pass 2: Run FaceLandmarker on horizontally flipped image to capture extreme profile angles."""
        h, w = image.shape[:2]
        flipped_img = cv2.flip(image, 1)
        flipped_faces = self._run_face_mesh(flipped_img)

        unflipped_faces = []
        for face in flipped_faces:
            orig_bbox = face['bbox']
            # Unflip x coordinate: x_orig = w - (x_flipped + w_bbox)
            unflipped_x = max(0, w - (orig_bbox['x'] + orig_bbox['w']))

            # Invert direction
            if face['direction'] == 'left_profile':
                unflipped_dir = 'right_profile'
            elif face['direction'] == 'right_profile':
                unflipped_dir = 'left_profile'
            else:
                unflipped_dir = 'frontal'

            unflipped_keypoints = [
                {'x': max(0, w - kp['x']), 'y': kp['y']}
                for kp in face.get('keypoints', [])
            ]

            soft_bio = dict(face.get('soft_biometrics', {}))
            unflipped_yaw = -face.get('yaw', soft_bio.get('yaw', 0.0))
            unflipped_pitch = face.get('pitch', soft_bio.get('pitch', 0.0))
            unflipped_roll = -face.get('roll', soft_bio.get('roll', 0.0))

            soft_bio['yaw'] = round(unflipped_yaw, 2)
            soft_bio['pitch'] = round(unflipped_pitch, 2)
            soft_bio['roll'] = round(unflipped_roll, 2)
            soft_bio['direction'] = unflipped_dir

            unflipped_faces.append({
                'bbox': {
                    'x': unflipped_x,
                    'y': orig_bbox['y'],
                    'w': orig_bbox['w'],
                    'h': orig_bbox['h']
                },
                'confidence': face['confidence'],
                'direction': unflipped_dir,
                'angle': face['angle'],
                'angle_label': unflipped_dir,
                'profile_confidence': face['profile_confidence'],
                'keypoints': unflipped_keypoints,
                'soft_biometrics': soft_bio,
                'yaw': round(unflipped_yaw, 2),
                'pitch': round(unflipped_pitch, 2),
                'roll': round(unflipped_roll, 2),
                '_source': 'face_mesh_flipped'
            })

        return unflipped_faces

    def _run_haar_profile(self, image):
        """Pass 3: OpenCV Haar Profile Cascade for extreme 90° side profiles."""
        if self.profile_cascade is None or self.profile_cascade.empty():
            return []

        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray_clahe = self.clahe.apply(gray)

        faces = []

        # Detect right profiles on original image
        rects_orig = self.profile_cascade.detectMultiScale(
            gray_clahe, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
        )
        for (x, y, bw, bh) in rects_orig:
            faces.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(bw), 'h': int(bh)},
                'confidence': 0.75,
                'direction': 'right_profile',
                'angle': 90.0,
                'angle_label': 'right_profile',
                'profile_confidence': 90.0,
                'keypoints': [{'x': int(x + bw / 2), 'y': int(y + bh / 2)}],
                'soft_biometrics': {'yaw': -90.0, 'pitch': 0.0, 'roll': 0.0, 'direction': 'right_profile'},
                'yaw': -90.0,
                'pitch': 0.0,
                'roll': 0.0,
                '_source': 'haar_profile'
            })

        # Detect left profiles on flipped image
        gray_flipped = cv2.flip(gray_clahe, 1)
        rects_flip = self.profile_cascade.detectMultiScale(
            gray_flipped, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
        )
        for (x, y, bw, bh) in rects_flip:
            unflipped_x = max(0, w - (x + bw))
            faces.append({
                'bbox': {'x': int(unflipped_x), 'y': int(y), 'w': int(bw), 'h': int(bh)},
                'confidence': 0.75,
                'direction': 'left_profile',
                'angle': 90.0,
                'angle_label': 'left_profile',
                'profile_confidence': 90.0,
                'keypoints': [{'x': int(unflipped_x + bw / 2), 'y': int(y + bh / 2)}],
                'soft_biometrics': {'yaw': 90.0, 'pitch': 0.0, 'roll': 0.0, 'direction': 'left_profile'},
                'yaw': 90.0,
                'pitch': 0.0,
                'roll': 0.0,
                '_source': 'haar_profile'
            })

        return faces

    def _run_haar_frontal(self, image):
        """Pass 4: OpenCV Haar Frontal Cascade emergency fallback."""
        if self.frontal_cascade is None or self.frontal_cascade.empty():
            return []

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray_clahe = self.clahe.apply(gray)

        rects = self.frontal_cascade.detectMultiScale(
            gray_clahe, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
        )
        faces = []
        for (x, y, bw, bh) in rects:
            faces.append({
                'bbox': {'x': int(x), 'y': int(y), 'w': int(bw), 'h': int(bh)},
                'confidence': 0.70,
                'direction': 'frontal',
                'angle': 0.0,
                'angle_label': 'frontal',
                'profile_confidence': 10.0,
                'keypoints': [{'x': int(x + bw / 2), 'y': int(y + bh / 2)}],
                'soft_biometrics': {'yaw': 0.0, 'pitch': 0.0, 'roll': 0.0, 'direction': 'frontal'},
                'yaw': 0.0,
                'pitch': 0.0,
                'roll': 0.0,
                '_source': 'haar_frontal'
            })

        return faces

    @staticmethod
    def _compute_iou(box1, box2):
        """Compute Intersection over Union (IoU) between two bounding boxes."""
        x1 = max(box1['x'], box2['x'])
        y1 = max(box1['y'], box2['y'])
        x2 = min(box1['x'] + box1['w'], box2['x'] + box2['w'])
        y2 = min(box1['y'] + box1['h'], box2['y'] + box2['h'])

        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = box1['w'] * box1['h']
        area2 = box2['w'] * box2['h']
        union = area1 + area2 - inter

        return inter / (union + 1e-6)

    def _nms_faces(self, faces, iou_threshold=0.4):
        """Non-Maximum Suppression to eliminate duplicate face detections."""
        if len(faces) <= 1:
            return faces

        faces_sorted = sorted(faces, key=lambda f: f.get('confidence', 0), reverse=True)
        kept = []

        for face in faces_sorted:
            is_duplicate = False
            for kept_face in kept:
                iou = self._compute_iou(face['bbox'], kept_face['bbox'])
                if iou > iou_threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                kept.append(face)

        return kept

    def detect_faces(self, image, profile_only=True):
        """
        Execute 4-pass detection cascade with CLAHE preprocessing and NMS.
        
        Pass 1: FaceLandmarker (478 3D landmarks + solvePnP)
        Pass 2: FaceLandmarker on horizontally flipped image
        Pass 3: Haar Profile Cascade (left & right profiles)
        Pass 4: Haar Frontal Cascade
        
        Args:
            image: BGR image from OpenCV.
            profile_only: If True, returns only side-facing profiles.
            
        Returns:
            list: List of standard face dictionaries.
        """
        all_faces = []

        # Pass 1: Primary FaceLandmarker detection
        faces_1 = self._run_face_mesh(image)
        all_faces.extend(faces_1)

        # Pass 2: Flipped FaceLandmarker (if Pass 1 found nothing)
        if len(all_faces) == 0:
            faces_2 = self._run_face_mesh_flipped(image)
            all_faces.extend(faces_2)

        # Pass 3: Haar Profile Cascade (if Pass 1 and 2 found nothing)
        if len(all_faces) == 0:
            faces_3 = self._run_haar_profile(image)
            all_faces.extend(faces_3)

        # Pass 4: Haar Frontal Cascade (emergency fallback)
        if len(all_faces) == 0:
            faces_4 = self._run_haar_frontal(image)
            all_faces.extend(faces_4)

        # Deduplicate with NMS
        all_faces = self._nms_faces(all_faces, iou_threshold=0.4)

        # Filter by direction if profile_only is requested
        if profile_only:
            all_faces = [f for f in all_faces if f['direction'] in ['left_profile', 'right_profile']]

        # Sort faces left-to-right based on x coordinate for stable ordering
        all_faces.sort(key=lambda f: f['bbox']['x'])

        return all_faces

    def detect_detailed(self, image):
        """Execute full multi-pass detection and return all face poses/bounding boxes."""
        return self.detect_faces(image, profile_only=False)

    def draw_results(self, image, faces, show_keypoints=True, show_stats=True):
        """Draw detection bounding boxes, angles, keypoints, and statistics."""
        output = image.copy()
        h, w = output.shape[:2]

        # Update FPS
        self.frame_count += 1
        elapsed = time.time() - self.start_time
        if elapsed > 0.5:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.start_time = time.time()

        for face in faces:
            bbox = face['bbox']
            direction = face['direction']
            conf = face.get('confidence', 0.0)
            angle = face.get('angle', 0.0)
            soft = face.get('soft_biometrics', {})
            yaw = soft.get('yaw', angle)
            pitch = soft.get('pitch', 0.0)
            roll = soft.get('roll', 0.0)

            color = self.COLORS.get(direction, self.COLORS['unknown'])
            x, y, bw, bh = bbox['x'], bbox['y'], bbox['w'], bbox['h']

            # Bounding box
            cv2.rectangle(output, (x, y), (x + bw, y + bh), color, 2)
            cv2.rectangle(output, (x - 1, y - 1), (x + bw + 1, y + bh + 1), (0, 0, 0), 1)

            # Direction & Angle Label
            label = f"{direction.replace('_', ' ').upper()} ({abs(yaw):.1f}°)"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)

            cv2.rectangle(output, (x, max(0, y - 26)), (x + label_size[0] + 8, y), color, -1)
            cv2.putText(output, label, (x + 4, max(12, y - 7)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

            # Subtitle with Pitch and Roll
            sub_label = f"P:{pitch:+.0f}° R:{roll:+.0f}°"
            cv2.putText(output, sub_label, (x + 2, y + bh - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

            # Confidence bar
            bar_width = int(conf * bw)
            cv2.rectangle(output, (x, y + bh + 4), (x + bar_width, y + bh + 10), color, -1)
            cv2.rectangle(output, (x, y + bh + 4), (x + bw, y + bh + 10), color, 1)

            # Keypoints
            if show_keypoints and 'keypoints' in face:
                for kp in face['keypoints']:
                    cv2.circle(output, (kp['x'], kp['y']), 3, (0, 255, 255), -1)
                    cv2.circle(output, (kp['x'], kp['y']), 4, (0, 0, 0), 1)

        # Stats overlay
        if show_stats:
            overlay = output.copy()
            cv2.rectangle(overlay, (8, 8), (220, 105), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.65, output, 0.35, 0, output)

            left_count = sum(1 for f in faces if f['direction'] == 'left_profile')
            right_count = sum(1 for f in faces if f['direction'] == 'right_profile')
            frontal_count = sum(1 for f in faces if f['direction'] == 'frontal')

            cv2.putText(output, f"FPS: {self.fps:.1f}", (16, 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2)
            cv2.putText(output, f"Left Profiles:  {left_count}", (16, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.48, self.COLORS['left_profile'], 2)
            cv2.putText(output, f"Right Profiles: {right_count}", (16, 72),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.48, self.COLORS['right_profile'], 2)
            cv2.putText(output, f"Frontal Faces:  {frontal_count}", (16, 94),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.48, self.COLORS['frontal'], 2)

        return output

    def close(self):
        """Cleanup resources."""
        if hasattr(self, 'landmarker') and self.landmarker:
            try:
                self.landmarker.close()
            except Exception:
                pass
            self.landmarker = None


def run_webcam_detection(profile_only=True):
    """Real-time webcam detection with keyboard controls."""
    print("\n" + "=" * 55)
    print("🎥 WEBCAM 4-PASS FACE DETECTION (MediaPipe FaceLandmarker)")
    print("=" * 55)
    print("Controls: [Q] Quit | [P] Toggle Profile Mode | [K] Keypoints | [S] Screenshot\n")

    detector = SideFaceDetector(min_detection_confidence=0.35)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Error: Cannot open webcam!")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    show_keypoints = True
    screenshot_count = 0

    print("✅ Webcam active! Turn head left/right to test profile detection.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        faces = detector.detect_faces(frame, profile_only=profile_only)
        output = detector.draw_results(frame, faces, show_keypoints=show_keypoints)

        mode_text = "PROFILE ONLY" if profile_only else "ALL FACES"
        mode_color = (0, 200, 255) if profile_only else (0, 255, 0)
        cv2.putText(output, f"Mode: {mode_text}", (output.shape[1] - 200, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, mode_color, 2)

        cv2.imshow('Face Detection (Press Q to Quit)', output)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('p'):
            profile_only = not profile_only
            print(f"📌 Mode: {'Profile Only' if profile_only else 'All Faces'}")
        elif key == ord('k'):
            show_keypoints = not show_keypoints
        elif key == ord('s'):
            screenshot_count += 1
            filename = f"screenshot_{screenshot_count}.jpg"
            cv2.imwrite(filename, output)
            print(f"📸 Saved: {filename}")

    cap.release()
    cv2.destroyAllWindows()
    detector.close()


def run_image_detection(image_path, output_path=None, profile_only=True):
    """Process a single image for face and profile detection."""
    detector = SideFaceDetector(min_detection_confidence=0.35)
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ Error: Cannot read image at {image_path}")
        return None

    faces = detector.detect_faces(image, profile_only=profile_only)
    output = detector.draw_results(image, faces)

    if output_path:
        cv2.imwrite(output_path, output)
        print(f"✅ Saved output to: {output_path}")
    else:
        cv2.imshow('Detection Result (Press any key)', output)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    detector.close()
    return faces


def main():
    """CLI Menu."""
    print("\n" + "=" * 55)
    print("   🎯 ADVANCED SIDE FACE DETECTION (4-PASS CASCADE)")
    print("=" * 55)
    print("   1. 🎥 Webcam - Profile faces ONLY")
    print("   2. 🎥 Webcam - All faces (Frontal & Profiles)")
    print("   3. 📷 Image  - Profile faces ONLY")
    print("   4. 📷 Image  - All faces")
    print("   5. 🚪 Exit")
    print("-" * 55)

    choice = input("\n   Enter choice (1-5): ").strip()
    if choice == '1':
        run_webcam_detection(profile_only=True)
    elif choice == '2':
        run_webcam_detection(profile_only=False)
    elif choice in ('3', '4'):
        path = input("   Image path: ").strip().strip('"')
        run_image_detection(path, profile_only=(choice == '3'))


if __name__ == "__main__":
    main()
