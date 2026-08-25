import os
import sys
import pickle
import numpy as np
from scipy.spatial.distance import cosine
from collections import defaultdict
import random

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPTS_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ml_robustness import compute_adaptive_thresholds, mine_hard_negatives

ENCODINGS_FILE = os.path.join(BACKEND_DIR, "data", "encodings.pickle")
if not os.path.exists(ENCODINGS_FILE) and os.path.exists(os.path.join(BACKEND_DIR, "encodings.pickle")):
    ENCODINGS_FILE = os.path.join(BACKEND_DIR, "encodings.pickle")
STATIC_THRESHOLD = 0.40  # Old static threshold

def benchmark():
    print("--- ML Robustness Production Benchmark ---")
    
    if not os.path.exists(ENCODINGS_FILE):
        print(f"Error: {ENCODINGS_FILE} not found. Cannot benchmark.")
        return
        
    print(f"Loading {ENCODINGS_FILE} (this may take a moment)...")
    with open(ENCODINGS_FILE, 'rb') as f:
        data = pickle.load(f)
        
    encodings = data.get('encodings', data.get('embeddings', []))
    names = data.get('names', data.get('labels', []))
    
    if not encodings:
        print("No embeddings found in file.")
        return
        
    print(f"Loaded {len(encodings)} embeddings.")
    
    # Group by person
    person_embeddings = defaultdict(list)
    for emb, name in zip(encodings, names):
        person_embeddings[name].append(np.array(emb))
        
    # Split into 80% train (enrollment), 20% test (held-out)
    train_encs = []
    train_names = []
    test_encs = []
    test_names = []
    
    # Fix random seed for reproducibility
    random.seed(42)
    
    for name, embs in person_embeddings.items():
        if len(embs) < 2:
            # Skip if only 1 embedding
            continue
        random.shuffle(embs)
        split_idx = max(1, int(len(embs) * 0.8))
        
        for e in embs[:split_idx]:
            train_encs.append(e)
            train_names.append(name)
        for e in embs[split_idx:]:
            test_encs.append(e)
            test_names.append(name)
            
    print(f"Split data into {len(train_encs)} train and {len(test_encs)} test embeddings.")
    print(f"Total unique people in train: {len(set(train_names))}")
    
    # 1. Run Hard Negative Mining on Train
    print("\n--- 1. Hard Negative Mining (Train Set) ---")
    hn_results = mine_hard_negatives(train_encs, train_names, similarity_threshold=0.35)
    print(f"Total Pairs Checked: {hn_results['total_pairs_checked']}")
    print(f"Confusable Pairs Found: {len(hn_results['confusable_pairs'])}")
    print(f"High/Critical Risk Pairs: {hn_results['high_risk_count']}")
    if hn_results['confusable_pairs']:
        top_pair = hn_results['confusable_pairs'][0]
        print(f"Most confusable pair: {top_pair['person_a']} vs {top_pair['person_b']} (dist: {top_pair['min_distance']})")
        
    # 2. Compute Adaptive Thresholds on Train
    print("\n--- 2. Adaptive Threshold Calculation ---")
    adaptive_results = compute_adaptive_thresholds(train_encs, train_names, margin=0.05)
    thresholds = adaptive_results.get('thresholds', {})
    global_thresh = adaptive_results.get('global_threshold', STATIC_THRESHOLD)
    print(f"Global Fallback Threshold: {global_thresh:.3f}")
    
    t_vals = [v['threshold'] for v in thresholds.values()]
    if t_vals:
        print(f"Adaptive Thresholds Stats -> Min: {min(t_vals):.3f}, Max: {max(t_vals):.3f}, Avg: {np.mean(t_vals):.3f}")
        below_040 = sum(1 for t in t_vals if t < 0.40)
        print(f"People with threshold < 0.40: {below_040} / {len(t_vals)}")
    
    # 3. Benchmark on Held-out Test Set
    print("\n--- 3. Evaluating on Held-Out Test Set ---")
    
    # Compute centroids from train set for recognition
    train_centroids = {}
    train_person_embs = defaultdict(list)
    for emb, name in zip(train_encs, train_names):
        train_person_embs[name].append(emb)
    for name, embs in train_person_embs.items():
        train_centroids[name] = np.mean(embs, axis=0)
        
    static_false_positives = 0
    static_false_negatives = 0
    static_true_positives = 0
    
    adaptive_false_positives = 0
    adaptive_false_negatives = 0
    adaptive_true_positives = 0
    
    total_tests = len(test_encs)
    
    for test_emb, true_name in zip(test_encs, test_names):
        # Find nearest neighbor in train centroids
        best_name = None
        best_dist = float('inf')
        for name, centroid in train_centroids.items():
            dist = cosine(test_emb, centroid)
            if dist < best_dist:
                best_dist = dist
                best_name = name
                
        # Evaluate Static Threshold
        if best_dist <= STATIC_THRESHOLD:
            # System accepted the match
            if best_name == true_name:
                static_true_positives += 1
            else:
                static_false_positives += 1
        else:
            # System rejected
            if best_name == true_name:
                static_false_negatives += 1
                
        # Evaluate Adaptive Threshold
        person_thresh = thresholds.get(best_name, {}).get('threshold', global_thresh)
        if best_dist <= person_thresh:
            if best_name == true_name:
                adaptive_true_positives += 1
            else:
                adaptive_false_positives += 1
        else:
            if best_name == true_name:
                adaptive_false_negatives += 1

    print("Baseline (Static Threshold = 0.40):")
    print(f"  True Positives:  {static_true_positives}")
    print(f"  False Positives: {static_false_positives}")
    print(f"  False Negatives: {static_false_negatives}")
    
    print(f"\nAdaptive Thresholds:")
    print(f"  True Positives:  {adaptive_true_positives}")
    print(f"  False Positives: {adaptive_false_positives}")
    print(f"  False Negatives: {adaptive_false_negatives}")
    
    if static_false_positives > 0:
        reduction = (static_false_positives - adaptive_false_positives) / static_false_positives * 100
        print(f"\n=> False Positive Reduction: {reduction:.1f}%")
    else:
        print("\n=> False Positive Reduction: N/A (0 baseline FP)")
        
    print("\nBenchmark Complete.")

if __name__ == '__main__':
    benchmark()
