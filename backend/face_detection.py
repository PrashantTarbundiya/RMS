"""
Advanced Side/Profile Face Detection using MediaPipe
=====================================================
✅ Optimized for LEFT and RIGHT profile detection
✅ Pre-trained model - NO dataset required
✅ Real-time FPS display
✅ Multiple detection modes
✅ Enhanced profile classification
"""

import cv2
import numpy as np
import time
import os
import urllib.request

# Path constants
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class SideFaceDetector:
    """Enhanced MediaPipe Face Detection for side/profile faces.
    
    Uses multi-pass detection cascade for maximum recall:
      Pass 1: BlazeFace at normal confidence (fast, catches most faces)
      Pass 2: BlazeFace at low confidence (catches side faces)
      Pass 3: Haar profile cascade (catches extreme profiles BlazeFace misses)
    
    Includes Non-Maximum Suppression (NMS) to deduplicate overlapping detections.
    """
    
    # Detection thresholds
    PROFILE_THRESHOLD = 0.20      # Lower = more sensitive to profiles
    STRONG_PROFILE_THRESHOLD = 0.40  # Strong profile detection
    
    # Colors (BGR format)
    COLORS = {
        'left_profile': (255, 100, 0),    # Blue
        'right_profile': (0, 100, 255),   # Red-Orange
        'frontal': (0, 200, 0),           # Green
        'unknown': (128, 128, 128)        # Gray
    }
    
    def __init__(self, min_detection_confidence=0.30):
        """
        Initialize the Enhanced Side Face Detector.
        
        Args:
            min_detection_confidence: Lower = detect more faces (better for profiles)
        """
        self.min_confidence = min_detection_confidence
        self.fps = 0
        self.frame_count = 0
        self.start_time = time.time()
        
        # Download and load primary model
        model_path = self._ensure_model()
        
        # Primary detector (normal confidence)
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=min_detection_confidence
        )
        self.detector = vision.FaceDetector.create_from_options(options)
        
        # Low-confidence fallback detector for side faces
        self._low_conf_detector = None
        low_conf = min(min_detection_confidence, 0.20)
        if low_conf < min_detection_confidence:
            try:
                base_options_low = python.BaseOptions(model_asset_path=model_path)
                options_low = vision.FaceDetectorOptions(
                    base_options=base_options_low,
                    min_detection_confidence=low_conf
                )
                self._low_conf_detector = vision.FaceDetector.create_from_options(options_low)
            except Exception:
                pass  # Fallback not available — fine, primary is good enough
        
        # Haar profile cascade for extreme side faces
        self._haar_profile = None
        try:
            haar_profile_path = os.path.join(
                cv2.data.haarcascades, 'haarcascade_profileface.xml'
            )
            if os.path.exists(haar_profile_path):
                cascade = cv2.CascadeClassifier(haar_profile_path)
                if not cascade.empty():
                    self._haar_profile = cascade
        except Exception:
            pass
        
        print("✅ Face detector initialized (multi-pass cascade)!")
    
    def _ensure_model(self):
        """Download the face detection model if not present."""
        model_path = os.path.join(BACKEND_DIR, 'data', 'blaze_face_short_range.tflite')
        
        if not os.path.exists(model_path):
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            root_path = os.path.join(os.path.dirname(BACKEND_DIR), 'blaze_face_short_range.tflite')
            if os.path.exists(root_path):
                import shutil
                print("[INFO] Copying face detection model from root...")
                shutil.copy(root_path, model_path)
            else:
                print("📥 Downloading face detection model...")
                url = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
                try:
                    urllib.request.urlretrieve(url, model_path)
                    print("✅ Model downloaded!")
                except Exception as e:
                    print(f"❌ Download failed: {e}")
                    raise
        
        return model_path
    
    def _calculate_profile_direction(self, keypoints, img_w, img_h):
        """
        Calculates profile direction using "Short-term Soft Biometrics" (Anthropometric features).
        
        Reference: 
        Alsubhi, A.H.; Jaha, E.S. "Front-to-Side Hard and Soft Biometrics for Augmented Zero-Shot 
        Side Face Recognition". Sensors 2025, 25, 1638.
        
        Extracts anthropometric keys from the face to determine pose:
        1. Nose-Eye Offset (Horizontal Asymmetry)
        2. Eye-Ear Distance Ratio (Vertical/Depth Asymmetry)
        3. Facial Width Compression (Projected Geometry)
        """
        if len(keypoints) < 3:
            return 0, 'unknown', 0, {}
        
        # Extract ALL keypoints (normalized 0-1)
        # BlazeFace keypoints: right_eye, left_eye, nose, mouth, right_ear, left_ear
        right_eye = keypoints[0]
        left_eye = keypoints[1]
        nose = keypoints[2] # Nose tip (Pronasale)

        
        # Convert to pixel coordinates - Core keypoints
        re_x, re_y = right_eye.x * img_w, right_eye.y * img_h
        le_x, le_y = left_eye.x * img_w, left_eye.y * img_h
        nose_x, nose_y = nose.x * img_w, nose.y * img_h
        
        # Optional keypoints (mouth and ears)
        mouth_x, mouth_y = None, None
        right_ear_x, right_ear_y = None, None
        left_ear_x, left_ear_y = None, None
        
        if len(keypoints) >= 4:
            mouth = keypoints[3]
            mouth_x, mouth_y = mouth.x * img_w, mouth.y * img_h
        
        if len(keypoints) >= 5:
            right_ear = keypoints[4]
            right_ear_x, right_ear_y = right_ear.x * img_w, right_ear.y * img_h
        
        if len(keypoints) >= 6:
            left_ear = keypoints[5]
            left_ear_x, left_ear_y = left_ear.x * img_w, left_ear.y * img_h
        
        # ============ FEATURE 1: Eye distance (baseline) ============
        eye_dist = abs(le_x - re_x)
        eye_mid_x = (le_x + re_x) / 2
        eye_mid_y = (le_y + re_y) / 2
        
        # ============ FEATURE 2: Nose offset from eye center ============
        nose_offset = nose_x - eye_mid_x
        if eye_dist > 5:
            nose_offset_ratio = nose_offset / eye_dist
        else:
            nose_offset_ratio = 0.8 if nose_x > eye_mid_x else -0.8
        
        # ============ FEATURE 3: Eye distance compression ============
        # When face turns, eyes appear closer together
        # Normalize by face height (nose to eye distance)
        face_height = abs(nose_y - eye_mid_y)
        if face_height > 5:
            eye_compression_ratio = eye_dist / face_height
        else:
            eye_compression_ratio = 1.0
        
        # Lower ratio = more profile (eyes compressed)
        eye_compression_score = max(0, 1 - (eye_compression_ratio / 2.5))
        
        # ============ FEATURE 4: Mouth-nose alignment ============
        mouth_score = 0
        if mouth_x is not None:
            mouth_offset = mouth_x - eye_mid_x
            if eye_dist > 5:
                mouth_offset_ratio = mouth_offset / eye_dist
                # Mouth and nose should align in profile
                alignment_diff = abs(mouth_offset_ratio - nose_offset_ratio)
                mouth_score = max(0, abs(mouth_offset_ratio) - alignment_diff * 0.5)
            else:
                mouth_score = 0.5
        
        # ============ FEATURE 5: Ear visibility analysis ============
        ear_score = 0
        ear_direction_hint = 0  # -1 = left profile, +1 = right profile
        
        if right_ear_x is not None and left_ear_x is not None:
            # Calculate ear visibility difference
            right_ear_dist = abs(right_ear_x - re_x)
            left_ear_dist = abs(left_ear_x - le_x)
            
            # In profile, one ear is much closer to its eye than the other
            if eye_dist > 5:
                ear_asymmetry = abs(right_ear_dist - left_ear_dist) / eye_dist
                ear_score = min(ear_asymmetry * 2, 1.0)
                
                # Determine direction from ear positions
                if right_ear_dist < left_ear_dist * 0.7:
                    ear_direction_hint = 1  # Right profile (right ear hidden behind face)
                elif left_ear_dist < right_ear_dist * 0.7:
                    ear_direction_hint = -1  # Left profile (left ear hidden behind face)
                    
        elif right_ear_x is not None:
            # Only right ear visible - likely right profile
            ear_score = 0.4
            ear_direction_hint = 1
        elif left_ear_x is not None:
            # Only left ear visible - likely left profile
            ear_score = 0.4
            ear_direction_hint = -1
        
        # ============ FEATURE 6: Eye-to-ear distance ratio ============
        eye_ear_score = 0
        if right_ear_x is not None and left_ear_x is not None:
            re_to_rear = abs(re_x - right_ear_x)
            le_to_lear = abs(le_x - left_ear_x)
            
            if max(re_to_rear, le_to_lear) > 5:
                eye_ear_ratio = min(re_to_rear, le_to_lear) / max(re_to_rear, le_to_lear)
                eye_ear_score = 1 - eye_ear_ratio  # Higher when asymmetric
        
        # ============ FEATURE 7: Face symmetry score ============
        symmetry_score = 0
        if right_ear_x is not None and left_ear_x is not None and mouth_x is not None:
            # Calculate centroid of all points
            all_x = [re_x, le_x, nose_x, mouth_x, right_ear_x, left_ear_x]
            centroid_x = sum(all_x) / len(all_x)
            
            # Calculate variance of points from centroid
            right_side = [re_x, right_ear_x]
            left_side = [le_x, left_ear_x]
            
            right_spread = sum(abs(x - centroid_x) for x in right_side) / 2
            left_spread = sum(abs(x - centroid_x) for x in left_side) / 2
            
            if max(right_spread, left_spread) > 5:
                symmetry_ratio = min(right_spread, left_spread) / max(right_spread, left_spread)
                symmetry_score = 1 - symmetry_ratio  # Higher when asymmetric
        
        # ============ FEATURE 8: Vertical alignment analysis ============
        vertical_score = 0
        if mouth_x is not None:
            # In profile, nose and mouth align more vertically with one eye
            nose_to_re = abs(nose_x - re_x)
            nose_to_le = abs(nose_x - le_x)
            
            if max(nose_to_re, nose_to_le) > 5:
                vertical_ratio = min(nose_to_re, nose_to_le) / max(nose_to_re, nose_to_le)
                vertical_score = 1 - vertical_ratio
        
        # ============ COMBINE ALL FEATURES ============
        # Weighted combination of all profile indicators
        weights = {
            'nose_offset': 0.30,
            'eye_compression': 0.15,
            'mouth': 0.10,
            'ear': 0.20,
            'eye_ear': 0.10,
            'symmetry': 0.10,
            'vertical': 0.05
        }
        
        combined_score = (
            abs(nose_offset_ratio) * weights['nose_offset'] +
            eye_compression_score * weights['eye_compression'] +
            mouth_score * weights['mouth'] +
            ear_score * weights['ear'] +
            eye_ear_score * weights['eye_ear'] +
            symmetry_score * weights['symmetry'] +
            vertical_score * weights['vertical']
        )
        
        # Determine direction
        # Primary indicator is nose offset, ear hints provide confirmation
        direction_score = nose_offset_ratio
        if ear_direction_hint != 0:
            # Boost confidence when ear visibility agrees with nose offset
            if (ear_direction_hint > 0 and nose_offset_ratio > 0) or \
               (ear_direction_hint < 0 and nose_offset_ratio < 0):
                combined_score *= 1.2
        
        # Classify based on combined score
        if combined_score > self.STRONG_PROFILE_THRESHOLD:
            confidence = min(combined_score * 120, 100)
            direction = 'right_profile' if direction_score > 0 else 'left_profile'
        elif combined_score > self.PROFILE_THRESHOLD:
            confidence = combined_score * 100
            direction = 'right_profile' if direction_score > 0 else 'left_profile'
        else:
            confidence = (1 - combined_score) * 100
            direction = 'frontal'
        
        # Calculate angle (0-90 degrees)
        angle = min(combined_score * 120, 90)
        
        soft_biometrics = {
            'nose_offset_ratio': nose_offset_ratio,
            'eye_compression_score': eye_compression_score,
            'ear_symmetry_score': ear_score,
            'combined_pose_score': combined_score
        }
        
        return angle, direction, confidence, soft_biometrics
    
    @staticmethod
    def _compute_iou(box1, box2):
        """Compute IoU between two bounding boxes (x, y, w, h)."""
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
        """Non-Maximum Suppression to remove duplicate face detections."""
        if len(faces) <= 1:
            return faces
        
        # Sort by confidence (descending)
        faces_sorted = sorted(faces, key=lambda f: f['confidence'], reverse=True)
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
    
    def _run_blazeface(self, image, detector_obj=None):
        """Run a BlazeFace detector on the image, return list of face dicts."""
        if detector_obj is None:
            detector_obj = self.detector
        
        h, w = image.shape[:2]
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        
        result = detector_obj.detect(mp_image)
        faces = []
        
        for detection in result.detections:
            bbox = detection.bounding_box
            score = detection.categories[0].score
            
            angle, direction, profile_conf, soft_metrics = self._calculate_profile_direction(
                detection.keypoints, w, h
            )
            
            face = {
                'bbox': {
                    'x': max(0, bbox.origin_x),
                    'y': max(0, bbox.origin_y),
                    'w': bbox.width,
                    'h': bbox.height
                },
                'confidence': score,
                'direction': direction,
                'angle': angle,
                'profile_confidence': profile_conf,
                'keypoints': [
                    {'x': int(kp.x * w), 'y': int(kp.y * h)} 
                    for kp in detection.keypoints
                ],
                'soft_biometrics': soft_metrics
            }
            faces.append(face)
        
        return faces
    
    def _run_haar_profile(self, image):
        """Run Haar profile cascade as fallback for extreme side faces."""
        if self._haar_profile is None:
            return []
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            h, w = image.shape[:2]
            
            faces = []
            # Detect left-looking profiles
            left_detections = self._haar_profile.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
            )
            for (x, y, bw, bh) in (left_detections if len(left_detections) > 0 else []):
                faces.append({
                    'bbox': {'x': int(x), 'y': int(y), 'w': int(bw), 'h': int(bh)},
                    'confidence': 0.5,
                    'direction': 'left_profile',
                    'angle': 60.0,
                    'profile_confidence': 70.0,
                    'keypoints': [],
                    'soft_biometrics': {}
                })
            
            # Detect right-looking profiles (flip image)
            flipped = cv2.flip(gray, 1)
            right_detections = self._haar_profile.detectMultiScale(
                flipped, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
            )
            for (x, y, bw, bh) in (right_detections if len(right_detections) > 0 else []):
                # Mirror the x coordinate back
                faces.append({
                    'bbox': {'x': int(w - x - bw), 'y': int(y), 'w': int(bw), 'h': int(bh)},
                    'confidence': 0.5,
                    'direction': 'right_profile',
                    'angle': 60.0,
                    'profile_confidence': 70.0,
                    'keypoints': [],
                    'soft_biometrics': {}
                })
            
            return faces
        except Exception:
            return []
    
    def detect_faces(self, image, profile_only=True):
        """
        Multi-pass face detection for maximum recall.
        
        Pass 1: BlazeFace at normal confidence (fast, catches most faces)
        Pass 2: BlazeFace at low confidence (catches side faces missed by Pass 1)
        Pass 3: Haar profile cascade (catches extreme profiles BlazeFace misses)
        
        All passes are deduplicated via Non-Maximum Suppression (NMS).
        
        Args:
            image: BGR image from OpenCV
            profile_only: If True, only return side-facing faces
            
        Returns:
            List of face dictionaries with detection info
        """
        all_faces = []
        
        # Pass 1: Primary BlazeFace detector
        faces_1 = self._run_blazeface(image, self.detector)
        all_faces.extend(faces_1)
        
        # Pass 2: Low-confidence BlazeFace (only if Pass 1 found few faces)
        if len(faces_1) < 1 and self._low_conf_detector is not None:
            faces_2 = self._run_blazeface(image, self._low_conf_detector)
            all_faces.extend(faces_2)
        
        # Pass 3: Haar profile cascade (only if still no faces found)
        if len(all_faces) < 1:
            faces_3 = self._run_haar_profile(image)
            all_faces.extend(faces_3)
        
        # Deduplicate with NMS
        all_faces = self._nms_faces(all_faces, iou_threshold=0.4)
        
        # Filter by direction if profile_only
        if profile_only:
            all_faces = [f for f in all_faces if f['direction'] in ['left_profile', 'right_profile']]
        
        return all_faces
    
    def draw_results(self, image, faces, show_keypoints=True, show_stats=True):
        """
        Draw detection results on image with enhanced visuals.
        """
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
            conf = face['confidence']
            prof_conf = face.get('profile_confidence', 0)
            color = self.COLORS.get(direction, self.COLORS['unknown'])
            
            x, y, bw, bh = bbox['x'], bbox['y'], bbox['w'], bbox['h']
            
            # Draw rounded rectangle effect
            cv2.rectangle(output, (x, y), (x + bw, y + bh), color, 2)
            cv2.rectangle(output, (x-1, y-1), (x + bw + 1, y + bh + 1), (0, 0, 0), 1)
            
            # Direction label with background
            label = direction.replace('_', ' ').upper()
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            
            # Label background
            cv2.rectangle(output, (x, y - 28), (x + label_size[0] + 10, y), color, -1)
            cv2.putText(output, label, (x + 5, y - 8),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Confidence bar
            bar_width = int((conf) * bw)
            cv2.rectangle(output, (x, y + bh + 5), (x + bar_width, y + bh + 12), color, -1)
            cv2.rectangle(output, (x, y + bh + 5), (x + bw, y + bh + 12), color, 1)
            
            # Draw keypoints
            if show_keypoints:
                keypoint_colors = [
                    (0, 255, 255),  # right eye - yellow
                    (0, 255, 255),  # left eye - yellow
                    (255, 0, 255),  # nose - magenta
                    (255, 255, 0),  # mouth - cyan
                    (0, 165, 255),  # right ear - orange
                    (0, 165, 255),  # left ear - orange
                ]
                for i, kp in enumerate(face['keypoints']):
                    kp_color = keypoint_colors[i] if i < len(keypoint_colors) else (255, 255, 255)
                    cv2.circle(output, (kp['x'], kp['y']), 4, kp_color, -1)
                    cv2.circle(output, (kp['x'], kp['y']), 5, (0, 0, 0), 1)
        
        # Stats overlay
        if show_stats:
            # Create semi-transparent overlay
            overlay = output.copy()
            cv2.rectangle(overlay, (5, 5), (220, 100), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, output, 0.4, 0, output)
            
            # Stats text
            left_count = sum(1 for f in faces if f['direction'] == 'left_profile')
            right_count = sum(1 for f in faces if f['direction'] == 'right_profile')
            frontal_count = sum(1 for f in faces if f['direction'] == 'frontal')
            
            cv2.putText(output, f"FPS: {self.fps:.1f}", (15, 28),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(output, f"Left Profiles: {left_count}", (15, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.COLORS['left_profile'], 2)
            cv2.putText(output, f"Right Profiles: {right_count}", (15, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.COLORS['right_profile'], 2)
            cv2.putText(output, f"Frontal: {frontal_count}", (15, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.COLORS['frontal'], 2)
        
        return output
    
    def close(self):
        """Cleanup resources."""
        self.detector = None


def run_webcam_detection(profile_only=True):
    """
    Real-time webcam detection with keyboard controls.
    
    Controls:
        Q - Quit
        P - Toggle profile-only mode
        K - Toggle keypoints
        S - Save screenshot
    """
    print("\n" + "=" * 50)
    print("🎥 WEBCAM SIDE FACE DETECTION")
    print("=" * 50)
    print("\n🎮 Controls:")
    print("   [Q] Quit")
    print("   [P] Toggle Profile-Only Mode")
    print("   [K] Toggle Keypoints")
    print("   [S] Save Screenshot")
    print("=" * 50)
    
    detector = SideFaceDetector(min_detection_confidence=0.35)
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Cannot open webcam!")
        return
    
    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    show_keypoints = True
    screenshot_count = 0
    
    print("\n✅ Webcam started! Turn your head left/right to detect profiles.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Frame capture failed")
            break
        
        # Mirror the frame
        frame = cv2.flip(frame, 1)
        
        # Detect faces
        faces = detector.detect_faces(frame, profile_only=profile_only)
        
        # Draw results
        output = detector.draw_results(frame, faces, show_keypoints=show_keypoints)
        
        # Mode indicator
        mode_text = "PROFILE ONLY" if profile_only else "ALL FACES"
        mode_color = (0, 200, 255) if profile_only else (0, 255, 0)
        cv2.putText(output, f"Mode: {mode_text}", (output.shape[1] - 200, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, mode_color, 2)
        
        # Show frame
        cv2.imshow('Side Face Detection - Press Q to Quit', output)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("\n👋 Exiting...")
            break
        elif key == ord('p'):
            profile_only = not profile_only
            print(f"📌 Mode: {'Profile Only' if profile_only else 'All Faces'}")
        elif key == ord('k'):
            show_keypoints = not show_keypoints
            print(f"📌 Keypoints: {'ON' if show_keypoints else 'OFF'}")
        elif key == ord('s'):
            screenshot_count += 1
            filename = f"screenshot_{screenshot_count}.jpg"
            cv2.imwrite(filename, output)
            print(f"📸 Saved: {filename}")
    
    cap.release()
    cv2.destroyAllWindows()
    detector.close()


def run_image_detection(image_path, output_path=None, profile_only=True):
    """Process a single image for side face detection."""
    print(f"\n📷 Processing: {image_path}")
    
    detector = SideFaceDetector(min_detection_confidence=0.35)
    
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ Error: Cannot read image!")
        return None
    
    faces = detector.detect_faces(image, profile_only=profile_only)
    
    # Print results
    print("\n" + "=" * 40)
    print("📊 DETECTION RESULTS")
    print("=" * 40)
    
    left = sum(1 for f in faces if f['direction'] == 'left_profile')
    right = sum(1 for f in faces if f['direction'] == 'right_profile')
    frontal = sum(1 for f in faces if f['direction'] == 'frontal')
    
    print(f"  🔵 Left Profiles:  {left}")
    print(f"  🔴 Right Profiles: {right}")
    if not profile_only:
        print(f"  🟢 Frontal Faces:  {frontal}")
    print("=" * 40)
    
    for i, face in enumerate(faces):
        print(f"\n  Face {i+1}:")
        print(f"    Direction:  {face['direction'].replace('_', ' ').title()}")
        print(f"    Confidence: {face['confidence']:.1%}")
    
    # Draw and save/show
    output = detector.draw_results(image, faces)
    
    if output_path:
        cv2.imwrite(output_path, output)
        print(f"\n✅ Saved: {output_path}")
    else:
        cv2.imshow('Detection Result - Press any key', output)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    detector.close()
    return faces


def main():
    """Main menu interface."""
    print("\n" + "=" * 55)
    print("   🎯 ADVANCED SIDE FACE / PROFILE DETECTION")
    print("   📦 Using MediaPipe (Pre-trained Model)")
    print("=" * 55)
    print("\n   ✅ No dataset required!")
    print("   ✅ Detects: LEFT PROFILE | RIGHT PROFILE | FRONTAL")
    print("\n" + "-" * 55)
    print("   OPTIONS:")
    print("-" * 55)
    print("   1. 🎥 Webcam - Profile faces ONLY")
    print("   2. 🎥 Webcam - All faces (with direction)")
    print("   3. 📷 Image  - Profile faces ONLY")
    print("   4. 📷 Image  - All faces (with direction)")
    print("   5. 🚪 Exit")
    print("-" * 55)
    
    while True:
        choice = input("\n   Enter choice (1-5): ").strip()
        
        if choice == '1':
            run_webcam_detection(profile_only=True)
        elif choice == '2':
            run_webcam_detection(profile_only=False)
        elif choice == '3':
            path = input("   Image path: ").strip().strip('"')
            save = input("   Save output? (y/n): ").strip().lower()
            out = input("   Output path: ").strip().strip('"') if save == 'y' else None
            run_image_detection(path, out, profile_only=True)
        elif choice == '4':
            path = input("   Image path: ").strip().strip('"')
            save = input("   Save output? (y/n): ").strip().lower()
            out = input("   Output path: ").strip().strip('"') if save == 'y' else None
            run_image_detection(path, out, profile_only=False)
        elif choice == '5':
            print("\n   👋 Goodbye!\n")
            break
        else:
            print("   ⚠️ Invalid choice. Try again.")


if __name__ == "__main__":
    main()
