"""
add_person_utils.py — Backend utilities for adding a new person to all three models.

1. DeepFace (Facenet512): Append new embeddings to encodings.pickle (no retrain)
2. Custom CNN: Expand classifier head + quick fine-tune
3. SOTA MobileNetV2: Expand classifier head + quick fine-tune
"""

import os
import cv2
import pickle
import shutil
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset
from PIL import Image

# Reuse existing pipeline functions
from model import apply_clahe, get_embedding, generate_augments, NUM_AUGMENTS
from face_detection import SideFaceDetector
from clean_dataset import _build_mediapipe_detector, _detect_with_mediapipe, EXTRA_PAD


# ============================================================================
# 1. DEEPFACE — Incremental Embedding Append (No Retrain)
# ============================================================================

def update_deepface_model(person_name, image_paths, encodings_path='encodings.pickle'):
    """
    Generate Facenet512 embeddings for uploaded images and append them to
    the existing encodings.pickle. No retraining needed.

    Returns:
        tuple: (new_encodings_list, new_names_list, num_added)
    """
    print(f"\n{'='*50}")
    print(f"📦 DeepFace: Adding embeddings for '{person_name}'")
    print(f"{'='*50}")

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

    # Initialize face detector
    detector = SideFaceDetector(min_detection_confidence=0.35)  # 0.35 = better side-face recall
    
    new_count = 0

    for img_path in image_paths:
        try:
            image = cv2.imread(img_path)
            if image is None:
                print(f"   ⚠️ Could not read: {os.path.basename(img_path)}")
                continue

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
            embedding = get_embedding(face_crop)
            if embedding:
                existing_encodings.append(embedding)
                existing_names.append(person_name)
                new_count += 1

            # Generate embeddings for AUGMENTED variants
            augments = generate_augments(face_crop)
            for aug_img in augments:
                aug_embedding = get_embedding(aug_img)
                if aug_embedding:
                    existing_encodings.append(aug_embedding)
                    existing_names.append(person_name)
                    new_count += 1

            print(f"   ✅ Processed: {os.path.basename(img_path)}")

        except Exception as e:
            print(f"   ❌ Error processing {os.path.basename(img_path)}: {e}")

    detector.close()

    # Save updated encodings
    data = {
        "encodings": existing_encodings,
        "names": existing_names,
        "model_used": "Facenet512",
        "version": "2.0-lightweight"
    }
    with open(encodings_path, "wb") as f:
        pickle.dump(data, f)

    print(f"   💾 Saved {new_count} new embeddings. Total: {len(existing_encodings)}")

    return existing_encodings, existing_names, new_count


# ============================================================================
# 2. CUSTOM CNN — Expand Head + Quick Fine-Tune
# ============================================================================

