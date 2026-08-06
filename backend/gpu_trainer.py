"""
gpu_trainer.py — GPU-Accelerated Face Enrollment & Embedding Generation

Uses InsightFace ArcFace (buffalo_sc recognition model, w600k_mbf.onnx) directly via
ONNX Runtime for GPU-accelerated embedding generation.

GPU acceleration strategy (Windows-compatible):
  1. DirectML  — DirectX 12 ML, works on any Windows GPU (NVIDIA/AMD/Intel)
                 No CUDA runtime DLLs needed, just the GPU driver.
  2. CUDA      — ONNX Runtime CUDAExecutionProvider (requires CUDA Toolkit 12.x)
  3. CPU       — ONNX Runtime CPU (still 3-5x faster than DeepFace TF, uses optimized kernels)

Key design decisions:
  - We load the recognition ONNX model DIRECTLY (bypassing FaceAnalysis) because:
    (a) We already do face detection with SideFaceDetector (MediaPipe)
    (b) FaceAnalysis's internal assertion on 'detection' fails when det_500m.onnx
        can't run on the requested provider
  - Embedding format: 512-d L2-normalized (identical to DeepFace Facenet512 format)
  - Falls back to CPU DeepFace if ONNX loading fails entirely

Expected speedup vs CPU DeepFace:
  - DirectML/CUDA: 8-15x
  - CPU ONNX:      3-5x
"""

import os
import cv2
import pickle
import logging
import numpy as np
import time
from typing import Optional

log = logging.getLogger(__name__)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# InsightFace model download URL and local path
BUFFALO_SC_URL = "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_sc.zip"
INSIGHTFACE_HOME = os.path.join(os.path.expanduser('~'), '.insightface', 'models')
BUFFALO_SC_DIR   = os.path.join(INSIGHTFACE_HOME, 'buffalo_sc')
REC_MODEL_PATH   = os.path.join(BUFFALO_SC_DIR, 'w600k_mbf.onnx')

# ── Module-level cache ───────────────────────────────────────────────────────
_ort_session   = None   # Cached ONNX Runtime InferenceSession
_active_device = None   # 'directml', 'cuda', or 'cpu'
_init_attempted = False # Don't retry a failed init every call


# ============================================================================
# MODEL DOWNLOAD
# ============================================================================

def _ensure_model_downloaded():
    """Download buffalo_sc ONNX models if not already present."""
    if os.path.exists(REC_MODEL_PATH):
        return  # Already downloaded

    import zipfile
    import urllib.request

    os.makedirs(BUFFALO_SC_DIR, exist_ok=True)
    zip_path = os.path.join(INSIGHTFACE_HOME, 'buffalo_sc.zip')

    log.info(f"[GPU] Downloading buffalo_sc model from InsightFace GitHub...")
    try:
        # Try using the insightface downloader first (respects mirrors)
        from insightface.utils.storage import download
        download('buffalo_sc', root=INSIGHTFACE_HOME, force=False)
    except Exception:
        # Fallback to direct download
        urllib.request.urlretrieve(BUFFALO_SC_URL, zip_path)
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(BUFFALO_SC_DIR)
        if os.path.exists(zip_path):
            os.remove(zip_path)

    log.info(f"[GPU] Model downloaded to: {REC_MODEL_PATH}")


# ============================================================================
# GPU / ONNX RUNTIME SESSION
# ============================================================================

def get_device() -> str:
    """
    Returns 'cuda' if PyTorch can use the GPU (CUDA smoke test), else 'cpu'.
    The actual ONNX Runtime provider used may differ (DirectML/CUDA/CPU).
    """
    try:
        import torch
        if torch.cuda.is_available() and torch.cuda.device_count() > 0:
            _ = torch.zeros(1).cuda()  # Smoke test
            gpu_name = torch.cuda.get_device_name(0)
            vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
            log.info(f"[GPU] PyTorch CUDA available: {gpu_name} ({vram_gb:.1f} GB VRAM)")
            return 'cuda'
    except Exception as e:
        log.debug(f"[GPU] PyTorch CUDA unavailable: {e}")
    return 'cpu'


