"""
add_person_utils.py — Backend utilities for adding a new person to all three models.

1. DeepFace (Facenet512): Append new embeddings to encodings.pickle (no retrain)
2. SOTA MobileNetV2: Expand classifier head + quick fine-tune
"""

import os
import cv2
import pickle
import shutil
import numpy as np
from PIL import Image

# Path constants
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Reuse existing pipeline functions
from model import apply_clahe, get_embedding, get_embedding_insightface, generate_augments, NUM_AUGMENTS_QUICK, EDGE_LIGHTWEIGHT
from org_storage import get_sota_model_path, get_sota_classes_path
from face_detection import SideFaceDetector


# ============================================================================
# IMAGE QUALITY VALIDATION
# ============================================================================

def check_image_quality(img_bgr, min_size=60, blur_threshold=50.0):
    """
    Check if an image meets minimum quality standards for face training.
    
    Args:
        img_bgr: OpenCV BGR image
        min_size: Minimum width/height in pixels
        blur_threshold: Laplacian variance threshold (lower = blurrier)
    
    Returns:
        tuple: (is_valid: bool, issues: list[str])
    """
    issues = []
    h, w = img_bgr.shape[:2]
    
    # Check minimum dimensions
    if w < min_size or h < min_size:
        issues.append(f"Image too small ({w}x{h}px, need at least {min_size}x{min_size}px)")
    
    # Check blur using Laplacian variance
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < blur_threshold:
        issues.append(f"Image is too blurry (score: {blur_score:.1f}, need > {blur_threshold})")
    
    # Check if image is too dark or too bright
    mean_brightness = gray.mean()
    if mean_brightness < 30:
        issues.append(f"Image is too dark (brightness: {mean_brightness:.0f}/255)")
    elif mean_brightness > 240:
        issues.append(f"Image is too bright/washed out (brightness: {mean_brightness:.0f}/255)")
    
    return len(issues) == 0, issues


# ============================================================================
# 1. DEEPFACE — Incremental Embedding Append (No Retrain)
# ============================================================================

