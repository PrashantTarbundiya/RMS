"""
edge_benchmark_suite.py — Lightweight Edge Model & Detector Benchmarking Suite

Compares face detectors and embedding models under identical conditions to
determine the optimal pipeline for edge deployment (Jetson Nano, RPi, RK3588).

Detectors Compared:
  - MediaPipe (SideFaceDetector) — our current production detector
  - OpenCV DNN (Caffe-based) — lightweight alternative
  - OpenCV Haar Cascade — ultra-lightweight fallback

Embedding Models Compared (v2.0):
  - Facenet512 (DeepFace) — our current production model
  - ArcFace (DeepFace) — higher accuracy, heavier
  - GhostFaceNet (DeepFace) — edge-optimized lightweight model
  - InsightFace ArcFace (buffalo_sc, GPU/CPU ONNX) — NEW: GPU-accelerated

Metrics (v2.0):
  - Latency (avg, P95 ms/frame)
  - FPS (frames per second)
  - CPU usage (avg + peak %) per model
  - RAM usage (avg + peak MB) per model
  - Recognition accuracy (%)
  - FAR (False Acceptance Rate) per model
  - FRR (False Rejection Rate) per model

Usage:
  python edge_benchmark_suite.py [--sample-size N]
"""

import os
import sys
import cv2
import json
import time
import pickle
import psutil
import argparse
import numpy as np
from collections import defaultdict

# Path setup
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'


# ============================================================================
# DETECTOR BENCHMARKS
# ============================================================================

def benchmark_mediapipe_detector(test_images, warmup=3):
    """Benchmark our SideFaceDetector (MediaPipe-based)."""
    from face_detection import SideFaceDetector
    detector = SideFaceDetector(min_detection_confidence=0.30)

    # Warm up
    for img in test_images[:warmup]:
        detector.detect_faces(img, profile_only=False)

    latencies = []
    detections = 0
    for img in test_images:
        start = time.time()
        faces = detector.detect_faces(img, profile_only=False)
        latencies.append((time.time() - start) * 1000)
        if faces:
            detections += 1

    detector.close()
    return {
        "name": "MediaPipe (SideFaceDetector)",
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "detection_rate": round(detections / len(test_images) * 100, 1),
        "tested": len(test_images),
    }


def benchmark_opencv_haar_detector(test_images, warmup=3):
    """Benchmark OpenCV Haar Cascade detector — ultra-lightweight."""
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    detector = cv2.CascadeClassifier(cascade_path)

    # Warm up
    for img in test_images[:warmup]:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        detector.detectMultiScale(gray, 1.3, 5)

    latencies = []
    detections = 0
    for img in test_images:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        start = time.time()
        faces = detector.detectMultiScale(gray, 1.3, 5)
        latencies.append((time.time() - start) * 1000)
        if len(faces) > 0:
            detections += 1

    return {
        "name": "OpenCV Haar Cascade",
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "detection_rate": round(detections / len(test_images) * 100, 1),
        "tested": len(test_images),
    }