def _get_ort_providers(prefer_gpu: bool = True) -> list:
    """
    Build a provider priority list for ONNX Runtime that works on Windows.

    NOTE: DirectML (DmlExecutionProvider) is skipped intentionally.
    The w600k_mbf.onnx model (MobileFaceNet backbone) has a Conv kernel
    incompatibility with onnxruntime-directml 1.24.x on some GPUs, causing
    an 80070057 'parameter is incorrect' error at runtime.

    CPU ONNX with ORT_ENABLE_ALL graph optimization is still 3-5x faster
    than DeepFace + TensorFlow for this model size.
    CUDA can be added if the CUDA Toolkit 12.x runtime DLLs are installed.
    """
    import onnxruntime as ort
    available = ort.get_available_providers()
    log.info(f"[GPU] ORT available providers: {available}")

    providers = []
    if prefer_gpu:
        # CUDA — requires CUDA 12.x runtime DLLs in PATH
        if 'CUDAExecutionProvider' in available:
            providers.append(('CUDAExecutionProvider', {
                'device_id': 0,
                'arena_extend_strategy': 'kNextPowerOfTwo',
                'cudnn_conv_algo_search': 'EXHAUSTIVE',
            }))
            log.info("[GPU] Using CUDA provider")
        else:
            log.info("[GPU] No CUDA provider — using CPU ONNX (3-5x faster than DeepFace TF)")

    providers.append('CPUExecutionProvider')
    return providers


def _load_ort_session():
    """Load the InsightFace ArcFace recognition ONNX model into an ORT InferenceSession."""
    _ensure_model_downloaded()

    if not os.path.exists(REC_MODEL_PATH):
        raise FileNotFoundError(f"Model not found after download: {REC_MODEL_PATH}")

    import onnxruntime as ort

    providers = _get_ort_providers(prefer_gpu=True)

    try:
        session = ort.InferenceSession(
            REC_MODEL_PATH,
            providers=providers,
            sess_options=_get_ort_session_options(),
        )
        active_providers = session.get_providers()
        provider_used = active_providers[0] if active_providers else 'Unknown'
        log.info(f"[GPU] ORT session loaded. Active provider: {provider_used}")

        # Determine active device label and set module-level variable
        global _active_device
        if 'DmlExecutionProvider' in provider_used:
            _active_device = 'directml'
        elif 'CUDAExecutionProvider' in provider_used:
            _active_device = 'cuda'
        else:
            _active_device = 'cpu_onnx'

        # Warm-up run to catch provider-level failures before returning
        dummy = np.zeros((1, 3, 112, 112), dtype=np.float32)
        input_name = session.get_inputs()[0].name
        try:
            session.run(None, {input_name: dummy})
            log.info(f"[GPU] Warm-up OK on {_active_device}")
        except Exception as warm_err:
            # Provider loaded but fails at inference — fall back to CPU
            log.warning(f"[GPU] Provider {provider_used} failed warm-up ({warm_err}), retrying on CPU ONNX...")
            session = ort.InferenceSession(
                REC_MODEL_PATH,
                providers=['CPUExecutionProvider'],
                sess_options=_get_ort_session_options(),
            )
            _active_device = 'cpu_onnx'
            log.info("[GPU] CPU ONNX fallback session loaded OK")

        return session
    except Exception as e:
        log.warning(f"[GPU] Failed with preferred providers ({e}), falling back to CPU ORT...")
        session = ort.InferenceSession(
            REC_MODEL_PATH,
            providers=['CPUExecutionProvider'],
            sess_options=_get_ort_session_options(),
        )
        _active_device = 'cpu_onnx'
        return session


def _get_ort_session_options():
    """ORT session options: enable parallelism, suppress shape-mismatch warnings."""
    import onnxruntime as ort
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = os.cpu_count()
    opts.inter_op_num_threads = os.cpu_count()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.log_severity_level = 3   # Suppress shape-mismatch and other INFO/WARNING logs
    return opts


def load_insightface_model(device: str = 'cuda'):
    """
    Load InsightFace ArcFace recognition model.
    Returns the cached ORT session (loads on first call).
    `device` param is accepted for API compatibility but provider is chosen automatically.
    """
    global _ort_session
    if _ort_session is not None:
        return _ort_session

    _ort_session = _load_ort_session()
    return _ort_session


def is_gpu_available() -> bool:
    """
    Returns True if the recognition model can be loaded via ONNX Runtime
    (DirectML, CUDA, or CPU ONNX are all considered "available").
    """
    global _init_attempted, _ort_session
    if _init_attempted:
        return _ort_session is not None

    _init_attempted = True
    try:
        load_insightface_model()
        return True
    except Exception as e:
        log.info(f"[GPU] Model init failed, will use CPU DeepFace fallback. Reason: {e}")
        return False


# ============================================================================
# EMBEDDING INFERENCE
# ============================================================================

def _preprocess_crop(face_crop: np.ndarray) -> Optional[np.ndarray]:
    """
    Preprocess a BGR face crop for the buffalo_sc recognition model.
    Normalization: (pixel - 127.5) / 127.5  →  range [-1, 1]
    Output shape:  (1, 3, 112, 112) float32
    """
    if face_crop is None or face_crop.size == 0:
        return None
    try:
        # Resize to 112×112
        resized = cv2.resize(face_crop, (112, 112), interpolation=cv2.INTER_LINEAR)
        # BGR → RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        # Normalize to [-1, 1]
        arr = (rgb.astype(np.float32) - 127.5) / 127.5
        # HWC → CHW → NCHW
        arr = arr.transpose(2, 0, 1)[np.newaxis, ...]  # (1, 3, 112, 112)
        return arr
    except Exception:
        return None


