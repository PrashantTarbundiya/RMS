# RMS Face AI — Complete Project Guide

## What is This Project?

**RMS Face AI** is a production-ready, multi-tenant enterprise facial recognition platform designed to identify individuals from frontal and profile side views (up to 90° rotation). The system combines deep learning vision backbones (SOTA MobileNetV2) and deep metric embeddings (DeepFace/Facenet512 with Test-Time Augmentation) into a unified ensemble voting layer with integrated anti-spoofing liveness detection.

The project consists of three main systems:
- A **Premium React Web Dashboard** (Vite + CSS) with JWT authentication, glassmorphism UI, 14 pages, and a storytelling landing page.
- An **Enterprise Flask API Server** (Python 3.12) featuring multi-tenant PostgreSQL database (8 tables), RBAC middleware, MediaPipe BlazeFace face detection, and dual-auth (JWT + API keys).
- An **On-device Mobile App** (React Native/Expo) with liquid glass UI for portable biometric scanning.

---

## Technical Specifications & Features

### 1. Hybrid Ensemble Architecture
The system supports dual inference pipelines that vote on identity classifications:
* **SOTA MobileNetV2:** Fine-tuned on local training classes. The vision model understands facial orientation features and is optimized for speed and generalization.
* **DeepFace (Facenet512 + TTA):** Generates a 512-dimension spatial embedding vector per face using Test-Time Augmentation (5 augmented variants averaged). A K-Nearest Neighbors (KNN) classifier with cosine distance evaluates matches against enrolled class centroids.
* **Global Model Selection:** DeepFace/Ensemble settings can be disabled entirely in the Models page. When disabled, the server bypasses embedding computation, saves memory, and relies strictly on SOTA MobileNetV2.

### 2. Multi-Stage AI Pipeline
The inference pipeline runs 5 stages in sequence:
1. **MediaPipe BlazeFace Detection:** Deep learning face detection supporting 0°–90° head rotation.
2. **Liveness Detection:** Anti-spoofing checks (edge density, color variance, texture analysis) reject printed photos and screen replays.
3. **DeepFace FaceNet512 + TTA:** 5-variant augmented embedding generation with KNN cosine distance matching.
4. **MobileNetV2 SOTA:** Fine-tuned CNN forward pass for categorical classification.
5. **4-Gate Ensemble Voter:** Distance threshold → binary agreement → adaptive threshold → confidence level classification.

### 3. Multi-View Landmarked Alignment
RMS captures left-profile, frontal, and right-profile views during enrollment. During video stream ingestion, MediaPipe evaluates head rotation keypoints:
* Faces rotated up to 30° are evaluated against frontal embeddings.
* Faces rotated between 30° to 90° are mapped against left or right profile vectors.

### 4. Integrated Asset Allocation Layout
The **Enrollment & Update** interface (UploadPage.jsx) is organized into profile-centric row grids:
* **Row 1 (LEFT, FRONT, RIGHT):** Category dropzones side-by-side.
* **Row 2 (EXTRA FILES):** Bulk/additional uploads.
* **Inline Photo Grids:** Database photos show green `Enrolled` badges; local uploads show violet `New` badges.
* **Drag-and-Drop Relocation:** Relocate photos between categories. Dropping an enrolled photo updates the file on disk and hot-reloads models.

### 5. Real-time Video Telemetry & Bounding Boxes
* The Webcam test console continuously polls frame captures (every 1.5s) in the background.
* Scaled bounding boxes overlay the live `<video>` element with name labels ("SPOOF", "UNKNOWN", or recognized name).
* **Capture & Run Inference** freezes the frame, stops the camera, and runs static inference.
* Mode tracking via `modeRef` prevents stale live-camera results from overwriting captured photo results.

### 6. Operator Feedback & Custom Relabeling
3-step structured feedback form:
1. Confirm if a human face is present (filter false detections).
2. Confirm if the predicted classification label is correct.
3. Select an existing person from a searchable dropdown or type a custom name.
All corrections are logged in the `feedback_logs` database table.

### 7. Security Architecture
* **JWT Authentication:** bcrypt password hashing, 15-minute access tokens, 7-day refresh tokens.
* **RBAC:** Role hierarchy `platform_owner > org_admin > manager > viewer > kiosk`.
* **API Key Auth:** Edge cameras authenticate via `X-API-Key` header against the `cameras` database table.
* **Dual-Auth on `/api/predict`:** JWT users are forced into test mode (no attendance logging). API key cameras run in production mode.
* **Identity Spoofing Prevention:** `/api/sync` overrides any client-provided `org_id`/`camera_id` with the authenticated device's identity.
* **Multi-Tenant Isolation:** `@inject_org_id` middleware ensures every query is scoped to the authenticated organization.

---

## Folder Structure

