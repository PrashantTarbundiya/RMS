"""
ml_robustness.py — ML Robustness Enhancements for RMS Face AI.

Phase 8 improvements:
  1. Hard negative mining — identifies visually similar individuals in the
     enrollment database and returns confusable pairs for targeted retraining.
  2. Adaptive per-person thresholds — computes optimal confirm thresholds
     based on each person's intra-class and inter-class embedding distributions.
  3. Expanded augmentation transforms — motion blur, occlusion simulation,
     extreme lighting, and low-resolution degradation.
  4. Model quantization — INT8 dynamic quantization for faster CPU inference
     with benchmark comparison against the original model.
"""

import os
import sys
import json
import time
import logging
import pickle
import numpy as np
from collections import defaultdict
from datetime import datetime, timezone

logger = logging.getLogger('rms-ml')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


# ─── 1. Hard Negative Mining ────────────────────────────────────────

def mine_hard_negatives(encodings, names, similarity_threshold=0.35):
    """
    Identify confusable (visually similar) pairs in the enrollment database.

    For each person, finds other people whose embeddings are dangerously
    close (below similarity_threshold), creating a risk of false positives.

    Args:
        encodings: List of embedding vectors (from encodings.pickle)
        names: List of corresponding person names
        similarity_threshold: Cosine distance below which two different
                            people are considered confusable (lower = closer)

    Returns:
        {
            'confusable_pairs': [
                {'person_a': 'Alice', 'person_b': 'Bob', 'min_distance': 0.28,
                 'risk_level': 'high'},
            ],
            'per_person_stats': {
                'Alice': {'nearest_other': 'Bob', 'nearest_distance': 0.28},
            },
            'total_people': 10,
            'total_pairs_checked': 45,
            'high_risk_count': 2,
        }
    """
    from scipy.spatial.distance import cosine, cdist

    if not encodings or not names:
        return {
            'confusable_pairs': [],
            'per_person_stats': {},
            'total_people': 0,
            'total_pairs_checked': 0,
            'high_risk_count': 0,
        }

    # Group embeddings by person
    person_embeddings = defaultdict(list)
    for emb, name in zip(encodings, names):
        person_embeddings[name].append(np.array(emb))

    unique_names = sorted(person_embeddings.keys())
    n = len(unique_names)

    # Compute centroid for each person
    centroids = {}
    for name in unique_names:
        embs = np.array(person_embeddings[name])
        centroids[name] = np.mean(embs, axis=0)

    # Find confusable pairs
    confusable_pairs = []
    per_person_stats = {}
    total_pairs = 0

    for i in range(n):
        name_a = unique_names[i]
        nearest_other = None
        nearest_dist = float('inf')
        embs_a = np.array(person_embeddings[name_a])

        for j in range(i + 1, n):
            name_b = unique_names[j]
            total_pairs += 1
            embs_b = np.array(person_embeddings[name_b])

            if len(embs_a) > 0 and len(embs_b) > 0:
                # Vectorized cdist for extremely fast pair comparison
                min_dist = float(np.min(cdist(embs_a, embs_b, 'cosine')))
            else:
                min_dist = float('inf')

            if min_dist < nearest_dist:
                nearest_dist = min_dist
                nearest_other = name_b

            if min_dist < similarity_threshold:
                risk = 'critical' if min_dist < 0.20 else 'high' if min_dist < 0.30 else 'medium'
                confusable_pairs.append({
                    'person_a': name_a,
                    'person_b': name_b,
                    'min_distance': round(min_dist, 4),
                    'centroid_distance': round(cosine(centroids[name_a], centroids[name_b]), 4),
                    'risk_level': risk,
                })

        if nearest_other:
            per_person_stats[name_a] = {
                'nearest_other': nearest_other,
                'nearest_distance': round(nearest_dist, 4),
            }

    # Sort by risk (closest first)
    confusable_pairs.sort(key=lambda x: x['min_distance'])
    high_risk = sum(1 for p in confusable_pairs if p['risk_level'] in ('critical', 'high'))

    return {
        'confusable_pairs': confusable_pairs,
        'per_person_stats': per_person_stats,
        'total_people': n,
        'total_pairs_checked': total_pairs,
        'high_risk_count': high_risk,
    }


