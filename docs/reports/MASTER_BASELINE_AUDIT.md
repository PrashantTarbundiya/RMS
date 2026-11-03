# AuraPass™ Enterprise — Master Baseline Audit

**Document Reference**: `docs/reports/MASTER_BASELINE_AUDIT.md`  
**Execution Timestamp**: 2026-11-02T21:22:00+05:30  
**Authority**: Principal Software Architect & Lead DevSecOps Auditor  
**Workspace**: `E:\RMS`  
**Governance**: Strict adherence to `GEMINI.md` Rules A through I  

---

## 1. Executive Summary & Repository Architecture

AuraPass™ Enterprise is an AI-native biometric access control, facial recognition attendance, and multi-tenant security appliance. The repository combines:
- **Backend**: Flask 3.0 + Gevent WSGI + Flask-SocketIO runtime in Python 3.12/3.14.
- **Computer Vision & ML Engines**: Multi-model biometric pipeline leveraging Facenet512, InsightFace ArcFace, GhostFaceNet, and fine-tuned MobileNetV2 with OpenCV, MediaPipe BlazeFace, and PyTorch.
- **Database & Storage**: SQLAlchemy 2.0 ORM with SQLite (`backend/data/rms.db`) for multi-tenant state and namespaced filesystem storage under `backend/data/orgs/{org_id}/` and `dataset_cleaned/orgs/{org_id}/`.
- **Frontend**: React 19 SPA powered by Vite 8, Tailwind CSS, Lucide icons, Framer Motion, and HTML5 WebRTC camera capture.
- **Offline & Appliance Architecture**: Supports sovereign air-gapped appliances, PWA offline sync, USB RTSP camera mosaic feeds, and local biometric KNN vector indices.

---

## 2. Main Application Modules

