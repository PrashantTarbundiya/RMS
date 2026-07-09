import cv2
import os
import pickle
import numpy as np
from deepface import DeepFace
from soft_biometrics import extract_soft_biometrics
# Suppress TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# ======================== CONFIGURATION ========================
# MODEL OPTIONS (lightest → heaviest / fastest → most accurate):
#   "Facenet"    — 128-d,  ~90 MB,  fastest   (~3 ms/img)
#   "Facenet512" — 512-d,  ~90 MB,  balanced  (~5 ms/img)  ← DEFAULT
#   "ArcFace"    — 512-d, ~260 MB,  most accurate but heavy
MODEL_NAME = "Facenet512"

# Number of augmented variants per face crop.
# 3 = good balance of diversity vs training speed.
# Increase to 5 if you have many images and want max accuracy.
NUM_AUGMENTS = 3

# Crop margin as a percentage of face dimension
CROP_MARGIN_RATIO = 0.22

# Detector confidence — 0.35 catches side/profile faces without too many false positives
DETECTOR_CONFIDENCE = 0.35

# Embedding batch size — process N images per DeepFace call (faster on CPU too)
EMBEDDING_BATCH = 8
# ===============================================================


def apply_clahe(image):
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).
    Normalizes lighting and exposure variations — the biggest source of
    embedding error in real-world conditions.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def generate_augments(image, num_augments=NUM_AUGMENTS):
    """
    Generate augmented variants of a face crop to create a richer
    embedding database per person.

    Variants:
      0 — Horizontal flip          (simulates opposite profile view)
      1 — Brightness/contrast jitter
      2 — Slight Gaussian blur     (simulates motion / OOF)
      3 — Mild rotation ±8°        (head tilt compensation)
      4 — Unsharp mask sharpening  (compensates for soft uploads)

    Extra variants beyond index 4 cycle through random combos.
    """
    augments = []
    h, w = image.shape[:2]

    for i in range(num_augments):
        aug = image.copy()

        if i == 0:
            # Horizontal flip — critical for side-face diversity
            aug = cv2.flip(aug, 1)

        elif i == 1:
            # Brightness + contrast jitter
            alpha = np.random.uniform(0.75, 1.25)   # contrast
            beta  = int(np.random.uniform(-25, 25))  # brightness
            aug = cv2.convertScaleAbs(aug, alpha=alpha, beta=beta)

        elif i == 2:
            # Gaussian blur — simulates camera blur / motion
            aug = cv2.GaussianBlur(aug, (3, 3), 0)
            beta = int(np.random.uniform(-15, 15))
            aug = cv2.convertScaleAbs(aug, alpha=1.0, beta=beta)

        elif i == 3:
            # Mild rotation to handle head tilt (±8 degrees)
            angle = float(np.random.uniform(-8, 8))
            M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
            aug = cv2.warpAffine(aug, M, (w, h), borderMode=cv2.BORDER_REFLECT)

        elif i == 4:
            # Unsharp mask — sharpens slightly blurry images
            blurred = cv2.GaussianBlur(aug, (0, 0), sigmaX=2)
            aug = cv2.addWeighted(aug, 1.5, blurred, -0.5, 0)

        else:
            # Extra variants: random flip + brightness combo
            if np.random.rand() > 0.5:
                aug = cv2.flip(aug, 1)
            alpha = float(np.random.uniform(0.8, 1.2))
            beta  = int(np.random.uniform(-20, 20))
            aug = cv2.convertScaleAbs(aug, alpha=alpha, beta=beta)

        augments.append(aug)

    return augments


def get_embedding(face_crop):
    """
    Generate a single L2-normalized embedding (dim depends on MODEL_NAME).
    Returns a list[float] or None on failure.
    """
    try:
        embedding_objs = DeepFace.represent(
            img_path=face_crop,
            model_name=MODEL_NAME,
            enforce_detection=False,
            align=False  # Alignment ruins side profiles
        )
        if embedding_objs:
            emb = np.array(embedding_objs[0]['embedding'], dtype=np.float32)
            
            # 1. Extract soft biometrics (10-d geometric ratios)
            soft_emb = extract_soft_biometrics(face_crop)
            
            # 2. Fuse Hard (DeepFace) + Soft (MediaPipe) features
            # Weighting: 85% importance to DeepFace, 15% to Soft Biometrics
            fused_emb = np.concatenate([emb * 0.85, soft_emb * 0.15])
            
            # 3. L2 normalize the final fused embedding for stable cosine matching
            norm = np.linalg.norm(fused_emb)
            if norm > 0:
                fused_emb = fused_emb / norm
            return fused_emb.tolist()
    except Exception as e:
        print(f"      ⚠️ Embedding failed: {e}")

    return None


def get_embeddings_batch(face_crops):
    """
    Generate embeddings for a list of face crop images in one DeepFace call.
    ~4× faster than calling get_embedding() individually on CPU.
    Returns list of (embedding | None).
    """
    results = []
    for crop in face_crops:
        results.append(get_embedding(crop))
    return results