def mine_hard_negatives_from_pickle(encodings_path, similarity_threshold=0.35):
    """Load encodings.pickle and run hard negative mining."""
    if not os.path.exists(encodings_path):
        return {'error': f'Encodings file not found: {encodings_path}'}

    try:
        with open(encodings_path, 'rb') as f:
            data = pickle.load(f)

        encodings = data.get('encodings', data.get('embeddings', []))
        names = data.get('names', data.get('labels', []))

        if not encodings:
            return {'error': 'No encodings found in pickle file'}

        return mine_hard_negatives(encodings, names, similarity_threshold)

    except Exception as e:
        logger.error(f"Hard negative mining error: {e}", exc_info=True)
        return {'error': str(e)}


# ─── 2. Adaptive Per-Person Thresholds ──────────────────────────────

def compute_adaptive_thresholds(encodings, names, margin=0.05):
    """
    Compute optimal per-person confirm thresholds based on each person's
    embedding distribution relative to others.

    For each person:
      - intra_spread: max cosine distance between their own embeddings
      - inter_gap: min cosine distance to the nearest different person
      - adaptive_threshold = (intra_spread + inter_gap) / 2 + margin

    This is tighter for well-separated people and more lenient for people
    with high intra-class variance (e.g., wearing glasses sometimes).

    Args:
        encodings: List of embedding vectors
        names: List of corresponding person names
        margin: Safety margin added to the threshold (default 0.05)

    Returns:
        {
            'thresholds': {
                'Alice': {'threshold': 0.42, 'intra_spread': 0.15, 'inter_gap': 0.55},
                'Bob': {'threshold': 0.38, 'intra_spread': 0.10, 'inter_gap': 0.48},
            },
            'global_threshold': 0.40,  # Median of all per-person thresholds
        }
    """
    from scipy.spatial.distance import cosine, cdist

    if not encodings or not names:
        return {'thresholds': {}, 'global_threshold': 0.55}

    # Group embeddings by person
    person_embeddings = defaultdict(list)
    for emb, name in zip(encodings, names):
        person_embeddings[name].append(np.array(emb))

    unique_names = sorted(person_embeddings.keys())
    thresholds = {}

    for name in unique_names:
        embs = np.array(person_embeddings[name])

        # Intra-class spread: 90th percentile distance to ignore outliers
        intra_spread = 0.0
        if len(embs) > 1:
            # cdist computes all pairwise distances efficiently
            dists = cdist(embs, embs, 'cosine')
            # Extract upper triangle to avoid 0s on diagonal dominating
            upper_tri = dists[np.triu_indices_from(dists, k=1)]
            if len(upper_tri) > 0:
                intra_spread = float(np.percentile(upper_tri, 90))

        # Inter-class gap: min distance to nearest different person
        inter_gap = float('inf')
        for other_name in unique_names:
            if other_name == name:
                continue
            other_embs = np.array(person_embeddings[other_name])
            if len(other_embs) > 0:
                # cdist for inter-class gap
                min_d = float(np.min(cdist(embs, other_embs, 'cosine')))
                inter_gap = min(inter_gap, min_d)

        if inter_gap == float('inf'):
            inter_gap = 1.0  # Only person in DB

        # Adaptive threshold: prioritize false-positive reduction
        STATIC_MAX = 0.40
        ideal_threshold = inter_gap - margin
        
        # Start with a threshold that accommodates the user's variance
        adaptive = intra_spread + (margin / 2)
        
        # SECURITY OVERRIDE: Never exceed the static max, and NEVER exceed the ideal threshold 
        # that prevents confusion with the nearest imposter.
        adaptive = min(STATIC_MAX, min(ideal_threshold, adaptive))

        # Clamp to absolute reasonable range (0.20 is the strictest we can reasonably be)
        adaptive = max(0.20, min(0.40, adaptive))

        thresholds[name] = {
            'threshold': round(adaptive, 4),
            'intra_spread': round(intra_spread, 4),
            'inter_gap': round(inter_gap, 4),
            'num_embeddings': len(embs),
        }

    # Global threshold = median of all per-person thresholds
    all_thresholds = [v['threshold'] for v in thresholds.values()]
    global_threshold = round(float(np.median(all_thresholds)), 4) if all_thresholds else 0.55

    return {
        'thresholds': thresholds,
        'global_threshold': global_threshold,
    }


