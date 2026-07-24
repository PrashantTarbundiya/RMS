# 02 Folder Structure

This document explains the purpose, responsibility, and important files within every directory of the RMS Face AI repository.

## Root Directory (`/`)
**Purpose:** Entry point for orchestration, containerization, and global configuration.

- `start.bat`: Automated bootstrap script for Windows. Detects Python/Node, installs dependencies, and launches Flask + Vite servers concurrently.
- `docker-compose.yml`: Container orchestration for production deployments.
- `requirements.txt`: Global Python dependency list.
- `render.yaml`: Infrastructure-as-code for Render.com cloud deployment.
- `DEPLOY.md`: Step-by-step deployment guide for Vercel (frontend) + Render (backend).
- `PROJECT_GUIDE.md`: Comprehensive technical reference for the entire project.
- `README.md`: Quick start guide and feature overview.

---

## `/backend`
**Purpose:** The core intelligence and security layer of the application.
**Responsibility:** Houses the Flask API, authentication system, ML pipelines, database models, and multi-tenant data management.

### Core Server Files
- `server.py`: The Flask entry point. Defines all REST routes, handles file uploads, manages CORS, rate limiting, and returns JSON. Registers Blueprints for modular route organization.
- `middleware.py`: Security enforcement layer with decorators:
  - `@require_auth`: JWT Bearer token validation for human users.
  - `@require_api_key`: API key validation for edge cameras.
  - `@require_api_key_or_auth`: Dual-auth for hybrid endpoints (e.g., `/api/predict`).
  - `@require_role(*roles)`: RBAC role hierarchy enforcement.
  - `@inject_org_id`: Multi-tenant organization isolation.
- `auth.py`: JWT token creation/validation (HS256), bcrypt password hashing/verification. Manages access tokens (15min) and refresh tokens (7 days).

### AI & ML Files
- `face_detection.py`: MediaPipe BlazeFace deep learning face detector with landmark-based pose estimation (frontal, left profile, right profile classification).
- `inference.py`: KNN vector matching, cosine distance calculations, CLAHE preprocessing, and Test-Time Augmentation (TTA) embedding generation.
- `ensemble.py`: Prediction voter combining DeepFace KNN and MobileNetV2 outputs through a 4-gate confirmation pipeline.
- `model.py`: DeepFace FaceNet512 embedding extraction, augmentation pipeline, and vector storage management.
- `liveness.py`: Anti-spoofing checks evaluating edge density (Laplacian variance), color variance, and texture patterns.
- `soft_biometrics.py`: Geometric facial measurements (Nose-Eye Offset, Eye Compression ratios) for supplementary verification.

### Business Logic Files
- `employees.py`: Flask Blueprint for Employee CRUD operations via SQLAlchemy.
- `feedback_learner.py`: Human-in-the-loop correction system. Processes feedback, moves images between dataset folders, and re-indexes embeddings.
- `add_person_utils.py`: Multi-view fast enrollment with zero-shot KNN indexing and background SOTA retraining triggers.
- `org_storage.py`: Per-organization file path resolution for multi-tenant data isolation. Routes to `data/orgs/{org_id}/` in multi-tenant mode or global `data/` in single-tenant mode.
- `config_utils.py`: Dynamic runtime configuration management (thresholds, model toggles).
- `sync.py`: Edge-cloud attendance log synchronization utilities.
- `billing.py`: Subscription plan limit enforcement and usage tracking.
- `license.py` / `generate_license.py`: License key generation and validation.

### Training & Dataset Scripts
- `retrain_all.py`: Full retraining pipeline — regenerates encodings and fine-tunes MobileNetV2.
- `clean_dataset.py`: Dataset normalization and cleanup utilities.
- `dataset_setup.py`: Initial dataset directory structure creation.
- `download_dataset.py`: External dataset download utilities.
- `benchmark_models.py`: Model accuracy benchmarking and performance metrics.

### `/backend/database`
**Purpose:** SQLAlchemy ORM layer for PostgreSQL multi-tenant database.
- `__init__.py`: Package initialization with conditional database availability checks.
- `db.py`: Database engine initialization, session management (`get_db_session()` context manager), and `is_db_available()` utility.
- `models.py`: SQLAlchemy ORM models for all 8 tables: `Organization`, `User`, `Employee`, `Camera`, `AttendanceLog`, `FeedbackLog`, `Subscription`, `ConsentRecord`.

### `/backend/models`
**Purpose:** PyTorch model definitions and saved weights.
- `sota_finetune/finetune.py`: MobileNetV2 architecture definition, custom classification head, and training loop.
- `sota_finetune/best_mobile_sideface.pth`: Trained model weights.
- `sota_finetune/mobile_classes.txt`: Known personnel class indices.

### `/backend/migrations`
**Purpose:** Alembic database migration scripts for schema versioning.
- `versions/`: Individual migration files for PostgreSQL schema changes.
- `env.py`: Alembic environment configuration.

### `/backend/routes`
**Purpose:** Flask Blueprint route modules for modular API organization.
- `analytics.py`: Analytics and reporting endpoints.

### `/backend/data`
**Purpose:** Lightweight local data storage (single-tenant mode fallback).
- `config.json`: Runtime-editable application thresholds.
- `recognition_history.json`: Flat-file detection event ledger.
- `encodings.pickle`: FaceNet512 embedding index for KNN matching.
- `orgs/{org_id}/`: Per-organization isolated data directories (multi-tenant mode).