def update_deepface_model(person_name, image_paths, model_name='Facenet512', org_id=None):
    from org_storage import get_encodings_path
    encodings_path = get_encodings_path(org_id, model_name)
    """
    Generate embeddings for uploaded images and append them to
    the existing encodings file for the specified model. No retraining needed.

    GPU-first strategy:
      - If InsightFace (ArcFace) + CUDA is available, uses GPU batch embedding
        (~10-20x faster than CPU DeepFace).
      - Falls back automatically to the existing CPU DeepFace pipeline if GPU
        is unavailable or raises any error.

    Edge optimization: When EDGE_LIGHTWEIGHT is enabled and multi-angle
    enrollment photos (front/left/right) are present, synthetic augmentation
    is skipped entirely since real viewing angles are far more representative.

    Returns:
        tuple: (new_encodings_list, new_names_list, num_added)
    """
    # ── GPU Fast Path (InsightFace only) ─────────────────────────────────────
    try:
        from gpu_trainer import is_gpu_available, enroll_with_gpu
        if model_name == 'InsightFace' and is_gpu_available():
            print(f"\n{'='*50}")
            print(f"GPU (InsightFace): Adding embeddings for '{person_name}'")
            print(f"{'='*50}")
            return enroll_with_gpu(person_name, image_paths, encodings_path)
    except Exception as gpu_err:
        print(f"   [GPU] Failed ({gpu_err}), falling back to CPU DeepFace...")
    # ── CPU Fallback (original logic below, unchanged) ──────────────────────

    # Load existing encodings
    existing_encodings = []
    existing_names = []

    if os.path.exists(encodings_path):
        with open(encodings_path, "rb") as f:
            data = pickle.load(f)
            existing_encodings = data.get("encodings", [])
            existing_names = data.get("names", [])
            print(f"   Loaded {len(existing_encodings)} existing embeddings.")
    else:
        print("   No existing encodings found. Creating new file.")

    # Detect multi-angle coverage: if the person has front/left/right images,
    # real viewing angle diversity makes augmentation unnecessary.
    has_multi_angle = False
    angle_dirs = set()
    for p in image_paths:
        parent_dir = os.path.basename(os.path.dirname(p)).lower()
        if parent_dir in ('frontal', 'front', 'left', 'right', 'front_img', 'left_img', 'right_img'):
            angle_dirs.add(parent_dir)
    if len(angle_dirs) >= 2:
        has_multi_angle = True

    skip_augmentation = EDGE_LIGHTWEIGHT and has_multi_angle
    if skip_augmentation:
        print(f"   [Edge] Multi-angle photos detected ({', '.join(angle_dirs)}). Skipping synthetic augmentation.")
    else:
        print(f"   [Augmentation] Generating {NUM_AUGMENTS_QUICK} augments per image.")

    # Initialize face detector
    detector = SideFaceDetector(min_detection_confidence=0.45)  # 0.45 = balanced to reduce false positives
    
    new_count = 0

    for img_path in image_paths:
        try:
            image = cv2.imread(img_path)
            if image is None:
                print(f"   [Warning] Could not read: {os.path.basename(img_path)}")
                continue

            # Quality check before processing
            is_valid, issues = check_image_quality(image)
            if not is_valid:
                print(f"   [Warning] Quality issues for {os.path.basename(img_path)}: {'; '.join(issues)}")
                # Still process but warn — don't discard, as even noisy data helps with few-shot

            # Detect face using our SideFaceDetector
            faces = detector.detect_faces(image, profile_only=False)

            if not faces:
                face_crop = image
            else:
                # Take the largest face
                face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                x, y, w, h = face['bbox']['x'], face['bbox']['y'], face['bbox']['w'], face['bbox']['h']

                # Wider margin (matching training pipeline)
                h_img, w_img = image.shape[:2]
                margin_x = int(w * 0.20)
                margin_y = int(h * 0.20)
                x1 = max(0, x - margin_x)
                y1 = max(0, y - margin_y)
                x2 = min(w_img, x + w + margin_x)
                y2 = min(h_img, y + h + margin_y)
                face_crop = image[y1:y2, x1:x2]

            if face_crop.size == 0:
                continue

            # Apply CLAHE preprocessing (matching training pipeline)
            face_crop = apply_clahe(face_crop)

            # Generate embedding for the ORIGINAL image
            if model_name == 'InsightFace':
                embedding = get_embedding_insightface(face_crop)
            else:
                embedding = get_embedding(face_crop, model_name=model_name)
            if embedding:
                existing_encodings.append(embedding)
                existing_names.append(person_name)
                new_count += 1

            # Generate embeddings for AUGMENTED variants (skip when multi-angle + edge mode)
            if not skip_augmentation:
                augments = generate_augments(face_crop, num_augments=NUM_AUGMENTS_QUICK)
                for aug_img in augments:
                    if model_name == 'InsightFace':
                        aug_embedding = get_embedding_insightface(aug_img)
                    else:
                        aug_embedding = get_embedding(aug_img, model_name=model_name)
                    if aug_embedding:
                        existing_encodings.append(aug_embedding)
                        existing_names.append(person_name)
                        new_count += 1

            print(f"   [OK] Processed: {os.path.basename(img_path)}")

        except Exception as e:
            print(f"   [Error] Error processing {os.path.basename(img_path)}: {e}")

    detector.close()

    # Save updated encodings
    data = {
        "encodings": existing_encodings,
        "names": existing_names,
        "model_used": model_name,
        "version": "2.0-lightweight"
    }
    with open(encodings_path, "wb") as f:
        pickle.dump(data, f)

    print(f"   [Saved] Saved {new_count} new embeddings. Total: {len(existing_encodings)}")

    return existing_encodings, existing_names, new_count

