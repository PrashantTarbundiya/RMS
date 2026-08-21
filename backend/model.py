# pyrefly: ignore [missing-import]
"""
model.py — Face embedding generation pipeline.

v5.0 Production-Ready:
  - Facenet512 model loaded ONCE at module level (eliminates per-call TF reload)
  - Pure 512-d embeddings (no soft biometrics overhead)
  - Batch embedding generation for training speed
  - CLAHE preprocessing for lighting normalization
  - Rich augmentation (4 variants for add-person, 8 for full retrain)

Performance:
  - Training 15 images: ~45 seconds (was ~50 minutes)
  - Single embedding:   ~100ms (was ~20 seconds)
"""

import cv2
import os
import pickle
import time
import numpy as np

# Suppress TF logs before any TF import
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from deepface import DeepFace

# Path constants
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# ======================== CONFIGURATION ========================
MODEL_NAME = "Facenet512"

# Augmentation counts — edge-optimized defaults
# When multi-angle enrollment photos (front/left/right) are provided,
# synthetic augmentations add marginal value. Keep them minimal.
NUM_AUGMENTS_FULL = 2       # For full retrain (flip + jitter only; was 8)
NUM_AUGMENTS_QUICK = 2      # For add-person (same lightweight set)
NUM_AUGMENTS = NUM_AUGMENTS_FULL  # Default for backward compatibility

# Edge lightweight training: set EDGE_LIGHTWEIGHT_TRAINING=true to skip
# all augmentations when multi-angle enrollment photos are present.
EDGE_LIGHTWEIGHT = os.environ.get('EDGE_LIGHTWEIGHT_TRAINING', 'false').lower() == 'true'

# Crop margin as a percentage of face dimension
CROP_MARGIN_RATIO = 0.22

# Detector confidence — 0.30 catches more side/profile faces
DETECTOR_CONFIDENCE = 0.30

# CLAHE preprocessing toggle — disable to benchmark its impact on latency
ENABLE_CLAHE = os.environ.get('ENABLE_CLAHE', 'true').lower() != 'false'

# Embedding dimension (pure Facenet512, no soft biometrics)
EMBEDDING_DIM = 512
# ===============================================================


# ======================== MODEL WARM-UP ========================
from config_utils import load_config
_startup_cfg = load_config()

if _startup_cfg.get("ENABLE_FACENET512", False):
    print("[INFO] Warming up Facenet512 model (one-time load)...")
    _warmup_start = time.time()
    try:
        _dummy = np.zeros((160, 160, 3), dtype=np.uint8)
        DeepFace.represent(
            img_path=_dummy,
            model_name=MODEL_NAME,
            enforce_detection=False,
            detector_backend='skip',
            align=False
        )
        print(f"[INFO] Facenet512 ready in {time.time() - _warmup_start:.1f}s")
    except Exception as e:
        print(f"[WARNING] Facenet512 warm-up failed: {e}")
else:
    print("[INFO] Facenet512 is disabled in settings. Skipping warm-up.")

if _startup_cfg.get("ENABLE_VGGFACE", False):
    print("[INFO] Warming up VGG-Face model (one-time load)...")
    _warmup_start_vgg = time.time()
    try:
        _dummy_vgg = np.zeros((224, 224, 3), dtype=np.uint8)
        DeepFace.represent(
            img_path=_dummy_vgg,
            model_name="VGG-Face",
            enforce_detection=False,
            detector_backend='skip',
            align=False
        )
        print(f"[INFO] VGG-Face ready in {time.time() - _warmup_start_vgg:.1f}s")
    except Exception as e:
        print(f"[WARNING] VGG-Face warm-up failed: {e}")
else:
    print("[INFO] VGG-Face is disabled in settings. Skipping warm-up.")

if _startup_cfg.get("ENABLE_GHOSTFACENET", False):
    print("[INFO] Warming up GhostFaceNet model (one-time load)...")
    _warmup_start_ghost = time.time()
    try:
        _dummy_ghost = np.zeros((112, 112, 3), dtype=np.uint8)
        DeepFace.represent(
            img_path=_dummy_ghost,
            model_name="GhostFaceNet",
            enforce_detection=False,
            detector_backend='skip',
            align=False
        )
        print(f"[INFO] GhostFaceNet ready in {time.time() - _warmup_start_ghost:.1f}s")
    except Exception as e:
        print(f"[WARNING] GhostFaceNet warm-up failed: {e}")
else:
    print("[INFO] GhostFaceNet is disabled in settings. Skipping warm-up.")
# ===============================================================


# ======================== INSIGHTFACE ONNX ========================
# InsightFace ArcFace (MobileFaceNet w600k) via ONNX Runtime
# 42x faster than Facenet512: 9.8ms vs 414ms per embedding on CPU.
# This is the RECOMMENDED primary model for both live prediction and
# edge deployment based on our evaluation report.
# ===================================================================

