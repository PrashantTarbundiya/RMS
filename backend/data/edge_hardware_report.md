# Edge Hardware & Model Benchmark Report

> Generated: 2026-07-31 21:45:09
> System: 12 CPU cores, 15790.0 MB RAM
> Process RAM: 1518.3 MB

---

## 1. Face Detector Comparison

| Detector | Avg Latency | P95 Latency | FPS | Detection Rate |
|----------|-------------|-------------|-----|----------------|
| MediaPipe (SideFaceDetector) | 2.6ms | 3.0ms | 380.5 | 100.0% |
| OpenCV Haar Cascade | 0.8ms | 1.0ms | 1249.7 | 0.0% |
| OpenCV DNN (Caffe SSD) | N/A | N/A | N/A | Model files not found. Download deploy.prototxt and res10_300x300_ssd_iter_140000.caffemodel to backend/data/ |

---

## 2. Embedding Model Comparison

| Model | Dim | Avg Latency | P95 Latency | FPS | Accuracy |
|-------|-----|-------------|-------------|-----|----------|
| Facenet512 (DeepFace) | 512d | 423.4ms | 525.9ms | 2.4 | 100.0% |
| ArcFace (DeepFace) | 512d | 706.9ms | 996.9ms | 1.4 | 0% |
| GhostFaceNet (EdgeFace) | 512d | 1307.5ms | 1486.7ms | 0.8 | 0% |

---

## 3. Edge Deployment Recommendations

- **Fastest Detector:** OpenCV Haar Cascade (0.8ms, 1249.7 FPS)
- **Best Detection Rate:** MediaPipe (SideFaceDetector) (100.0%)
- **Fastest Embedding Model:** Facenet512 (DeepFace) (423.4ms)
- **Highest Accuracy Model:** Facenet512 (DeepFace) (100.0%)

### For Jetson Nano / Orin Nano
- Use **MediaPipe (SideFaceDetector)** for detection
- Use **Facenet512 (DeepFace)** with TensorRT optimization

### For Raspberry Pi 5 / RK3588
- Use **OpenCV Haar Cascade** for detection (lowest CPU overhead)
- Use **Facenet512** or **MobileFaceNet** for embedding
- Consider ONNX Runtime for optimized inference