def gpu_embed_batch(face_crops: list, device: str = 'cuda') -> list:
    """
    Generate L2-normalized 512-d ArcFace embeddings for a batch of BGR face crops.
    Runs through ONNX Runtime (DirectML GPU / CUDA / CPU ONNX).

    Args:
        face_crops: list of BGR np.ndarray face crops (any size — will be resized)
        device: 'cuda' or 'cpu' (used only for API compat; ORT provider chosen at load time)

    Returns:
        list of (list[float] | None) — one 512-d L2-normalized embedding per crop
    """
    global _ort_session
    if _ort_session is None:
        return [None] * len(face_crops)

    # Pre-process all crops
    preprocessed = []
    valid_indices = []
    for i, crop in enumerate(face_crops):
        arr = _preprocess_crop(crop)
        if arr is not None:
            preprocessed.append(arr)
            valid_indices.append(i)

    if not preprocessed:
        return [None] * len(face_crops)

    results = [None] * len(face_crops)
    try:
        # Batch all crops into a single NCHW tensor: (N, 3, 112, 112)
        batch = np.concatenate(preprocessed, axis=0)  # (N, 3, 112, 112)

        input_name = _ort_session.get_inputs()[0].name
        raw = _ort_session.run(None, {input_name: batch})[0]  # (N, 512)

        for j, idx in enumerate(valid_indices):
            emb = raw[j].astype(np.float32)
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            results[idx] = emb.tolist()

    except Exception as e:
        log.warning(f"[GPU] Batch embed failed: {e}")

    return results


def gpu_embed_single(face_crop: np.ndarray) -> Optional[list]:
    """Convenience wrapper for a single crop."""
    embs = gpu_embed_batch([face_crop])
    return embs[0] if embs else None


# ============================================================================
# STANDALONE PREPROCESSING  (no TF/DeepFace dependency)
# ============================================================================