_INSIGHTFACE_ONNX_PATH = os.path.join(
    os.path.expanduser('~'), '.insightface', 'models', 'buffalo_sc', 'w600k_mbf.onnx'
)
_insightface_session = None  # Loaded lazily on first call

def _load_insightface_session():
    """Load the InsightFace ONNX session once. Thread-safe via GIL."""
    global _insightface_session
    if _insightface_session is not None:
        return _insightface_session

    if not os.path.exists(_INSIGHTFACE_ONNX_PATH):
        print(f"[WARNING] InsightFace ONNX not found at {_INSIGHTFACE_ONNX_PATH}")
        print("          Run gpu_trainer.py first to download the model.")
        return None

    try:
        import onnxruntime as ort
        so = ort.SessionOptions()
        so.intra_op_num_threads = os.cpu_count() or 4
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.log_severity_level = 3

        _insightface_session = ort.InferenceSession(
            _INSIGHTFACE_ONNX_PATH,
            providers=['CPUExecutionProvider'],
            sess_options=so
        )
        # Warm up with a dummy inference
        dummy = np.zeros((1, 3, 112, 112), dtype=np.float32)
        _insightface_session.run(None, {_insightface_session.get_inputs()[0].name: dummy})
        print(f"[INFO] InsightFace ArcFace ONNX ready (CPU, {os.cpu_count()} threads)")
        return _insightface_session
    except ImportError:
        print("[WARNING] onnxruntime not installed. InsightFace unavailable.")
        return None
    except Exception as e:
        print(f"[WARNING] InsightFace ONNX load failed: {e}")
        return None


def get_embedding_insightface(face_crop):
    """
    Generate a single L2-normalized 512-d embedding using InsightFace ArcFace.

    Input: BGR face crop (any size, will be resized to 112x112).
    Output: list[float] (512-d) or None on failure.

    Performance: ~9.8ms per call on CPU (42x faster than Facenet512).
    """
    sess = _load_insightface_session()
    if sess is None:
        return None

    try:
        # Preprocess: resize to 112x112, BGR->RGB, normalize to [-1, 1], NCHW
        resized = cv2.resize(face_crop, (112, 112), interpolation=cv2.INTER_LINEAR)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        arr = ((rgb.astype(np.float32) - 127.5) / 127.5)  # normalize to [-1, 1]
        arr = arr.transpose(2, 0, 1)[np.newaxis]           # (1, 3, 112, 112)

        raw = sess.run(None, {sess.get_inputs()[0].name: arr})[0][0]
        emb = raw.astype(np.float32)

        # L2 normalize
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb.tolist()
    except Exception as e:
        print(f"[WARNING] InsightFace embedding failed: {e}")
        return None

# Eagerly load InsightFace session at startup for instant first-call
print("[INFO] Loading InsightFace ArcFace model...")
_load_insightface_session()
# ===================================================================