def recompute_person_embeddings(person_name):
    """
    Given a person's name, scan their dataset folder and recompute embeddings.
    Useful for feedback loops where a single image is added to the folder.
    It removes their old embeddings and recalculates them.
    """
    print(f"[Recomputing] Recomputing embeddings for '{person_name}'...")
    
    person_dir = os.path.join(BACKEND_DIR, 'dataset', person_name)
    if not os.path.exists(person_dir):
        print(f"[Error] Cannot recompute: folder for {person_name} does not exist.")
        return
        
    image_paths = [
        os.path.join(person_dir, f) for f in os.listdir(person_dir)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]
    
    if not image_paths:
        print(f"[Warning] No images found for {person_name}.")
        return

    # Load existing
    encodings_path = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')
    existing_encodings = []
    existing_names = []
    if os.path.exists(encodings_path):
        with open(encodings_path, "rb") as f:
            data = pickle.load(f)
            existing_encodings = data.get("encodings", [])
            existing_names = data.get("names", [])

    # Filter out old embeddings for this person
    filtered_encodings = []
    filtered_names = []
    for enc, name in zip(existing_encodings, existing_names):
        if name != person_name:
            filtered_encodings.append(enc)
            filtered_names.append(name)
            
    existing_encodings = filtered_encodings
    existing_names = filtered_names
    
    # Detector setup
    from face_detection import SideFaceDetector
    detector = SideFaceDetector()
    new_count = 0
    
    for img_path in image_paths:
        try:
            image = cv2.imread(img_path)
            if image is None: continue
            
            is_valid, _ = check_image_quality(image)
            if not is_valid: continue
            
            faces = detector.detect(image)
            if not faces:
                h, w = image.shape[:2]
                faces = [(0, 0, w, h)]
                
            x, y, w, h = faces[0]
            margin_x, margin_y = int(w * 0.15), int(h * 0.15)
            x1, y1 = max(0, x - margin_x), max(0, y - margin_y)
            x2, y2 = min(image.shape[1], x + w + margin_x), min(image.shape[0], y + h + margin_y)
            face_crop = image[y1:y2, x1:x2]
            
            face_crop = apply_clahe(face_crop)
            embedding = get_embedding(face_crop)
            
            if embedding:
                existing_encodings.append(embedding)
                existing_names.append(person_name)
                new_count += 1
                
                # Few augments
                augments = generate_augments(face_crop, num_augments=2)
                for aug_img in augments:
                    aug_embedding = get_embedding(aug_img)
                    if aug_embedding:
                        existing_encodings.append(aug_embedding)
                        existing_names.append(person_name)
                        new_count += 1
        except Exception as e:
            print(f"   [Error] Error recomputing {img_path}: {e}")
            
    detector.close()
    
    # Save
    data = {
        "encodings": existing_encodings,
        "names": existing_names,
        "model_used": "Facenet512",
        "version": "2.0-lightweight"
    }
    with open(encodings_path, "wb") as f:
        pickle.dump(data, f)
        
    # Trigger live reload in server
    from inference import global_encodings, global_names
    global_encodings.clear()
    global_names.clear()
    global_encodings.extend(existing_encodings)
    global_names.extend(existing_names)
    
    print(f"[OK] Recomputed {new_count} embeddings for {person_name}. Live reload complete.")


# ============================================================================
# 2. SOTA MobileNetV2 — Expand Head + Quick Fine-Tune
# ============================================================================

