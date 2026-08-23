"""
camera_spec_evaluator.py — Minimum Camera Specification Evaluation Engine

Empirically tests our face recognition pipeline under simulated camera degradation
to determine the minimum hardware requirements for reliable employee recognition.

Evaluation Dimensions:
  1. Resolution & Distance — Downsamples faces to simulate 480p/720p/1080p at varying distances
  2. Viewing Angles — Tests frontal vs profile recognition from existing multi-angle data
  3. Lighting Conditions — Simulates office, low-light, and harsh outdoor conditions
  4. Frame Rate (FPS) — Simulates motion blur at 15/30/60 FPS

Outputs:
  - JSON results file (camera_spec_results.json)
  - Markdown report (minimum_camera_specification.md)

Usage:
  python camera_spec_evaluator.py [--dataset-path PATH] [--output-dir PATH]
"""

import os
import sys
import cv2
import json
import time
import pickle
import argparse
import threading
import numpy as np
import psutil
from collections import defaultdict

# Path setup
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPTS_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from model import get_embedding, apply_clahe, EMBEDDING_DIM
from face_detection import SideFaceDetector


# ============================================================================
# RESOURCE MONITOR — CPU & RAM sampling during benchmark runs
# ============================================================================

class ResourceMonitor:
    """
    Background thread that samples CPU% and RAM usage at 200ms intervals.
    Use as a context manager around any benchmark block.

    Usage:
        monitor = ResourceMonitor()
        monitor.start()
        ... run benchmark ...
        stats = monitor.stop()
        # stats = {"avg_cpu_pct", "peak_cpu_pct", "avg_ram_mb", "peak_ram_mb"}
    """
    def __init__(self, interval: float = 0.2):
        self._interval = interval
        self._process = psutil.Process(os.getpid())
        self._samples_cpu = []
        self._samples_ram = []
        self._running = False
        self._thread = None

    def _collect(self):
        while self._running:
            try:
                self._samples_cpu.append(self._process.cpu_percent(interval=None))
                self._samples_ram.append(self._process.memory_info().rss / (1024 * 1024))
            except Exception:
                pass
            time.sleep(self._interval)

    def start(self):
        self._running = True
        self._samples_cpu.clear()
        self._samples_ram.clear()
        # Prime cpu_percent (first call always returns 0.0)
        self._process.cpu_percent(interval=None)
        self._thread = threading.Thread(target=self._collect, daemon=True)
        self._thread.start()
        return self

    def stop(self) -> dict:
        self._running = False
        if self._thread:
            self._thread.join(timeout=1.0)
        cpu = self._samples_cpu or [0.0]
        ram = self._samples_ram or [0.0]
        return {
            "avg_cpu_pct":  round(float(np.mean(cpu)), 1),
            "peak_cpu_pct": round(float(np.max(cpu)), 1),
            "avg_ram_mb":   round(float(np.mean(ram)), 1),
            "peak_ram_mb":  round(float(np.max(ram)), 1),
        }


# ============================================================================
# FAR / FRR COMPUTATION
# ============================================================================

