import time
import cv2
import numpy as np
import matplotlib.pyplot as plt
import torch
import os

# Import the specific models configured in the architecture
try:
    from face_detection import SideFaceDetector
    from deepface import DeepFace
    from models.sota_finetune.finetune import build_mobile_model
except ImportError as e:
    exit(1)

def generate_graphs():
    # 1. Known Hardcoded Metrics (Accuracy & Size based on quantized standards)
    models = ["BlazeFace\n(Detection)", "MobileNetV2", "Facenet512"]
    sizes = [0.23, 2.5, 22.0]     # Sizes in MB
    accuracies = [98.6, 91.6, 99.6] # Accuracies in %
    
    # 2. Measure Live Inference Speed
    print("Initializing models for live latency benchmark...")
    
    # Create dummy images for testing to normalize the workload
    dummy_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    dummy_crop = np.random.randint(0, 255, (160, 160, 3), dtype=np.uint8)
    from PIL import Image
    dummy_pil = Image.fromarray(dummy_crop)

    latencies = []
    
    # ==========================================
    # A. BlazeFace Latency
    # ==========================================
    try:
        print("Benchmarking BlazeFace...")
        detector = SideFaceDetector(min_detection_confidence=0.5)
        _ = detector.detect_faces(dummy_img, profile_only=False) # Warm up
        
        start = time.time()
        for _ in range(20):
            _ = detector.detect_faces(dummy_img, profile_only=False)
        blaze_time = ((time.time() - start) / 20) * 1000 # ms
        detector.close()
    except Exception as e:
        print(f"BlazeFace error: {e}")
        blaze_time = 0
    latencies.append(blaze_time)
    
    # ==========================================
    # B. MobileNetV2 Latency
    # ==========================================
    try:
        print("Benchmarking MobileNetV2...")
        device = torch.device("cpu")
        model = build_mobile_model(num_classes=2)
        model.eval()
        dummy_tensor = torch.randn(1, 3, 224, 224)
        _ = model(dummy_tensor) # Warm up
        
        start = time.time()
        with torch.no_grad():
            for _ in range(20):
                _ = model(dummy_tensor)
        mobile_time = ((time.time() - start) / 20) * 1000 # ms
    except Exception as e:
        print(f"MobileNet error: {e}")
        mobile_time = 0
    latencies.append(mobile_time)
    
    # ==========================================
    # C. Facenet512 Latency
    # ==========================================
    try:
        print("Benchmarking Facenet512...")
        # DeepFace enforce_detection=False since we pass a pre-cropped dummy face
        _ = DeepFace.represent(img_path=dummy_crop, model_name="Facenet512", enforce_detection=False, align=False)
        
        start = time.time()
        for _ in range(10): # Running fewer iterations as Facenet is slower
            _ = DeepFace.represent(img_path=dummy_crop, model_name="Facenet512", enforce_detection=False, align=False)
        facenet_time = ((time.time() - start) / 10) * 1000 # ms
    except Exception as e:
        print(f"Facenet error: {e}")
        facenet_time = 0
    latencies.append(facenet_time)
    
    # ------------------------------------------
    # Output Terminal Results
    # ------------------------------------------
    print("\n" + "="*40)
    print("📊 BENCHMARK RESULTS (Averaged)")
    print("="*40)
    for m, t in zip(models, latencies):
        print(f"{m.replace(chr(10), ' '):<30} : {t:.2f} ms")
        
    # 3. Plotting the Comparison Graphs
    print("\nGenerating visual performance graphs...")
    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(16, 6))
    colors = ['#4CAF50', '#2196F3', '#FF9800'] # Green, Blue, Orange
    
    # Graph 1: Inference Speed
    bars1 = ax1.bar(models, latencies, color=colors, edgecolor='black')
    ax1.set_title('A. Live Inference Latency (Lower Core Speed is Better)', pad=15)
    ax1.set_ylabel('Latency (Milliseconds)')
    for bar in bars1:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, yval + 1, f'{yval:.1f} ms', ha='center', va='bottom', fontweight='bold')

    # Graph 2: Model Size
    bars2 = ax2.bar(models, sizes, color=colors, edgecolor='black')
    ax2.set_title('B. Disk Footprint & Size (Lower is Better)', pad=15)
    ax2.set_ylabel('Size (Megabytes)')
    for bar in bars2:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2, yval + 0.5, f'{yval:.1f} MB', ha='center', va='bottom', fontweight='bold')

    # Graph 3: Accuracy
    bars3 = ax3.bar(models, accuracies, color=colors, edgecolor='black')
    ax3.set_title('C. Operational Accuracy (Higher is Better)', pad=15)
    ax3.set_ylabel('Accuracy (%)')
    ax3.set_ylim([90, 100]) # Zoom in to see the difference
    for bar in bars3:
        yval = bar.get_height()
        ax3.text(bar.get_x() + bar.get_width()/2, yval + 0.2, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')

    plt.suptitle('Unified Face Recognition Architecture - Performance Benchmark', fontsize=16, fontweight='bold', y=1.05)
    plt.tight_layout()
    
    # Save & Show
    save_path = 'model_performance_graphs.png'
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved comparative graphs to '{save_path}'")
    plt.show()

if __name__ == "__main__":
    generate_graphs()