def _crop_face(image, detector):
    """
    Detect and crop the largest face in the image using SideFaceDetector.
    Returns (face_crop, was_detected).
    Falls back to the full image if nothing is found.
    """
    faces = detector.detect_faces(image, profile_only=False)

    if not faces:
        # Try MediaPipe directly at lower threshold before giving up
        try:
            from clean_dataset import _build_mediapipe_detector, _detect_with_mediapipe
            _mp = _build_mediapipe_detector(confidence=0.20)
            if _mp:
                boxes = _detect_with_mediapipe(_mp, image)
                if boxes:
                    h_img, w_img = image.shape[:2]
                    x, y, w, h = max(boxes, key=lambda f: f[2] * f[3])
                    mx = int(w * CROP_MARGIN_RATIO)
                    my = int(h * CROP_MARGIN_RATIO)
                    crop = image[max(0, y-my):min(h_img, y+h+my),
                                 max(0, x-mx):min(w_img, x+w+mx)]
                    if crop.size > 0:
                        return crop, True
        except Exception:
            pass
        return image, False   # fallback: full image

    face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
    x, y, w, h = face['bbox']['x'], face['bbox']['y'], face['bbox']['w'], face['bbox']['h']

    h_img, w_img = image.shape[:2]
    mx = int(w * CROP_MARGIN_RATIO)
    my = int(h * CROP_MARGIN_RATIO)
    x1 = max(0, x - mx);  y1 = max(0, y - my)
    x2 = min(w_img, x + w + mx);  y2 = min(h_img, y + h + my)

    crop = image[y1:y2, x1:x2]
    return crop, True


