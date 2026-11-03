import os

SKILLS_DIR = os.path.abspath(".agents/skills")
os.makedirs(SKILLS_DIR, exist_ok=True)

ai_skills = [
    {
        "name": "machine-learning-engineering",
        "description": "Architect, train, evaluate, optimize, and package machine learning pipelines and deep neural network models for face verification and feature extraction.",
        "category": "AI and Computer Vision",
        "reference": "Deep Learning (Goodfellow, Bengio, Courville); ONNX Runtime Standards",
        "license": "Apache-2.0",
        "content": r"""# Machine Learning Engineering Protocol

## Purpose & Scope
Governs ML model selection, quantization, export, and inference lifecycle in AuraPass Enterprise.

## Technical Standards
1. **Model Serialization**:
   - Primary: ONNX format for cross-platform portability.
   - Secondary: PyTorch state dicts (`.pth`) with explicit architecture definitions.
   - Vector Indices: Scikit-learn NearestNeighbors or FAISS L2/Cosine index.
2. **Quantization & Acceleration**:
   - Quantize fp32 models to dynamic int8 for CPU edge inference (reducing memory by ~70%).
   - DirectML / CUDA execution providers enabled conditionally based on hardware acceleration.
3. **Inference Latency Targets**:
   - Face Detection: $\le 25\text{ms}$ on CPU.
   - Landmark Alignment: $\le 10\text{ms}$.
   - Feature Embedding: $\le 65\text{ms}$ (Facenet512 / GhostFaceNet).
   - Total Pipeline per Frame: $\le 120\text{ms}$.

## Verification Checklist
- [ ] Exported ONNX graph passes validation with `onnx.checker.check_model()`.
- [ ] Model weights do not exceed edge deployment budget ($\le 50\text{MB}$).
- [ ] Precision / Recall evaluated against standard benchmarks prior to production deployment.
"""
    },
    {
        "name": "computer-vision",
        "description": "Apply digital image processing, illumination normalization, color space transformations, CLAHE, and geometric corrections to facial images.",
        "category": "AI and Computer Vision",
        "reference": "Digital Image Processing (Gonzalez & Woods); OpenCV 4.x Vision Pipeline",
        "license": "Apache-2.0",
        "content": r"""# Computer Vision Pipeline Standard

## Purpose & Scope
Standardizes low-level image processing, lighting compensation, and geometric normalization across camera input streams.

## Operational Procedures
1. **Preprocessing Pipeline**:
   - BGR to RGB conversion.
   - Bilateral filtering or Gaussian blur to suppress camera sensor noise without eroding edges.
   - Contrast Limited Adaptive Histogram Equalization (CLAHE) on the L-channel in LAB color space:
     ```python
     lab = cv2.cvtColor(crop, cv2.COLOR_RGB2LAB)
     l, a, b = cv2.split(lab)
     clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
     cl = clahe.apply(l)
     normalized = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2RGB)
     ```
2. **Aspect Ratio Preservation**:
   - Pad letterboxing to $112 \times 112$ or $160 \times 160$ without non-uniform stretching or distortion.

## Verification Checklist
- [ ] Color channel ordering is consistently RGB before passing to neural networks.
- [ ] Illumination normalization preserves facial feature landmarks.
- [ ] Cropped bounding boxes include appropriate contextual padding ($15-20\%$).
"""
    },
    {
        "name": "face-recognition-research",
        "description": "Research, benchmark, and implement state-of-the-art deep face recognition architectures including ArcFace, CosFace, MagFace, and GhostFaceNet.",
        "category": "AI and Computer Vision",
        "reference": "Deng et al., ArcFace: Additive Angular Margin Loss for Deep Face Recognition (CVPR 2019)",
        "license": "MIT",
        "content": r"""# Face Recognition Research & Loss Architectures

## Purpose & Scope
Guides mathematical formulation and architectural evaluation of deep feature embedding extractors.

## Deep Embedding Formulations
1. **ArcFace Loss (Additive Angular Margin)**:
   $$\mathcal{L} = -\log \frac{e^{s(\cos(\theta_{y_i} + m))}}{e^{s(\cos(\theta_{y_i} + m))} + \sum_{j \neq y_i} e^{s \cos \theta_j}}$$
   - Enhances intra-class compactness and inter-class discrepancy on a hypersphere.
   - Recommended hypersphere scale: $s = 64.0$, margin: $m = 0.50$.
2. **Backbone Implementations**:
   - Primary Authoritative Model: Facenet512 (Inception-ResNet-v1, 512-d).
   - Secondary Multi-Angle Verifier: InsightFace ResNet-50 / ArcFace (512-d).
   - Lightweight Edge Model: GhostFaceNet-V2 (512-d, $\sim 15\text{MB}$).

## Verification Checklist
- [ ] Embedding vector $L_2$ norm equals $1.0$ ($\|e\|_2 = 1.0$) for cosine similarity comparability.
- [ ] Multi-model agreement requires cosine distance consensus below threshold before confirming match.
"""
    },
    {
        "name": "face-embedding-evaluation",
        "description": "Evaluate face embedding vector spaces, calculate distance metrics (Cosine vs Euclidean L2), compute ROC curves, and calibrate decision thresholds.",
        "category": "AI and Computer Vision",
        "reference": "NIST Face Recognition Vendor Test (FRVT); ISO/IEC 19795 Biometric Performance Testing",
        "license": "Apache-2.0",
        "content": r"""# Face Embedding Metric Evaluation & Threshold Calibration

## Purpose & Scope
Mathematical procedures for tuning acceptance thresholds, minimizing False Acceptance Rate (FAR) and False Rejection Rate (FRR).

## Distance Metric Calibration
1. **Cosine Distance**:
   $$D_{\text{cosine}}(u, v) = 1 - \frac{u \cdot v}{\|u\|_2 \|v\|_2}$$
   - Range: $[0, 2]$. Identical faces: $\to 0$.
2. **Euclidean Distance on Normalized Vectors**:
   $$D_{\text{euclidean}}(u, v) = \sqrt{2 \cdot D_{\text{cosine}}(u, v)}$$
3. **Threshold Calibration Strategy**:
   - **Strict Mode** (High Security / Access Control): Cosine distance $\le 0.30$ (Confidence $\ge 85\%$).
   - **Balanced Mode** (Daily Enterprise Attendance): Cosine distance $\le 0.38$ (Confidence $\ge 81\%$).
   - **Open-Set Negative Rejection**: If distance to nearest neighbor $> 0.40$, classified as `Unknown`.

## Verification Checklist
- [ ] Threshold evaluated against negative open-set controls (faces not enrolled in system).
- [ ] Confidence percentage correctly maps non-linearly: $\text{Confidence} = \max(0, (1 - D / 0.40)) \times 100\%$.
"""
    },
    {
        "name": "face-detection",
        "description": "Configure, tune, and benchmark multi-scale face detection models including RetinaFace, MediaPipe BlazeFace, MTCNN, and OpenCV YuNet.",
        "category": "AI and Computer Vision",
        "reference": "Deng et al., RetinaFace: Single-shot Multi-level Face Localisation in the Wild (CVPR 2020)",
        "license": "MIT",
        "content": r"""# Face Detection Engineering Standard

## Purpose & Scope
Configures robust single-shot and multi-scale face localization models across varying lighting and camera angles.

## Detector Hierarchy in AuraPass
1. **Primary Detector**: MediaPipe BlazeFace / SideFaceDetector.
   - Ultra-fast CPU inference ($\sim 15\text{ms}$).
   - Extracts 6 primary 2D landmarks (eyes, nose, mouth corners, ears).
2. **High-Accuracy Fallback**: RetinaFace (ResNet50 / MobileNet0.25).
   - High recall on profile angles and partially occluded faces.
3. **Lightweight Edge Detector**: OpenCV YuNet (ONNX format).

## Operational Rules
- Minimum face detection bounding box: $60 \times 60$ pixels. Smaller faces rejected as low-quality.
- Non-Maximum Suppression (NMS) IoU threshold: $0.40$.
- Confidence cutoff: $\ge 0.50$.

## Verification Checklist
- [ ] Bounding boxes do not clip forehead or chin regions.
- [ ] Profile faces up to $\pm 60^\circ$ yaw reliably detected without false positives on background patterns.
"""
    },
    {
        "name": "face-alignment",
        "description": "Perform 2D/3D facial landmark extraction, affine transformation, and canonical pose alignment to normalize face crops before feature extraction.",
        "category": "AI and Computer Vision",
        "reference": "Kazemi & Sullivan, One Millisecond Face Alignment with an Ensemble of Trees (CVPR 2014)",
        "license": "BSD-3-Clause",
        "content": r"""# Face Alignment & Canonical Pose Normalization

## Purpose & Scope
Aligns detected faces to canonical coordinates, eliminating roll and tilt distortion to optimize feature extraction.

## Operational Procedures
1. **5-Point Landmark Extraction**:
   - Left eye $(x_l, y_l)$, Right eye $(x_r, y_r)$, Nose tip $(x_n, y_n)$, Left mouth corner, Right mouth corner.
2. **Canonical Transformation Matrix**:
   - Calculate eye center midpoint: $C = \frac{E_l + E_r}{2}$.
   - Compute roll angle: $\theta = \arctan\left(\frac{y_r - y_l}{x_r - x_l}\right)$.
   - Scale factor: $s = \frac{D_{\text{target}}}{D_{\text{measured}}}$.
   - Apply affine transformation via `cv2.getRotationMatrix2D` and `cv2.warpAffine` to produce standard $112 \times 112$ crop.

## Verification Checklist
- [ ] Eye centers align horizontally at fixed vertical coordinate ($y \approx 38\%$ of image height).
- [ ] Canonical crop contains zero boundary black padding artifacts.
"""
    },
    {
        "name": "face-quality-assessment",
        "description": "Assess image quality metrics including blur/sharpness, illumination, pose angles (yaw, pitch, roll), and facial occlusion.",
        "category": "AI and Computer Vision",
        "reference": "ISO/IEC 29794-5 Biometric Sample Quality — Face Image Data; SER-FIQ Quality Standard",
        "license": "Apache-2.0",
        "content": r"""# Face Quality Assessment (FQA) Standard

## Purpose & Scope
Ensures only high-quality, uncorrupted facial samples are processed for enrollment and verification.

## Quality Metrics & Thresholds
1. **Sharpness (Blur Detection)**:
   - Evaluated via variance of the Laplacian:
     $$\text{Var}(\nabla^2 I) \ge 100.0$$
   - Samples below $100.0$ are flagged as motion-blurred.
2. **Illumination Uniformity**:
   - Mean brightness on facial mask: $80 \le \mu_L \le 200$.
   - Shadow contrast ratio between left and right facial hemispheres $\le 2.5$.
3. **Head Pose Boundaries**:
   - Yaw: $\pm 35^\circ$
   - Pitch: $\pm 25^\circ$
   - Roll: $\pm 20^\circ$

## Verification Checklist
- [ ] Low-quality frames rejected early in pipeline with actionable user UI prompts ("Hold still", "Increase lighting").
- [ ] High-confidence false rejections tracked and inspected against FQA logs.
"""
    },
    {
        "name": "face-anti-spoofing",
        "description": "Implement multi-cue biometric liveness detection combining texture analysis, frequency spectrum, color distortion, and CNN liveness voting.",
        "category": "AI and Computer Vision",
        "reference": "Boulkenafet et al., Face Spoofing Detection Using Colour Texture Analysis (TIFS 2016)",
        "license": "IEEE / Open Research",
        "content": r"""# Face Anti-Spoofing & Liveness Protocol

## Purpose & Scope
Prevents presentation attacks using printed photos, video replays, and digital displays.

## Multi-Cue Defense Architecture
1. **Color & Chrominance Distortion**:
   - Compute standard deviation and Fourier spectrum in YCrCb and HSV color spaces. Printed paper and screens exhibit spectral banding (Moiré patterns).
2. **Eye Blink & Dynamic Motion**:
   - Track Eye Aspect Ratio (EAR): $\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$.
   - Detect natural blink dynamics over a $1.5\text{s}$ video buffer.
3. **Deep CNN Anti-Spoofing Classifier**:
   - MobileNetV2 binary classifier trained on genuine vs. spoof presentations.

## Verification Checklist
- [ ] Screen replay attack (iPad/phone display) triggers `SPOOF DETECTED` with confidence $\ge 90\%$.
- [ ] High-resolution color photo printout fails texture analysis.
- [ ] Genuine users experience zero latency degradation ($\le 20\text{ms}$ overhead).
"""
    },
    {
        "name": "presentation-attack-detection",
        "description": "Audit, test, and harden facial recognition systems against ISO/IEC 30107-3 Presentation Attack Detection (PAD) levels A, B, and C.",
        "category": "AI and Computer Vision",
        "reference": "ISO/IEC 30107-3 Biometric Presentation Attack Detection — Testing and Reporting",
        "license": "ISO Standard",
        "content": r"""# Presentation Attack Detection (PAD) Framework

## Purpose & Scope
Compliance and verification procedures aligned with ISO/IEC 30107-3 international standards.

## Threat Levels Covered
- **Level A (Novice)**: Paper printouts, flat screen displays, still photos.
- **Level B (Intermediate)**: Curved video displays, paper masks with eye cutouts, latex masks.
- **Level C (Expert)**: 3D silicone human masks, deepfake real-time video injection.

## Test & Reporting Metrics
- **APCER** (Attack Presentation Classification Error Rate): Proportion of spoof attacks misclassified as bona fide.
- **BPCER** (Bona Fide Presentation Classification Error Rate): Proportion of genuine presentations misclassified as attacks.

## Verification Checklist
- [ ] Target APCER $\le 1.0\%$ at BPCER $\le 0.5\%$.
- [ ] Audit logs record presentation attack classification telemetry with bounding box snapshots.
"""
    },
    {
        "name": "model-benchmarking",
        "description": "Benchmark face recognition models on standard academic datasets (LFW, CFP-FP, AgeDB) and measure throughput (FPS), latency, and memory footprint.",
        "category": "AI and Computer Vision",
        "reference": "LFW (Labeled Faces in the Wild); NIST FRVT 1:1 Verification Benchmarks",
        "license": "Public Domain",
        "content": r"""# Model Benchmarking & Throughput Profiling

## Purpose & Scope
Establishes empirical baselines for model accuracy, hardware resource consumption, and inference latency.

## Standard Evaluation Protocols
1. **Accuracy Benchmarks**:
   - LFW (Unconstrained 1:1 verification accuracy).
   - CFP-FP (Celebrities in Frontal-Profile — assesses pose invariance).
   - AgeDB-30 (Evaluates temporal aging robustness).
2. **Hardware Profiling**:
   - Peak RAM / VRAM allocation during batch inference.
   - Per-frame throughput (Frames Per Second) on standard 4-core CPU appliances.

## Verification Checklist
- [ ] Baseline accuracy on LFW verified $\ge 99.2\%$.
- [ ] Inference time measured over 1,000 warm-up runs with standard deviation reported.
- [ ] No memory leaks detected over 24-hour continuous streaming stress tests.
"""
    },
    {
        "name": "model-monitoring",
        "description": "Monitor production model behavior, detect embedding drift, track unknown face clusters, and aggregate operational telemetry.",
        "category": "AI and Computer Vision",
        "reference": "Sculley et al., Hidden Technical Debt in Machine Learning Systems (NeurIPS)",
        "license": "Apache-2.0",
        "content": r"""# Model Monitoring & Telemetry Standard

## Purpose & Scope
Continuous observability of machine learning model performance in production deployments.

## Monitored Indicators
1. **Confidence Distribution Drift**:
   - Track 7-day rolling median of match confidence scores. A drop below $82\%$ indicates sensor degradation, lens smudging, or lighting changes.
2. **False Rejection Spike Detection**:
   - Monitor ratio of `Unknown` classifications during peak shift arrival hours ($8:30 - 9:30\text{ AM}$).
3. **Edge Disconnect & Latency Telemetry**:
   - Track round-trip WebSocket recognition latency.

## Verification Checklist
- [ ] Telemetry events recorded in `audit_logs` without storing unencrypted raw biometrics.
- [ ] Alerts triggered automatically when confidence drop exceeds $2\sigma$ historical standard deviation.
"""
    },
    {
        "name": "ml-data-quality",
        "description": "Audit and sanitize employee photo training datasets, eliminate duplicates, balance class samples, and enforce resolution standards.",
        "category": "AI and Computer Vision",
        "reference": "Data-Centric AI (Andrew Ng); ISO/IEC 19794-5 Biometric Data Interchange Formats",
        "license": "Apache-2.0",
        "content": r"""# Machine Learning Data Quality Standard

## Purpose & Scope
Ensures training datasets in `dataset_cleaned/` are pristine, properly labeled, and free of synthetic or corrupted samples.

## Dataset Curation Rules
1. **Sample Quantity per Person**:
   - Minimum: 3 diverse photos (frontal, left $20^\circ$, right $20^\circ$).
   - Recommended: 5 - 15 photos under varied natural office lighting.
2. **Resolution & Crop Requirements**:
   - Minimum resolution: $250 \times 250$ pixels per face region.
   - Sharpness score $\ge 120.0$.
3. **Deduplication & Hygiene**:
   - MD5 hash check prevents duplicate image uploads.
   - Background celebrity benchmark datasets (LFW) must remain strictly segregated from enterprise tenant rosters.

## Verification Checklist
- [ ] Every enrolled person folder contains only validated photos of that single individual.
- [ ] Zero synthetic, duplicate, or corrupted image files in training directories.
- [ ] Directory names strictly match canonical database employee names.
"""
    }
]

for skill in ai_skills:
    s_dir = os.path.join(SKILLS_DIR, skill["name"])
    os.makedirs(s_dir, exist_ok=True)
    skill_md = os.path.join(s_dir, "SKILL.md")
    content = f"""---
name: {skill["name"]}
description: >-
  {skill["description"]}
---

{skill["content"]}

---

## Skill Metadata
- **Category**: {skill["category"]}
- **Authoritative Reference**: {skill["reference"]}
- **License**: {skill["license"]}
- **Scope**: Workspace Agent Skill (`.agents/skills/{skill["name"]}`)
"""
    with open(skill_md, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated {len(ai_skills)} AI & Computer Vision skills successfully.")

