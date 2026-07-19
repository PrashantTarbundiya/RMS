# RMS Face AI — Complete Project Guide

## What is This Project?

**RMS Face AI** is a production-ready, modular face recognition system designed to identify individuals from frontal and profile side views (up to 90° rotation). The system combines deep learning vision backbones (SOTA MobileNetV2) and deep metric embeddings (DeepFace/Facenet512) into a unified ensemble voting layer.

The project consists of three main systems:
- A **Premium React Web Dashboard** (Vite + CSS) for identity enrollment, model training control, and real-time inference testing.
- An **Enterprise Flask API Server** (Python 3.12) featuring modular multi-tenant database adapters (PostgreSQL) or single-tenant local file storage fallbacks.
- An **On-device Mobile App** (React Native/Expo) for portable biometric scanning.

---

## Technical Specifications & Features

### 1. Hybrid Ensemble Architecture
The system supports dual inference pipelines that vote on identity classifications:
* **SOTA MobileNetV2:** Fine-tuned on local training classes. The vision model understands facial orientation features and is optimized for speed and generalization.
* **DeepFace (Facenet512):** Generates a 512-dimension spatial embedding vector per face. A K-Nearest Neighbors (KNN) classifier with cosine distance evaluates matches against enrolled class centroids.
* **Global Model Selection:** DeepFace/Ensemble settings can be disabled entirely in Settings. When disabled, the server bypasses embedding computation, saves memory, and relies strictly on SOTA MobileNetV2.

### 2. Multi-View Landmarked Alignment
RMS captures left-profile, frontal, and right-profile views during enrollment. During video stream ingestion, MediaPipe evaluates head rotation keypoints:
* Faces rotated up to 30° are evaluated against frontal embeddings.
* Faces rotated between 30° to 90° are mapped against left or right profile vectors, enabling side-face identification.

### 3. Integrated Asset Allocation Layout
The **Enrollment & Update** interface is organized into profile-centric row grids:
* **Row 1 (LEFT, FRONT, RIGHT):** Displays category dropzones side-by-side.
* **Row 2 (EXTRA FILES):** Positioned directly below Row 1 for bulk/additional uploads.
* **Inline Photo Grids:** Already-enrolled database photos are grouped directly inside their respective Left, Front, or Right folders with green `Enrolled` badges, alongside new local uploads with violet `New` badges.
* **Drag-and-Drop Relocation:** Relocate any photo (`Enrolled` or `New`) between categories by dragging it. Dropping an enrolled photo updates the file on disk via `/api/persons/<name>/photos/move` and hot-reloads models.

### 4. Real-time Video Telemetry & Bounding Boxes
* The Webcam test console continuously polls frame captures (every 1.5 seconds) in the background.
* Scaled bounding boxes are overlayed on top of the live `<video>` element with name labels ("SPOOF", "UNKNOWN", or the recognized name).
* Supports **Capture & Run Inference** to draw the current video frame on a canvas, halt the video feed, and execute static inference.

### 5. Operator Feedback & Custom Relabeling
If the models make a mistake, operators can trigger a structured 3-step feedback form:
1. Confirm if a human face is present (filter out false detections).
2. Confirm if the predicted classification label is correct.
3. Select an existing person from a dropdown or type a custom name to dynamically append/relabel the face data.

---

## Folder Structure

```
RMS/
├── backend/                     # Python Flask API Server
│   ├── server.py                # Main Flask application and blueprints
│   ├── middleware.py            # JWT auth, tenant isolation, and CORS handling
│   ├── model.py                 # DeepFace vector generation and preprocessing
│   ├── inference.py             # KNN matching and cosine distance voting
│   ├── ensemble.py              # Combined model result voter
│   ├── face_detection.py        # MediaPipe BlazeFace alignment & pose logic
│   ├── add_person_utils.py      # Multi-view fast enrollment triggers
│   ├── models/
│   │   └── sota_finetune/
│   │       ├── finetune.py      # MobileNetV2 architecture fine-tuning
│   │       └── mobile_classes.txt # Known personnel indices
│   └── venv/                    # Python virtual environment
│
├── frontend/                    # Vite + React Web Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Roster search, model health, and stats
│   │   │   ├── UploadPage.jsx   # Row-based drag-and-drop enrollment page
│   │   │   ├── TestPage.jsx     # Live webcam bounding boxes and feedback
│   │   │   ├── ModelsPage.jsx   # DeepFace settings switches and thresholds
│   │   │   └── ProfilePage.jsx  # Account settings and storage infrastructure logs
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT token storage and API clients
│   │   └── config.js            # Axios endpoint settings
│   ├── index.css                # Base Tailwind-compatible utilities
│   └── dist/                    # Minified production bundle
│
├── mobile/                      # React Native Expo Mobile App
│
├── dataset/                     # Raw uploads (unprocessed)
└── dataset_cleaned/             # Cropped and aligned training images
    └── PersonName/
        ├── frontal/             # Front-facing photos
        ├── left/                # Left-profile photos
        ├── right/               # Right-profile photos
        └── extra/               # Unsorted bulk photos
```

---

## Local Configuration Reference

| Parameter | Configuration File | Description |
|-----------|--------------------|-------------|
| `DEPLOYMENT_MODE` | `backend/.env` | `local` (single-tenant SQLite/files) or `cloud` (multi-tenant PostgreSQL) |
| `LAZY_LOAD_MODELS` | `backend/.env` | If `true`, models load on the first API request to save start RAM |
| `MAX_DISTANCE` | `backend/inference.py` | Max cosine distance threshold (default: 0.55) to accept match |
| `MIN_CONFIDENCE_THRESHOLD` | `backend/ensemble.py` | Final voting confidence threshold. Lower shows "UNKNOWN" |
|---------|------|--------------|--------------|
| `NUM_AUGMENTS` | `model.py` | 5 | How many augmented variants per training image |
| `KNN_K` | `inference.py` | 5 | Number of nearest neighbors for DeepFace voting |
| `MAX_DISTANCE` | `inference.py` | 0.55 | Max cosine distance to accept a match |
| `MIN_CONFIDENCE_THRESHOLD` | `ensemble.py` | 0.25 | Below this → "Unknown" |
| `AGREEMENT_BONUS` | `ensemble.py` | 0.10 | Bonus when 2+ models agree |
