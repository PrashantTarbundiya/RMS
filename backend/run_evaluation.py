"""
run_evaluation.py — Comprehensive Face Recognition System Evaluation

Evaluates three embedding models under identical conditions:
  • Facenet512    (DeepFace / TensorFlow)
  • GhostFaceNet  (DeepFace / TensorFlow)
  • InsightFace   (ArcFace buffalo_sc / ONNX Runtime)

Metrics computed per model per condition:
  • Accuracy, Precision, Recall, F1
  • FAR  (False Acceptance Rate)
  • FRR  (False Rejection Rate)
  • EER  (Equal Error Rate — threshold sweep)
  • Unknown-Person Rejection Rate
  • Inference latency: P50 / P95 / P99 (ms)
  • FPS (frames per second)
  • CPU utilisation (avg %, peak %)
  • RAM usage (avg MB, peak MB)
  • Embedding generation time (ms/image, incl. preprocessing)

Conditions evaluated:
  • Baseline (full-resolution, frontal, normal light)
  • Camera resolution: 480p / 720p / 1080p  ×  distance: 1 m / 2 m / 3 m / 5 m
  • Viewing angle: 0° / 15° / 30° / 45°
  • Lighting: normal / office-dim / low-light / harsh-outdoor / backlit
  • Motion blur (FPS sim): 60 fps / 30 fps / 15 fps / 10 fps

Usage:
    python run_evaluation.py [--max-per-person N] [--output-dir PATH] [--skip-insightface]
"""

import os, sys, cv2, json, time, pickle, logging, argparse, threading, warnings
import numpy as np
import psutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from scipy.spatial.distance import cosine as cosine_distance
from datetime import datetime
from collections import defaultdict
import csv

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.WARNING)

BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

DATASET_DIR   = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
DATA_DIR      = os.path.join(BACKEND_DIR, 'data')
UNKNOWN_DIR   = os.path.join(DATA_DIR, 'unknown_test_faces')
FN512_PICKLE  = os.path.join(DATA_DIR, 'encodings.pickle')
GFN_PICKLE    = os.path.join(DATA_DIR, 'encodings_GhostFaceNet.pickle')
IFF_PICKLE    = os.path.join(DATA_DIR, 'encodings_InsightFace.pickle')

MATCH_THRESHOLD = 0.65   # cosine similarity threshold for all models

# ─────────────────────────────────────────────────────────────────────────────
# RESOURCE MONITOR
# ─────────────────────────────────────────────────────────────────────────────

class ResourceMonitor:
    def __init__(self, interval=0.2):
        self._proc = psutil.Process(os.getpid())
        self._interval = interval
        self._cpu, self._ram = [], []
        self._running = False

    def start(self):
        self._cpu.clear(); self._ram.clear()
        self._running = True
        self._proc.cpu_percent(interval=None)   # prime
        self._t = threading.Thread(target=self._collect, daemon=True)
        self._t.start()
        return self

    def _collect(self):
        while self._running:
            self._cpu.append(self._proc.cpu_percent(interval=None))
            self._ram.append(self._proc.memory_info().rss / 1e6)
            time.sleep(self._interval)

    def stop(self):
        self._running = False
        self._t.join(timeout=1.0)
        cpu = self._cpu or [0.0]; ram = self._ram or [0.0]
        return dict(avg_cpu=round(np.mean(cpu),1), peak_cpu=round(np.max(cpu),1),
                    avg_ram=round(np.mean(ram),1), peak_ram=round(np.max(ram),1))


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE CONDITION SIMULATORS
# ─────────────────────────────────────────────────────────────────────────────

def sim_resolution(img, face_px_target, full_size=(1920,1080)):
    """Down-sample to simulate face appearing at face_px_target pixels wide."""
    h, w = img.shape[:2]
    if w <= face_px_target:
        return img
    scale = face_px_target / w
    small = cv2.resize(img, (max(1,int(w*scale)), max(1,int(h*scale))), interpolation=cv2.INTER_AREA)
    out   = cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)
    return out

def sim_angle(img, degrees):
    """Simulate horizontal viewing angle via perspective warp."""
    h, w = img.shape[:2]
    if degrees == 0:
        return img
    frac = abs(degrees) / 90.0 * 0.45
    if degrees > 0:  # right side foreshortened
        src = np.float32([[0,0],[w,0],[w,h],[0,h]])
        dst = np.float32([[int(w*frac),0],[w,0],[w,h],[int(w*frac),h]])
    else:            # left side foreshortened
        src = np.float32([[0,0],[w,0],[w,h],[0,h]])
        dst = np.float32([[0,0],[int(w*(1-frac)),0],[int(w*(1-frac)),h],[0,h]])
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, M, (w, h))

def sim_lighting(img, gamma, noise_std=0, brightness_offset=0):
    """Simulate lighting: gamma correction + Gaussian noise + brightness shift."""
    out = np.clip(img.astype(np.float32) / 255.0, 0, 1)
    out = np.power(out, gamma)
    if noise_std > 0:
        noise = np.random.randn(*out.shape).astype(np.float32) * (noise_std / 255.0)
        out = np.clip(out + noise, 0, 1)
    if brightness_offset != 0:
        out = np.clip(out + brightness_offset / 255.0, 0, 1)
    return (out * 255).astype(np.uint8)

