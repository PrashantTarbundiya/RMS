import os
import cv2
import numpy as np
from sklearn.datasets import fetch_lfw_people
from face_detection import SideFaceDetector

def create_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_and_sort_lfw():
    print("⬇️  Downloading LFW dataset (this may take a few minutes)...")
    # Fetch LFW with color and original size
    lfw_people = fetch_lfw_people(min_faces_per_person=20, resize=None, color=True)
    
    print(f"✅ Downloaded {len(lfw_people.images)} images of {len(lfw_people.target_names)} people.")
    
    detector = SideFaceDetector(min_detection_confidence=0.4)
    base_dir = "dataset"
    create_directory(base_dir)
    
    print("🔍 Analyzing faces for side profiles...")
    
    processed_count = 0
    saved_count = 0
    
    # We want to find people who have at least ONE profile view to be useful
    # So we'll first sort images by person
    person_images = {}
    
    for idx, (image, target) in enumerate(zip(lfw_people.images, lfw_people.target)):
        name = lfw_people.target_names[target].replace(" ", "_")
        if name not in person_images:
            person_images[name] = []
        
        # Convert from float (0-1) to uint8 (0-255) if needed
        if image.dtype == np.float32 or image.dtype == np.float64:
            uint8_image = (image * 255).astype(np.uint8)
        else:
            uint8_image = image.astype(np.uint8)
            
        # LFW images are RGB, OpenCV needs BGR
        bgr_image = cv2.cvtColor(uint8_image, cv2.COLOR_RGB2BGR)
        person_images[name].append(bgr_image)

    # Now process each person
    total_people = len(person_images)
    print(f"👤 Processing {total_people} identities...")

    for i, (name, images) in enumerate(person_images.items()):
        print(f"  [{i+1}/{total_people}] Analyzing {name} ({len(images)} images)...", end="\r")
        
        user_dir = os.path.join(base_dir, name)
        
        counts = {'frontal': 0, 'left_profile': 0, 'right_profile': 0}
        
        temp_saved = [] # Store (image, direction, path)
        
        for img_idx, img in enumerate(images):
            # Detect
            faces = detector.detect_faces(img, profile_only=False)
            
            if not faces:
                continue
                
            # Get primary face (largest)
            face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
            direction = face['direction']
            
            if direction == 'unknown':
                continue
            
            # Map 'left_profile' -> 'left', etc
            subdir = direction
            if direction == 'left_profile': subdir = 'left'
            if direction == 'right_profile': subdir = 'right'
            
            counts[direction] += 1
            
            # Prepare to save
            save_path = os.path.join(user_dir, subdir)
            filename = f"{name}_{subdir}_{img_idx}.jpg"
            temp_saved.append((img, save_path, filename))
            
        # Strategy: Keep this person ONLY if they have diverse views?
        # Or just keep everyone?
        # User wants "bestest available". A dataset of only frontals is useless for side recognition demo.
        # But valid side profiles in LFW are rare. 
        # Let's save WHATEVER we find, but only create folders if we have images.
        
        if len(temp_saved) > 0:
            for img, path, fname in temp_saved:
                create_directory(path)
                cv2.imwrite(os.path.join(path, fname), img)
                saved_count += 1

    print("\n" + "="*50)
    print(f"✅ Dataset generation complete!")
    print(f"💾 Saved {saved_count} sorted images to '{base_dir}/'")
    print("="*50)
    
    # Summary of side profiles found
    # Scan directories to see what we actually got
    total_left = 0
    total_right = 0
    for root, dirs, files in os.walk(base_dir):
        if 'left' in root: total_left += len(files)
        if 'right' in root: total_right += len(files)
        
    print(f"📊 Statistics:")
    print(f"  Left Profiles: {total_left}")
    print(f"  Right Profiles: {total_right}")
    
    if total_left + total_right < 5:
        print("\n⚠️ WARNING: Low number of profile faces found in LFW subset.")
        print("   LFW is mostly frontal. For better results, you might need to:")
        print("   1. Run this script again (it might download more if sklearn caches)")
        print("   2. Or manually add some profile photos to dataset/User/left_profile/")
    
    detector.close()

if __name__ == "__main__":
    download_and_sort_lfw()