def benchmark_opencv_dnn_detector(test_images, warmup=3):
    """Benchmark OpenCV DNN face detector (Caffe-based SSD)."""
    # Check if the model files exist
    proto_path = os.path.join(BACKEND_DIR, 'data', 'deploy.prototxt')
    model_path = os.path.join(BACKEND_DIR, 'data', 'res10_300x300_ssd_iter_140000.caffemodel')

    if not os.path.exists(proto_path) or not os.path.exists(model_path):
        return {
            "name": "OpenCV DNN (Caffe SSD)",
            "avg_latency_ms": -1,
            "p95_latency_ms": -1,
            "fps": 0,
            "detection_rate": 0,
            "tested": 0,
            "note": "Model files not found. Download deploy.prototxt and res10_300x300_ssd_iter_140000.caffemodel to backend/data/"
        }

    net = cv2.dnn.readNetFromCaffe(proto_path, model_path)

    # Warm up
    for img in test_images[:warmup]:
        blob = cv2.dnn.blobFromImage(cv2.resize(img, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
        net.setInput(blob)
        net.forward()

    latencies = []
    detections = 0
    for img in test_images:
        blob = cv2.dnn.blobFromImage(cv2.resize(img, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
        net.setInput(blob)
        start = time.time()
        dets = net.forward()
        latencies.append((time.time() - start) * 1000)
        for i in range(dets.shape[2]):
            if dets[0, 0, i, 2] > 0.5:
                detections += 1
                break

    return {
        "name": "OpenCV DNN (Caffe SSD)",
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "detection_rate": round(detections / len(test_images) * 100, 1),
        "tested": len(test_images),
    }


# ============================================================================
# EMBEDDING MODEL BENCHMARKS
# ============================================================================

def benchmark_facenet512(face_crops, ref_encodings, ref_names, warmup=2):
    """Benchmark Facenet512 via DeepFace — our current production model."""
    from model import get_embedding, apply_clahe
    from camera_spec_evaluator import match_embedding

    # Warm up
    for crop, _, _ in face_crops[:warmup]:
        get_embedding(apply_clahe(crop))

    latencies = []
    correct = 0
    total = 0

    for crop, true_name, _ in face_crops:
        processed = apply_clahe(crop)
        start = time.time()
        emb = get_embedding(processed)
        latencies.append((time.time() - start) * 1000)

        if emb is not None:
            predicted, dist = match_embedding(emb, ref_encodings, ref_names)
            total += 1
            if predicted == true_name:
                correct += 1

    accuracy = (correct / total * 100) if total > 0 else 0

    return {
        "name": "Facenet512 (DeepFace)",
        "embedding_dim": 512,
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "accuracy": round(accuracy, 1),
        "tested": total,
        "correct": correct,
    }


def benchmark_arcface(face_crops, ref_encodings_arc, ref_names_arc, warmup=2):
    """Benchmark ArcFace via DeepFace — higher accuracy but heavier."""
    from deepface import DeepFace

    def get_arcface_embedding(crop):
        try:
            result = DeepFace.represent(
                img_path=crop, model_name="ArcFace",
                enforce_detection=False, detector_backend='skip', align=False
            )
            if result:
                emb = np.array(result[0]['embedding'], dtype=np.float32)
                norm = np.linalg.norm(emb)
                if norm > 0:
                    emb = emb / norm
                return emb.tolist()
        except Exception:
            pass
        return None

    # Warm up
    for crop, _, _ in face_crops[:warmup]:
        get_arcface_embedding(crop)

    latencies = []
    embeddings_generated = []
    names_generated = []

    # Generate reference embeddings for ArcFace (can't reuse Facenet512 ones)
    print("    [ArcFace] Generating reference embeddings...")
    for crop, true_name, _ in face_crops:
        start = time.time()
        emb = get_arcface_embedding(crop)
        latencies.append((time.time() - start) * 1000)
        if emb is not None:
            embeddings_generated.append(emb)
            names_generated.append(true_name)

    # Self-test accuracy (leave-one-out style)
    correct = 0
    total = 0
    if len(embeddings_generated) > 1:
        from camera_spec_evaluator import match_embedding
        for i, (emb, true_name) in enumerate(zip(embeddings_generated, names_generated)):
            ref_embs = embeddings_generated[:i] + embeddings_generated[i+1:]
            ref_nms = names_generated[:i] + names_generated[i+1:]
            predicted, _ = match_embedding(emb, ref_embs, ref_nms)
            total += 1
            if predicted == true_name:
                correct += 1

    accuracy = (correct / total * 100) if total > 0 else 0

    return {
        "name": "ArcFace (DeepFace)",
        "embedding_dim": 512,
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "accuracy": round(accuracy, 1),
        "tested": total,
        "correct": correct,
    }


def benchmark_ghostfacenet(face_crops, ref_encodings_edge, ref_names_edge, warmup=2):
    """Benchmark GhostFaceNet via DeepFace — edge optimized model."""
    from deepface import DeepFace

    def get_ghostfacenet_embedding(crop):
        try:
            result = DeepFace.represent(
                img_path=crop, model_name="GhostFaceNet",
                enforce_detection=False, detector_backend='skip', align=False
            )
            if result:
                emb = np.array(result[0]['embedding'], dtype=np.float32)
                norm = np.linalg.norm(emb)
                if norm > 0:
                    emb = emb / norm
                return emb.tolist()
        except Exception:
            pass
        return None

    # Warm up
    for crop, _, _ in face_crops[:warmup]:
        get_ghostfacenet_embedding(crop)

    latencies = []
    embeddings_generated = []
    names_generated = []

    print("    [GhostFaceNet] Generating reference embeddings...")
    for crop, true_name, _ in face_crops:
        start = time.time()
        emb = get_ghostfacenet_embedding(crop)
        latencies.append((time.time() - start) * 1000)
        if emb is not None:
            embeddings_generated.append(emb)
            names_generated.append(true_name)

    # Self-test accuracy
    correct = 0
    total = 0
    if len(embeddings_generated) > 1:
        from camera_spec_evaluator import match_embedding
        for i, (emb, true_name) in enumerate(zip(embeddings_generated, names_generated)):
            ref_embs = embeddings_generated[:i] + embeddings_generated[i+1:]
            ref_nms = names_generated[:i] + names_generated[i+1:]
            predicted, _ = match_embedding(emb, ref_embs, ref_nms)
            total += 1
            if predicted == true_name:
                correct += 1

    accuracy = (correct / total * 100) if total > 0 else 0

    return {
        "name": "GhostFaceNet (EdgeFace)",
        "embedding_dim": 512,
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "accuracy": round(accuracy, 1),
        "tested": total,
        "correct": correct,
    }


def benchmark_insightface_arcface(face_crops, warmup=2):
    """
    Benchmark InsightFace buffalo_sc (ArcFace) via ONNX Runtime.
    Uses GPU if CUDA is available, falls back to CPU ONNX.
    Measures latency with ResourceMonitor for CPU/RAM profiling.
    Uses leave-one-out self-test for accuracy and per-model FAR/FRR.
    """
    from camera_spec_evaluator import match_embedding, ResourceMonitor

    # Try to load InsightFace
    try:
        from gpu_trainer import is_gpu_available, load_insightface_model, gpu_embed_batch, get_device
        device = get_device()
        model = load_insightface_model(device)
        backend_label = f"InsightFace ArcFace ({'GPU' if device == 'cuda' else 'CPU ONNX'})"
    except Exception as e:
        return {
            "name": "InsightFace ArcFace",
            "embedding_dim": 512,
            "avg_latency_ms": -1,
            "p95_latency_ms": -1,
            "fps": 0,
            "accuracy": 0,
            "tested": 0,
            "correct": 0,
            "note": f"Not available: {e}",
        }

    # Warm up
    warm_crops = [c for c, _, _ in face_crops[:warmup]]
    if warm_crops:
        gpu_embed_batch(warm_crops, device=device)

    monitor = ResourceMonitor()
    monitor.start()

    latencies = []
    embeddings_generated = []
    names_generated = []

    for crop, true_name, _ in face_crops:
        start = time.time()
        embs = gpu_embed_batch([crop], device=device)
        latencies.append((time.time() - start) * 1000)
        emb = embs[0] if embs else None
        if emb is not None:
            embeddings_generated.append(emb)
            names_generated.append(true_name)

    resources = monitor.stop()

    # Leave-one-out accuracy + FAR/FRR
    correct = 0
    total = 0
    false_accepts = 0
    false_rejects = 0
    genuine_attempts = 0
    impostor_attempts = 0

    if len(embeddings_generated) > 1:
        for i, (emb, true_name) in enumerate(zip(embeddings_generated, names_generated)):
            # Genuine test
            ref_embs = embeddings_generated[:i] + embeddings_generated[i+1:]
            ref_nms = names_generated[:i] + names_generated[i+1:]
            predicted, _ = match_embedding(emb, ref_embs, ref_nms)
            total += 1
            genuine_attempts += 1
            if predicted == true_name:
                correct += 1
            else:
                false_rejects += 1

            # Impostor test: remove this person's embeddings
            imp_refs = [(e, n) for e, n in zip(ref_embs, ref_nms) if n != true_name]
            if len(imp_refs) >= 2:
                imp_e, imp_n = zip(*imp_refs)
                imp_pred, _ = match_embedding(emb, list(imp_e), list(imp_n))
                impostor_attempts += 1
                if imp_pred != "Unknown":
                    false_accepts += 1

    accuracy = (correct / total * 100) if total > 0 else 0
    FAR = round(false_accepts / impostor_attempts * 100, 2) if impostor_attempts > 0 else None
    FRR = round(false_rejects / genuine_attempts * 100, 2) if genuine_attempts > 0 else None

    if not latencies:
        latencies = [0]

    return {
        "name": backend_label,
        "embedding_dim": 512,
        "avg_latency_ms": round(np.mean(latencies), 1),
        "p95_latency_ms": round(np.percentile(latencies, 95), 1),
        "fps": round(1000.0 / np.mean(latencies), 1) if np.mean(latencies) > 0 else 0,
        "accuracy": round(accuracy, 1),
        "tested": total,
        "correct": correct,
        "FAR": FAR,
        "FRR": FRR,
        "avg_cpu_pct": resources.get("avg_cpu_pct"),
        "peak_cpu_pct": resources.get("peak_cpu_pct"),
        "avg_ram_mb": resources.get("avg_ram_mb"),
        "peak_ram_mb": resources.get("peak_ram_mb"),
    }


# ============================================================================
# SYSTEM RESOURCE MEASUREMENT
# ============================================================================


def measure_system_resources():
    """Capture current system resource usage."""
    process = psutil.Process(os.getpid())
    mem = process.memory_info()
    return {
        "ram_mb": round(mem.rss / (1024 * 1024), 1),
        "cpu_percent": psutil.cpu_percent(interval=0.5),
        "cpu_count": psutil.cpu_count(),
        "total_ram_mb": round(psutil.virtual_memory().total / (1024 * 1024), 0),
    }


# ============================================================================
# REPORT GENERATION
# ============================================================================

def generate_edge_report(detector_results, model_results, system_info, output_path):
    """Generate a Markdown report comparing all detectors and models."""
    lines = [
        "# Edge Hardware & Model Benchmark Report",
        "",
        f"> Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"> System: {system_info.get('cpu_count', '?')} CPU cores, {system_info.get('total_ram_mb', '?')} MB RAM",
        f"> Process RAM: {system_info.get('ram_mb', '?')} MB",
        "",
        "---",
        "",
        "## 1. Face Detector Comparison",
        "",
        "| Detector | Avg Latency | P95 Latency | FPS | Detection Rate |",
        "|----------|-------------|-------------|-----|----------------|",
    ]

    for r in detector_results:
        if r.get("avg_latency_ms", -1) < 0:
            lines.append(f"| {r['name']} | N/A | N/A | N/A | {r.get('note', 'Not available')} |")
        else:
            lines.append(f"| {r['name']} | {r['avg_latency_ms']}ms | {r['p95_latency_ms']}ms | {r['fps']} | {r['detection_rate']}% |")

    lines.extend([
        "",
        "---",
        "",
        "## 2. Embedding Model Comparison",
        "",
        "| Model | Dim | Avg Latency | P95 Latency | FPS | Accuracy |",
        "|-------|-----|-------------|-------------|-----|----------|",
    ])

    for r in model_results:
        lines.append(f"| {r['name']} | {r['embedding_dim']}d | {r['avg_latency_ms']}ms | {r['p95_latency_ms']}ms | {r['fps']} | {r['accuracy']}% |")

    # Recommendations
    lines.extend([
        "",
        "---",
        "",
        "## 3. Edge Deployment Recommendations",
        "",
    ])

    # Find best detector
    valid_detectors = [d for d in detector_results if d.get("avg_latency_ms", -1) > 0]
    if valid_detectors:
        fastest = min(valid_detectors, key=lambda x: x["avg_latency_ms"])
        best_detection = max(valid_detectors, key=lambda x: x["detection_rate"])
        lines.append(f"- **Fastest Detector:** {fastest['name']} ({fastest['avg_latency_ms']}ms, {fastest['fps']} FPS)")
        lines.append(f"- **Best Detection Rate:** {best_detection['name']} ({best_detection['detection_rate']}%)")

    # Find best model
    if model_results:
        fastest_model = min(model_results, key=lambda x: x["avg_latency_ms"])
        best_accuracy = max(model_results, key=lambda x: x["accuracy"])
        lines.append(f"- **Fastest Embedding Model:** {fastest_model['name']} ({fastest_model['avg_latency_ms']}ms)")
        lines.append(f"- **Highest Accuracy Model:** {best_accuracy['name']} ({best_accuracy['accuracy']}%)")

    # Edge-specific recommendations
    lines.extend([
        "",
        "### For Jetson Nano / Orin Nano",
        f"- Use **{best_detection['name'] if valid_detectors else 'MediaPipe'}** for detection",
        f"- Use **{best_accuracy['name'] if model_results else 'Facenet512'}** with TensorRT optimization",
        "",
        "### For Raspberry Pi 5 / RK3588",
        "- Use **OpenCV Haar Cascade** for detection (lowest CPU overhead)",
        "- Use **Facenet512** or **MobileFaceNet** for embedding",
        "- Consider ONNX Runtime for optimized inference",
        "",
    ])

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n[Report] Edge benchmark report saved to: {output_path}")


# ============================================================================
# MAIN
# ============================================================================

def run_edge_benchmarks(sample_size=50):
    """Run all edge benchmarks and generate reports."""
    dataset_path = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
    output_dir = os.path.join(BACKEND_DIR, 'data')
    os.makedirs(output_dir, exist_ok=True)

    encodings_path = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')

    print("="*60)
    print("  EDGE MODEL & DETECTOR BENCHMARK SUITE")
    print("="*60)

    # Load reference embeddings
    if not os.path.exists(encodings_path):
        print("[ERROR] No trained embeddings found. Run model.py first.")
        return None

    with open(encodings_path, "rb") as f:
        data = pickle.load(f)
    ref_encodings = data.get("encodings", [])
    ref_names = data.get("names", [])
    print(f"   Reference: {len(ref_encodings)} embeddings, {len(set(ref_names))} persons")

    # Collect test images (full frames for detector benchmark)
    from face_detection import SideFaceDetector
    detector = SideFaceDetector(min_detection_confidence=0.30)

    test_images = []
    face_crops = []  # (crop, true_name, path)

    persons = sorted([d for d in os.listdir(dataset_path)
                      if os.path.isdir(os.path.join(dataset_path, d))])

    print(f"   Collecting up to {sample_size} test samples...")
    count = 0
    for person_name in persons:
        if count >= sample_size:
            break
        person_dir = os.path.join(dataset_path, person_name)
        for root, _, files in os.walk(person_dir):
            for f in sorted(files)[:2]:  # Max 2 per person
                if count >= sample_size:
                    break
                if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                img_path = os.path.join(root, f)
                img = cv2.imread(img_path)
                if img is None:
                    continue

                test_images.append(img)

                # Also crop face for embedding benchmarks
                faces = detector.detect_faces(img, profile_only=False)
                if faces:
                    face = max(faces, key=lambda x: x['bbox']['w'] * x['bbox']['h'])
                    bx = face['bbox']
                    h_img, w_img = img.shape[:2]
                    mx, my = int(bx['w'] * 0.22), int(bx['h'] * 0.22)
                    crop = img[max(0, bx['y']-my):min(h_img, bx['y']+bx['h']+my),
                               max(0, bx['x']-mx):min(w_img, bx['x']+bx['w']+mx)]
                else:
                    crop = img

                if crop.size > 0:
                    face_crops.append((crop, person_name, img_path))
                count += 1

    detector.close()
    print(f"   Collected {len(test_images)} full frames, {len(face_crops)} face crops.")

    # ── Detector Benchmarks ──
    print("\n" + "="*60)
    print("  DETECTOR BENCHMARKS")
    print("="*60)

    detector_results = []

    print("\n  [1/3] MediaPipe (SideFaceDetector)...")
    detector_results.append(benchmark_mediapipe_detector(test_images))

    print(f"  [2/3] OpenCV Haar Cascade...")
    detector_results.append(benchmark_opencv_haar_detector(test_images))

    print(f"  [3/3] OpenCV DNN (Caffe SSD)...")
    detector_results.append(benchmark_opencv_dnn_detector(test_images))

    for r in detector_results:
        if r.get("avg_latency_ms", -1) > 0:
            print(f"    {r['name']:>35s}: {r['avg_latency_ms']:>6.1f}ms  |  {r['fps']:>5.1f} FPS  |  {r['detection_rate']}% detected")

    # ── Embedding Model Benchmarks ──
    print("\n" + "="*60)
    print("  EMBEDDING MODEL BENCHMARKS")
    print("="*60)

    model_results = []

    print("\n  [1/4] Facenet512 (DeepFace)...")
    model_results.append(benchmark_facenet512(face_crops, ref_encodings, ref_names))

    print(f"  [2/4] ArcFace (DeepFace)...")
    model_results.append(benchmark_arcface(face_crops, [], []))

    print(f"  [3/4] GhostFaceNet (EdgeFace)...")
    model_results.append(benchmark_ghostfacenet(face_crops, [], []))

    print(f"  [4/4] InsightFace ArcFace (buffalo_sc, GPU/CPU ONNX)...")
    model_results.append(benchmark_insightface_arcface(face_crops))

    print("\n  Model Results Summary:")
    print(f"  {'Model':<40} {'Latency':>10} {'FPS':>7} {'Accuracy':>10} {'FAR':>7} {'FRR':>7}")
    print(f"  {'-'*90}")
    for r in model_results:
        if r.get("avg_latency_ms", -1) < 0:
            print(f"  {r['name']:<40}  NOT AVAILABLE — {r.get('note', '')}")
        else:
            far_str = f"{r['FAR']}%" if r.get("FAR") is not None else "N/A"
            frr_str = f"{r['FRR']}%" if r.get("FRR") is not None else "N/A"
            print(
                f"  {r['name']:<40} {r['avg_latency_ms']:>8.1f}ms"
                f" {r['fps']:>7.1f} {r['accuracy']:>9.1f}%"
                f" {far_str:>7} {frr_str:>7}"
            )

    # ── System Resources ──
    system_info = measure_system_resources()
    print(f"\n  System: {system_info['ram_mb']} MB RAM used, {system_info['cpu_percent']}% CPU")

    # ── Save Results ──
    all_results = {
        "detectors": detector_results,
        "models": model_results,
        "system": system_info,
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
    }

    json_path = os.path.join(output_dir, "edge_benchmark_results.json")
    with open(json_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\n[Results] JSON saved to: {json_path}")

    # Generate report
    md_path = os.path.join(output_dir, "edge_hardware_report.md")
    generate_edge_report(detector_results, model_results, system_info, md_path)

    return all_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Edge Model & Detector Benchmark Suite v2.0")
    parser.add_argument("--sample-size", type=int, default=50, help="Number of test samples")
    args = parser.parse_args()

    run_edge_benchmarks(args.sample_size)