def update_sota_model(person_name, dataset_dir=None,
                      model_path=None,
                      classes_path=None,
                      num_epochs=5, batch_size=16,
                      org_id=None):
    if dataset_dir is None:
        dataset_dir = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
    if model_path is None:
        model_path = get_sota_model_path(org_id)
    if classes_path is None:
        classes_path = get_sota_classes_path(org_id)
    """
    Add a new person to the SOTA MobileNetV2 model:
    1. Read existing class names
    2. Rebuild model with updated num_classes
    3. Copy old weights, initialize new class randomly
    4. Fine-tune on entire dataset for a few epochs
    5. Save updated model + mobile_classes.txt
    """
    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim
        from torchvision import datasets, transforms
        from torch.utils.data import DataLoader, Subset
        from models.sota_finetune.finetune import build_mobile_model
    except ImportError as e:
        print(f"   [Warning] PyTorch/Torchvision not installed ({e}). SOTA MobileNetV2 training is disabled in cloud inference mode.")
        return False

    print(f"\n{'='*50}")
    print(f"SOTA MobileNetV2: Fine-tuning for '{person_name}'")
    print(f"{'='*50}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cpu":
        num_threads = min(8, os.cpu_count() or 4)
        torch.set_num_threads(num_threads)
        print(f"   [INFO] PyTorch CPU training optimized: using {num_threads} threads.")

    # Load existing classes
    old_classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            old_classes = [line.strip() for line in f.readlines() if line.strip()]

    if person_name in old_classes:
        print(f"   [INFO] '{person_name}' already exists in SOTA classes. Re-training...")
    else:
        old_classes.append(person_name)

    # Data transforms (optimized for speed on CPU)
    if device.type == "cpu":
        train_transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomCrop(224),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            transforms.RandomErasing(p=0.1, scale=(0.02, 0.1)),
        ])
    else:
        train_transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomCrop(224),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(20),
            transforms.RandomPerspective(distortion_scale=0.15, p=0.3),
            transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.3, hue=0.05),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
            transforms.RandomGrayscale(p=0.1),
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
        ])

    # Load dataset
    try:
        from models.sota_finetune.finetune import SafeImageFolder
        train_dataset = SafeImageFolder(root=dataset_dir, transform=train_transform)
    except ImportError:
        train_dataset = datasets.ImageFolder(root=dataset_dir, transform=train_transform)

    actual_num_classes = len(train_dataset.classes)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    print(f"   Classes: {actual_num_classes} (including '{person_name}')")

    # Build new model
    model = build_mobile_model(num_classes=actual_num_classes).to(device)

    # Try to load old weights
    if os.path.exists(model_path):
        try:
            old_state = torch.load(model_path, map_location=device)
            new_state = model.state_dict()
            for key in old_state:
                if key in new_state and old_state[key].shape == new_state[key].shape:
                    new_state[key] = old_state[key]
            model.load_state_dict(new_state)
            print("   [OK] Loaded compatible weights from previous model.")
        except Exception as e:
            print(f"   [Warning] Could not load old weights: {e}. Training from scratch.")

    # Fine-tune with improved training recipe
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=0.0005, weight_decay=1e-4
    )
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)

    best_acc = 0.0
    patience_counter = 0
    early_stop_patience = 7

    model.train()
    for epoch in range(num_epochs):
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        epoch_loss = running_loss / len(train_dataset)
        acc = 100 * correct / total if total > 0 else 0
        scheduler.step(epoch_loss)
        
        current_lr = optimizer.param_groups[0]['lr']
        print(f"   Epoch [{epoch+1}/{num_epochs}] Loss: {epoch_loss:.4f}, Acc: {acc:.1f}%, LR: {current_lr:.6f}")

        # Early stopping check
        if acc > best_acc:
            best_acc = acc
            patience_counter = 0
            torch.save(model.state_dict(), model_path)
        else:
            patience_counter += 1
            if patience_counter >= early_stop_patience and epoch >= 10:
                print(f"   Early stopping at epoch {epoch+1} (best acc: {best_acc:.1f}%)")
                break

    # Save final model (if not already saved by early stopping)
    if patience_counter < early_stop_patience:
        torch.save(model.state_dict(), model_path)
    print(f"   Saved updated model: {model_path} (best acc: {best_acc:.1f}%)")

    # Save class names
    with open(classes_path, "w") as f:
        f.write("\n".join(train_dataset.classes))
    print(f"   Updated class names: {classes_path}")

    return True


