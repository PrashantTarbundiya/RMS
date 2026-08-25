import cv2
import os
import time
# Path constants
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPTS_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from face_detection import SideFaceDetector

def create_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)

def capture_images(user_name):
    """
    Captures images for a specific user from 3 angles: Frontal, Left, Right.
    """
    base_dir = os.path.join(PROJECT_ROOT, "dataset")
    user_dir = os.path.join(base_dir, user_name)
    
    modes = [
        {'name': 'frontal', 'prompt': 'Please look STRAIGHT at the camera', 'target_dir': 'frontal'},
        {'name': 'left_profile', 'prompt': 'Please turn your head to the LEFT', 'target_dir': 'left'},
        {'name': 'right_profile', 'prompt': 'Please turn your head to the RIGHT', 'target_dir': 'right'}
    ]
    
    # Initialize detector
    detector = SideFaceDetector(min_detection_confidence=0.5)
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Cannot open webcam!")
        return

    # Valid angles for strictly enforcing profile capture
    valid_angles = {
        'frontal': ['frontal'],
        'left_profile': ['left_profile'],
        'right_profile': ['right_profile']
    }

    try:
        for mode in modes:
            target_path = os.path.join(user_dir, mode['target_dir'])
            create_directory(target_path)
            
            count = 0
            max_images = 10
            last_capture_time = 0
            capture_delay = 0.5  # Seconds between captures
            
            print(f"\n" + "="*50)
            print(f"📸 MODE: {mode['name'].upper()}")
            print(f"👉 {mode['prompt']}")
            print(f"💾 Saving to: {target_path}")
            print("="*50)
            print("Press 'q' to skip this mode, 'c' to capture manually if auto fails.")
            
            while count < max_images:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Mirror frame
                frame = cv2.flip(frame, 1)
                display_frame = frame.copy()
                
                # Detect faces
                faces = detector.detect_faces(frame, profile_only=False)
                
                status_color = (0, 0, 255) # Red by default
                status_text = "Waiting for valid face..."
                
                valid_face_found = False
                
                if faces:
                    # Sort by confidence
                    face = max(faces, key=lambda x: x['confidence'])
                    direction = face['direction']
                    
                    # Draw box
                    detector.draw_results(display_frame, [face], show_keypoints=True, show_stats=False)
                    
                    # Check if direction matches current mode
                    if direction in valid_angles[mode['name']]:
                        status_color = (0, 255, 0)
                        status_text = "PERFECT! Hold still..."
                        valid_face_found = True
                        
                        # Auto-capture
                        current_time = time.time()
                        if current_time - last_capture_time > capture_delay:
                            img_name = f"{user_name}_{mode['name']}_{count}.jpg"
                            cv2.imwrite(os.path.join(target_path, img_name), frame)
                            count += 1
                            last_capture_time = current_time
                            print(f"✅ Captured {count}/{max_images} ({mode['name']})")
                    else:
                        status_color = (0, 165, 255)
                        status_text = f"Wrong angle! Detected: {direction}"
                
                # UI Overlay
                cv2.rectangle(display_frame, (0, 0), (640, 80), (0, 0, 0), -1)
                cv2.putText(display_frame, f"MODE: {mode['name'].upper()}", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(display_frame, f"Captured: {count}/{max_images}", (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(display_frame, status_text, (250, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
                
                cv2.imshow('Dataset Collection', display_frame)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print(f"⚠️ Skipped {mode['name']} collection.")
                    break
                elif key == ord('c'):
                    # Manual force capture
                    img_name = f"{user_name}_{mode['name']}_{count}_manual.jpg"
                    cv2.imwrite(os.path.join(target_path, img_name), frame)
                    count += 1
                    print(f"✅ Manual capture {count}/{max_images}")

            print(f"🎉 Completed {mode['name']} collection!\n")
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n❌ Interrupted by user.")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        print("💾 Dataset collection finished.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        name = sys.argv[1]
    else:
        name = input("Enter user name for dataset: ").strip()
    
    if name:
        capture_images(name)
    else:
        print("❌ No name provided.")