# ─── 3. Expanded Augmentation Transforms ────────────────────────────

def get_robust_train_transforms():
    """
    Enhanced training augmentation pipeline with:
      - Motion blur (simulates head movement during capture)
      - Random occlusion (simulates masks, hands, objects)
      - Extreme lighting (simulates shadows, overexposure)
      - Low-resolution degradation (simulates distant cameras)
      - JPEG compression artifacts
      - All existing transforms from the baseline pipeline

    Returns a torchvision transforms.Compose pipeline.
    """
    import torch
    from torchvision import transforms
    from PIL import ImageFilter, ImageEnhance
    import random

    class MotionBlur:
        """Simulate motion blur from head movement."""
        def __init__(self, p=0.15, kernel_size=5):
            self.p = p
            self.kernel_size = kernel_size

        def __call__(self, img):
            if random.random() < self.p:
                return img.filter(ImageFilter.BoxBlur(
                    radius=random.randint(1, self.kernel_size)
                ))
            return img

    class RandomOcclusion:
        """Simulate partial occlusion (masks, objects blocking face)."""
        def __init__(self, p=0.15, max_patches=2):
            self.p = p
            self.max_patches = max_patches

        def __call__(self, img):
            if random.random() < self.p:
                w, h = img.size
                from PIL import ImageDraw
                draw = ImageDraw.Draw(img)
                for _ in range(random.randint(1, self.max_patches)):
                    # Random rectangle covering 5-20% of face
                    rw = random.randint(int(w * 0.05), int(w * 0.20))
                    rh = random.randint(int(h * 0.05), int(h * 0.20))
                    rx = random.randint(0, w - rw)
                    ry = random.randint(0, h - rh)
                    # Use skin-like or dark color
                    color = random.choice([(0, 0, 0), (128, 128, 128), (200, 180, 160)])
                    draw.rectangle([rx, ry, rx + rw, ry + rh], fill=color)
            return img

    class ExtremeLighting:
        """Simulate extreme lighting conditions."""
        def __init__(self, p=0.15):
            self.p = p

        def __call__(self, img):
            if random.random() < self.p:
                # Random brightness extreme
                factor = random.choice([
                    random.uniform(0.3, 0.5),   # Very dark
                    random.uniform(1.5, 2.0),   # Very bright
                ])
                img = ImageEnhance.Brightness(img).enhance(factor)
                # Possibly also adjust contrast
                if random.random() < 0.5:
                    img = ImageEnhance.Contrast(img).enhance(
                        random.uniform(0.5, 1.5)
                    )
            return img

    class LowResolution:
        """Simulate low-resolution camera by downscaling then upscaling."""
        def __init__(self, p=0.10, min_scale=0.25):
            self.p = p
            self.min_scale = min_scale

        def __call__(self, img):
            if random.random() < self.p:
                w, h = img.size
                scale = random.uniform(self.min_scale, 0.5)
                small = img.resize((int(w * scale), int(h * scale)))
                img = small.resize((w, h))
            return img

    class JPEGCompression:
        """Simulate JPEG compression artifacts."""
        def __init__(self, p=0.10, quality_range=(10, 40)):
            self.p = p
            self.quality_range = quality_range

        def __call__(self, img):
            if random.random() < self.p:
                import io
                quality = random.randint(*self.quality_range)
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=quality)
                buf.seek(0)
                from PIL import Image
                img = Image.open(buf).copy()
            return img

    return transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(25),                        # Wider rotation
        transforms.RandomPerspective(distortion_scale=0.20, p=0.3),
        MotionBlur(p=0.15, kernel_size=5),
        RandomOcclusion(p=0.15, max_patches=2),
        ExtremeLighting(p=0.15),
        LowResolution(p=0.10),
        JPEGCompression(p=0.10),
        transforms.ColorJitter(brightness=0.5, contrast=0.5, saturation=0.4, hue=0.08),
        transforms.RandomAffine(degrees=0, translate=(0.12, 0.12), scale=(0.85, 1.15)),
        transforms.RandomGrayscale(p=0.15),
        transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 2.0)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.20)),
    ])


# ─── 4. Model Quantization ─────────────────────────────────────────