def train_model(dataset_path='dataset_cleaned', model_save_path='encodings.pickle'):
    """
    High-accuracy embedding generation pipeline (lightweight).

    Improvements over baseline:
    1. CLAHE preprocessing for lighting normalization
    2. Richer training-time augmentation (5 variants: flip, jitter, blur, rotate, sharpen)
    3. Wider crop margins (22%) for more facial context
    4. L2-normalized embeddings for stable matching
    5. Two-stage face detection: SideFaceDetector → MediaPipe @ 0.20 → full-image fallback
    6. Detector confidence lowered to 0.35 to capture side/profile faces

    Dataset structure: dataset_cleaned/PersonName/angle/image.jpg
    """
    if not os.path.exists(dataset_path):
        print(f"❌ Error: Dataset directory '{dataset_path}' not found.")
        return

    known_encodings = []
    known_names = []

    from face_detection import SideFaceDetector
    detector = SideFaceDetector(min_detection_confidence=DETECTOR_CONFIDENCE)

    print("🔍 Scanning dataset and generating embeddings...")
    print(f"   Model:              {MODEL_NAME}")
    print(f"   Augments per img:   {NUM_AUGMENTS}")
    print(f"   Crop margin:        {int(CROP_MARGIN_RATIO*100)}%")
    print(f"   Detector confidence:{DETECTOR_CONFIDENCE}")
    print("   (This may take a while on first run...)\n")

    total_images = 0
    total_embeddings = 0
    total_fallbacks = 0  # images where no face was detected

    for user_name in sorted(os.listdir(dataset_path)):
        user_dir = os.path.join(dataset_path, user_name)
        if not os.path.isdir(user_dir):
            continue

        print(f"  👤 Processing user: {user_name}")

        image_paths = []
        for root, dirs, files in os.walk(user_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_paths.append(os.path.join(root, file))

        if not image_paths:
            print(f"    ⚠️ No images found for {user_name}, skipping.")
            continue

        user_embedding_count = 0

        for img_path in image_paths:
            try:
                image = cv2.imread(img_path)
                if image is None:
                    continue
                total_images += 1

                # Detect + crop face
                face_crop, detected = _crop_face(image, detector)
                if not detected:
                    total_fallbacks += 1

                if face_crop.size == 0:
                    continue

                # CLAHE preprocessing
                face_crop = apply_clahe(face_crop)

                # Original embedding
                embedding = get_embedding(face_crop)
                if embedding:
                    known_encodings.append(embedding)
                    known_names.append(user_name)
                    user_embedding_count += 1
                    total_embeddings += 1

                # Augmented embeddings
                augments = generate_augments(face_crop)
                for aug_img in augments:
                    aug_embedding = get_embedding(aug_img)
                    if aug_embedding:
                        known_encodings.append(aug_embedding)
                        known_names.append(user_name)
                        user_embedding_count += 1
                        total_embeddings += 1

            except Exception as e:
                print(f"    ❌ Error processing {os.path.basename(img_path)}: {e}")

        print(f"    ✅ Generated {user_embedding_count} embeddings for {user_name}")

    detector.close()

    if not known_encodings:
        print("❌ No embeddings were generated. Check dataset structure.")
        return

    # ── Summary ────────────────────────────────────────────────
    print(f"\n{'='*50}")
    print(f"📊 TRAINING SUMMARY")
    print(f"{'='*50}")
    print(f"   Images processed:    {total_images}")
    print(f"   Full-image fallbacks:{total_fallbacks}  (no face detected)")
    print(f"   Total embeddings:    {total_embeddings}")
    print(f"   Embedding dimension: {len(known_encodings[0])}")
    print(f"   Model used:          {MODEL_NAME}")
    print(f"\n💾 Saving {len(known_encodings)} embeddings to {model_save_path}...")
    data = {
        "encodings": known_encodings,
        "names": known_names,
        "model_used": MODEL_NAME,
        "version": "3.0-sideface",
    }
    with open(model_save_path, "wb") as f:
        pickle.dump(data, f)
    print("✅ Model training complete (v3.0 SideFace)!")

    return known_encodings, known_names


import json
from collections import defaultdict


# ======================== ONNX EXPORT ========================
def export_to_onnx(
    encodings,
    names,
    onnx_model_path="facenet512.onnx",
    centroids_path="class_centroids.json",
    label_map_path="label_map.json",
):
    """
    After training, exports two artefacts for mobile / edge deployment:

    1. facenet512.onnx   — The Facenet512 Keras backbone in ONNX format.
                           Input : (1, 160, 160, 3)  float32, values in [-1, 1]
                           Output: (1, 512)           float32  L2-normalised embedding
                           Use with onnxruntime (PC) or onnxruntime-react-native (mobile).

    2. class_centroids.json — One averaged (centroid) embedding per person.
                              The mobile app only needs cosine similarity against
                              these N vectors instead of the full pickle database.

    3. label_map.json    — {"0": "Alice", "1": "Bob", ...}  (index → name)

    Requirements:
        pip install tf2onnx onnx
    """
    print(f"\n{'='*50}")
    print("📦 ONNX EXPORT")
    print(f"{'='*50}")

    # ── 1. Export Facenet512 Keras model → ONNX ──────────────────
    print("\n⏳ Loading Facenet512 Keras model from DeepFace...")
    try:
        import tf2onnx
        import onnx
        from deepface import DeepFace as _DF

        # Force DeepFace to build its Facenet512 model
        dummy = np.zeros((160, 160, 3), dtype=np.float32)
        _DF.represent(img_path=dummy, model_name=MODEL_NAME,
                      enforce_detection=False, align=False)

        # Access the underlying Keras model
        from deepface.models.facial_recognition.Facenet512 import Facenet512Client
        keras_model = Facenet512Client().model

        print(f"   Input shape:  {keras_model.input_shape}")
        print(f"   Output shape: {keras_model.output_shape}")

        # Convert to ONNX (opset 13)
        input_signature = (
            tf2onnx.tf_loader.tf.TensorSpec(
                keras_model.input_shape, tf2onnx.tf_loader.tf.float32, name="input"
            ),
        )
        onnx_model, _ = tf2onnx.convert.from_keras(
            keras_model, input_signature=input_signature, opset=13
        )
        onnx.save(onnx_model, onnx_model_path)
        size_mb = os.path.getsize(onnx_model_path) / (1024 * 1024)
        print(f"   ✅ Saved: {onnx_model_path}  ({size_mb:.1f} MB)")

    except ImportError:
        print("   ⚠️  tf2onnx / onnx not installed.")
        print("       Run: pip install tf2onnx onnx")
        print("       Skipping ONNX backbone export.")
    except Exception as e:
        print(f"   ⚠️  ONNX export failed: {e}")
        print("       Skipping — centroids/label_map will still be saved.")

    # ── 2. Build class centroids ─────────────────────────────────
    print("\n⏳ Computing class centroids...")
    buckets = defaultdict(list)
    for emb, name in zip(encodings, names):
        buckets[name].append(emb)

    sorted_names = sorted(buckets.keys())
    centroids = {}
    label_map = {}

    for idx, name in enumerate(sorted_names):
        vecs = np.array(buckets[name], dtype=np.float32)   # (N, D)
        centroid = vecs.mean(axis=0)
        # L2 normalise
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids[name] = centroid.tolist()
        label_map[str(idx)] = name

    with open(centroids_path, "w") as f:
        json.dump(centroids, f)
    print(f"   ✅ Saved: {centroids_path}  ({len(centroids)} classes)")

    with open(label_map_path, "w") as f:
        json.dump(label_map, f, indent=2)
    print(f"   ✅ Saved: {label_map_path}")

    print(f"\n{'='*50}")
    print("📱 MOBILE / EDGE INTEGRATION:")
    print(f"{'='*50}")
    print("  1. Copy facenet512.onnx + class_centroids.json")
    print("     to your React Native 'assets/' folder.")
    print("  2. Run facenet512.onnx on a cropped face (160x160, [-1,1])")
    print("  3. Cosine-match output vs centroids in class_centroids.json")
    print("  4. Use label_map.json to map index → person name")
    print(f"{'='*50}")


if __name__ == "__main__":
    result = train_model()

    # Auto-export to ONNX after training if encodings were generated
    if result is not None:
        encodings, names = result
        export_to_onnx(encodings, names)