def apply_clahe(image):
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).
    Normalizes lighting and exposure variations — the biggest source of
    embedding error in real-world conditions.

    Toggleable via ENABLE_CLAHE env var (default: true).
    When disabled, returns the image unchanged — useful for benchmarking
    CLAHE's latency cost vs accuracy gain on edge hardware.
    """
    if not ENABLE_CLAHE:
        return image
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def generate_augments(image, num_augments=NUM_AUGMENTS):
    """
    Generate augmented variants of a face crop.

    Variants:
      0 — Horizontal flip          (simulates opposite profile view)
      1 — Brightness/contrast jitter
      2 — Slight Gaussian blur     (simulates motion / OOF)
      3 — Mild rotation +/-8 deg   (head tilt compensation)
      4 — Unsharp mask sharpening  (compensates for soft uploads)
      5 — Simulated sunglasses     (black band over eye region)
      6 — Random rectangular occlusion (partial face hiding)
      7 — Gamma correction         (harsh outdoor lighting)
    """
    augments = []
    h, w = image.shape[:2]

    for i in range(num_augments):
        aug = image.copy()

        if i == 0:
            aug = cv2.flip(aug, 1)

        elif i == 1:
            alpha = np.random.uniform(0.75, 1.25)
            beta = int(np.random.uniform(-25, 25))
            aug = cv2.convertScaleAbs(aug, alpha=alpha, beta=beta)

        elif i == 2:
            aug = cv2.GaussianBlur(aug, (3, 3), 0)
            beta = int(np.random.uniform(-15, 15))
            aug = cv2.convertScaleAbs(aug, alpha=1.0, beta=beta)

        elif i == 3:
            angle = float(np.random.uniform(-8, 8))
            M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
            aug = cv2.warpAffine(aug, M, (w, h), borderMode=cv2.BORDER_REFLECT)

        elif i == 4:
            blurred = cv2.GaussianBlur(aug, (0, 0), sigmaX=2)
            aug = cv2.addWeighted(aug, 1.5, blurred, -0.5, 0)

        elif i == 5:
            eye_y_start = int(h * 0.25)
            eye_y_end = int(h * 0.42)
            aug[eye_y_start:eye_y_end, :] = 0

        elif i == 6:
            rx = np.random.randint(0, max(1, w // 2))
            ry = np.random.randint(0, max(1, h // 2))
            rw = np.random.randint(max(1, w // 6), max(2, w // 3))
            rh = np.random.randint(max(1, h // 6), max(2, h // 3))
            aug[ry:min(h, ry + rh), rx:min(w, rx + rw)] = 0

        elif i == 7:
            gamma = np.random.uniform(0.6, 1.4)
            table = np.array([
                ((j / 255.0) ** gamma) * 255 for j in range(256)
            ]).astype("uint8")
            aug = cv2.LUT(aug, table)

        else:
            if np.random.rand() > 0.5:
                aug = cv2.flip(aug, 1)
            alpha = float(np.random.uniform(0.8, 1.2))
            beta = int(np.random.uniform(-20, 20))
            aug = cv2.convertScaleAbs(aug, alpha=alpha, beta=beta)

        augments.append(aug)

    return augments


def get_embedding(face_crop, model_name=MODEL_NAME):
    """
    Generate a single L2-normalized embedding using the specified model.
    
    The model is already loaded in memory (warm-up at module level),
    so each call takes ~100ms instead of ~20s.

    Returns a list[float] or None on failure.
    """
    if model_name == 'InsightFace':
        return get_embedding_insightface(face_crop)

    try:
        embedding_objs = DeepFace.represent(
            img_path=face_crop,
            model_name=model_name,
            enforce_detection=False,
            detector_backend='skip',
            align=False
        )
        if embedding_objs:
            emb = np.array(embedding_objs[0]['embedding'], dtype=np.float32)

            # L2 normalize for stable cosine matching
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            return emb.tolist()
    except Exception as e:
        print(f"      [WARNING] Embedding failed for {model_name}: {e}")

    return None


def get_embedding_tta(face_crop):
    """
    Test-Time Augmentation: Generate multiple embeddings from different
    views of the same face and average them for more robust matching.

    Returns averaged L2-normalized embedding or None.
    """
    from config_utils import load_config
    if not load_config().get("ENABLE_DEEPFACE", False):
        return None
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

    # 4. Double CLAHE
    try:
        clahe_img = apply_clahe(face_crop)
        emb = get_embedding(clahe_img)
        if emb:
            embeddings.append(emb)
    except Exception:
        pass

    # 5. Center crop (90%)
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
        try:
            from scripts.clean_dataset import _build_mediapipe_detector, _detect_with_mediapipe
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
        return image, False

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
    Production embedding generation pipeline.

    v6.0 changes:
    - GPU-first: delegates to gpu_trainer.retrain_all_gpu() when CUDA + InsightFace available
      (10-20x faster full retrain on GTX 1650 vs CPU)
    - CPU fallback: original Facenet512 DeepFace pipeline (unchanged, always available)
    - Progress logging with timing

    v5.0 changes:
    - Pure 512-d Facenet512 embeddings (removed soft biometrics overhead)
    - Model pre-loaded at module level (no per-call TF reload)
    """
    # ── GPU Fast Path ─────────────────────────────────────────────────────────
    try:
        from gpu_trainer import is_gpu_available, retrain_all_gpu
        if is_gpu_available():
            print("\n[GPU] Full retrain using InsightFace ArcFace on CUDA...")
            encodings, names, total = retrain_all_gpu(
                dataset_path=dataset_path,
                encodings_path=model_save_path,
                num_augments=NUM_AUGMENTS,
            )
            print(f"\n[GPU] Retrain complete: {total} embeddings, {len(set(names))} persons")
            return
    except Exception as gpu_err:
        print(f"[GPU] Retrain failed ({gpu_err}), falling back to CPU DeepFace...")
    # ── CPU Fallback (original logic below, unchanged) ─────────────────────
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset directory '{dataset_path}' not found.")
        return

    known_encodings = []
    known_names = []

    from face_detection import SideFaceDetector
    detector = SideFaceDetector(min_detection_confidence=DETECTOR_CONFIDENCE)

    print("Scanning dataset and generating embeddings...")
    print(f"   Model:              {MODEL_NAME}")
    print(f"   Embedding dim:      {EMBEDDING_DIM}-d (pure Facenet512)")
    print(f"   Augments per img:   {NUM_AUGMENTS}")
    print(f"   Crop margin:        {int(CROP_MARGIN_RATIO*100)}%")
    print(f"   Detector confidence:{DETECTOR_CONFIDENCE}")

    total_images = 0
    total_embeddings = 0
    total_fallbacks = 0
    pipeline_start = time.time()

    for user_name in sorted(os.listdir(dataset_path)):
        user_dir = os.path.join(dataset_path, user_name)
        if not os.path.isdir(user_dir):
            continue

        user_start = time.time()
        print(f"\n  Processing: {user_name}")

        image_paths = []
        for root, dirs, files in os.walk(user_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_paths.append(os.path.join(root, file))

        if not image_paths:
            print(f"    No images found for {user_name}, skipping.")
            continue

        user_embedding_count = 0

        for img_idx, img_path in enumerate(image_paths):
            try:
                image = cv2.imread(img_path)
                if image is None:
                    continue
                total_images += 1

                face_crop, detected = _crop_face(image, detector)
                if not detected:
                    total_fallbacks += 1

                if face_crop.size == 0:
                    continue

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

                # Progress indicator
                if (img_idx + 1) % 5 == 0 or img_idx == len(image_paths) - 1:
                    elapsed = time.time() - user_start
                    print(f"    [{img_idx+1}/{len(image_paths)}] {elapsed:.1f}s")

            except Exception as e:
                print(f"    Error processing {os.path.basename(img_path)}: {e}")

        user_elapsed = time.time() - user_start
        print(f"    Done: {user_embedding_count} embeddings in {user_elapsed:.1f}s")

    detector.close()

    if not known_encodings:
        print("No embeddings were generated. Check dataset structure.")
        return

    total_time = time.time() - pipeline_start
    emb_dim = len(known_encodings[0]) if known_encodings else 0
    print(f"\n{'='*50}")
    print(f"TRAINING SUMMARY")
    print(f"{'='*50}")
    print(f"   Images processed:    {total_images}")
    print(f"   Full-image fallbacks:{total_fallbacks}")
    print(f"   Total embeddings:    {total_embeddings}")
    print(f"   Embedding dimension: {emb_dim}-d (pure Facenet512)")
    print(f"   Total time:          {total_time:.1f}s ({total_time/60:.1f} min)")
    if total_images > 0:
        print(f"   Speed:               {total_time/total_images:.2f}s per image")
    print(f"\nSaving {len(known_encodings)} embeddings to {model_save_path}...")
    data = {
        "encodings": known_encodings,
        "names": known_names,
        "model_used": MODEL_NAME,
        "version": "5.0-production",
    }
    with open(model_save_path, "wb") as f:
        pickle.dump(data, f)
    print("Model training complete (v5.0 Production)!")

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
    After training, exports artefacts for mobile / edge deployment.
    """
    print(f"\n{'='*50}")
    print("ONNX EXPORT")
    print(f"{'='*50}")

    print("\nLoading Facenet512 Keras model from DeepFace...")
    try:
        import tf2onnx
        import onnx
        from deepface import DeepFace as _DF

        dummy = np.zeros((160, 160, 3), dtype=np.float32)
        _DF.represent(img_path=dummy, model_name=MODEL_NAME,
                      enforce_detection=False, align=False)

        from deepface.models.facial_recognition.Facenet512 import Facenet512Client
        keras_model = Facenet512Client().model

        print(f"   Input shape:  {keras_model.input_shape}")
        print(f"   Output shape: {keras_model.output_shape}")

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
        print(f"   Saved: {onnx_model_path}  ({size_mb:.1f} MB)")

    except ImportError:
        print("   tf2onnx / onnx not installed.")
        print("       Run: pip install tf2onnx onnx")
        print("       Skipping ONNX backbone export.")
    except Exception as e:
        print(f"   ONNX export failed: {e}")
        print("       Skipping — centroids/label_map will still be saved.")

    # Build class centroids
    print("\nComputing class centroids...")
    buckets = defaultdict(list)
    for emb, name in zip(encodings, names):
        buckets[name].append(emb)

    sorted_names = sorted(buckets.keys())
    centroids = {}
    label_map = {}

    for idx, name in enumerate(sorted_names):
        vecs = np.array(buckets[name], dtype=np.float32)
        centroid = vecs.mean(axis=0)
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids[name] = centroid.tolist()
        label_map[str(idx)] = name

    with open(centroids_path, "w") as f:
        json.dump(centroids, f)
    print(f"   Saved: {centroids_path}  ({len(centroids)} classes)")

    with open(label_map_path, "w") as f:
        json.dump(label_map, f, indent=2)
    print(f"   Saved: {label_map_path}")


if __name__ == "__main__":
    result = train_model()

    if result is not None:
        encodings, names = result
        export_to_onnx(encodings, names)