# ============================================================================
# FACE CROP CLEANING (same as clean_dataset.py)
# ============================================================================

# Module-level MediaPipe detector (built once, reused for all uploads in this process)
_mp_face_detector = None

def _get_mp_detector():
    """Return a cached MediaPipe BlazeFace detector (confidence=0.30 for max recall)."""
    global _mp_face_detector
    if _mp_face_detector is None:
        try:
            from scripts.clean_dataset import _build_mediapipe_detector
            _mp_face_detector = _build_mediapipe_detector(confidence=0.30)
        except Exception as e:
            print(f"   [Warning] Could not initialize MediaPipe detector: {e}")
            _mp_face_detector = None
    return _mp_face_detector


def clean_and_save_face(img_bgr, output_path, margin_ratio=0.20):
    """
    Detect face using MediaPipe BlazeFace (falls back to Haar if unavailable),
    crop with margin, and save the cleaned face to output_path.

    Improvements over the old Haar-only version:
    - MediaPipe handles side/profile faces much better than Haar frontal cascade.
    - Larger default margin (0.20 vs 0.15) to avoid cutting off chin/forehead.
    - If no face is found, the full image is saved as fallback instead of discarding
      (side-profile images often evade even BlazeFace at steep angles).

    Returns:
        str or None: path to saved cleaned image, or None on error
    """
    detector = _get_mp_detector()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    extra_pad = 10
    if detector is not None:
        # --- MediaPipe path ---
        try:
            from scripts.clean_dataset import _detect_with_mediapipe, EXTRA_PAD
            extra_pad = EXTRA_PAD
            faces = _detect_with_mediapipe(detector, img_bgr)
        except Exception:
            faces = []
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cascade_file = os.path.join(base_dir, 'haarcascade_frontalface_default.xml')
        face_cascade = cv2.CascadeClassifier(cascade_file)
        faces = []
        if face_cascade is not None and not face_cascade.empty():
            try:
                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
                faces = list(face_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=4, minSize=(20, 20)
                ))
            except Exception as e:
                print(f"   [WARNING] Haar detectMultiScale failed: {e}")

    if len(faces) == 0:
        # No face detected — save original as fallback (side faces at steep angles)
        print(f"   [Warning] No face detected, saving full image as fallback.")
        cv2.imwrite(output_path, img_bgr)
        return output_path

    # Take the largest detected face
    (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])

    # Add margin: percentage + fixed 10px boundary on all sides
    margin_x = int(w * margin_ratio) + extra_pad
    margin_y = int(h * margin_ratio) + extra_pad
    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(img_bgr.shape[1], x + w + margin_x)
    y2 = min(img_bgr.shape[0], y + h + margin_y)

    face_roi = img_bgr[y1:y2, x1:x2]
    cv2.imwrite(output_path, face_roi)
    print(f"   [+] Cropped & Saved: {output_path}")
    return output_path


# ============================================================================
# MASTER FUNCTION: Save images + clean + update DeepFace (Synchronous/Fast)
# ============================================================================