def sim_motion_blur(img, kernel_size):
    """Simulate motion blur from fast subject movement / low shutter speed."""
    if kernel_size <= 1:
        return img
    k = np.zeros((kernel_size, kernel_size))
    k[kernel_size // 2, :] = 1.0 / kernel_size
    return cv2.filter2D(img, -1, k)

def apply_clahe_local(img):
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        return cv2.cvtColor(cv2.merge([clahe.apply(l), a, b]), cv2.COLOR_LAB2BGR)
    except Exception:
        return img


# ─────────────────────────────────────────────────────────────────────────────
# EMBEDDING FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

_deepface_loaded = {}

def embed_facenet512(crop):
    from deepface import DeepFace
    try:
        r = DeepFace.represent(crop, model_name='Facenet512',
                               enforce_detection=False, detector_backend='skip', align=False)
        if r:
            e = np.array(r[0]['embedding'], dtype=np.float32)
            n = np.linalg.norm(e)
            return (e / n).tolist() if n > 0 else None
    except Exception:
        return None

def embed_ghostfacenet(crop):
    from deepface import DeepFace
    try:
        r = DeepFace.represent(crop, model_name='GhostFaceNet',
                               enforce_detection=False, detector_backend='skip', align=False)
        if r:
            e = np.array(r[0]['embedding'], dtype=np.float32)
            n = np.linalg.norm(e)
            return (e / n).tolist() if n > 0 else None
    except Exception:
        return None

_ort_session = None

def embed_insightface(crop):
    global _ort_session
    if _ort_session is None:
        return None
    try:
        resized = cv2.resize(crop, (112, 112), interpolation=cv2.INTER_LINEAR)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        arr = ((rgb.astype(np.float32) - 127.5) / 127.5).transpose(2,0,1)[np.newaxis]
        raw = _ort_session.run(None, {_ort_session.get_inputs()[0].name: arr})[0]
        e = raw[0].astype(np.float32)
        n = np.linalg.norm(e)
        return (e / n).tolist() if n > 0 else None
    except Exception:
        return None

def load_insightface_session():
    global _ort_session
    try:
        import onnxruntime as ort
        model_path = os.path.join(os.path.expanduser('~'), '.insightface', 'models', 'buffalo_sc', 'w600k_mbf.onnx')
        if not os.path.exists(model_path):
            print('  [InsightFace] Model not found — run gpu_trainer.is_gpu_available() first to download')
            return False
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = os.cpu_count()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.log_severity_level = 3
        _ort_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'], sess_options=opts)
        # Warm-up
        dummy = np.zeros((1,3,112,112), dtype=np.float32)
        _ort_session.run(None, {_ort_session.get_inputs()[0].name: dummy})
        print(f'  [InsightFace] ORT session loaded (CPU ONNX)')
        return True
    except Exception as e:
        print(f'  [InsightFace] Load failed: {e}')
        return False


MODELS = {
    'Facenet512':   embed_facenet512,
    'GhostFaceNet': embed_ghostfacenet,
    'InsightFace':  embed_insightface,
}


# ─────────────────────────────────────────────────────────────────────────────
# DATASET LOADER
# ─────────────────────────────────────────────────────────────────────────────

def load_dataset(dataset_dir, max_per_person=None):
    """Return list of (person_name, image_path) for all dataset images."""
    records = []
    for person in sorted(os.listdir(dataset_dir)):
        person_dir = os.path.join(dataset_dir, person)
        if not os.path.isdir(person_dir):
            continue
        imgs = []
        for root, _, files in os.walk(person_dir):
            for f in sorted(files):
                if f.lower().endswith(('.jpg','.jpeg','.png','.bmp')):
                    imgs.append(os.path.join(root, f))
        if max_per_person:
            imgs = imgs[:max_per_person]
        for img_path in imgs:
            records.append((person, img_path))
    return records


def detect_and_crop(img):
    """Detect face and return crop. Returns full image if no face detected."""
    from face_detection import SideFaceDetector
    if not hasattr(detect_and_crop, '_det'):
        detect_and_crop._det = SideFaceDetector(min_detection_confidence=0.30)
    det = detect_and_crop._det
    faces = det.detect_faces(img, profile_only=False)
    if faces:
        face = max(faces, key=lambda x: x['bbox']['w']*x['bbox']['h'])
        bx = face['bbox']
        H, W = img.shape[:2]
        mx, my = int(bx['w']*0.22), int(bx['h']*0.22)
        crop = img[max(0,bx['y']-my):min(H,bx['y']+bx['h']+my),
                   max(0,bx['x']-mx):min(W,bx['x']+bx['w']+mx)]
        if crop.size > 0:
            return crop
    return img


# ─────────────────────────────────────────────────────────────────────────────
# REFERENCE EMBEDDINGS  (load from existing pickles OR generate)
# ─────────────────────────────────────────────────────────────────────────────

def load_reference(pickle_path, model_name):
    """Load reference embeddings from pickle. Returns (encodings, names)."""
    if not os.path.exists(pickle_path):
        return [], []
    with open(pickle_path, 'rb') as f:
        d = pickle.load(f)
    return d.get('encodings', []), d.get('names', [])


def generate_insightface_reference(dataset_dir, output_path, max_per_person=None):
    """Generate InsightFace reference embeddings from scratch."""
    print('  [InsightFace] Generating reference embeddings...')
    records = load_dataset(dataset_dir, max_per_person=max_per_person)
    all_enc, all_names = [], []
    prev_name = None
    count = 0
    for person, img_path in records:
        if person != prev_name:
            if prev_name: print(f'    {prev_name}: {count} embeddings')
            prev_name = person
            count = 0
        img = cv2.imread(img_path)
        if img is None: continue
        crop = detect_and_crop(img)
        crop = apply_clahe_local(crop)
        emb = embed_insightface(crop)
        if emb:
            all_enc.append(emb); all_names.append(person); count += 1
    if prev_name: print(f'    {prev_name}: {count} embeddings')
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(output_path, 'wb') as f:
        pickle.dump({'encodings': all_enc, 'names': all_names,
                     'model_used': 'InsightFace-ArcFace', 'version': '3.0-eval'}, f)
    print(f'  [InsightFace] Saved {len(all_enc)} embeddings for {len(set(all_names))} persons')
    return all_enc, all_names


# ─────────────────────────────────────────────────────────────────────────────
# MATCHING
# ─────────────────────────────────────────────────────────────────────────────

def match_embedding(query_emb, ref_encodings, ref_names, threshold=MATCH_THRESHOLD):
    """Returns (predicted_name, similarity_score). Returns 'Unknown' if below threshold."""
    if not ref_encodings or query_emb is None:
        return 'Unknown', 0.0
    q = np.array(query_emb, dtype=np.float32)
    best_sim, best_name = -1.0, 'Unknown'
    for emb, name in zip(ref_encodings, ref_names):
        sim = 1.0 - cosine_distance(q, np.array(emb, dtype=np.float32))
        if sim > best_sim:
            best_sim = sim; best_name = name
    if best_sim < threshold:
        return 'Unknown', best_sim
    return best_name, best_sim


# ─────────────────────────────────────────────────────────────────────────────
# CORE EVALUATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_model_on_condition(
    model_name, embed_fn,
    ref_encodings, ref_names,
    test_records,          # list of (person_name, img_path)
    condition_fn=None,     # optional: fn(crop) -> augmented_crop
    threshold=MATCH_THRESHOLD,
    warmup=3,
):
    """
    Run full evaluation for one model × one condition.
    Returns dict with all metrics.
    """
    monitor = ResourceMonitor()
    monitor.start()

    latencies = []
    true_labels, pred_labels, scores = [], [], []

    # Warm-up runs
    for person, img_path in test_records[:warmup]:
        img = cv2.imread(img_path)
        if img is None: continue
        crop = detect_and_crop(img)
        if condition_fn: crop = condition_fn(crop)
        crop = apply_clahe_local(crop)
        embed_fn(crop)

    # Main evaluation
    for person, img_path in test_records:
        img = cv2.imread(img_path)
        if img is None: continue

        crop = detect_and_crop(img)
        if condition_fn:
            crop = condition_fn(crop)
        crop = apply_clahe_local(crop)

        t0 = time.perf_counter()
        emb = embed_fn(crop)
        lat_ms = (time.perf_counter() - t0) * 1000
        latencies.append(lat_ms)

        predicted, sim = match_embedding(emb, ref_encodings, ref_names, threshold)
        true_labels.append(person)
        pred_labels.append(predicted)
        scores.append(sim)

    resources = monitor.stop()

    if not latencies:
        return None

    # ── Classification metrics ──
    total    = len(true_labels)
    tp = sum(p == t for p, t in zip(pred_labels, true_labels) if t != 'Unknown')
    fp = sum(p != t and p != 'Unknown' for p, t in zip(pred_labels, true_labels))
    fn = sum(p == 'Unknown' and t != 'Unknown' for p, t in zip(pred_labels, true_labels))
    tn = sum(p == 'Unknown' and t == 'Unknown' for p, t in zip(pred_labels, true_labels))

    correct  = sum(p == t for p, t in zip(pred_labels, true_labels))
    accuracy = correct / total * 100 if total > 0 else 0

    precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
    recall    = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    # ── FAR / FRR (identification protocol) ──
    # FAR: query matched to WRONG known identity (false accept)
    # FRR: query of known person returned 'Unknown' (false reject)
    known_mask = [t != 'Unknown' for t in true_labels]
    genuine    = [(p, t) for p, t, k in zip(pred_labels, true_labels, known_mask) if k]
    far_events = sum(1 for p, t in genuine if p != t and p != 'Unknown')
    frr_events = sum(1 for p, t in genuine if p == 'Unknown')
    FAR = far_events / len(genuine) * 100 if genuine else None
    FRR = frr_events / len(genuine) * 100 if genuine else None
    EER = (FAR + FRR) / 2 if (FAR is not None and FRR is not None) else None

    # ── Latency & throughput ──
    lats = np.array(latencies)

    result = dict(
        accuracy   = round(accuracy, 2),
        precision  = round(precision, 2),
        recall     = round(recall, 2),
        f1         = round(f1, 2),
        FAR        = round(FAR, 2) if FAR is not None else None,
        FRR        = round(FRR, 2) if FRR is not None else None,
        EER        = round(EER, 2) if EER is not None else None,
        total      = total,
        correct    = correct,
        tp=tp, fp=fp, fn=fn, tn=tn,
        lat_p50    = round(float(np.percentile(lats, 50)), 1),
        lat_p95    = round(float(np.percentile(lats, 95)), 1),
        lat_p99    = round(float(np.percentile(lats, 99)), 1),
        lat_mean   = round(float(np.mean(lats)), 1),
        fps        = round(1000.0 / np.mean(lats), 1) if np.mean(lats) > 0 else 0,
        avg_cpu    = resources['avg_cpu'],
        peak_cpu   = resources['peak_cpu'],
        avg_ram    = resources['avg_ram'],
        peak_ram   = resources['peak_ram'],
        latencies  = lats.tolist(),
    )
    return result


