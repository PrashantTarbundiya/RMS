# RMS Face AI — Enterprise Facial Recognition Platform

RMS Face AI is a production-grade, multi-tenant facial recognition platform for automated employee attendance tracking, identity verification, and access control. It recognizes individuals from both frontal views and profile side views (up to 90° rotation) using a dual-model ensemble AI pipeline with anti-spoofing liveness detection.

## 🏗️ Architecture

The system consists of three integrated applications:
- **Web Dashboard** — React + Vite SPA with premium dark-mode glassmorphism UI, JWT authentication, and a storytelling landing page.
- **Flask API Server** — Python backend with multi-tenant PostgreSQL database, RBAC middleware, MediaPipe face detection, and dual-model ensemble inference.
- **Mobile App** — React Native (Expo) with liquid glass UI for portable biometric scanning.

```mermaid
graph LR
    Web[Web Dashboard] -->|JWT| API[Flask API]
    Mobile[Mobile App] -->|JWT| API
    Cameras[Edge Cameras] -->|API Key| API
    API --> ML[AI Pipeline]
    API --> DB[(PostgreSQL)]
    ML --> MediaPipe[MediaPipe BlazeFace]
    ML --> DeepFace[FaceNet512 + TTA]
    ML --> SOTA[MobileNetV2]
```

## 🚀 Key Features

- **Real-time Face Recognition** with MediaPipe BlazeFace detection and dual-model ensemble voting
- **Anti-Spoofing Liveness Detection** — rejects printed photos and screen replays
- **Zero-Shot Enrollment** — new employees searchable within seconds via KNN indexing
- **4-Gate Confirmation Pipeline** — definitive CONFIRMED/NOT FOUND binary verification
- **Multi-Tenant SaaS** — full organization isolation with PostgreSQL + SQLAlchemy
- **JWT Authentication & RBAC** — role hierarchy: platform_owner → org_admin → manager → viewer → kiosk
- **Edge Camera API Key Auth** — hardware cameras authenticate independently with anti-spoofing on `/api/predict`
- **Per-Camera Threshold Tuning** — different strictness levels for different camera locations
- **Live Attendance Dashboard** — real-time grid with elapsed timers and historical CSV export
- **Human-in-the-Loop Feedback** — 3-step correction modal to refine ML predictions
- **Storytelling Landing Page** — scroll-driven animations with glassmorphism effects

## 🛠️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-org/rms-face-ai.git
cd rms-face-ai
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
```

**Local Mode** (no database — single-tenant demo):
```env
DEPLOYMENT_MODE=local
SECRET_KEY=your-random-secret
JWT_SECRET_KEY=your-jwt-secret
LAZY_LOAD_MODELS=true
```

**Cloud Mode** (multi-tenant with PostgreSQL):
```env
DEPLOYMENT_MODE=cloud
DATABASE_URL=postgresql://user:pass@localhost:5432/rms_faceai
SECRET_KEY=your-random-secret
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Cloud mode only: run database migrations
alembic upgrade head

python server.py
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. (Optional) Start the Mobile App
```bash
cd mobile
npm install
npx expo start
```

---

## 📦 Project Structure
```
RMS/
├── backend/                  # Flask API + AI Pipeline
│   ├── server.py            # API routes and orchestration
│   ├── middleware.py         # JWT auth, API keys, RBAC, tenant isolation
│   ├── auth.py              # bcrypt + JWT token management
│   ├── face_detection.py    # MediaPipe BlazeFace detection
│   ├── liveness.py          # Anti-spoofing checks
│   ├── inference.py         # KNN matching + TTA embeddings
│   ├── ensemble.py          # 4-gate confirmation pipeline
│   ├── org_storage.py       # Multi-tenant file path routing
│   ├── database/            # SQLAlchemy ORM (8 tables)
│   └── migrations/          # Alembic schema versions
├── frontend/                 # React + Vite Web Dashboard
│   └── src/
│       ├── pages/           # 14 route components
│       ├── components/      # UI + landing page sections
│       └── context/         # AuthContext (JWT management)
├── mobile/                   # React Native + Expo Mobile App
├── docs/                     # Technical documentation (16 files)
├── dataset_cleaned/          # Training images (Left/Front/Right/Extra)
├── docker-compose.yml        # Container orchestration
└── start.bat                 # Windows auto-launcher
```

## 📚 Documentation
Full enterprise documentation is available in the [`/docs`](docs/) directory:
- [00 Project Overview](docs/00_Project_Overview.md)
- [01 Architecture](docs/01_Architecture.md)
- [07 API Documentation](docs/07_API_Documentation.md)
- [08 Database Schema](docs/08_Database.md)
- [09 Authentication & Security](docs/09_Authentication.md)
- [15 Developer Guide](docs/15_Developer_Guide.md)

## 🔒 Security
- JWT access tokens (15m) + refresh tokens (7d) with bcrypt password hashing
- API key authentication for edge cameras with identity spoofing prevention
- Backend-enforced test mode for human users (prevents attendance forgery)
- Anti-spoofing liveness detection in the ML pipeline
- Multi-tenant data isolation via middleware decorators
- CORS enforcement in production
- Biometric consent audit trail (BIPA/GDPR/DPDP)

## 📄 License
Proprietary. All rights reserved.
