# pyrefly: ignore [missing-import]
import cv2
import os
import pickle
import numpy as np
from deepface import DeepFace
from soft_biometrics import extract_soft_biometrics
# Suppress TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Path constants
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# ======================== CONFIGURATION ========================
# MODEL OPTIONS (lightest → heaviest / fastest → most accurate):
#   "Facenet"    — 128-d,  ~90 MB,  fastest   (~3 ms/img)
#   "Facenet512" — 512-d,  ~90 MB,  balanced  (~5 ms/img)  ← DEFAULT
#   "ArcFace"    — 512-d, ~260 MB,  most accurate but heavy
MODEL_NAME = "Facenet512"

# Number of augmented variants per face crop.
# 8 = comprehensive diversity covering flip, jitter, blur, rotate, sharpen,
#     sunglasses simulation, random occlusion, and gamma correction.
NUM_AUGMENTS = 8

# Crop margin as a percentage of face dimension
CROP_MARGIN_RATIO = 0.22

# Detector confidence — 0.30 catches more side/profile faces
DETECTOR_CONFIDENCE = 0.30

# Embedding batch size — process N images per DeepFace call (faster on CPU too)
EMBEDDING_BATCH = 8

# Soft biometrics feature count (must match soft_biometrics.py)
SOFT_BIOMETRICS_DIM = 20
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

    Variants (8 total):
      0 — Horizontal flip          (simulates opposite profile view)
      1 — Brightness/contrast jitter
      2 — Slight Gaussian blur     (simulates motion / OOF)
      3 — Mild rotation ±8°        (head tilt compensation)
      4 — Unsharp mask sharpening  (compensates for soft uploads)
      5 — Simulated sunglasses     (black band over eye region)
      6 — Random rectangular occlusion (partial face hiding)
      7 — Gamma correction         (harsh outdoor lighting)

    Extra variants beyond index 7 cycle through random combos.
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

        elif i == 5:
            # Simulated sunglasses — black band over the eye region
            # Teaches the model to not rely on eye features
            eye_y_start = int(h * 0.25)
            eye_y_end = int(h * 0.42)
            aug[eye_y_start:eye_y_end, :] = 0

        elif i == 6:
            # Random rectangular occlusion — simulates partial face hiding
            rx = np.random.randint(0, max(1, w // 2))
            ry = np.random.randint(0, max(1, h // 2))
            rw = np.random.randint(max(1, w // 6), max(2, w // 3))
            rh = np.random.randint(max(1, h // 6), max(2, h // 3))
            aug[ry:min(h, ry + rh), rx:min(w, rx + rw)] = 0

        elif i == 7:
            # Gamma correction — simulates harsh outdoor lighting
            gamma = np.random.uniform(0.6, 1.4)
            table = np.array([
                ((j / 255.0) ** gamma) * 255 for j in range(256)
            ]).astype("uint8")
            aug = cv2.LUT(aug, table)

        else:
            # Extra variants: random flip + brightness combo
            if np.random.rand() > 0.5:
                aug = cv2.flip(aug, 1)
            alpha = float(np.random.uniform(0.8, 1.2))
            beta  = int(np.random.uniform(-20, 20))
            aug = cv2.convertScaleAbs(aug, alpha=alpha, beta=beta)

        augments.append(aug)

    return augments


# ======================== FACE QUALITY ASSESSMENT ========================

def _assess_face_quality(face_crop):
    """
    Assess face quality to determine dynamic fusion weights.

    Returns one of:
      'frontal'      — full frontal face, clear view
      'side_profile'  — face is turned significantly
      'occluded'     — eyes likely hidden (sunglasses, mask)
      'default'      — uncertain / mixed

    Uses three signals:
      1. Laplacian variance (blur detection)
      2. Horizontal symmetry of intensity (profile detection)
      3. Eye region darkness (occlusion detection)
    """
    if face_crop is None or face_crop.size == 0:
        return 'default'

    try:
        h, w = face_crop.shape[:2]
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

        # --- Signal 1: Symmetry check (profile detection) ---
        # Split face into left and right halves
        mid = w // 2
        if mid < 5:
            return 'default'
        left_half = gray[:, :mid]
        right_half = cv2.flip(gray[:, mid:2*mid], 1) if 2*mid <= w else gray[:, mid:]

        # Ensure same size for comparison
        min_w = min(left_half.shape[1], right_half.shape[1])
        if min_w < 5:
            return 'default'
        left_half = left_half[:, :min_w]
        right_half = right_half[:, :min_w]

        # Compare intensity distributions
        left_mean = left_half.astype(float).mean()
        right_mean = right_half.astype(float).mean()
        symmetry_diff = abs(left_mean - right_mean) / (max(left_mean, right_mean) + 1e-6)

        # --- Signal 2: Eye region occlusion check ---
        # Check if the eye region (upper 25-42% of face) is abnormally dark
        eye_y_start = int(h * 0.25)
        eye_y_end = int(h * 0.42)
        eye_region = gray[eye_y_start:eye_y_end, :]
        eye_mean = eye_region.mean() if eye_region.size > 0 else 128
        face_mean = gray.mean()

        # If eye region is much darker than face average → likely sunglasses
        eye_darkness_ratio = eye_mean / (face_mean + 1e-6)

        # --- Classify ---
        if eye_darkness_ratio < 0.55:
            return 'occluded'       # Eyes very dark → sunglasses/mask
        elif symmetry_diff > 0.15:
            return 'side_profile'   # Asymmetric → profile view
        elif symmetry_diff < 0.06:
            return 'frontal'        # Very symmetric → frontal
        else:
            return 'default'

    except Exception:
        return 'default'


def get_embedding(face_crop):
    """
    Generate a single L2-normalized fused embedding.
    Combines DeepFace (512-d) + Soft Biometrics (20-d) with dynamic weights
    based on face quality assessment.

    Returns a list[float] or None on failure.
    """
    try:
        embedding_objs = DeepFace.represent(
            img_path=face_crop,
            model_name=MODEL_NAME,
            enforce_detection=False,
            detector_backend='skip',  # We already crop faces ourselves
            align=False  # Alignment ruins side profiles
        )
        if embedding_objs:
            emb = np.array(embedding_objs[0]['embedding'], dtype=np.float32)

            # 1. Extract soft biometrics (20-d geometric ratios)
            soft_emb = extract_soft_biometrics(face_crop, num_features=SOFT_BIOMETRICS_DIM)

            # 2. Assess face quality for dynamic weighting
            quality = _assess_face_quality(face_crop)

            if quality == 'frontal':
                deepface_w, soft_w = 0.85, 0.15
            elif quality == 'side_profile':
                deepface_w, soft_w = 0.70, 0.30   # Soft biometrics matter more
            elif quality == 'occluded':
                deepface_w, soft_w = 0.75, 0.25   # Balanced
            else:
                deepface_w, soft_w = 0.80, 0.20   # Default

            # 3. Fuse Hard (DeepFace) + Soft (MediaPipe) features
            fused_emb = np.concatenate([emb * deepface_w, soft_emb * soft_w])

            # 4. L2 normalize the final fused embedding for stable cosine matching
            norm = np.linalg.norm(fused_emb)
            if norm > 0:
                fused_emb = fused_emb / norm
            return fused_emb.tolist()
    except Exception as e:
        print(f"      ⚠️ Embedding failed: {e}")

    return None


def get_embedding_tta(face_crop):
    """
    Test-Time Augmentation: Generate multiple embeddings from different
    views of the same face and average them for more robust matching.

    Generates 5 embeddings:
      1. Original
      2. Horizontally flipped
      3. Slight brightness boost
      4. Double CLAHE (extra normalization)
      5. Center crop (90% — removes noisy borders)

    Returns averaged L2-normalized embedding or None.
    """
    if face_crop is None or face_crop.size == 0:
        return None

    embeddings = []

    # 1. Original
    emb = get_embedding(face_crop)
    if emb:
        embeddings.append(emb)

    # 2. Horizontally flipped
    try:
        flipped = cv2.flip(face_crop, 1)
        emb = get_embedding(flipped)
        if emb:
            embeddings.append(emb)
    except Exception:
        pass

    # 3. Slight brightness boost
    try:
        bright = cv2.convertScaleAbs(face_crop, alpha=1.1, beta=10)
        emb = get_embedding(bright)
        if emb:
            embeddings.append(emb)
    except Exception:
        pass

    # 4. Double CLAHE (extra normalization for harsh lighting)
    try:
        clahe_img = apply_clahe(face_crop)
        emb = get_embedding(clahe_img)
        if emb:
            embeddings.append(emb)
    except Exception:
        pass

    # 5. Center crop (90% — removes noisy borders)
    try:
        h, w = face_crop.shape[:2]
        margin = int(min(h, w) * 0.05)
        if margin > 0 and h > 2 * margin and w > 2 * margin:
            cropped = face_crop[margin:h - margin, margin:w - margin]
            emb = get_embedding(cropped)
            if emb:
                embeddings.append(emb)
    except Exception:
        pass

    if not embeddings:
        return None

    # Average all embeddings + L2 normalize
    avg_emb = np.mean(embeddings, axis=0)
    norm = np.linalg.norm(avg_emb)
    if norm > 0:
        avg_emb = avg_emb / norm
    return avg_emb.tolist()


def get_embeddings_batch(face_crops):
    """
    Generate embeddings for a list of face crop images.
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


def train_model(dataset_path=None, model_save_path=None):
    if dataset_path is None:
        dataset_path = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
    if model_save_path is None:
        model_save_path = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')
    """
    High-accuracy embedding generation pipeline.

    Improvements over baseline:
    1. CLAHE preprocessing for lighting normalization
    2. Rich training-time augmentation (8 variants: flip, jitter, blur, rotate,
       sharpen, sunglasses sim, random occlusion, gamma correction)
    3. Wider crop margins (22%) for more facial context
    4. L2-normalized embeddings for stable matching
    5. Two-stage face detection: SideFaceDetector → MediaPipe @ 0.20 → full-image fallback
    6. Detector confidence lowered to 0.30 to capture side/profile faces
    7. Dynamic fusion weights based on face quality
    8. 20-d soft biometrics with occlusion-aware weighting

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
    print(f"   Soft biometrics:    {SOFT_BIOMETRICS_DIM}-d (occlusion-aware)")
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
    emb_dim = len(known_encodings[0]) if known_encodings else 0
    print(f"\n{'='*50}")
    print(f"📊 TRAINING SUMMARY")
    print(f"{'='*50}")
    print(f"   Images processed:    {total_images}")
    print(f"   Full-image fallbacks:{total_fallbacks}  (no face detected)")
    print(f"   Total embeddings:    {total_embeddings}")
    print(f"   Embedding dimension: {emb_dim}  (512 DeepFace + {SOFT_BIOMETRICS_DIM} soft biometrics)")
    print(f"   Model used:          {MODEL_NAME}")
    print(f"\n💾 Saving {len(known_encodings)} embeddings to {model_save_path}...")
    data = {
        "encodings": known_encodings,
        "names": known_names,
        "model_used": MODEL_NAME,
        "version": "4.0-enhanced-sideface",
    }
    with open(model_save_path, "wb") as f:
        pickle.dump(data, f)
    print("✅ Model training complete (v4.0 Enhanced SideFace)!")

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
