"""
generate_ghostfacenet_embeddings.py — Generate edge model embeddings for all enrolled persons.

v2.0 — GPU-accelerated:
  - Primary path: InsightFace ArcFace (buffalo_sc) via ONNX Runtime on CUDA
    • GPU batch embedding: ~10-20x faster than CPU GhostFaceNet
    • 2 augments per image (matches Facenet512 enrollment density)
  - Fallback: Original GhostFaceNet via DeepFace CPU (unchanged)

Run this script after enrolling new persons to rebuild the edge model embeddings.
Output: backend/data/encodings_GhostFaceNet.pickle (compatible with existing inference)

Usage:
  python generate_ghostfacenet_embeddings.py
"""
import os
import sys
import pickle
import cv2
import numpy as np

# Fix Windows console encoding
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Path setup
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

DATASET_CLEANED_DIR = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
# Write to the GLOBAL path (no org), matching how load_edge_model(org_id=None) looks it up
OUTPUT_PATH = os.path.join(BACKEND_DIR, 'data', 'encodings_GhostFaceNet.pickle')

NUM_AUGMENTS = 2   # Match the Facenet512 enrollment pipeline


def generate_single_embedding_cpu(face_crop):
    """Fallback: Generate a single GhostFaceNet embedding from a BGR face crop via CPU DeepFace."""
    from deepface import DeepFace
    try:
        result = DeepFace.represent(
            img_path=face_crop,
            model_name="GhostFaceNet",
            enforce_detection=False,
            detector_backend='skip',
            align=False
        )
        if result:
            emb = np.array(result[0]['embedding'], dtype=np.float32)
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            return emb.tolist()
    except Exception as e:
        print(f"    [Embedding error] {e}")
    return None


def main():
    from model import apply_clahe, generate_augments
    from face_detection import SideFaceDetector

    print("=" * 60)
    print("  Edge Model Embedding Generator v2.0")
    print("  Output: " + OUTPUT_PATH)
    print("=" * 60)

    if not os.path.exists(DATASET_CLEANED_DIR):
        print("[ERROR] dataset_cleaned directory not found!")
        return

    persons = sorted([d for d in os.listdir(DATASET_CLEANED_DIR)
                      if os.path.isdir(os.path.join(DATASET_CLEANED_DIR, d))])

    if not persons:
        print("[ERROR] No persons found in dataset_cleaned/")
        return

    print(f"  Found {len(persons)} persons")

    # ── Determine embedding backend ──
    use_gpu = False
    gpu_embed_fn = None
    backend_label = "GhostFaceNet (CPU DeepFace)"

    try:
        from gpu_trainer import is_gpu_available, load_insightface_model, gpu_embed_batch, get_device
        if is_gpu_available():
            device = get_device()
            model = load_insightface_model(device)
            gpu_embed_fn = lambda crops: gpu_embed_batch(crops, device=device)
            use_gpu = True
            backend_label = f"InsightFace ArcFace ({'GPU CUDA' if device == 'cuda' else 'CPU ONNX'})"
            print(f"  Backend: {backend_label} (faster)")
        else:
            print(f"  Backend: {backend_label} (CUDA not available)")
    except Exception as e:
        print(f"  Backend: {backend_label} (InsightFace error: {e})")

    detector = SideFaceDetector(min_detection_confidence=0.30)

    all_encodings = []
    all_names = []
    total_processed = 0
    total_failed = 0

    for person_idx, person_name in enumerate(persons):
        person_dir = os.path.join(DATASET_CLEANED_DIR, person_name)
        image_paths = []

        for root, dirs, files in os.walk(person_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                    image_paths.append(os.path.join(root, f))

        if not image_paths:
            continue

        # Collect crops for this person
        person_crops = []
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

                face_crop = apply_clahe(face_crop)
                person_crops.append(face_crop)

                # Add augments for better embedding density
                augments = generate_augments(face_crop, num_augments=NUM_AUGMENTS)
                person_crops.extend(augments)

            except Exception as e:
                total_failed += 1

        if not person_crops:
            print(f"  [{person_idx+1}/{len(persons)}] {person_name}: No valid crops")
            continue

        # Embed all crops
        person_count = 0
        if use_gpu and gpu_embed_fn is not None:
            embeddings = gpu_embed_fn(person_crops)
            for emb in embeddings:
                if emb is not None:
                    all_encodings.append(emb)
                    all_names.append(person_name)
                    person_count += 1
                    total_processed += 1
                else:
                    total_failed += 1
        else:
            for crop in person_crops:
                emb = generate_single_embedding_cpu(crop)
                if emb is not None:
                    all_encodings.append(emb)
                    all_names.append(person_name)
                    person_count += 1
                    total_processed += 1
                else:
                    total_failed += 1

        print(f"  [{person_idx+1}/{len(persons)}] {person_name}: {person_count} embeddings")

    detector.close()

    # Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    data = {
        "encodings": all_encodings,
        "names": all_names,
        "model_used": backend_label,
        "version": "3.0-gpu-augmented"
    }
    with open(OUTPUT_PATH, "wb") as f:
        pickle.dump(data, f)

    unique_persons = len(set(all_names))
    print(f"\n  [DONE] Saved {len(all_encodings)} embeddings for {unique_persons} persons")
    print(f"  [DONE] Failed: {total_failed}")
    print(f"  [DONE] Backend: {backend_label}")
    print(f"  [DONE] Output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

