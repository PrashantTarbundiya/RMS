# 06 AI Model Architecture

## Overview
RMS Face AI utilizes a **Multi-Stage Ensemble Pipeline** combining deep learning face detection, anti-spoofing liveness checks, rapid vector similarity indexing, and deep categorical classification. The pipeline is designed to deliver a definitive binary "CONFIRMED" or "NOT FOUND" result through a strict 4-gate confirmation process.

## Stage 1: Face Detection (MediaPipe BlazeFace)
Before any recognition occurs, faces must be precisely located and cropped from the input image.

- **Algorithm:** MediaPipe BlazeFace deep learning model.
- **Capabilities:**
  - Detects faces at extreme angles (0°–90° yaw, including full side profiles).
  - Handles partial occlusions (glasses, masks, hair).
  - Works robustly across varying lighting conditions.
  - Returns precise bounding boxes with facial mesh landmarks.
- **Pose Classification:** Landmark-based geometric analysis classifies head orientation as `Frontal`, `Left Profile`, or `Right Profile` for multi-view matching.
- **Why MediaPipe?** Replaced the legacy OpenCV Haar Cascade classifier, which struggled with extreme side profiles (>45° yaw) and produced high false positive rates on background objects.

## Stage 2: Liveness Detection (Anti-Spoofing Voting System)
Each detected face is evaluated for liveness before being passed to the recognition models. This prevents presentation attacks (printed photos, screen replays).

The system uses a **2-Failure Voting System**. A face must fail at least 2 heuristic checks to be classified as a spoof. This prevents false positives caused by isolated environmental factors (like screen reflections on glasses).

- **Edge Density (Laplacian Variance, threshold 10.0):** Real faces exhibit rich texture detail. Blurry printed photos and low-res screens produce flatter texture patterns and fail this check.
- **Color Variance Analysis (Saturation 5.0, Hue 3.0):** Real faces have natural color gradients across skin tones. Printed images show more uniform color blocks.
- **Specular Glare (Brightness > 40%):** Phone/tablet glass produces massive specular highlights. The threshold is relaxed to 40% to accommodate users wearing glasses in brightly lit rooms.
- **Texture Frequency (Moiré Peak < 0.60):** Evaluates frequency-domain characteristics to detect screen pixel grids and moiré artifacts.
- **Decision:** If the face fails ≥2 checks, it is flagged as `SPOOF DETECTED` and rejected before any ML inference occurs.

## Stage 3: Structural Embeddings (DeepFace/FaceNet512 + TTA)
**Goal:** High-speed vector similarity matching with enhanced robustness through Test-Time Augmentation.

### Embedding Generation
- DeepFace passes the cropped, CLAHE-normalized face through the FaceNet512 architecture, producing a 512-dimensional floating-point vector (embedding).
- **CLAHE Preprocessing:** Contrast Limited Adaptive Histogram Equalization normalizes shadows and harsh overhead lighting before embedding extraction.

### Test-Time Augmentation (TTA)
Instead of generating a single embedding, the system creates 5 augmented variants of the input face:
1. Original image
2. Horizontally flipped
3. Slightly brightened
4. Slightly darkened
5. Small rotation
The 5 embeddings are averaged into a single robust vector, significantly reducing sensitivity to lighting variations and minor pose changes.

### KNN Matching
- **Storage:** Embeddings are stored in RAM via `encodings.pickle` alongside person identifiers.
- **Inference:** Scikit-Learn's `KNeighborsClassifier` calculates cosine distance between the incoming TTA-averaged embedding and all known vectors.
- **Per-Camera Thresholds:** Each physical camera can override the global `CONFIRM_THRESHOLD` for environment-specific tuning (e.g., `0.40` for well-lit lobbies, `0.60` for dim warehouses).

### Zero-Shot Enrollment
When a new employee is enrolled, embeddings are computed and appended to the Pickle dictionary immediately. No neural network retraining required — the new employee is instantly searchable by KNN.

## Stage 4: Deep Classifier (MobileNetV2 SOTA)
**Goal:** High-accuracy categorical confirmation as a secondary validator.

- **Architecture:** MobileNetV2 base layers loaded with ImageNet weights (transfer learning). Base layers are frozen. The final classification head is replaced with a custom Linear layer matching the exact number of enrolled employees.
- **Strengths:** Learns robust features (lighting variance, side profiles, partial occlusions) that raw Euclidean distance sometimes misses.
- **Weakness:** Slow to train. Adding a new employee requires backpropagation over the entire dataset, taking minutes/hours depending on hardware.
- **Graceful Degradation:** If the SOTA model is not yet trained (new deployment or recently enrolled employee), the system automatically falls back to DeepFace-only inference and labels results as `[UNTRAINED]` for the SOTA component.

## Stage 5: Ensemble Voting & 4-Gate Confirmation (`ensemble.py`)
The ensemble engine combines outputs from both models through a strict multi-gate confirmation pipeline:

### Gate 1: Distance Threshold
If DeepFace is active, its cosine distance must be below `CONFIRM_THRESHOLD` (default: 0.55). If the distance exceeds this threshold, the face is rejected regardless of SOTA output.

### Gate 2: Binary Classifier Agreement
If both DeepFace and MobileNetV2 agree on the identity label, an agreement bonus is applied to the confidence score. If they disagree, the system defaults to the DeepFace result (which has the embedding-backed geometric proof).

### Gate 3: Dynamic Adaptive Threshold
The effective threshold is dynamically adjusted based on camera-specific overrides, the confidence level of the match, and the number of active models.

### Gate 4: Resilient Single-Model Fallback
If the global model settings have disabled DeepFace, or if DeepFace is untrained, the ensemble dynamically falls back to relying strictly on the MobileNetV2 SOTA confidence.
The final prediction evaluates `ensemble_result['is_recognized']` rather than enforcing a hardcoded dependency on DeepFace. If the ensemble threshold is met, the system returns a definitive `CONFIRMED` match, otherwise `NOT FOUND / Unknown`.

## Feature Extraction & Normalization
- Images are resized to 160×160 for DeepFace and 224×224 for MobileNetV2.
- **CLAHE** is applied to normalize lighting before all embedding extractions.
- Face crops include a 15% bounding box margin to capture chin and forehead context.

## Performance Metrics
- **Detection Speed:** MediaPipe BlazeFace runs in ~20ms on CPU (vs. ~50ms for Haar Cascade).
- **Full Pipeline:** Detection → Crop → Liveness → TTA → KNN → SOTA → Ensemble executes in ~400–1000ms on Intel i5/i7 CPU.
- **GPU Scaling:** PyTorch automatically utilizes CUDA if an NVIDIA GPU is present, reducing inference to <100ms.
- **Per-Org Model Cache:** Models are cached per organization to avoid reloading on every request.

## Training Loop
Handled by `retrain_all.py` and `models/sota_finetune/finetune.py`.
- **Optimizer:** Adam.
- **Loss Function:** CrossEntropyLoss.
- **Epochs:** Configurable (default 25).
- **Data Augmentation:** RandomHorizontalFlip, RandomRotation, ColorJitter, RandomErasing, and GaussianBlur are applied during the PyTorch DataLoader phase.
- **Progress Reporting:** Real-time SSE (Server-Sent Events) stream training progress to the frontend dashboard.