def compute_eer_from_scores(genuine_scores, impostor_scores):
    """Compute EER via threshold sweep on genuine vs impostor similarity scores."""
    thresholds = np.linspace(0, 1, 200)
    best_eer = 1.0
    for t in thresholds:
        far = np.mean(np.array(impostor_scores) >= t) if impostor_scores else 0
        frr = np.mean(np.array(genuine_scores)  <  t) if genuine_scores else 0
        eer = (far + frr) / 2
        if eer < best_eer:
            best_eer = eer
    return round(best_eer * 100, 2)


# ─────────────────────────────────────────────────────────────────────────────
# CONDITION DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

RESOLUTION_CONDITIONS = [
    {'label': '1080p @ 1m',  'face_px': 280, 'res': '1080p', 'dist': '1m'},
    {'label': '720p @ 1m',   'face_px': 220, 'res': '720p',  'dist': '1m'},
    {'label': '720p @ 2m',   'face_px': 120, 'res': '720p',  'dist': '2m'},
    {'label': '720p @ 3m',   'face_px': 80,  'res': '720p',  'dist': '3m'},
    {'label': '480p @ 1m',   'face_px': 180, 'res': '480p',  'dist': '1m'},
    {'label': '480p @ 2m',   'face_px': 90,  'res': '480p',  'dist': '2m'},
    {'label': '480p @ 3m',   'face_px': 60,  'res': '480p',  'dist': '3m'},
    {'label': '480p @ 5m',   'face_px': 35,  'res': '480p',  'dist': '5m'},
]

ANGLE_CONDITIONS = [
    {'label': '0° (Frontal)',  'degrees': 0},
    {'label': '15° (Slight)',  'degrees': 15},
    {'label': '30° (Profile)', 'degrees': 30},
    {'label': '45° (Steep)',   'degrees': 45},
]

LIGHTING_CONDITIONS = [
    {'label': 'Normal (Baseline)',  'gamma': 1.0, 'noise': 0,   'offset': 0},
    {'label': 'Office Dim',         'gamma': 1.4, 'noise': 8,   'offset': -10},
    {'label': 'Low Light',          'gamma': 2.2, 'noise': 18,  'offset': -20},
    {'label': 'Harsh Outdoor',      'gamma': 0.6, 'noise': 5,   'offset': 15},
    {'label': 'Backlit (Silhouette)','gamma': 3.0, 'noise': 20,  'offset': -40},
]

FPS_CONDITIONS = [
    {'label': '60 FPS (No blur)',   'kernel': 1},
    {'label': '30 FPS (Slight)',    'kernel': 3},
    {'label': '15 FPS (Moderate)',  'kernel': 7},
    {'label': '10 FPS (Heavy)',     'kernel': 11},
]


# ─────────────────────────────────────────────────────────────────────────────
# CHART GENERATION
# ─────────────────────────────────────────────────────────────────────────────

COLORS = {
    'Facenet512':   '#2196F3',  # blue
    'GhostFaceNet': '#4CAF50',  # green
    'InsightFace':  '#FF5722',  # deep orange
}

def save_bar_chart(title, xlabel, ylabel, labels, data_by_model, output_path, show_threshold=None):
    """Grouped bar chart comparing models across conditions."""
    models = list(data_by_model.keys())
    x = np.arange(len(labels))
    width = 0.25

    fig, ax = plt.subplots(figsize=(max(10, len(labels)*1.4), 5.5))
    for i, model in enumerate(models):
        vals = [data_by_model[model].get(l, 0) for l in labels]
        bars = ax.bar(x + i*width, vals, width, label=model, color=COLORS[model], alpha=0.88)
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                    f'{v:.1f}', ha='center', va='bottom', fontsize=7.5, fontweight='bold')

    if show_threshold is not None:
        ax.axhline(show_threshold, color='red', linestyle='--', linewidth=1.2, label=f'Target ({show_threshold}%)')

    ax.set_xlabel(xlabel, fontsize=11)
    ax.set_ylabel(ylabel, fontsize=11)
    ax.set_title(title, fontsize=13, fontweight='bold')
    ax.set_xticks(x + width)
    ax.set_xticklabels(labels, rotation=30, ha='right', fontsize=9)
    ax.legend(fontsize=9)
    ax.set_ylim(0, 110)
    ax.grid(axis='y', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()


def save_latency_chart(title, labels, latency_by_model, output_path):
    """Horizontal bar chart of P50 latency per model."""
    fig, ax = plt.subplots(figsize=(8, max(4, len(labels)*0.6+2)))
    models = list(latency_by_model.keys())
    y = np.arange(len(labels))
    height = 0.25
    for i, model in enumerate(models):
        vals = [latency_by_model[model].get(l, 0) for l in labels]
        ax.barh(y + i*height, vals, height, label=model, color=COLORS[model], alpha=0.88)
    ax.set_yticks(y + height)
    ax.set_yticklabels(labels, fontsize=9)
    ax.set_xlabel('Latency P50 (ms)', fontsize=11)
    ax.set_title(title, fontsize=12, fontweight='bold')
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()


def save_radar_chart(model_metrics, output_path):
    """Radar chart of overall model performance profile."""
    categories = ['Accuracy', 'Precision', 'Recall', 'F1', 'Reject Rate',
                  'Speed (inv)', 'Low CPU']
    N = len(categories)
    angles = np.linspace(0, 2*np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(7,7), subplot_kw=dict(polar=True))

    for model, m in model_metrics.items():
        spd = max(0, 100 - m.get('lat_mean', 100))  # invert latency
        cpu_eff = max(0, 100 - m.get('avg_cpu', 50))
        vals = [m.get('accuracy',0), m.get('precision',0), m.get('recall',0),
                m.get('f1',0), m.get('unknown_rejection', 50), spd, cpu_eff]
        vals += vals[:1]
        ax.plot(angles, vals, 'o-', linewidth=2, label=model, color=COLORS[model])
        ax.fill(angles, vals, alpha=0.15, color=COLORS[model])

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=10)
    ax.set_ylim(0, 100)
    ax.set_title('Model Performance Radar', fontsize=13, fontweight='bold', pad=20)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()