def add_person_fast(person_name, image_data_list, dataset_dir=None, encodings_path=None, org_id=None):
    if dataset_dir is None:
        dataset_dir = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
    """
    Master function called from the Gradio UI and Flask API.

    Args:
        person_name: Name of the new person (used as folder name)
        image_data_list: List of tuples (numpy_array_RGB, angle_label)
                         where angle_label is 'frontal', 'left', 'right', or 'extra'
        dataset_dir: Path to the cleaned dataset directory

    Returns:
        str: Status message summary
    """
    if not person_name or not person_name.strip():
        return "❌ Error: Please enter a person name."

    person_name = person_name.strip().replace(" ", "_")

    # Resolve per-organization dataset paths
    if org_id and org_id != 'default-org':
        from org_storage import get_raw_dataset_dir, get_dataset_cleaned_dir
        raw_base = get_raw_dataset_dir(org_id)
        cleaned_base = dataset_dir if dataset_dir is not None else get_dataset_cleaned_dir(org_id)
    else:
        raw_base = os.path.join(PROJECT_ROOT, 'dataset')
        cleaned_base = dataset_dir if dataset_dir is not None else os.path.join(PROJECT_ROOT, 'dataset_cleaned')

    saved_cleaned_paths = []
    
    # Check current directory contents to avoid overwriting previous files
    angle_counts = {}
    for a in ('frontal', 'left', 'right', 'extra'):
        dir_to_check = os.path.join(raw_base, person_name, a)
        if os.path.exists(dir_to_check):
            # Count existing images
            existing = [f for f in os.listdir(dir_to_check) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp'))]
            angle_counts[a] = len(existing)
        else:
            angle_counts[a] = 0

    if image_data_list is not None and len(image_data_list) > 0:
        for i, (img_array, angle_label) in enumerate(image_data_list):
            if img_array is None:
                continue

            # Determine angle subfolder
            angle = angle_label if angle_label in ('frontal', 'left', 'right') else 'extra'
            angle_counts[angle] += 1

            # Convert RGB (Gradio) to BGR (OpenCV)
            img_bgr = cv2.cvtColor(np.array(img_array), cv2.COLOR_RGB2BGR)

            filename = f"{person_name}_{angle}_{angle_counts[angle]:03d}.jpg"

            # 1. Save RAW image to dataset/{name}/{angle}/
            raw_dir = os.path.join(raw_base, person_name, angle)
            os.makedirs(raw_dir, exist_ok=True)
            raw_path = os.path.join(raw_dir, filename)
            cv2.imwrite(raw_path, img_bgr)
            print(f"   [Raw saved] {raw_path}")

            # 2. Clean (face crop) and save to dataset_cleaned/{name}/{angle}/
            cleaned_dir = os.path.join(cleaned_base, person_name, angle)
            os.makedirs(cleaned_dir, exist_ok=True)
            cleaned_path = os.path.join(cleaned_dir, filename)
            result_path = clean_and_save_face(img_bgr, cleaned_path)
            if result_path:
                saved_cleaned_paths.append(result_path)

    # Summary of saved images
    saved_summary = []
    for angle in ['frontal', 'left', 'right', 'extra']:
        if angle_counts[angle] > 0:
            saved_summary.append(f"{angle}: {angle_counts[angle]}")

    status_parts = []
    if saved_cleaned_paths:
        status_parts.append(
            f"[Saved] Saved {len(saved_cleaned_paths)} cleaned images ({', '.join(saved_summary)})\n"
            f"   Raw -> `dataset/{person_name}/`\n"
            f"   Cleaned -> `{dataset_dir}/{person_name}/`\n"
        )
    else:
        status_parts.append(f"[Saved] Retraining on existing dataset for {person_name}.\n")

    # 3. Update Embeddings (instant -- no retrain) if we added new images
    # We update Facenet512, GhostFaceNet, AND InsightFace (primary model for live prediction)
    if saved_cleaned_paths:
        from config_utils import load_config
        cfg = load_config()
        active_models = ['Facenet512']
        if cfg.get('ENABLE_INSIGHTFACE', False):
            active_models.append('InsightFace')

        for model_name in active_models:
            try:
                new_encs, new_names, num_added = update_deepface_model(person_name, saved_cleaned_paths, model_name=model_name, org_id=org_id)
                status_parts.append(f"**{model_name}**: Added {num_added} embeddings (total: {len(new_encs)})")
            except Exception as e:
                status_parts.append(f"**{model_name}**: Error -- {e}")
    elif not saved_cleaned_paths:
        status_parts.append("**Models**: No new images to process.")

    return "\n\n".join(status_parts)