### Configuration Files
- `.env`: Environment variables (DATABASE_URL, JWT_SECRET_KEY, DEPLOYMENT_MODE, etc.).
- `.env.example`: Template with all available environment variables documented.
- `Dockerfile`: Container image definition for cloud deployment.
- `Procfile`: Heroku/Render process definition.
- `gunicorn.conf.py`: Production WSGI server configuration.
- `alembic.ini`: Alembic migration tool configuration.

---

## `/frontend`
**Purpose:** The Web Dashboard and Landing Page interface.
**Responsibility:** Provides administrators a visual interface for authentication, attendance monitoring, personnel enrollment, model management, and system configuration.

### `/frontend/src/pages`
**Purpose:** React route components (14 pages).
- `LandingPage.jsx`: Marketing landing page with scroll-driven storytelling animations, glassmorphism effects, and AI-generated background images.
- `LoginPage.jsx`: JWT authentication login form.
- `RegisterPage.jsx`: Organization registration and initial admin account creation.
- `DashboardPage.jsx`: Main overview with KPI metrics, roster search, model health, and system status.
- `AttendancePage.jsx`: Tabular historical attendance view with filtering and CSV export.
- `LiveAttendancePage.jsx`: Real-time grid showing currently on-site employees with elapsed timers.
- `TestPage.jsx`: Live Inference Console with webcam bounding boxes, Capture & Run Inference, and the structured Feedback Modal for ML corrections.
- `UploadPage.jsx`: Multi-view drag-and-drop enrollment interface with Left/Front/Right/Extra category slots.
- `ManagePersonPage.jsx`: Administrative view of all registered identities with photo management.
- `TrainingPage.jsx`: MobileNetV2 retraining control panel with real-time SSE progress.
- `ModelsPage.jsx`: AI model configuration — DeepFace toggle, threshold adjustments, ensemble settings.
- `LogsPage.jsx`: System logs and recognition history viewer.
- `ProfilePage.jsx`: User account settings and storage infrastructure information.
- `SupportPage.jsx`: Help documentation and support resources.

### `/frontend/src/components`
**Purpose:** Reusable UI components.
- `Navbar.jsx`: Responsive navigation sidebar (desktop) with scroll-aware mobile capsule navbar.
- `Modal.jsx`: Reusable modal dialog component.
- `ApertureReticle.jsx`: Animated SVG reticle overlay for face detection visualization.

### `/frontend/src/components/landing`
**Purpose:** Landing page section components (9 components).
- `HeroReticleCanvas.jsx`: Animated SVG reticle grid for the hero section.
- `ProblemSection.jsx`: Problem statement narrative with scroll animations.
- `PipelineSection.jsx`: AI pipeline visualization with scroll-driven connecting lines.
- `ProofWidget.jsx`: Typewriter terminal demonstrating live inference.
- `BentoGrid.jsx`: Hierarchical feature showcase in bento card layout.
- `SovereigntySection.jsx`: Data sovereignty and air-gap deployment diagram.
- `StatsSection.jsx`: Animated count-up statistics.
- `FaqSection.jsx`: Spring-animated FAQ accordion.
- `FinalCta.jsx`: Final call-to-action with portal gateway background.

### `/frontend/src/components/ui`
**Purpose:** Primitive UI building blocks.

### `/frontend/src/context`
**Purpose:** React Context providers.
- `AuthContext.jsx`: JWT token storage, automatic refresh, and authenticated API client factory.

### `/frontend/` (Root & Config Files)
- `vite.config.js`: Vite bundler configuration.
- `src/config.js`: Centralized API URL configuration.
- `src/index.css`: Global design system with CSS variables, glassmorphism utilities, liquid glass effects, and responsive breakpoints.
- `src/main.jsx`: React DOM mount point and Router configuration.

---

## `/mobile`
**Purpose:** The Expo React Native mobile application.
**Responsibility:** Portable camera interface for security personnel to scan individuals on the move.

### `/mobile/src/screens`
- `LoginScreen.js`: Mobile authentication screen.
- `DashboardScreen.js`: Mobile-optimized system health dashboard.
- `RecognizeScreen.js`: Photo capture and binary identity verification display.
- `AddPersonScreen.js`: Mobile enrollment flow.
- `CameraCaptureScreen.js`: Isolated full-screen camera modal.
- `ModelsScreen.js`: Model configuration screen.

### `/mobile/src/services`
- `api.js`: Network request handling with dynamic IP resolution, base64-to-blob conversions, and timeout management.

### `/mobile/src/components`
- `BackgroundOrbs.js`: Animated gradient orb backgrounds for liquid glass UI.

### `/mobile/` (Root Files)
- `App.js`: Entry point and Navigation Container.
- `src/theme.js`: Centralized styling variables and liquid glass color palette.
- `app.json`: Expo configuration with camera permissions.

---

## `/dataset` & `/dataset_cleaned`
**Purpose:** Structural image storage for ML training.
- `/dataset`: Raw uploaded photos (unprocessed).
- `/dataset_cleaned`: Cropped, normalized face arrays organized by identity.
  - `PersonName/frontal/`: Front-facing photos.
  - `PersonName/left/`: Left-profile photos.
  - `PersonName/right/`: Right-profile photos.
  - `PersonName/extra/`: Unsorted bulk photos.

---

## `/docs`
**Purpose:** Enterprise technical documentation.
**Responsibility:** Onboarding new engineers, preserving architectural knowledge, and serving as reference for client presentations.
- `00–15_*.md`: Numbered documentation covering all aspects of the system.
- `PPT/`: Presentation materials.
- `Paper/`: Research paper references.