```
RMS/
├── backend/                     # Python Flask API Server
│   ├── server.py                # Main Flask application and routes
│   ├── middleware.py            # JWT auth, API keys, RBAC, tenant isolation
│   ├── auth.py                  # bcrypt password hashing + JWT token management
│   ├── model.py                 # DeepFace vector generation and preprocessing
│   ├── inference.py             # KNN matching, TTA, and cosine distance voting
│   ├── ensemble.py              # 4-gate combined model result voter
│   ├── face_detection.py        # MediaPipe BlazeFace detection & pose classification
│   ├── liveness.py              # Anti-spoofing (edge density, color, texture)
│   ├── add_person_utils.py      # Multi-view fast enrollment triggers
│   ├── org_storage.py           # Per-org file path routing (multi-tenant)
│   ├── employees.py             # Employee CRUD Blueprint
│   ├── feedback_learner.py      # Human-in-the-loop correction system
│   ├── billing.py               # Subscription plan enforcement
│   ├── database/
│   │   ├── db.py                # SQLAlchemy session management
│   │   └── models.py           # 8 ORM tables (Organization, User, Employee, etc.)
│   ├── migrations/              # Alembic schema versioning
│   ├── models/
│   │   └── sota_finetune/
│   │       ├── finetune.py      # MobileNetV2 fine-tuning loop
│   │       └── mobile_classes.txt
│   └── .env                     # Environment variables
│
├── frontend/                    # Vite + React Web Application
│   ├── src/
│   │   ├── pages/               # 14 route components
│   │   │   ├── LandingPage.jsx  # Marketing landing page (9 sections)
│   │   │   ├── LoginPage.jsx    # JWT authentication
│   │   │   ├── RegisterPage.jsx # Organization registration
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TestPage.jsx     # Live inference console + feedback
│   │   │   ├── UploadPage.jsx   # Drag-and-drop enrollment
│   │   │   ├── ModelsPage.jsx   # AI model configuration
│   │   │   ├── ProfilePage.jsx  # Account settings
│   │   │   └── ...              # +6 more pages
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Responsive sidebar + mobile capsule
│   │   │   └── landing/        # 9 landing page section components
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT token storage and API client
│   │   └── index.css            # Design system (glassmorphism, CSS vars)
│   └── vite.config.js
│
├── mobile/                      # React Native Expo Mobile App
│   └── src/
│       ├── screens/             # Login, Dashboard, Recognize, AddPerson, Camera
│       ├── components/          # BackgroundOrbs (liquid glass)
│       ├── services/api.js      # Network client
│       └── theme.js             # Liquid glass color palette
│
├── dataset_cleaned/             # Cropped training images
│   └── PersonName/
│       ├── frontal/
│       ├── left/
│       ├── right/
│       └── extra/
│
├── docs/                        # Technical documentation (16 files)
├── docker-compose.yml           # Container orchestration
├── DEPLOY.md                    # Vercel + Render deployment guide
└── start.bat                    # Windows auto-launcher
```

---

## Database Schema (PostgreSQL — Cloud Mode)

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant entity (name, slug, plan tier, threshold) |
| `users` | Dashboard operators (email, bcrypt hash, RBAC role) |
| `employees` | Enrolled faces (name, department, consent status) |
| `cameras` | Physical devices (location, API key, threshold override) |
| `attendance_logs` | Check-in events (employee, camera, confidence, status) |
| `feedback_logs` | ML correction audit trail |
| `subscriptions` | Billing plans and usage limits (Stripe integration ready) |
| `consent_records` | Biometric consent audit trail (BIPA/GDPR/DPDP) |

---

## Local Configuration Reference

| Parameter | Configuration File | Default | Description |
|-----------|-------------------|---------|-------------|
| `DEPLOYMENT_MODE` | `backend/.env` | `local` | `local` (no DB) or `cloud` (PostgreSQL) |
| `DATABASE_URL` | `backend/.env` | None | PostgreSQL connection string |
| `JWT_SECRET_KEY` | `backend/.env` | `change-me-...` | JWT signing secret |
| `LAZY_LOAD_MODELS` | `backend/.env` | `true` | Defer model loading to first request |
| `LOCAL_CAMERA_KEY` | `backend/.env` | `default-local-camera-key` | API key for local cameras |
| `FRONTEND_URL` | `backend/.env` | None (open CORS) | Production CORS origin |
| `VITE_API_URL` | `frontend/.env` | `http://localhost:5000/api` | Backend API URL |
| `CONFIRM_THRESHOLD` | `backend/data/config.json` | `0.55` | KNN distance threshold |
| `NUM_AUGMENTS` | `model.py` | `5` | TTA augmented variants per image |
| `KNN_K` | `inference.py` | `5` | K-Nearest Neighbors count |
| `MAX_DISTANCE` | `inference.py` | `0.55` | Max cosine distance for match |
| `MIN_CONFIDENCE_THRESHOLD` | `ensemble.py` | `0.25` | Below this → "Unknown" |
| `AGREEMENT_BONUS` | `ensemble.py` | `0.10` | Bonus when 2+ models agree |