def update_custom_cnn(person_name, dataset_dir='dataset_cleaned',
                      model_path='custom_cnn/best_face_model.pth',
                      classes_path='custom_cnn/class_names.txt',
                      num_epochs=5, batch_size=16):
    """
    Add a new person to the Custom CNN model:
    1. Read existing class names
    2. Rebuild model with num_classes + 1
    3. Copy old weights, initialize new class randomly
    4. Fine-tune on entire dataset for a few epochs
    5. Save updated model + class_names.txt
    """
    from custom_cnn.model import CustomFaceCNN

    print(f"\n{'='*50}")
    print(f"🧠 Custom CNN: Fine-tuning for '{person_name}'")
    print(f"{'='*50}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load existing classes
    old_classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            old_classes = [line.strip() for line in f.readlines() if line.strip()]

    # Check if person already exists
    if person_name in old_classes:
        print(f"   ℹ️ '{person_name}' already exists in Custom CNN classes. Re-training...")
    else:
        old_classes.append(person_name)

    num_classes = len(old_classes)
    print(f"   Classes: {num_classes} (including '{person_name}')")

    # Data transforms (must match custom_cnn/train.py)
    transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Load dataset (ImageFolder reads from dataset_cleaned/)
    train_path = dataset_dir
    if os.path.exists(os.path.join(dataset_dir, 'train')):
        train_path = os.path.join(dataset_dir, 'train')

    try:
        train_dataset = datasets.ImageFolder(root=train_path, transform=transform)
    except Exception as e:
        print(f"   ❌ Failed to load dataset: {e}")
        return False

    actual_num_classes = len(train_dataset.classes)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    # Build new model with correct number of classes
    model = CustomFaceCNN(num_classes=actual_num_classes).to(device)

    # Try to load old weights into the new model
    if os.path.exists(model_path):
        try:
            old_state = torch.load(model_path, map_location=device)
            # Load compatible layers (skip fc2 if size changed)
            new_state = model.state_dict()
            for key in old_state:
                if key in new_state and old_state[key].shape == new_state[key].shape:
                    new_state[key] = old_state[key]
            model.load_state_dict(new_state)
            print("   ✅ Loaded compatible weights from previous model.")
        except Exception as e:
            print(f"   ⚠️ Could not load old weights: {e}. Training from scratch.")

    # Fine-tune
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0005)

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

        acc = 100 * correct / total if total > 0 else 0
        print(f"   Epoch [{epoch+1}/{num_epochs}] Loss: {running_loss/len(train_dataset):.4f}, Acc: {acc:.1f}%")

    # Save model
    torch.save(model.state_dict(), model_path)
    print(f"   💾 Saved updated model: {model_path}")

    # Save class names
    with open(classes_path, "w") as f:
        f.write("\n".join(train_dataset.classes))
    print(f"   💾 Updated class names: {classes_path}")

    return True


# ============================================================================
# 3. SOTA MobileNetV2 — Expand Head + Quick Fine-Tune
# ============================================================================

def update_sota_model(person_name, dataset_dir='dataset_cleaned',
                      model_path='sota_finetune/best_mobile_sideface.pth',
                      classes_path='sota_finetune/mobile_classes.txt',
                      num_epochs=5, batch_size=16):
    """
    Add a new person to the SOTA MobileNetV2 model:
    1. Read existing class names
    2. Rebuild model with updated num_classes
    3. Copy old weights, initialize new class randomly
    4. Fine-tune on entire dataset for a few epochs
    5. Save updated model + mobile_classes.txt
    """
    from sota_finetune.finetune import build_mobile_model

    print(f"\n{'='*50}")
    print(f"📱 SOTA MobileNetV2: Fine-tuning for '{person_name}'")
    print(f"{'='*50}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load existing classes
    old_classes = []
    if os.path.exists(classes_path):
        with open(classes_path, "r") as f:
            old_classes = [line.strip() for line in f.readlines() if line.strip()]

    if person_name in old_classes:
        print(f"   ℹ️ '{person_name}' already exists in SOTA classes. Re-training...")
    else:
        old_classes.append(person_name)

    # Data transforms (must match sota_finetune/finetune.py)
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Load dataset
    try:
        from sota_finetune.finetune import SafeImageFolder
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
            print("   ✅ Loaded compatible weights from previous model.")
        except Exception as e:
            print(f"   ⚠️ Could not load old weights: {e}. Training from scratch.")

    # Fine-tune
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=0.0005, weight_decay=1e-4
    )

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

        acc = 100 * correct / total if total > 0 else 0
        print(f"   Epoch [{epoch+1}/{num_epochs}] Loss: {running_loss/len(train_dataset):.4f}, Acc: {acc:.1f}%")

    # Save model
    torch.save(model.state_dict(), model_path)
    print(f"   💾 Saved updated model: {model_path}")

    # Save class names
    with open(classes_path, "w") as f:
        f.write("\n".join(train_dataset.classes))
    print(f"   💾 Updated class names: {classes_path}")

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
        _mp_face_detector = _build_mediapipe_detector(confidence=0.30)
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

    if detector is not None:
        # --- MediaPipe path ---
        faces = _detect_with_mediapipe(detector, img_bgr)
    else:
        # --- Haar fallback ---
        cascade_file = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_file)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = list(face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=4, minSize=(20, 20)
        ))

    if len(faces) == 0:
        # No face detected — save original as fallback (side faces at steep angles)
        print(f"   ⚠️  No face detected, saving full image as fallback.")
        cv2.imwrite(output_path, img_bgr)
        return output_path

    # Take the largest detected face
    (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])

    # Add margin: percentage + fixed 10px boundary on all sides
    margin_x = int(w * margin_ratio) + EXTRA_PAD
    margin_y = int(h * margin_ratio) + EXTRA_PAD
    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(img_bgr.shape[1], x + w + margin_x)
    y2 = min(img_bgr.shape[0], y + h + margin_y)

    face_roi = img_bgr[y1:y2, x1:x2]
    cv2.imwrite(output_path, face_roi)
    print(f"   [+] Cropped & Saved: {output_path}")
    return output_path