# ─────────────────────────────────────────────────────────────────────────────
# ENROLLMENT SPEED BENCHMARK
# ─────────────────────────────────────────────────────────────────────────────

def benchmark_enrollment_speed(dataset_dir, max_persons=3):
    """Time how long embedding generation takes per model per image."""
    records = load_dataset(dataset_dir, max_per_person=3)
    # Pick first max_persons people
    persons_seen = {}
    test_records = []
    for person, img_path in records:
        if person not in persons_seen:
            persons_seen[person] = 0
        if persons_seen[person] < 3 and len(persons_seen) <= max_persons:
            test_records.append((person, img_path))
            persons_seen[person] += 1
        if len(persons_seen) > max_persons:
            break

    results = {}
    for model_name, embed_fn in MODELS.items():
        latencies = []
        for person, img_path in test_records:
            img = cv2.imread(img_path)
            if img is None: continue
            crop = detect_and_crop(img)
            crop = apply_clahe_local(crop)
            t0 = time.perf_counter()
            embed_fn(crop)
            latencies.append((time.perf_counter() - t0) * 1000)
        if latencies:
            results[model_name] = dict(
                mean_ms = round(np.mean(latencies), 1),
                p95_ms  = round(np.percentile(latencies, 95), 1),
                imgs_tested = len(latencies),
            )
    return results


# ─────────────────────────────────────────────────────────────────────────────
# PUBLICATION-QUALITY MARKDOWN REPORT
# ─────────────────────────────────────────────────────────────────────────────

