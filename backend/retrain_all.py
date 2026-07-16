"""
retrain_all.py — One-click script to retrain all 3 models with maximum accuracy.

Usage:
    cd backend
    .\\venv\\Scripts\\activate
    python retrain_all.py

This script:
  1. Regenerates all DeepFace (Facenet512) embeddings with 5 augments per image
  2. Retrains SOTA MobileNetV2 for 25 epochs with LR scheduler + early stopping
  3. Reports final accuracy for all 2 models
"""

import os
import sys
import time
import pickle
import cv2
import numpy as np

# Ensure encoding works on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Path setup
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

from model import apply_clahe, get_embedding, generate_augments, NUM_AUGMENTS
from add_person_utils import update_sota_model
from face_detection import SideFaceDetector

# Configuration
DATASET_CLEANED_DIR = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
ENCODINGS_PATH = os.path.join(DATA_DIR, 'encodings.pickle')
SOTA_EPOCHS = 25


def regenerate_deepface_embeddings():
    """Regenerate ALL DeepFace embeddings from scratch using the cleaned dataset."""
    print("\n" + "=" * 60)
    print("  STEP 1: Regenerating DeepFace (Facenet512) Embeddings")
    print("=" * 60)

    if not os.path.exists(DATASET_CLEANED_DIR):
        print("  ERROR: dataset_cleaned directory not found!")
        return False

    persons = [d for d in os.listdir(DATASET_CLEANED_DIR)
               if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, d))]
    
    if not persons:
        print("  ERROR: No persons found in dataset_cleaned/")
        return False

    print(f"  Found {len(persons)} persons: {', '.join(persons)}")

    all_encodings = []
    all_names = []
    
    detector = SideFaceDetector(min_detection_confidence=0.30)
    
    for person_name in sorted(persons):
        person_dir = os.path.join(DATASET_CLEANED_DIR, person_name)
        image_paths = []
        
        # Collect all images from all angle subdirectories
        for root, dirs, files in os.walk(person_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                    image_paths.append(os.path.join(root, f))
        
        if not image_paths:
            print(f"  WARNING: No images found for {person_name}")
            continue
        
        person_count = 0
        for img_path in image_paths:
            try:
                image = cv2.imread(img_path)
                if image is None:
                    continue
                
                # Detect face and crop
                faces = detector.detect_faces(image, profile_only=False)
                if faces:
                    face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                    x, y, w, h = face['bbox']['x'], face['bbox']['y'], face['bbox']['w'], face['bbox']['h']
                    h_img, w_img = image.shape[:2]
                    margin_x = int(w * 0.20)
                    margin_y = int(h * 0.20)
                    x1 = max(0, x - margin_x)
                    y1 = max(0, y - margin_y)
                    x2 = min(w_img, x + w + margin_x)
                    y2 = min(h_img, y + h + margin_y)
                    face_crop = image[y1:y2, x1:x2]
                else:
                    face_crop = image
                
                if face_crop.size == 0:
                    continue
                
                # Apply CLAHE
                face_crop = apply_clahe(face_crop)
                
                # Generate embedding for original
                embedding = get_embedding(face_crop)
                if embedding:
                    all_encodings.append(embedding)
                    all_names.append(person_name)
                    person_count += 1
                
                # Generate embeddings for augmented variants
                augments = generate_augments(face_crop)
                for aug_img in augments:
                    aug_emb = get_embedding(aug_img)
                    if aug_emb:
                        all_encodings.append(aug_emb)
                        all_names.append(person_name)
                        person_count += 1
                        
            except Exception as e:
                print(f"  WARNING: Error processing {img_path}: {e}")
        
        print(f"  {person_name}: {person_count} embeddings ({len(image_paths)} images x {NUM_AUGMENTS+1} variants)")
    
    detector.close()
    
    # Save
    os.makedirs(DATA_DIR, exist_ok=True)
    data = {
        "encodings": all_encodings,
        "names": all_names,
        "model_used": "Facenet512",
        "version": "2.0-retrained"
    }
    with open(ENCODINGS_PATH, "wb") as f:
        pickle.dump(data, f)
    
    # Summary
    from collections import Counter
    counts = Counter(all_names)
    print(f"\n  Total: {len(all_encodings)} embeddings for {len(counts)} people")
    for name, count in sorted(counts.items()):
        print(f"    {name}: {count}")
    
    return True


def retrain_sota_model():
    """Retrain SOTA MobileNetV2 on dataset_cleaned with more epochs."""
    print("\n" + "=" * 60)
    print(f"  STEP 2: Retraining SOTA MobileNetV2 ({SOTA_EPOCHS} epochs)")
    print("=" * 60)
    
    persons = [d for d in os.listdir(DATASET_CLEANED_DIR)
               if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, d))]
    
    if not persons:
        print("  ERROR: No persons found!")
        return False
    
    success = update_sota_model(
        persons[0],
        dataset_dir=DATASET_CLEANED_DIR,
        num_epochs=SOTA_EPOCHS
    )
    return success


def main():
    print("=" * 60)
    print("  RMS Face AI — Full Model Retrain Script")
    print("=" * 60)
    print(f"  Dataset: {DATASET_CLEANED_DIR}")
    print(f"  SOTA Epochs: {SOTA_EPOCHS}")
    print(f"  Augments per image: {NUM_AUGMENTS}")
    print("=" * 60)
    
    start_time = time.time()
    
    # Step 1: DeepFace embeddings
    df_ok = regenerate_deepface_embeddings()
    
    # Step 2: SOTA MobileNetV2
    sota_ok = retrain_sota_model()
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 60)
    print("  RETRAIN SUMMARY")
    print("=" * 60)
    print(f"  DeepFace Embeddings: {'OK' if df_ok else 'FAILED'}")
    print(f"  SOTA MobileNetV2:    {'OK' if sota_ok else 'FAILED'}")
    print(f"  Total time:          {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print("=" * 60)
    print("\n  Restart the server to use the updated models:")
    print("    python server.py")


if __name__ == "__main__":
    main()