| Module Layer | Primary Files | Architectural Responsibility |
| :--- | :--- | :--- |
| **API Server & Routing** | [`backend/server.py`](file:///e:/RMS/backend/server.py) (5,735 lines) | Core RESTful routes, WebSocket events, attendance logic, training queue, and dashboard stats. |
| **Auth & Security** | [`backend/auth.py`](file:///e:/RMS/backend/auth.py), [`backend/middleware.py`](file:///e:/RMS/backend/middleware.py) | JWT authentication, bcrypt hashing, RBAC enforcement (`@require_auth`, `@require_role`), and tenant injection. |
| **Tenant Storage Engine** | [`backend/org_storage.py`](file:///e:/RMS/backend/org_storage.py) | Namespaced filesystem path resolution, vector index serialization (`encodings.pickle`), and photo dataset directories. |
| **Database ORM** | [`backend/database/models.py`](file:///e:/RMS/backend/database/models.py), [`backend/database/db.py`](file:///e:/RMS/backend/database/db.py) | Multi-tenant schema: `organizations`, `users`, `employees`, `attendance_logs`, `subscriptions`, `cameras`. |
| **Biometric Inference** | [`backend/inference.py`](file:///e:/RMS/backend/inference.py), [`backend/deepface_utils.py`](file:///e:/RMS/backend/deepface_utils.py) | Face alignment, anti-spoofing liveness verification, KNN vector search, and dual-model confirmation. |
| **Frontend Application** | [`frontend/src/App.jsx`](file:///e:/RMS/frontend/src/App.jsx), [`frontend/src/pages/`](file:///e:/RMS/frontend/src/pages/) | Routing, Executive Dashboard, Kiosk mode, Real-time logs, Camera management, Profile, Models, and Analytics. |

---

## 3. Initial Baseline Git Status & Working Tree Analysis

```text
Changes not staged for commit:
  modified:   backend/config_utils.py
  modified:   backend/middleware.py
  modified:   backend/org_storage.py
  modified:   backend/server.py
  modified:   frontend/public/sw.js
  modified:   frontend/src/App.jsx
  modified:   frontend/src/components/Navbar.jsx
  modified:   frontend/src/context/PwaContext.jsx
  modified:   frontend/src/index.css
  modified:   frontend/src/pages/ModelsPage.jsx

Untracked files:
  .agents/
  GEMINI.md
  backend/tests/test_phase1_tenant_isolation.py
  docs/ai-engineering/
  docs/reports/
  scripts/
```

### Analysis of Existing Modifications:
1. **`backend/middleware.py`**: Multi-tenant authentication gate closed unauthenticated fallback to `default-org`.
2. **`backend/org_storage.py`**: Storage path resolvers strictly isolate `default-org` and custom tenants to `backend/data/orgs/{org_id}/` in database mode.
3. **`backend/server.py`**:
   - Registration benchmark auto-seeding removed.
   - Retraining benchmark auto-seeding removed.
   - Attendance employee auto-creation eliminated (strictly enforces enrolled tenant employee records).
   - User role enum/string serialization fixed for SQLite compatibility.
4. **`frontend/src/App.jsx`, `Navbar.jsx`, `index.css`**: Desktop and mobile flex viewport fixes preventing page clipping.
5. **`frontend/public/sw.js`, `PwaContext.jsx`**: Dev-mode service worker bypass preventing stale bundle caching on `localhost:5173`.
6. **`backend/config_utils.py`, `ModelsPage.jsx`**: Threshold synchronization documentation and metric alignment.

---

## 4. Runtime Status & Verification

- **Backend Flask API**: Process listening on `0.0.0.0:5000` (PID 63136).
  * Health Endpoint: `GET /api/health` returns HTTP 200 `status: "ok"`, `app_version: "1.0.0"`.
- **Frontend Vite Server**: Process listening on `localhost:5173` (PID 38748).
  * Root UI: HTTP 200 OK, Hot Module Replacement (HMR) active.
- **Database Baseline (`backend/data/rms.db`)**:
  * Organizations: 3 (`default-org`, `NIRMA`, `RMC`).
  * Real Customer Employees: 3 genuine active personnel in `RMC` (`Vatsal Vadgama`, `Shivam Petkar`, `Rakshit Gajnotar`).
  * Attendance Records: 5 valid logs for `RMC`.
  * Benchmark Contamination in DB: Cleaned/isolated (0 benchmark employees in RMC).

---

## 5. Security Risks, Technical Debt & Remaining Issues

1. **Root Directory Public Benchmark Dataset (`backend/data/encodings.pickle`)**:
   - Contains 70 LFW individuals (1,076 embeddings). While multi-tenant isolation now prevents normal tenants from accessing it, legacy files remain in root data directories.
2. **Profile & Settings UI Layout Glitches**:
   - As documented in user screenshots, the Profile page (`/profile`) exhibits a large empty space in the left column pushing profile cards down, and the Analytics page (`/analytics`) has a table/chart overflow on narrower viewports.
3. **Threshold Metric Ambiguity**:
   - `ModelsPage.jsx` presents a threshold slider from 0.20 to 0.70 (cosine distance), while `TestPage.jsx` presents a percentage score. The metric semantics must be clearly unified around Cosine Distance ($D_{cosine} \le \tau$) without misrepresenting similarity as identity probability.
4. **Biometric Deletion Cross-Model Coverage**:
   - Deletion of an employee must be verified across Facenet512, InsightFace, GhostFaceNet, and in-memory caches to guarantee complete erasure under GDPR Art. 17.

---

## 6. Implementation Priorities

1. **Verify Phase 1 Remediations independently** with zero false assertions.
2. **Audit historical benchmark data & establish non-destructive inventory**.
3. **Implement complete, auditable biometric lifecycle and multi-model deletion service**.
4. **Unify biometric threshold semantics & pipeline documentation**.
5. **Audit full backend security (IDOR, role escalation, SQL parameterization, secret hygiene)**.
6. **Remediate frontend layout defects on Profile, Models, Analytics, and Mobile viewports**.
7. **Execute comprehensive End-to-End integration tests (Playwright and automated API suite)**.
8. **Produce master validation report and leave the system running in ready state for owner testing**.