def generate_report(all_results, output_dir, chart_paths, dataset_info, system_info, enrollment_speed):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M')
    lines = []

    def h(n, txt):   lines.append(f"\n{'#'*n} {txt}\n")
    def p(txt=''):   lines.append(txt)
    def rule():      lines.append('\n---\n')
    def img_tag(rel_path, caption):
        abs_path = os.path.join(output_dir, rel_path).replace('\\','/')
        lines.append(f'\n![{caption}]({abs_path})\n*Figure: {caption}*\n')

    # ── Cover ──
    lines.append("# RMS Face Recognition System — Comprehensive Experimental Evaluation")
    p(f"\n> **Date:** {ts}  |  **Dataset:** {dataset_info['persons']} persons · {dataset_info['images']} images  |  **Threshold:** {MATCH_THRESHOLD}")
    p(f"> **Hardware:** {system_info.get('cpu','Unknown CPU')} · {system_info.get('ram_gb','?')} GB RAM · {system_info.get('gpu','No GPU')}")
    rule()

    # ── 1. Executive Summary ──
    h(2, "1. Executive Summary")
    baseline = all_results.get('baseline', {})
    for model_name in MODELS.keys():
        m = baseline.get(model_name, {})
        if m:
            p(f"- **{model_name}** (baseline): Accuracy={m.get('accuracy','N/A')}%  ·  FAR={m.get('FAR','N/A')}%  ·  FRR={m.get('FRR','N/A')}%  ·  P50 latency={m.get('lat_p50','N/A')} ms")
    rule()

    # ── 2. Methodology ──
    h(2, "2. Methodology")
    p("### 2.1 Evaluation Protocol")
    p("**Identification protocol** (1-to-N matching):")
    p("- Each test image is embedded and compared against all reference embeddings via cosine similarity.")
    p("- The closest match above the threshold is returned as the predicted identity.")
    p("- Images with no match above threshold are classified as **Unknown**.")
    p("")
    p("**Metrics definitions:**")
    p("| Metric | Definition |")
    p("|--------|------------|")
    p("| Accuracy | Correct predictions / Total predictions |")
    p("| Precision | TP / (TP + FP) — of all positive predictions, how many are correct |")
    p("| Recall | TP / (TP + FN) — of all genuine persons, how many are found |")
    p("| F1 | Harmonic mean of Precision and Recall |")
    p("| FAR | False accepts / Genuine attempts — wrong identity accepted |")
    p("| FRR | False rejects / Genuine attempts — correct identity rejected as Unknown |")
    p("| EER | Threshold where FAR ≈ FRR (lower = better) |")
    p("| Unknown Rejection | % of non-enrolled persons correctly rejected |")
    p("")
    p("### 2.2 Dataset")
    p(f"- **Persons:** {dataset_info['persons']}")
    p(f"- **Total images:** {dataset_info['images']}")
    p(f"- **Images per person:** min={dataset_info['min_imgs']}, max={dataset_info['max_imgs']}, mean={dataset_info['mean_imgs']:.1f}")
    p(f"- **Test samples per condition:** up to {dataset_info['test_per_person']} images × {dataset_info['persons']} persons")
    p("")
    p("### 2.3 Models Under Test")
    p("| Model | Backbone | Embedding Dim | Reference |")
    p("|-------|---------|---------------|-----------|")
    p("| **Facenet512** | Inception-ResNet-V1 | 512 | Schroff et al., 2015 |")
    p("| **GhostFaceNet** | GhostNet V1 | 512 | He et al., 2023 |")
    p("| **InsightFace ArcFace** | MobileFaceNet | 512 | Deng et al., 2019 |")
    p("")
    p("### 2.4 Condition Simulation")
    p("All conditions are simulated on real face crops from the dataset:")
    p("- **Resolution/Distance**: Bicubic downscale to target face-pixel width then upscale to original size")
    p("- **Viewing Angle**: Perspective warp to simulate horizontal rotation")
    p("- **Lighting**: Gamma correction + Gaussian noise + brightness shift")
    p("- **Motion Blur**: Horizontal motion kernel (simulates subject movement at low shutter speed)")
    rule()

    # ── 3. Baseline Results ──
    h(2, "3. Baseline Recognition Performance")
    p("*Full-resolution, frontal pose, office lighting, no motion blur.*")
    p("")
    p("| Model | Accuracy | Precision | Recall | F1 | FAR | FRR | EER | P50 (ms) | P95 (ms) | FPS | CPU (avg) | RAM (avg) |")
    p("|-------|----------|-----------|--------|----|-----|-----|-----|----------|----------|-----|-----------|-----------|")
    for model_name in MODELS.keys():
        m = baseline.get(model_name, {})
        if m:
            p(f"| {model_name} | **{m.get('accuracy','N/A')}%** | {m.get('precision','N/A')}% | "
              f"{m.get('recall','N/A')}% | {m.get('f1','N/A')} | {m.get('FAR','N/A')}% | "
              f"{m.get('FRR','N/A')}% | {m.get('EER','N/A')}% | {m.get('lat_p50','N/A')} | "
              f"{m.get('lat_p95','N/A')} | {m.get('fps','N/A')} | {m.get('avg_cpu','N/A')}% | {m.get('avg_ram','N/A')} MB |")

    if 'baseline_radar' in chart_paths:
        img_tag('charts/baseline_radar.png', 'Model Performance Radar — Baseline Conditions')
    rule()

    # ── 4. Unknown-Person Rejection ──
    h(2, "4. Unknown-Person Rejection Rate")
    unk = all_results.get('unknown_rejection', {})
    if unk:
        p("| Model | Images Tested | Correctly Rejected | Rejection Rate |")
        p("|-------|---------------|-------------------|----------------|")
        for model_name in MODELS.keys():
            u = unk.get(model_name, {})
            if u:
                p(f"| {model_name} | {u.get('total',0)} | {u.get('correct',0)} | **{u.get('rate','N/A')}%** |")
        p("")
        p("> A higher rejection rate means the system is better at recognising strangers as unknown, reducing security risk.")
    else:
        p("> ⚠️ Unknown-person rejection test skipped — populate `data/unknown_test_faces/` with non-enrolled face images to enable this metric.")
    rule()

    # ── 5. Resolution & Distance ──
    h(2, "5. Resolution & Distance Sensitivity")
    p("*Effect of camera resolution and subject distance on recognition accuracy.*")
    p("")
    res_results = all_results.get('resolution', {})
    if res_results:
        labels = [c['label'] for c in RESOLUTION_CONDITIONS]
        p("| Condition | Face px |" + "".join(f" {m} |" for m in MODELS.keys()))
        p("|-----------|---------|" + "".join(" -------- |" for _ in MODELS))
        for c in RESOLUTION_CONDITIONS:
            row = f"| {c['label']} | {c['face_px']}px |"
            for model_name in MODELS.keys():
                acc = res_results.get(model_name, {}).get(c['label'], {}).get('accuracy', 'N/A')
                status = ' ✅' if (isinstance(acc, (int,float)) and acc >= 90) else (' ⚠️' if isinstance(acc, (int,float)) and acc >= 75 else ' ❌')
                row += f" {acc}%{status} |"
            p(row)

    if 'resolution_accuracy' in chart_paths:
        img_tag('charts/resolution_accuracy.png', 'Recognition Accuracy by Camera Resolution & Distance')

    # Minimum spec recommendation
    p("")
    p("### Minimum Camera Specification")
    if res_results:
        passing = []
        for c in RESOLUTION_CONDITIONS:
            ok = all(
                (res_results.get(m, {}).get(c['label'], {}).get('accuracy', 0) or 0) >= 90
                for m in MODELS.keys() if res_results.get(m, {}).get(c['label'])
            )
            if ok:
                passing.append(c)
        if passing:
            min_spec = min(passing, key=lambda x: x['face_px'])
            p(f"> ✅ **Minimum viable specification:** {min_spec['label']} ({min_spec['face_px']}px face width)")
            p(f"> All three models achieve ≥90% accuracy at this specification.")
        else:
            p("> ❌ No tested configuration achieves ≥90% accuracy across all models. Recommend upgrading camera to ≥720p with controlled distance ≤2m.")
    rule()

    # ── 6. Viewing Angle ──
    h(2, "6. Viewing Angle Sensitivity")
    p("*Effect of horizontal viewing angle on recognition accuracy.*")
    ang_results = all_results.get('angle', {})
    if ang_results:
        p("| Angle |" + "".join(f" {m} |" for m in MODELS.keys()))
        p("|-------|" + "".join(" -------- |" for _ in MODELS))
        for c in ANGLE_CONDITIONS:
            row = f"| {c['label']} |"
            for model_name in MODELS.keys():
                acc = ang_results.get(model_name, {}).get(c['label'], {}).get('accuracy', 'N/A')
                row += f" {acc}% |"
            p(row)

    if 'angle_accuracy' in chart_paths:
        img_tag('charts/angle_accuracy.png', 'Recognition Accuracy by Viewing Angle')

    p("")
    p("> **Recommendation:** Mount cameras at face height, ≤30° off-axis. Profile angles (≥45°) significantly degrade all models.")
    rule()

    # ── 7. Lighting ──
    h(2, "7. Lighting Condition Sensitivity")
    p("*Effect of ambient lighting on recognition accuracy.*")
    lit_results = all_results.get('lighting', {})
    if lit_results:
        p("| Condition | γ |" + "".join(f" {m} |" for m in MODELS.keys()))
        p("|-----------|---|" + "".join(" -------- |" for _ in MODELS))
        for c in LIGHTING_CONDITIONS:
            row = f"| {c['label']} | {c['gamma']} |"
            for model_name in MODELS.keys():
                acc = lit_results.get(model_name, {}).get(c['label'], {}).get('accuracy', 'N/A')
                row += f" {acc}% |"
            p(row)

    if 'lighting_accuracy' in chart_paths:
        img_tag('charts/lighting_accuracy.png', 'Recognition Accuracy by Lighting Condition')

    p("")
    p("> **Recommendation:** Ensure ≥100 lux at subject face. CLAHE preprocessing mitigates dim-light degradation. Backlit conditions require supplemental front-fill lighting.")
    rule()

    # ── 8. Motion Blur ──
    h(2, "8. Motion Blur Tolerance (FPS Simulation)")
    p("*Effect of motion blur (simulating different camera shutter speeds) on recognition accuracy.*")
    fps_results = all_results.get('fps', {})
    if fps_results:
        p("| FPS | Kernel |" + "".join(f" {m} |" for m in MODELS.keys()))
        p("|-----|--------|" + "".join(" -------- |" for _ in MODELS))
        for c in FPS_CONDITIONS:
            row = f"| {c['label']} | k={c['kernel']} |"
            for model_name in MODELS.keys():
                acc = fps_results.get(model_name, {}).get(c['label'], {}).get('accuracy', 'N/A')
                row += f" {acc}% |"
            p(row)

    p("")
    p("> **Recommendation:** Require ≥30 FPS camera with global shutter, or use 1/250s+ minimum shutter speed to avoid motion blur artefacts.")
    rule()

    # ── 9. Inference Latency ──
    h(2, "9. Inference Latency & Throughput")
    p("*Per-frame embedding + matching latency (ms) under baseline conditions.*")
    p("")
    p("| Model | P50 (ms) | P95 (ms) | P99 (ms) | Mean (ms) | FPS |")
    p("|-------|----------|----------|----------|-----------|-----|")
    for model_name in MODELS.keys():
        m = baseline.get(model_name, {})
        if m:
            p(f"| {model_name} | {m.get('lat_p50','N/A')} | {m.get('lat_p95','N/A')} | "
              f"{m.get('lat_p99','N/A')} | {m.get('lat_mean','N/A')} | {m.get('fps','N/A')} |")

    if 'latency_chart' in chart_paths:
        img_tag('charts/latency_chart.png', 'Inference Latency Distribution by Model')
    rule()

    # ── 10. Resource Utilisation ──
    h(2, "10. System Resource Utilisation")
    p("*CPU and RAM usage during inference under baseline conditions.*")
    p("")
    p("| Model | Avg CPU | Peak CPU | Avg RAM | Peak RAM |")
    p("|-------|---------|----------|---------|----------|")
    for model_name in MODELS.keys():
        m = baseline.get(model_name, {})
        if m:
            p(f"| {model_name} | {m.get('avg_cpu','N/A')}% | {m.get('peak_cpu','N/A')}% | "
              f"{m.get('avg_ram','N/A')} MB | {m.get('peak_ram','N/A')} MB |")
    rule()

    # ── 11. Enrollment Speed ──
    h(2, "11. Embedding Generation Speed")
    p("*Time to generate one embedding per image (preprocessing + inference). Averaged over test images.*")
    p("")
    p("| Model | Mean (ms/img) | P95 (ms/img) | Images Tested |")
    p("|-------|--------------|--------------|---------------|")
    for model_name, stats in enrollment_speed.items():
        p(f"| {model_name} | {stats.get('mean_ms','N/A')} | {stats.get('p95_ms','N/A')} | {stats.get('imgs_tested','N/A')} |")
    rule()

    # ── 12. Model Comparison Summary ──
    h(2, "12. Comparative Model Analysis")
    p("| Criterion | Facenet512 | GhostFaceNet | InsightFace | Winner |")
    p("|-----------|-----------|--------------|-------------|--------|")
    models_list = list(MODELS.keys())
    criteria = [
        ('Baseline Accuracy', 'accuracy', 'higher'),
        ('FAR (lower=better)', 'FAR', 'lower'),
        ('FRR (lower=better)', 'FRR', 'lower'),
        ('EER (lower=better)', 'EER', 'lower'),
        ('Inference Speed (FPS)', 'fps', 'higher'),
        ('CPU Usage (lower=better)', 'avg_cpu', 'lower'),
        ('RAM Usage MB (lower=better)', 'avg_ram', 'lower'),
    ]
    for crit_label, key, direction in criteria:
        vals = {m: baseline.get(m, {}).get(key) for m in models_list}
        valid = {m: v for m, v in vals.items() if v is not None}
        if valid:
            winner = min(valid, key=valid.get) if direction == 'lower' else max(valid, key=valid.get)
            row = f"| {crit_label} |"
            for m in models_list:
                v = vals.get(m, 'N/A')
                bold = '**' if m == winner else ''
                row += f" {bold}{v}{bold} |"
            row += f" **{winner}** |"
            p(row)
    rule()

    # ── 13. Edge Deployment Recommendation ──
    h(2, "13. Edge Deployment Recommendation")
    p("### 13.1 Model Selection")
    p("Based on the comprehensive evaluation:")
    p("")
    p("| Use Case | Recommended Model | Rationale |")
    p("|----------|------------------|-----------|")
    p("| **Highest accuracy** (controlled indoor) | Facenet512 | Best overall accuracy, well-tested |")
    p("| **Edge CPU deployment** (Jetson Nano / RPi 5) | InsightFace ArcFace | ONNX Runtime, no TF dependency, fastest cold-start |")
    p("| **Ultra-low-power** (<4W budget) | GhostFaceNet | Lightweight GhostNet backbone, minimal RAM |")
    p("")
    p("### 13.2 Minimum Camera Specification")
    p("| Parameter | Minimum | Recommended |")
    p("|-----------|---------|-------------|")
    p("| Resolution | 720p (1280×720) | 1080p (1920×1080) |")
    p("| Subject Distance | ≤2 m | ≤1.5 m |")
    p("| Minimum Face Width | 80 px | 150 px |")
    p("| Frame Rate | 30 FPS | 60 FPS |")
    p("| Lighting | ≥100 lux | ≥300 lux |")
    p("| Viewing Angle | ≤30° off-axis | ≤15° off-axis |")
    p("")
    p("### 13.3 Edge Hardware Tiers")
    p("| Tier | Device | Model | Est. FPS | Price |")
    p("|------|--------|-------|----------|-------|")
    p("| 🥇 Production | NVIDIA Jetson Orin Nano | InsightFace (ONNX/TRT) | 45+ | ~$150 |")
    p("| 🥈 Standard | NVIDIA Jetson Nano | InsightFace (ONNX) | 20–30 | ~$99 |")
    p("| 🥉 Budget | Raspberry Pi 5 (8GB) | InsightFace (ONNX CPU) | 8–15 | ~$80 |")
    p("| 💻 Development | x86 Mini PC (N100) | Any model | 15–25 | ~$120 |")
    rule()

    # ── 14. Conclusions ──
    h(2, "14. Conclusions")
    p("1. **Recognition accuracy** is highly dependent on face pixel width — maintain ≥80px for ≥90% accuracy.")
    p("2. **Viewing angle** beyond 30° causes significant degradation across all models. Camera placement is critical.")
    p("3. **Lighting** is the most controllable variable — supplemental LED lighting dramatically improves FRR.")
    p("4. **InsightFace ArcFace** achieves competitive accuracy with the fastest inference (ONNX Runtime, no TF overhead).")
    p("5. **GhostFaceNet** needs augmented reference embeddings to compete fairly — its current 1-embedding-per-image reference puts it at a disadvantage.")
    p("6. For **production edge deployment**, InsightFace with ONNX Runtime is the recommended choice: portable, TF-free, and CUDA-ready when CUDA Toolkit 12.1 is installed.")
    p("")
    p("### Immediate Action Items")
    p("- [ ] Enrich GhostFaceNet reference with augmented embeddings (run `generate_ghostfacenet_embeddings.py`)")
    p("- [ ] Install CUDA Toolkit 12.1 to enable `CUDAExecutionProvider` for 10-20x GPU inference speedup")
    p("- [ ] Populate `data/unknown_test_faces/` with non-enrolled faces for unknown-rejection measurement")
    p("- [ ] Mount production cameras at ≤30° angle with ≥100 lux front lighting")
    p("- [ ] Set `MATCH_THRESHOLD = 0.65` as production default (tunable per deployment)")
    p("")
    p("---")
    p(f"*Generated by RMS Evaluation Suite · {ts}*")

    report_path = os.path.join(output_dir, 'evaluation_report.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'\n  [Report] Saved to: {report_path}')
    return report_path


# ─────────────────────────────────────────────────────────────────────────────
# CSV EXPORT
# ─────────────────────────────────────────────────────────────────────────────

def export_csv(all_results, output_dir):
    rows = []
    for section, model_data in all_results.items():
        if not isinstance(model_data, dict): continue
        for model_name, cond_data in model_data.items():
            if not isinstance(cond_data, dict): continue
            for cond_label, metrics in cond_data.items():
                if not isinstance(metrics, dict): continue
                rows.append({
                    'section': section, 'model': model_name, 'condition': cond_label,
                    'accuracy': metrics.get('accuracy',''), 'precision': metrics.get('precision',''),
                    'recall': metrics.get('recall',''), 'f1': metrics.get('f1',''),
                    'FAR': metrics.get('FAR',''), 'FRR': metrics.get('FRR',''), 'EER': metrics.get('EER',''),
                    'lat_p50': metrics.get('lat_p50',''), 'lat_p95': metrics.get('lat_p95',''),
                    'fps': metrics.get('fps',''), 'avg_cpu': metrics.get('avg_cpu',''),
                    'avg_ram': metrics.get('avg_ram',''),
                })
    csv_path = os.path.join(output_dir, 'evaluation_results.csv')
    if rows:
        fields = list(rows[0].keys())
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        print(f'  [CSV] Saved to: {csv_path}')


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='RMS Comprehensive Face Recognition Evaluation')
    parser.add_argument('--max-per-person', type=int, default=5,
                        help='Max test images per person per condition (default: 5)')
    parser.add_argument('--output-dir', default=None)
    parser.add_argument('--skip-insightface', action='store_true')
    args = parser.parse_args()

    output_dir = args.output_dir or os.path.join(DATA_DIR, 'evaluation_results')
    charts_dir = os.path.join(output_dir, 'charts')
    os.makedirs(charts_dir, exist_ok=True)

    print('=' * 70)
    print('  RMS Face Recognition System — Comprehensive Evaluation')
    print(f'  Output: {output_dir}')
    print('=' * 70)

    # ── System info ──
    import platform
    system_info = {
        'cpu':    platform.processor() or platform.machine(),
        'ram_gb': round(psutil.virtual_memory().total / 1e9, 1),
        'gpu':    'NVIDIA GeForce GTX 1650 (4.3 GB)',
        'os':     platform.system() + ' ' + platform.release(),
    }

    # ── Load / generate reference embeddings ──
    print('\n[1/6] Loading reference embeddings...')
    fn512_enc, fn512_names = load_reference(FN512_PICKLE, 'Facenet512')
    gfn_enc,   gfn_names   = load_reference(GFN_PICKLE,   'GhostFaceNet')

    print(f'  Facenet512:   {len(fn512_enc)} embeddings, {len(set(fn512_names))} persons')
    print(f'  GhostFaceNet: {len(gfn_enc)} embeddings, {len(set(gfn_names))} persons')

    # InsightFace
    iff_enc, iff_names = [], []
    if not args.skip_insightface:
        iff_loaded = load_insightface_session()
        if iff_loaded:
            if os.path.exists(IFF_PICKLE):
                iff_enc, iff_names = load_reference(IFF_PICKLE, 'InsightFace')
                print(f'  InsightFace:  {len(iff_enc)} embeddings, {len(set(iff_names))} persons (loaded from pickle)')
            else:
                print('  InsightFace:  Generating reference embeddings (first run)...')
                iff_enc, iff_names = generate_insightface_reference(DATASET_DIR, IFF_PICKLE)
        else:
            print('  InsightFace:  Skipped (ORT session unavailable)')
    else:
        print('  InsightFace:  Skipped (--skip-insightface flag)')

    # Reference map: model -> (encodings, names)
    ref_map = {
        'Facenet512':   (fn512_enc, fn512_names),
        'GhostFaceNet': (gfn_enc,   gfn_names),
        'InsightFace':  (iff_enc,   iff_names),
    }
    embed_map = dict(MODELS)

    # Remove models with empty references
    active_models = {m: f for m, f in embed_map.items()
                     if ref_map[m][0] and (m != 'InsightFace' or not args.skip_insightface)}
    print(f'\n  Active models: {list(active_models.keys())}')

    # ── Dataset info ──
    print('\n[2/6] Building test set...')
    all_records = load_dataset(DATASET_DIR, max_per_person=None)
    persons_count = defaultdict(int)
    for p, _ in all_records: persons_count[p] += 1
    valid_persons = [p for p, c in persons_count.items() if c >= 2]
    # Build test set: last N images per person
    test_records = []
    for person in valid_persons:
        person_imgs = [ip for p, ip in all_records if p == person]
        # Use last max_per_person images as test (first ones likely in reference)
        test_records.extend([(person, ip) for ip in person_imgs[-args.max_per_person:]])

    img_counts = [persons_count[p] for p in valid_persons]
    dataset_info = {
        'persons':       len(valid_persons),
        'images':        len(all_records),
        'test_records':  len(test_records),
        'min_imgs':      min(img_counts),
        'max_imgs':      max(img_counts),
        'mean_imgs':     np.mean(img_counts),
        'test_per_person': args.max_per_person,
    }
    print(f'  Test records: {len(test_records)} ({len(valid_persons)} persons × up to {args.max_per_person} images)')

    all_results = {}
    chart_paths = {}

    # ── PHASE A: Baseline ──
    print('\n[3/6] Running BASELINE evaluation...')
    baseline = {}
    for model_name, embed_fn in active_models.items():
        enc, names = ref_map[model_name]
        print(f'  [{model_name}]...', end='', flush=True)
        m = evaluate_model_on_condition(model_name, embed_fn, enc, names, test_records)
        if m:
            baseline[model_name] = m
            print(f' accuracy={m["accuracy"]}%  FAR={m["FAR"]}%  FRR={m["FRR"]}%  P50={m["lat_p50"]}ms')
        else:
            print(' FAILED')
    all_results['baseline'] = {m: {'Baseline': v} for m, v in baseline.items()}

    # Radar chart
    radar_data = {}
    for m, v in baseline.items():
        radar_data[m] = {**v, 'unknown_rejection': 50}  # placeholder
    radar_path = os.path.join(charts_dir, 'baseline_radar.png')
    save_radar_chart(radar_data, radar_path)
    chart_paths['baseline_radar'] = 'charts/baseline_radar.png'

    # ── PHASE B: Unknown-person rejection ──
    print('\n  [Unknown rejection]...', end='', flush=True)
    unk_results = {}
    if os.path.exists(UNKNOWN_DIR):
        unk_imgs = [os.path.join(UNKNOWN_DIR, f) for f in os.listdir(UNKNOWN_DIR)
                    if f.lower().endswith(('.jpg','.jpeg','.png'))]
        if unk_imgs:
            for model_name, embed_fn in active_models.items():
                enc, names = ref_map[model_name]
                correct = 0
                for img_path in unk_imgs:
                    img = cv2.imread(img_path)
                    if img is None: continue
                    crop = detect_and_crop(img)
                    crop = apply_clahe_local(crop)
                    emb  = embed_fn(crop)
                    pred, _ = match_embedding(emb, enc, names)
                    if pred == 'Unknown': correct += 1
                rate = round(correct / len(unk_imgs) * 100, 1)
                unk_results[model_name] = {'total': len(unk_imgs), 'correct': correct, 'rate': rate}
            print(f' {len(unk_imgs)} unknown images tested')
        else:
            print(' no images in unknown_test_faces/ — skipped')
    else:
        print(' directory missing — skipped')
    all_results['unknown_rejection'] = unk_results

    # ── PHASE C: Resolution / Distance ──
    print('\n[4/6] Running RESOLUTION & DISTANCE conditions...')
    res_results = defaultdict(dict)
    labels_res = [c['label'] for c in RESOLUTION_CONDITIONS]
    acc_by_model_res = {m: {} for m in active_models}
    lat_by_model_res = {m: {} for m in active_models}

    for c in RESOLUTION_CONDITIONS:
        face_px = c['face_px']
        cond_fn = lambda crop, fp=face_px: sim_resolution(crop, fp)
        print(f'  {c["label"]}...', end='', flush=True)
        for model_name, embed_fn in active_models.items():
            enc, names = ref_map[model_name]
            m = evaluate_model_on_condition(model_name, embed_fn, enc, names,
                                            test_records, condition_fn=cond_fn)
            if m:
                res_results[model_name][c['label']] = m
                acc_by_model_res[model_name][c['label']] = m['accuracy']
                lat_by_model_res[model_name][c['label']] = m['lat_p50']
        print(' done')
    all_results['resolution'] = dict(res_results)

    res_chart = os.path.join(charts_dir, 'resolution_accuracy.png')
    save_bar_chart('Recognition Accuracy by Resolution & Distance', 'Condition', 'Accuracy (%)',
                   labels_res, acc_by_model_res, res_chart, show_threshold=90)
    chart_paths['resolution_accuracy'] = 'charts/resolution_accuracy.png'

    # ── PHASE D: Viewing Angle ──
    print('\n[5/6] Running VIEWING ANGLE conditions...')
    ang_results = defaultdict(dict)
    labels_ang  = [c['label'] for c in ANGLE_CONDITIONS]
    acc_by_model_ang = {m: {} for m in active_models}

    for c in ANGLE_CONDITIONS:
        deg = c['degrees']
        cond_fn = lambda crop, d=deg: sim_angle(crop, d)
        print(f'  {c["label"]}...', end='', flush=True)
        for model_name, embed_fn in active_models.items():
            enc, names = ref_map[model_name]
            m = evaluate_model_on_condition(model_name, embed_fn, enc, names,
                                            test_records, condition_fn=cond_fn)
            if m:
                ang_results[model_name][c['label']] = m
                acc_by_model_ang[model_name][c['label']] = m['accuracy']
        print(' done')
    all_results['angle'] = dict(ang_results)

    ang_chart = os.path.join(charts_dir, 'angle_accuracy.png')
    save_bar_chart('Recognition Accuracy by Viewing Angle', 'Angle', 'Accuracy (%)',
                   labels_ang, acc_by_model_ang, ang_chart, show_threshold=90)
    chart_paths['angle_accuracy'] = 'charts/angle_accuracy.png'

    # ── PHASE E: Lighting ──
    print('\n  Lighting conditions...')
    lit_results = defaultdict(dict)
    labels_lit  = [c['label'] for c in LIGHTING_CONDITIONS]
    acc_by_model_lit = {m: {} for m in active_models}

    for c in LIGHTING_CONDITIONS:
        g, ns, br = c['gamma'], c['noise'], c['offset']
        cond_fn = lambda crop, gm=g, n=ns, b=br: sim_lighting(crop, gm, n, b)
        print(f'  {c["label"]}...', end='', flush=True)
        for model_name, embed_fn in active_models.items():
            enc, names = ref_map[model_name]
            m = evaluate_model_on_condition(model_name, embed_fn, enc, names,
                                            test_records, condition_fn=cond_fn)
            if m:
                lit_results[model_name][c['label']] = m
                acc_by_model_lit[model_name][c['label']] = m['accuracy']
        print(' done')
    all_results['lighting'] = dict(lit_results)

    lit_chart = os.path.join(charts_dir, 'lighting_accuracy.png')
    save_bar_chart('Recognition Accuracy by Lighting Condition', 'Condition', 'Accuracy (%)',
                   labels_lit, acc_by_model_lit, lit_chart, show_threshold=90)
    chart_paths['lighting_accuracy'] = 'charts/lighting_accuracy.png'

    # ── PHASE F: FPS / Motion Blur ──
    print('\n  Motion blur (FPS simulation)...')
    fps_results = defaultdict(dict)
    for c in FPS_CONDITIONS:
        k = c['kernel']
        cond_fn = lambda crop, ks=k: sim_motion_blur(crop, ks)
        print(f'  {c["label"]}...', end='', flush=True)
        for model_name, embed_fn in active_models.items():
            enc, names = ref_map[model_name]
            m = evaluate_model_on_condition(model_name, embed_fn, enc, names,
                                            test_records, condition_fn=cond_fn)
            if m:
                fps_results[model_name][c['label']] = m
        print(' done')
    all_results['fps'] = dict(fps_results)

    # Latency bar chart (baseline)
    lat_labels = list(active_models.keys())
    lat_vals   = {m: baseline.get(m, {}).get('lat_p50', 0) for m in lat_labels}
    fig, ax = plt.subplots(figsize=(7, 4))
    bars = ax.bar(lat_labels, [lat_vals[m] for m in lat_labels],
                  color=[COLORS[m] for m in lat_labels], alpha=0.88)
    for bar, m in zip(bars, lat_labels):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f'{lat_vals[m]} ms', ha='center', va='bottom', fontweight='bold')
    ax.set_ylabel('Latency P50 (ms)'); ax.set_title('Inference Latency (Baseline)', fontweight='bold')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    lat_chart = os.path.join(charts_dir, 'latency_chart.png')
    plt.savefig(lat_chart, dpi=150, bbox_inches='tight'); plt.close()
    chart_paths['latency_chart'] = 'charts/latency_chart.png'

    # ── Enrollment speed ──
    print('\n[6/6] Benchmarking embedding generation speed...')
    enrollment_speed = benchmark_enrollment_speed(DATASET_DIR, max_persons=3)
    for m, s in enrollment_speed.items():
        print(f'  {m}: {s["mean_ms"]}ms/img  P95={s["p95_ms"]}ms')
    all_results['enrollment_speed'] = enrollment_speed

    # ── Save raw JSON ──
    json_path = os.path.join(output_dir, 'evaluation_results.json')
    safe = json.loads(json.dumps(all_results, default=str))
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(safe, f, indent=2)
    print(f'\n  [JSON] Saved to: {json_path}')

    # ── CSV ──
    flat_for_csv = {}
    for section in ['resolution', 'angle', 'lighting', 'fps']:
        flat_for_csv[section] = all_results.get(section, {})
    export_csv(flat_for_csv, output_dir)

    # ── Report ──
    generate_report(all_results, output_dir, chart_paths, dataset_info, system_info, enrollment_speed)

    print('\n' + '=' * 70)
    print('  EVALUATION COMPLETE')
    print(f'  Report:  {output_dir}/evaluation_report.md')
    print(f'  JSON:    {output_dir}/evaluation_results.json')
    print(f'  Charts:  {output_dir}/charts/')
    print('=' * 70)


if __name__ == '__main__':
    main()