def quantize_model(model_path, output_path=None, num_classes=None):
    """
    Apply INT8 dynamic quantization to a trained MobileNetV2 model.

    Dynamic quantization converts weight matrices to INT8 at save time
    and quantizes activations on-the-fly during inference. This gives
    ~2-3x speedup on CPU with typically <1% accuracy drop.

    Args:
        model_path: Path to the trained .pth model file.
        output_path: Where to save the quantized model. Defaults to
                     model_path.replace('.pth', '_int8.pth').
        num_classes: Number of output classes.

    Returns:
        (success, output_path, benchmark, error)
    """
    import torch
    import torch.quantization

    if not os.path.exists(model_path):
        return False, '', {}, f"Model file not found: {model_path}"

    if output_path is None:
        output_path = model_path.replace('.pth', '_int8.pth')

    try:
        sys.path.insert(0, os.path.join(BACKEND_DIR, 'models', 'sota_finetune'))
        from finetune import build_mobile_model

        # Detect number of classes from the saved model
        state_dict = torch.load(model_path, map_location='cpu', weights_only=False)
        if num_classes is None:
            # Infer from the last linear layer
            for key in reversed(list(state_dict.keys())):
                if 'weight' in key and state_dict[key].dim() == 2:
                    num_classes = state_dict[key].shape[0]
                    break
            if num_classes is None:
                num_classes = 2

        # Build and load model
        model = build_mobile_model(num_classes=num_classes)
        model.load_state_dict(state_dict)
        model.eval()

        # Apply dynamic quantization
        quantized_model = torch.quantization.quantize_dynamic(
            model,
            {torch.nn.Linear, torch.nn.Conv2d},
            dtype=torch.qint8,
        )

        # Save quantized model
        torch.save(quantized_model.state_dict(), output_path)

        # Benchmark
        benchmark = _benchmark_models(model, quantized_model, num_classes)

        original_size = os.path.getsize(model_path) / (1024 * 1024)
        quantized_size = os.path.getsize(output_path) / (1024 * 1024)
        benchmark['original_size_mb'] = round(original_size, 2)
        benchmark['quantized_size_mb'] = round(quantized_size, 2)
        benchmark['size_reduction_pct'] = round(
            (1 - quantized_size / original_size) * 100, 1
        ) if original_size > 0 else 0

        logger.info(
            f"Quantized model saved: {output_path} "
            f"({benchmark['quantized_size_mb']} MB, "
            f"{benchmark['speedup_factor']}x faster)"
        )

        return True, output_path, benchmark, None

    except Exception as e:
        logger.error(f"Quantization failed: {e}", exc_info=True)
        return False, '', {}, str(e)


def _benchmark_models(original_model, quantized_model, num_classes, n_runs=20):
    """
    Benchmark original vs quantized model for speed and output consistency.
    """
    import torch

    dummy_input = torch.randn(1, 3, 224, 224)

    # Warm up
    for _ in range(3):
        with torch.no_grad():
            original_model(dummy_input)
            quantized_model(dummy_input)

    # Benchmark original
    start = time.perf_counter()
    for _ in range(n_runs):
        with torch.no_grad():
            orig_output = original_model(dummy_input)
    orig_time = (time.perf_counter() - start) / n_runs

    # Benchmark quantized
    start = time.perf_counter()
    for _ in range(n_runs):
        with torch.no_grad():
            quant_output = quantized_model(dummy_input)
    quant_time = (time.perf_counter() - start) / n_runs

    # Check output consistency
    with torch.no_grad():
        orig_out = original_model(dummy_input)
        quant_out = quantized_model(dummy_input)

    orig_probs = torch.softmax(orig_out, dim=1)
    quant_probs = torch.softmax(quant_out, dim=1)
    max_diff = float(torch.max(torch.abs(orig_probs - quant_probs)))

    orig_pred = int(torch.argmax(orig_probs))
    quant_pred = int(torch.argmax(quant_probs))

    return {
        'original_latency_ms': round(orig_time * 1000, 2),
        'quantized_latency_ms': round(quant_time * 1000, 2),
        'speedup_factor': round(orig_time / quant_time, 2) if quant_time > 0 else 1.0,
        'max_probability_diff': round(max_diff, 6),
        'predictions_match': orig_pred == quant_pred,
        'n_runs': n_runs,
    }