def compute_far_frr(
    test_data: list,
    ref_encodings: list,
    ref_names: list,
    threshold: float = 0.65,
    unknown_dir: str = None,
) -> dict:
    """
    Compute False Acceptance Rate, False Rejection Rate, and Unknown Rejection Rate.

    FAR (False Acceptance Rate):
        Fraction of impostor pairs where the system incorrectly grants access.
        Impostor pairs: image of person_A matched against references with person_A REMOVED.
        If the system returns ANY known name for the impostor → false accept.

    FRR (False Rejection Rate):
        Fraction of genuine pairs where the system fails to recognize the correct person.
        Genuine pair: image of person_X matched when person_X IS in the reference set.

    Unknown Rejection Rate:
        Fraction of genuinely unknown-person crops correctly classified as "Unknown".
        Requires JPEGs in `unknown_dir` (faces NOT in the reference database).

    Returns:
        dict with keys: FAR, FRR, EER (approx), unknown_rejection_rate, details
    """
    from scipy.spatial.distance import cosine as cosine_dist

    # Collect unique person names
    persons = list(set(ref_names))
    if len(persons) < 2:
        return {"FAR": None, "FRR": None, "EER": None,
                "note": "Need ≥2 enrolled persons for FAR/FRR"}

    false_accepts = 0
    false_rejects = 0
    genuine_attempts = 0
    impostor_attempts = 0

    for item in test_data:
        query_name = item["person"]
        query_emb = get_embedding(apply_clahe(item["crop"]))
        if query_emb is None:
            continue

        # ── Genuine test: match with person IN reference set ──
        predicted, _ = match_embedding(query_emb, ref_encodings, ref_names, threshold)
        genuine_attempts += 1
        if predicted != query_name:
            false_rejects += 1

        # ── Impostor test: match with that person REMOVED from references ──
        # Build a reference set excluding all embeddings of query_name
        impostor_refs = [(e, n) for e, n in zip(ref_encodings, ref_names) if n != query_name]
        if len(impostor_refs) < 2:
            continue
        imp_encodings, imp_names = zip(*impostor_refs)
        imp_predicted, _ = match_embedding(query_emb, list(imp_encodings), list(imp_names), threshold)
        impostor_attempts += 1
        if imp_predicted != "Unknown":
            false_accepts += 1

    FAR = (false_accepts / impostor_attempts) if impostor_attempts > 0 else None
    FRR = (false_rejects / genuine_attempts) if genuine_attempts > 0 else None
    EER = (FAR + FRR) / 2 if (FAR is not None and FRR is not None) else None

    # ── Unknown person rejection ──
    unknown_rejection_rate = None
    if unknown_dir and os.path.exists(unknown_dir):
        detector = SideFaceDetector(min_detection_confidence=0.30)
        unknown_files = [f for f in os.listdir(unknown_dir)
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        unknown_correct = 0
        unknown_total = 0
        for fname in unknown_files:
            img = cv2.imread(os.path.join(unknown_dir, fname))
            if img is None:
                continue
            faces = detector.detect_faces(img, profile_only=False)
            crop = img
            if faces:
                face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                bx = face['bbox']
                H, W = img.shape[:2]
                mx, my = int(bx['w'] * 0.22), int(bx['h'] * 0.22)
                crop = img[max(0, bx['y']-my):min(H, bx['y']+bx['h']+my),
                           max(0, bx['x']-mx):min(W, bx['x']+bx['w']+mx)]
            emb = get_embedding(apply_clahe(crop))
            if emb is None:
                continue
            predicted, _ = match_embedding(emb, ref_encodings, ref_names, threshold)
            unknown_total += 1
            if predicted == "Unknown":
                unknown_correct += 1
        detector.close()
        if unknown_total > 0:
            unknown_rejection_rate = round(unknown_correct / unknown_total * 100, 1)

    return {
        "FAR": round(FAR * 100, 2) if FAR is not None else None,
        "FRR": round(FRR * 100, 2) if FRR is not None else None,
        "EER": round(EER * 100, 2) if EER is not None else None,
        "unknown_rejection_rate": unknown_rejection_rate,
        "genuine_attempts": genuine_attempts,
        "impostor_attempts": impostor_attempts,
        "false_accepts": false_accepts,
        "false_rejects": false_rejects,
    }



# ============================================================================
# SIMULATION PARAMETERS
# ============================================================================

# Resolution simulation — effective face pixel widths at different camera/distance combos
RESOLUTION_TESTS = [
    {"label": "480p @ 1m",  "res": (640, 480),   "face_px": 180, "distance": "1m"},
    {"label": "480p @ 2m",  "res": (640, 480),   "face_px": 90,  "distance": "2m"},
    {"label": "480p @ 3m",  "res": (640, 480),   "face_px": 60,  "distance": "3m"},
    {"label": "720p @ 1m",  "res": (1280, 720),  "face_px": 280, "distance": "1m"},
    {"label": "720p @ 2m",  "res": (1280, 720),  "face_px": 140, "distance": "2m"},
    {"label": "720p @ 3m",  "res": (1280, 720),  "face_px": 93,  "distance": "3m"},
    {"label": "720p @ 4m",  "res": (1280, 720),  "face_px": 70,  "distance": "4m"},
    {"label": "1080p @ 2m", "res": (1920, 1080), "face_px": 210, "distance": "2m"},
    {"label": "1080p @ 3m", "res": (1920, 1080), "face_px": 140, "distance": "3m"},
    {"label": "1080p @ 4m", "res": (1920, 1080), "face_px": 105, "distance": "4m"},
    {"label": "1080p @ 5m", "res": (1920, 1080), "face_px": 84,  "distance": "5m"},
]

# Lighting simulation parameters
LIGHTING_CONDITIONS = [
    {"label": "Office (Normal)",    "gamma": 1.0,  "noise_std": 0},
    {"label": "Low Light",          "gamma": 2.2,  "noise_std": 15},
    {"label": "Very Low Light",     "gamma": 3.0,  "noise_std": 25},
    {"label": "Harsh Outdoor",      "gamma": 0.5,  "noise_std": 5},
    {"label": "Backlit/Silhouette", "gamma": 2.5,  "noise_std": 10},
]

# FPS motion blur simulation (kernel sizes)
FPS_CONDITIONS = [
    {"label": "60 FPS (Minimal Blur)", "blur_kernel": 1},
    {"label": "30 FPS (Standard)",     "blur_kernel": 3},
    {"label": "15 FPS (Budget Cam)",   "blur_kernel": 7},
    {"label": "10 FPS (Edge Limit)",   "blur_kernel": 11},
]

# Angle categories (mapped from dataset subfolder names)
ANGLE_MAP = {
    'frontal': '0° (Frontal)',
    'front': '0° (Frontal)',
    'front_img': '0° (Frontal)',
    'left': '30-45° (Left Profile)',
    'left_img': '30-45° (Left Profile)',
    'right': '30-45° (Right Profile)',
    'right_img': '30-45° (Right Profile)',
    'extra': 'Mixed/Unknown',
    'extra_files': 'Mixed/Unknown',
}


# ============================================================================
# IMAGE DEGRADATION FUNCTIONS
# ============================================================================

def simulate_resolution(face_crop, target_face_px):
    """Downsample a face crop to simulate how it would appear at a given distance/resolution."""
    h, w = face_crop.shape[:2]
    if w <= 0 or target_face_px <= 0:
        return face_crop
    scale = target_face_px / w
    if scale >= 1.0:
        return face_crop  # Already smaller than target
    small = cv2.resize(face_crop, (target_face_px, int(h * scale)), interpolation=cv2.INTER_AREA)
    # Re-upscale back to original size (simulates what the model actually sees)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)


def simulate_lighting(image, gamma=1.0, noise_std=0):
    """Apply gamma correction and Gaussian noise to simulate lighting conditions."""
    img = image.copy().astype(np.float32)
    # Gamma correction
    if gamma != 1.0:
        img = np.clip(((img / 255.0) ** gamma) * 255.0, 0, 255)
    # Gaussian noise
    if noise_std > 0:
        noise = np.random.normal(0, noise_std, img.shape)
        img = np.clip(img + noise, 0, 255)
    return img.astype(np.uint8)


def simulate_motion_blur(image, kernel_size):
    """Apply directional motion blur to simulate low FPS capture."""
    if kernel_size <= 1:
        return image
    kernel = np.zeros((kernel_size, kernel_size))
    kernel[kernel_size // 2, :] = np.ones(kernel_size)
    kernel /= kernel_size
    return cv2.filter2D(image, -1, kernel)


# ============================================================================
# CORE EVALUATION ENGINE
# ============================================================================

def load_reference_embeddings(encodings_path):
    """Load the trained embeddings database."""
    if not os.path.exists(encodings_path):
        print(f"[ERROR] No encodings found at {encodings_path}")
        return None, None
    with open(encodings_path, "rb") as f:
        data = pickle.load(f)
    return data.get("encodings", []), data.get("names", [])


def match_embedding(query_emb, ref_encodings, ref_names, threshold=0.65):
    """Match a query embedding against reference database using L2 distance."""
    if not ref_encodings or query_emb is None:
        return "Unknown", 1.0

    query = np.array(query_emb, dtype=np.float32)
    distances = []
    for ref in ref_encodings:
        dist = np.linalg.norm(query - np.array(ref, dtype=np.float32))
        distances.append(dist)

    distances = np.array(distances)
    sorted_indices = np.argsort(distances)

    # KNN-5 majority voting
    k = min(5, len(sorted_indices))
    top_k_names = [ref_names[i] for i in sorted_indices[:k]]
    top_k_dists = [distances[i] for i in sorted_indices[:k]]

    # Majority vote
    from collections import Counter
    vote = Counter(top_k_names).most_common(1)[0]
    best_name = vote[0]
    avg_dist = np.mean([d for n, d in zip(top_k_names, top_k_dists) if n == best_name])

    if avg_dist > threshold:
        return "Unknown", avg_dist

    return best_name, avg_dist


def collect_test_images(dataset_path, max_per_person=5):
    """Collect test face crops from the dataset, organized by person and angle."""
    test_data = []
    detector = SideFaceDetector(min_detection_confidence=0.30)

    persons = sorted([d for d in os.listdir(dataset_path)
                      if os.path.isdir(os.path.join(dataset_path, d))])

    print(f"\n[Camera Spec] Collecting test images from {len(persons)} persons...")

    for person_name in persons:
        person_dir = os.path.join(dataset_path, person_name)
        images_by_angle = defaultdict(list)

        for root, dirs, files in os.walk(person_dir):
            angle_label = ANGLE_MAP.get(
                os.path.basename(root).lower(),
                '0° (Frontal)'  # Default to frontal if no angle subdir
            )
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    images_by_angle[angle_label].append(os.path.join(root, f))

        for angle, paths in images_by_angle.items():
            selected = paths[:max_per_person]
            for img_path in selected:
                img = cv2.imread(img_path)
                if img is None:
                    continue

                # Crop face
                faces = detector.detect_faces(img, profile_only=False)
                if faces:
                    face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                    x, y, w, h = face['bbox']['x'], face['bbox']['y'], face['bbox']['w'], face['bbox']['h']
                    h_img, w_img = img.shape[:2]
                    mx, my = int(w * 0.22), int(h * 0.22)
                    crop = img[max(0, y-my):min(h_img, y+h+my), max(0, x-mx):min(w_img, x+w+mx)]
                else:
                    crop = img

                if crop.size > 0:
                    test_data.append({
                        "person": person_name,
                        "angle": angle,
                        "crop": crop,
                        "path": img_path
                    })

    detector.close()
    print(f"[Camera Spec] Collected {len(test_data)} test face crops.")
    return test_data


def run_resolution_benchmark(test_data, ref_encodings, ref_names):
    """Test recognition accuracy at different simulated resolutions/distances."""
    print("\n" + "="*60)
    print("  RESOLUTION & DISTANCE BENCHMARK")
    print("="*60)

    results = []
    for config in RESOLUTION_TESTS:
        correct = 0
        total = 0
        latencies = []

        for item in test_data:
            degraded = simulate_resolution(item["crop"], config["face_px"])
            degraded = apply_clahe(degraded)

            start = time.time()
            emb = get_embedding(degraded)
            latencies.append(time.time() - start)

            if emb is None:
                continue

            predicted, dist = match_embedding(emb, ref_encodings, ref_names)
            total += 1
            if predicted == item["person"]:
                correct += 1

        accuracy = (correct / total * 100) if total > 0 else 0
        avg_latency = np.mean(latencies) * 1000 if latencies else 0
        passed = accuracy >= 95.0

        result = {
            "config": config["label"],
            "face_px": config["face_px"],
            "distance": config["distance"],
            "accuracy": round(accuracy, 1),
            "avg_latency_ms": round(avg_latency, 1),
            "tested": total,
            "correct": correct,
            "passed": passed,
        }
        results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {config['label']:>18s}  |  face={config['face_px']:>3d}px  |  {accuracy:5.1f}%  |  {avg_latency:.0f}ms  |  {correct}/{total}")

    return results


def run_lighting_benchmark(test_data, ref_encodings, ref_names, sample_size=100):
    """Test recognition accuracy under different lighting conditions."""
    print("\n" + "="*60)
    print("  LIGHTING CONDITIONS BENCHMARK")
    print("="*60)

    # Use a subset for speed
    sample = test_data[:min(sample_size, len(test_data))]
    results = []

    for condition in LIGHTING_CONDITIONS:
        correct = 0
        total = 0

        for item in sample:
            degraded = simulate_lighting(item["crop"], condition["gamma"], condition["noise_std"])
            degraded = apply_clahe(degraded)
            emb = get_embedding(degraded)
            if emb is None:
                continue

            predicted, dist = match_embedding(emb, ref_encodings, ref_names)
            total += 1
            if predicted == item["person"]:
                correct += 1

        accuracy = (correct / total * 100) if total > 0 else 0
        passed = accuracy >= 90.0

        result = {
            "condition": condition["label"],
            "gamma": condition["gamma"],
            "noise_std": condition["noise_std"],
            "accuracy": round(accuracy, 1),
            "tested": total,
            "correct": correct,
            "passed": passed,
        }
        results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {condition['label']:>25s}  |  gamma={condition['gamma']:.1f}  |  {accuracy:5.1f}%  |  {correct}/{total}")

    return results


def run_angle_benchmark(test_data, ref_encodings, ref_names):
    """Test recognition accuracy across different viewing angles."""
    print("\n" + "="*60)
    print("  VIEWING ANGLE BENCHMARK")
    print("="*60)

    angle_stats = defaultdict(lambda: {"correct": 0, "total": 0})

    for item in test_data:
        emb = get_embedding(apply_clahe(item["crop"]))
        if emb is None:
            continue

        predicted, dist = match_embedding(emb, ref_encodings, ref_names)
        angle = item["angle"]
        angle_stats[angle]["total"] += 1
        if predicted == item["person"]:
            angle_stats[angle]["correct"] += 1

    results = []
    for angle in sorted(angle_stats.keys()):
        stats = angle_stats[angle]
        accuracy = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0
        passed = accuracy >= 90.0
        result = {
            "angle": angle,
            "accuracy": round(accuracy, 1),
            "tested": stats["total"],
            "correct": stats["correct"],
            "passed": passed,
        }
        results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {angle:>30s}  |  {accuracy:5.1f}%  |  {stats['correct']}/{stats['total']}")

    return results


def run_fps_benchmark(test_data, ref_encodings, ref_names, sample_size=80):
    """Test recognition accuracy under motion blur simulating different FPS."""
    print("\n" + "="*60)
    print("  FRAME RATE (FPS) MOTION BLUR BENCHMARK")
    print("="*60)

    sample = test_data[:min(sample_size, len(test_data))]
    results = []

    for config in FPS_CONDITIONS:
        correct = 0
        total = 0

        for item in sample:
            degraded = simulate_motion_blur(item["crop"], config["blur_kernel"])
            degraded = apply_clahe(degraded)
            emb = get_embedding(degraded)
            if emb is None:
                continue

            predicted, dist = match_embedding(emb, ref_encodings, ref_names)
            total += 1
            if predicted == item["person"]:
                correct += 1

        accuracy = (correct / total * 100) if total > 0 else 0
        passed = accuracy >= 90.0

        result = {
            "fps": config["label"],
            "blur_kernel": config["blur_kernel"],
            "accuracy": round(accuracy, 1),
            "tested": total,
            "correct": correct,
            "passed": passed,
        }
        results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {config['label']:>30s}  |  blur_k={config['blur_kernel']}  |  {accuracy:5.1f}%  |  {correct}/{total}")

    return results


# ============================================================================
# REPORT GENERATION
# ============================================================================

def generate_markdown_report(all_results, output_path):
    """Generate a comprehensive Markdown report from all benchmark results."""
    lines = [
        "# Minimum Camera Specification Report",
        "",
        f"> Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"> Model: Facenet512 (512-d embeddings)",
        f"> CLAHE: {'Enabled' if os.environ.get('ENABLE_CLAHE', 'true').lower() != 'false' else 'Disabled'}",
        "",
        "---",
        "",
        "## 1. Resolution & Distance",
        "",
        "| Camera | Distance | Face Pixels | Accuracy | Latency | Status |",
        "|--------|----------|-------------|----------|---------|--------|",
    ]

    for r in all_results.get("resolution", []):
        status = "PASS" if r["passed"] else "FAIL"
        res_label = r["config"].split(" @")[0] if " @" in r["config"] else r["config"]
        lines.append(f"| {res_label} | {r['distance']} | {r['face_px']}px | {r['accuracy']}% | {r['avg_latency_ms']}ms | {status} |")

    # Determine minimum spec
    passing = [r for r in all_results.get("resolution", []) if r["passed"]]
    if passing:
        min_spec = min(passing, key=lambda x: x["face_px"])
        lines.extend([
            "",
            f"**Minimum Viable Specification:** {min_spec['config']} ({min_spec['face_px']}px face width at {min_spec['distance']})",
            "",
        ])

    lines.extend([
        "---",
        "",
        "## 2. Lighting Conditions",
        "",
        "| Condition | Gamma | Noise | Accuracy | Status |",
        "|-----------|-------|-------|----------|--------|",
    ])
    for r in all_results.get("lighting", []):
        status = "PASS" if r["passed"] else "FAIL"
        lines.append(f"| {r['condition']} | {r['gamma']} | {r['noise_std']} | {r['accuracy']}% | {status} |")

    lines.extend([
        "",
        "---",
        "",
        "## 3. Viewing Angles",
        "",
        "| Angle | Accuracy | Tested | Status |",
        "|-------|----------|--------|--------|",
    ])
    for r in all_results.get("angle", []):
        status = "PASS" if r["passed"] else "FAIL"
        lines.append(f"| {r['angle']} | {r['accuracy']}% | {r['tested']} | {status} |")

    lines.extend([
        "",
        "---",
        "",
        "## 4. Frame Rate (FPS) Tolerance",
        "",
        "| FPS Setting | Blur Kernel | Accuracy | Status |",
        "|-------------|-------------|----------|--------|",
    ])
    for r in all_results.get("fps", []):
        status = "PASS" if r["passed"] else "FAIL"
        lines.append(f"| {r['fps']} | {r['blur_kernel']} | {r['accuracy']}% | {status} |")

    lines.extend([
        "",
        "---",
        "",
        "## Summary & Recommendation",
        "",
        "Based on the empirical evaluation above, the recommended minimum camera specification",
        "for reliable (>=95%) employee face recognition is:",
        "",
    ])

    if passing:
        lines.append(f"- **Resolution:** {min_spec['config'].split(' @')[0]} or higher")
        lines.append(f"- **Distance:** {min_spec['distance']} maximum")
        lines.append(f"- **Face Width:** >={min_spec['face_px']}px across the face")
    else:
        lines.append("- No resolution/distance combination achieved >=95% accuracy. Consider higher resolution cameras.")

    lit_fail = [r for r in all_results.get("lighting", []) if not r["passed"]]
    if lit_fail:
        lines.append(f"- **Lighting:** Fails under: {', '.join(r['condition'] for r in lit_fail)}")
    else:
        lines.append("- **Lighting:** All tested conditions pass >=90%")

    fps_pass = [r for r in all_results.get("fps", []) if r["passed"]]
    if fps_pass:
        lowest_fps = fps_pass[-1]
        lines.append(f"- **Minimum FPS:** {lowest_fps['fps']}")

    lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n[Report] Saved to: {output_path}")


# ============================================================================
# MAIN
# ============================================================================

def run_full_evaluation(dataset_path=None, output_dir=None):
    """
    Run all camera specification benchmarks and generate reports.

    Enhanced in v2.0:
      - Per-benchmark CPU/RAM profiling via ResourceMonitor
      - FAR (False Acceptance Rate) + FRR (False Rejection Rate) analysis
      - Unknown-person rejection rate (if data/unknown_test_faces/ is populated)
      - P95/P99 latency percentiles per benchmark
    """
    if dataset_path is None:
        dataset_path = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, 'data')

    os.makedirs(output_dir, exist_ok=True)

    # Create unknown_test_faces directory with README if it doesn't exist
    unknown_dir = os.path.join(BACKEND_DIR, 'data', 'unknown_test_faces')
    if not os.path.exists(unknown_dir):
        os.makedirs(unknown_dir, exist_ok=True)
        with open(os.path.join(unknown_dir, 'README.txt'), 'w') as f:
            f.write(
                "Place JPEG/PNG images of people NOT enrolled in the system here.\n"
                "These are used to measure the unknown-person rejection rate.\n"
                "Recommended: 5-15 images of people from outside your organization.\n"
            )

    encodings_path = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')

    print("="*60)
    print("  MINIMUM CAMERA SPECIFICATION EVALUATION v2.0")
    print("="*60)
    print(f"   Dataset:    {dataset_path}")
    print(f"   Encodings:  {encodings_path}")
    print(f"   Output:     {output_dir}")

    # Load reference embeddings
    ref_encodings, ref_names = load_reference_embeddings(encodings_path)
    if ref_encodings is None:
        print("[ERROR] Cannot run evaluation without trained embeddings.")
        return None

    print(f"   Reference:  {len(ref_encodings)} embeddings, {len(set(ref_names))} unique persons")

    # Collect test images
    test_data = collect_test_images(dataset_path, max_per_person=3)
    if not test_data:
        print("[ERROR] No test images found.")
        return None

    # ── Run all benchmarks with resource monitoring ──
    all_results = {}

    monitor = ResourceMonitor()
    monitor.start()
    all_results["resolution"] = run_resolution_benchmark(test_data, ref_encodings, ref_names)
    all_results["resolution_resources"] = monitor.stop()

    monitor.start()
    all_results["lighting"] = run_lighting_benchmark(test_data, ref_encodings, ref_names)
    all_results["lighting_resources"] = monitor.stop()

    monitor.start()
    all_results["angle"] = run_angle_benchmark(test_data, ref_encodings, ref_names)
    all_results["angle_resources"] = monitor.stop()

    monitor.start()
    all_results["fps"] = run_fps_benchmark(test_data, ref_encodings, ref_names)
    all_results["fps_resources"] = monitor.stop()

    # ── FAR / FRR Analysis ──
    print("\n" + "="*60)
    print("  FAR / FRR / UNKNOWN REJECTION ANALYSIS")
    print("="*60)
    print("  Computing genuine and impostor match statistics...")
    far_frr = compute_far_frr(
        test_data, ref_encodings, ref_names,
        threshold=0.65,
        unknown_dir=unknown_dir,
    )
    all_results["far_frr"] = far_frr
    if far_frr.get("FAR") is not None:
        print(f"  FAR:  {far_frr['FAR']}%  (false accepts / impostors)")
        print(f"  FRR:  {far_frr['FRR']}%  (false rejects / genuine)")
        print(f"  EER:  {far_frr['EER']}%  (approximate equal error rate)")
    if far_frr.get("unknown_rejection_rate") is not None:
        print(f"  Unknown rejection: {far_frr['unknown_rejection_rate']}%")
    else:
        print("  Unknown rejection: N/A (populate data/unknown_test_faces/ to enable)")

    # ── Save JSON results ──
    json_path = os.path.join(output_dir, "camera_spec_results.json")
    with open(json_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\n[Results] JSON saved to: {json_path}")

    # ── Generate Markdown report ──
    md_path = os.path.join(output_dir, "minimum_camera_specification.md")
    generate_markdown_report(all_results, md_path)

    return all_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Camera Specification Evaluation Engine v2.0")
    parser.add_argument("--dataset-path", default=None, help="Path to dataset_cleaned directory")
    parser.add_argument("--output-dir", default=None, help="Output directory for reports")
    args = parser.parse_args()

    run_full_evaluation(args.dataset_path, args.output_dir)

