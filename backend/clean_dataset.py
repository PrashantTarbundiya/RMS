import os
import cv2
import numpy as np

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    _MEDIAPIPE_OK = True
except ImportError:
    _MEDIAPIPE_OK = False


def _build_mediapipe_detector(model_path="blaze_face_short_range.tflite", confidence=0.3):
    """Build a MediaPipe FaceDetector (BlazeFace). Returns None if unavailable."""
    if not _MEDIAPIPE_OK:
        return None
    if not os.path.exists(model_path):
        import urllib.request
        url = ("https://storage.googleapis.com/mediapipe-models/face_detector/"
               "blaze_face_short_range/float16/1/blaze_face_short_range.tflite")
        print(f"📥 Downloading BlazeFace model...")
        urllib.request.urlretrieve(url, model_path)
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceDetectorOptions(
        base_options=base_options,
        min_detection_confidence=confidence
    )
    return vision.FaceDetector.create_from_options(options)


def _detect_with_mediapipe(detector, img_bgr):
    """Run MediaPipe detector on a BGR frame. Returns list of (x,y,w,h) tuples."""
    h, w = img_bgr.shape[:2]
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_img)
    boxes = []
    for det in result.detections:
        bb = det.bounding_box
        boxes.append((
            max(0, bb.origin_x),
            max(0, bb.origin_y),
            bb.width,
            bb.height
        ))
    return boxes


EXTRA_PAD = 10  # fixed extra pixels added around face crop on all sides

def clean_dataset(input_dir="dataset", output_dir="dataset_cleaned", margin_ratio=0.20):
    """
    Reads all images from input_dir, detects faces using MediaPipe BlazeFace
    (falls back to Haar cascade if MediaPipe is unavailable), crops the face
    with margin, and saves them to output_dir.
    Keeps the same folder structure (e.g., dataset/person1 -> dataset_cleaned/person1).
    If no face is detected, the full image is saved as a fallback (useful for 
    side/profile images that may not trigger frontal detectors).
    """
    # Use absolute paths or relative paths based on where the script is run
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(base_dir, input_dir)
    output_path = os.path.join(base_dir, output_dir)

    if not os.path.exists(input_path):
        print(f"Error: Input directory '{input_path}' not found.")
        print("Please make sure your dataset is in the correct folder.")
        return

    # Prefer MediaPipe BlazeFace (handles side/profile faces better than Haar)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "blaze_face_short_range.tflite")
    mp_detector = _build_mediapipe_detector(model_path, confidence=0.3)
    if mp_detector:
        print("🔍 Using MediaPipe BlazeFace for face detection.")
    else:
        print("⚠️  MediaPipe unavailable — falling back to Haar cascade.")
        cascade_file = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_file)

    os.makedirs(output_path, exist_ok=True)
    
    total_processed = 0
    total_faces_found = 0

    print(f"Scanning directory: {input_path}")
    
    for relative_path, dirs, files in os.walk(input_path):
        for filename in files:
            if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
                
            img_path = os.path.join(relative_path, filename)
            
            # Determine the output directory preserving the structure
            rel_dir = os.path.relpath(relative_path, input_path)
            out_person_dir = os.path.join(output_path, rel_dir)
            
            try:
                # Read image using cv2
                img = cv2.imread(img_path)
                if img is None:
                    continue
                
                total_processed += 1
                # Detect faces (MediaPipe preferred; Haar fallback)
                if mp_detector:
                    raw_faces = _detect_with_mediapipe(mp_detector, img)
                    faces = [(x, y, w, h) for (x, y, w, h) in raw_faces]
                else:
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    faces = list(face_cascade.detectMultiScale(
                        gray, scaleFactor=1.1, minNeighbors=4, minSize=(20, 20)
                    ))

                if len(faces) == 0:
                    # Fallback: save full image (side/profile faces can evade detectors)
                    os.makedirs(out_person_dir, exist_ok=True)
                    out_path = os.path.join(out_person_dir, filename)
                    cv2.imwrite(out_path, img)
                    total_faces_found += 1
                    print(f"[~] No face detected (saved full image): {out_path}")
                    continue
                
                # Take the LARGEST face found (most likely to be the subject)
                (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
                
                # Add margin: percentage of face size + fixed 10px extra boundary
                margin_x = int(w * margin_ratio) + EXTRA_PAD
                margin_y = int(h * margin_ratio) + EXTRA_PAD
                
                x1 = max(0, x - margin_x)
                y1 = max(0, y - margin_y)
                x2 = min(img.shape[1], x + w + margin_x)
                y2 = min(img.shape[0], y + h + margin_y)
                
                # Crop face
                face_roi = img[y1:y2, x1:x2]
                
                # Create directory if it doesn't exist
                os.makedirs(out_person_dir, exist_ok=True)
                
                # Save cropped face
                out_path = os.path.join(out_person_dir, filename)
                cv2.imwrite(out_path, face_roi)
                total_faces_found += 1
                
                print(f"[+] Cropped & Saved: {out_path}")
                
            except Exception as e:
                print(f"[!] Error processing {img_path}: {e}")

    print("-" * 40)
    print("Dataset Cleaning Complete!")
    print(f"Total images checked: {total_processed}")
    print(f"Total faces successfully cropped: {total_faces_found}")

if __name__ == "__main__":
    # You can change the input and output directory names here if needed
    # It assumes 'dataset' is in same directory as this script and creates 'dataset_cleaned'
    clean_dataset(input_dir="dataset", output_dir="dataset_cleaned")