def _clahe(img: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to improve
    recognition accuracy under poor lighting.
    Pure OpenCV — does NOT import model.py or TensorFlow.
    """
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_eq = clahe.apply(l)
        merged = cv2.merge([l_eq, a, b])
        return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    except Exception:
        return img


def _augment(img: np.ndarray, num_augments: int = 2) -> list:
    """
    Generate augmented face crops for training data expansion.
    Pure OpenCV — does NOT import model.py or TensorFlow.
    Augmentations: horizontal flip, brightness/contrast jitter, slight rotation.
    """
    if num_augments <= 0:
        return []
    augmented = []
    # 1. Horizontal flip (common for face data augmentation)
    augmented.append(cv2.flip(img, 1))
    if num_augments >= 2:
        # 2. Slight brightness boost / dim
        bright = cv2.convertScaleAbs(img, alpha=1.15, beta=12)
        augmented.append(bright)
    if num_augments >= 3:
        # 3. Small rotation (±10 deg)
        h, w = img.shape[:2]
        M = cv2.getRotationMatrix2D((w // 2, h // 2), 10, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h))
        augmented.append(rotated)
    return augmented[:num_augments]

def enroll_with_gpu(
    person_name: str,
    image_paths: list,
    encodings_path: str,
    num_augments: int = 2,
) -> tuple:
    """
    Full GPU enrollment pipeline for one person.

    Steps:
      1. Load existing embeddings
      2. Detect + CLAHE preprocess each image (pure OpenCV — no TF)
      3. Generate augments (pure OpenCV — no TF)
      4. Batch-embed all crops via ONNX Runtime
      5. Append to pickle and save

    NOTE: This function intentionally does NOT import model.py or face_detection.py
    to avoid triggering TensorFlow startup overhead in the GPU path.
    SideFaceDetector (MediaPipe) is the only non-ONNX dependency.

    Returns (all_encodings, all_names, num_added)
    """
    from face_detection import SideFaceDetector
    # No `from model import ...` here — using internal _clahe/_augment to avoid TF loading

    t_start = time.time()
    provider_label = _active_device or 'ort'
    log.info(f"[{provider_label.upper()}] Enrolling '{person_name}' — {len(image_paths)} images, {num_augments} augments")

    # ── Load existing encodings ──
    existing_encodings = []
    existing_names = []
    if os.path.exists(encodings_path):
        try:
            with open(encodings_path, 'rb') as f:
                data = pickle.load(f)
                existing_encodings = data.get('encodings', [])
                existing_names = data.get('names', [])
        except Exception as e:
            log.warning(f"[GPU] Could not load existing encodings: {e}")

    # ── Collect and preprocess crops ──
    detector = SideFaceDetector(min_detection_confidence=0.30)
    all_crops = []

    for img_path in image_paths:
        try:
            img = cv2.imread(img_path)
            if img is None:
                continue

            faces = detector.detect_faces(img, profile_only=False)
            if faces:
                face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                bx = face['bbox']
                H, W = img.shape[:2]
                mx, my = int(bx['w'] * 0.22), int(bx['h'] * 0.22)
                crop = img[max(0, bx['y']-my):min(H, bx['y']+bx['h']+my),
                           max(0, bx['x']-mx):min(W, bx['x']+bx['w']+mx)]
            else:
                crop = img

            if crop.size == 0:
                continue

            crop = _clahe(crop)
            all_crops.append(crop)
            if num_augments > 0:
                all_crops.extend(_augment(crop, num_augments))

        except Exception as e:
            log.debug(f"[GPU] Error on {img_path}: {e}")

    detector.close()

    if not all_crops:
        log.warning(f"[GPU] No valid crops for '{person_name}'")
        return existing_encodings, existing_names, 0

    # ── Batch embed ──
    log.info(f"[{provider_label.upper()}] Embedding {len(all_crops)} crops...")
    embeddings = gpu_embed_batch(all_crops)

    new_encodings = [e for e in embeddings if e is not None]
    num_added = len(new_encodings)
    all_encodings = existing_encodings + new_encodings
    all_names = existing_names + [person_name] * num_added

    # ── Save ──
    os.makedirs(os.path.dirname(os.path.abspath(encodings_path)), exist_ok=True)
    with open(encodings_path, 'wb') as f:
        pickle.dump({
            'encodings': all_encodings,
            'names': all_names,
            'model_used': f'InsightFace-ArcFace-{provider_label}',
            'version': '3.0-gpu',
        }, f)

    elapsed = time.time() - t_start
    log.info(f"[{provider_label.upper()}] Enrolled {num_added} embeddings in {elapsed:.2f}s")
    return all_encodings, all_names, num_added


# ============================================================================
# FULL RETRAIN
# ============================================================================

def retrain_all_gpu(
    dataset_path: str,
    encodings_path: str,
    num_augments: int = 2,
) -> tuple:
    """
    Full GPU retrain — regenerates all embeddings from scratch for the entire dataset.
    Returns (encodings, names, total_count)
    """
    from face_detection import SideFaceDetector
    # Uses internal _clahe/_augment (no TF/DeepFace dependency)

    provider_label = _active_device or 'ort'
    log.info(f"[{provider_label.upper()}] Full retrain from: {dataset_path}")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    persons = sorted([
        d for d in os.listdir(dataset_path)
        if os.path.isdir(os.path.join(dataset_path, d))
    ])
    if not persons:
        raise ValueError(f"No persons in: {dataset_path}")

    detector = SideFaceDetector(min_detection_confidence=0.30)
    all_encodings = []
    all_names = []

    for i, person_name in enumerate(persons):
        person_dir = os.path.join(dataset_path, person_name)
        crops = []

        for root, _, files in os.walk(person_dir):
            for f in files:
                if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                    continue
                try:
                    img = cv2.imread(os.path.join(root, f))
                    if img is None:
                        continue
                    faces = detector.detect_faces(img, profile_only=False)
                    if faces:
                        face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                        bx = face['bbox']
                        H, W = img.shape[:2]
                        mx, my = int(bx['w'] * 0.22), int(bx['h'] * 0.22)
                        crop = img[max(0, bx['y']-my):min(H, bx['y']+bx['h']+my),
                                   max(0, bx['x']-mx):min(W, bx['x']+bx['w']+mx)]
                    else:
                        crop = img
                    if crop.size == 0:
                        continue
                    crop = _clahe(crop)
                    crops.append(crop)
                    crops.extend(_augment(crop, num_augments))
                except Exception:
                    continue

        if not crops:
            continue

        embs = gpu_embed_batch(crops)
        valid = [e for e in embs if e is not None]
        all_encodings.extend(valid)
        all_names.extend([person_name] * len(valid))
        log.info(f"  [{i+1}/{len(persons)}] {person_name}: {len(valid)} embeddings")

    detector.close()

    os.makedirs(os.path.dirname(os.path.abspath(encodings_path)), exist_ok=True)
    with open(encodings_path, 'wb') as f:
        pickle.dump({
            'encodings': all_encodings,
            'names': all_names,
            'model_used': f'InsightFace-ArcFace-{provider_label}',
            'version': '3.0-gpu',
        }, f)

    log.info(f"[{provider_label.upper()}] Retrain complete: {len(all_encodings)} embeddings, {len(set(all_names))} persons")
    return all_encodings, all_names, len(all_encodings)
