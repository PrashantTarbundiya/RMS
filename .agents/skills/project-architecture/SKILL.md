---
name: project-architecture
description: >-
  Examine, document, and enforce system-wide component architecture, module boundaries, and multi-tier data flow across Flask, Gevent, SQLite/PostgreSQL, and React 19.
---

# Project Architecture Standard

## Purpose & Scope
Governs the end-to-end multi-tier system topology of AuraPass Enterprise, ensuring clean separation of concerns, process isolation, and scalable data flow.

## Architecture Topology
- **Edge / Client Tier**: React 19 SPA + Vite + Tailwind CSS + WebRTC camera stream.
- **Application Server Tier**: Flask 3.1 + Gevent WSGI server handling RESTful APIs and real-time WebSocket events.
- **Compute / Inference Tier**: DeepFace (Facenet512), InsightFace (ArcFace), GhostFaceNet ONNX, and PyTorch MobileNetV2 anti-spoofing.
- **Persistence Tier**: Dual-mode database (local sovereign SQLite `backend/data/rms.db` and cloud PostgreSQL via SQLAlchemy 2.0).
- **Asynchronous Task Tier**: Celery worker queue + Redis broker for background retraining and snapshot backups.

## Operational Procedures
1. **Module Boundary Verification**:
   - Ensure `backend/server.py` delegates business logic to `backend/services/` and database queries to `backend/database/`.
   - Ensure frontend components in `frontend/src/pages/` consume domain context via `AuthContext`, `ToastContext`, and `PwaContext`.
2. **Process Lifecycle Management**:
   - Master Gevent process handles socket listeners.
   - Workers dispose inherited SQLAlchemy connection pools (`_engine.dispose(close=False)`) upon fork to prevent deadlock.
3. **Data Flow Validation**:
   - Client Frame (Base64 JPEG) -> WebSocket/REST -> `face_detection.py` -> Landmark Alignment -> CNN Feature Extraction -> 512-d KNN Search -> Multi-Model Consensus -> Attendance Record Persistence.

## Verification Checklist
- [ ] No circular imports between `backend/routes/`, `backend/database/`, and `backend/services/`.
- [ ] Database session scopes are properly managed with `with get_db_session() as db:`.
- [ ] Frontend state changes do not cause unnecessary full-page DOM remounts.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: Martin Fowler, Patterns of Enterprise Application Architecture; IEEE 42010 Architecture Standard
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/project-architecture`)