# ============================================================================
# MASTER FUNCTION: Save images + clean + update all 3 models
# ============================================================================

def add_person_to_all_models(person_name, image_data_list, dataset_dir='dataset_cleaned', num_epochs=5):
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

    if image_data_list is None or len(image_data_list) == 0:
        return "❌ Error: Please upload at least one face image."

    person_name = person_name.strip().replace(" ", "_")

    # Raw images go to dataset/{name}/{angle}/
    raw_base = 'dataset'

    # Cleaned face crops go to dataset_cleaned/{name}/{angle}/
    cleaned_base = dataset_dir

    saved_cleaned_paths = []
    angle_counts = {'frontal': 0, 'left': 0, 'right': 0, 'extra': 0}

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
        print(f"   📸 Raw saved: {raw_path}")

        # 2. Clean (face crop) and save to dataset_cleaned/{name}/{angle}/
        cleaned_dir = os.path.join(cleaned_base, person_name, angle)
        cleaned_path = os.path.join(cleaned_dir, filename)
        result_path = clean_and_save_face(img_bgr, cleaned_path)
        if result_path:
            saved_cleaned_paths.append(result_path)

    if not saved_cleaned_paths:
        return "❌ Error: No valid images to save."

    # Summary of saved images
    saved_summary = []
    for angle in ['frontal', 'left', 'right', 'extra']:
        if angle_counts[angle] > 0:
            saved_summary.append(f"{angle}: {angle_counts[angle]}")

    status_parts = [
        f"📁 Saved {len(saved_cleaned_paths)} cleaned images ({', '.join(saved_summary)})\n"
        f"   Raw → `dataset/{person_name}/`\n"
        f"   Cleaned → `{dataset_dir}/{person_name}/`\n"
    ]

    # 3. Update DeepFace (instant — no retrain)
    try:
        new_encs, new_names, num_added = update_deepface_model(person_name, saved_cleaned_paths)
        status_parts.append(f"✅ **DeepFace**: Added {num_added} embeddings (total: {len(new_encs)})")
    except Exception as e:
        status_parts.append(f"⚠️ **DeepFace**: Error — {e}")

    # 4. Update Custom CNN (quick fine-tune)
    try:
        success = update_custom_cnn(person_name, dataset_dir=dataset_dir, num_epochs=num_epochs)
        if success:
            status_parts.append(f"✅ **Custom CNN**: Fine-tuned successfully")
        else:
            status_parts.append(f"⚠️ **Custom CNN**: Fine-tuning failed")
    except Exception as e:
        status_parts.append(f"⚠️ **Custom CNN**: Error — {e}")

    # 5. Update SOTA MobileNetV2 (quick fine-tune)
    try:
        success = update_sota_model(person_name, dataset_dir=dataset_dir, num_epochs=num_epochs)
        if success:
            status_parts.append(f"✅ **SOTA MobileNetV2**: Fine-tuned successfully")
        else:
            status_parts.append(f"⚠️ **SOTA MobileNetV2**: Fine-tuning failed")
    except Exception as e:
        status_parts.append(f"⚠️ **SOTA MobileNetV2**: Error — {e}")

    return "\n\n".join(status_parts)

