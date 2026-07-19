# Side Face Recognition System (RMS Face AI)

RMS Face AI is a robust, production-grade Face Recognition system capable of identifying individuals from both frontal views and profile side views (up to 90° rotation). It is built as a modular multi-tenant SaaS application containing a React web console, a Flask inference server, and offline biometric capabilities.

## 📄 Research & Architecture References
This implementation combines recent research on non-frontal face recognition with a real-time production architecture:
1.  **Geometric/Soft Biometrics**: Inspired by *Alsubhi et al., 2025*, the system analyzes **anthropometric soft biometrics** (Nose-Eye Offset, Eye Compression ratios, etc.) in real-time to assist in liveness checking.
2.  **Multi-View Pose Alignment**: Rather than relying on synthetic face frontalization GANs which introduce high latency and visual artifacts, RMS employs a **Multi-View Pose Alignment** strategy. It utilizes a custom landmark-based estimator (using MediaPipe BlazeFace) to evaluate head rotation and routes images into **Left Profile**, **Frontal**, and **Right Profile** slots.
3.  **Modular Multi-Tenancy**: Supports PostgreSQL + Alembic migration tables in Cloud deployment mode for multi-tenant isolation, or falls back to an offline, single-tenant local file storage engine in resource-constrained environments.

---

## 🚀 Key Features

* **Real-time Video Bounding Boxes:** Dynamic relative overlay that draws bounding boxes directly on top of the live browser webcam stream, showing user names, "UNKNOWN", or "SPOOF" labels.
* **Inline Drag-and-Drop Relocation:** Reorder local uploads and enrolled database photos by dragging them between **Left**, **Front**, **Right**, and **Extra Files** category slots.
* **Granular Model Settings:** Control DeepFace/Facenet512 ensemble configuration globally. Toggling off DeepFace hides its settings and runs exclusively on the SOTA MobileNetV2 model to conserve server memory.
* **Webcam Snapshot Inference:** Grabs static snapshots directly from the live video stream, stops the camera, and triggers immediate static inference.
* **Structured Operator Feedback:** Redesigned 3-step modal ("Is this a person?", "Is the prediction correct?", "Who is this person?") to capture training feedback, update weights, and refine model classification boundaries.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment variables
Create a `.env` file in the `backend/` directory:
```env
DEPLOYMENT_MODE=local
DATABASE_URL=
LAZY_LOAD_MODELS=true
```

### 3. Start the Backend Server
```bash
cd backend
.\venv\Scripts\activate
python server.py
```

### 4. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Project Structure
- **`backend/`**: Flask API backend, containing:
  - `server.py`: API endpoints for authentication, photo management, model training, and liveness testing.
  - `face_detection.py`: MediaPipe-based pose estimation.
  - `model.py` / `inference.py`: DeepFace / KNN vector storage and matching logic.
  - `ensemble.py`: Prediction voter pooling.
- **`frontend/`**: Vite + React single page app.
- **`dataset_cleaned/`**: Structured face-cropped training folders.
  - `PersonName/frontal/`
  - `PersonName/left/`
  - `PersonName/right/`
  - `PersonName/extra/`
