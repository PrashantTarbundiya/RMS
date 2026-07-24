# 00 Project Overview

## Project Purpose
RMS Face AI is a production-ready, multi-tenant enterprise facial recognition platform. It provides automated employee attendance tracking, identity verification, and access control through real-time facial recognition. The system is architected for dual deployment — either as a cloud-hosted SaaS application with full multi-tenant isolation, or as an edge-optimized local appliance requiring zero internet connectivity.

## Problem Statement
Traditional attendance systems rely on physical RFID cards (which can be swapped), PIN codes (which are easily forgotten or shared), or slow biometric scanners that cause bottlenecks at entry points. Cloud-based facial recognition systems suffer from latency, high API costs, and privacy concerns regarding employee data leaving the local network. Existing solutions fail to deliver a definitive binary verification result, leaving HR teams and security personnel uncertain about identity confirmation.

## Goals
- **Instant Recognition:** Perform real-time inference on edge devices (laptops, kiosks, local servers) with sub-second response times.
- **Binary Verification:** Provide a definitive "Confirmed" or "Not Found" result via a multi-gate confirmation pipeline rather than ambiguous confidence percentages.
- **Rapid Enrollment:** Add new employees to the system in seconds through zero-shot KNN indexing without waiting for neural network retraining.
- **Cross-Platform Accessibility:** Provide a premium Web Dashboard for administrators and a Mobile Application for security personnel.
- **Multi-Tenant Isolation:** Support multiple organizations on a single deployment, each with isolated data, models, and configuration.
- **Anti-Spoofing Protection:** Detect and reject presentation attacks (printed photos, screen replays) through integrated liveness detection.

## Features
1. **Live Attendance Tracking:** Automatically logs check-in/check-out times, calculates hours worked, and determines attendance status (On Time, Late, Incomplete) through face recognition at edge cameras.
2. **Dual-Model AI Ensemble Engine:** Combines lightning-fast structural embeddings (DeepFace/FaceNet512 with Test-Time Augmentation) with high-accuracy Convolutional Neural Networks (MobileNetV2) via an ensemble voting layer.
3. **MediaPipe BlazeFace Detection:** Uses deep learning-based face detection (replacing legacy Haar Cascades) for robust multi-angle face detection including extreme side profiles up to 90°.
4. **Liveness Detection (Anti-Spoofing):** Evaluates facial texture, edge patterns, and color variance to reject printed photos, screen replays, and other presentation attacks.
5. **Instant Edge Enrollment:** Extracts embeddings for new personnel instantly using K-Nearest Neighbors (KNN), making them immediately searchable while a background process fine-tunes the deep learning model.
6. **4-Gate Confirmation Pipeline:** Identity confirmation passes through distance threshold, binary classifier, dynamic adaptive threshold, and confidence-level gates before being accepted.
7. **Per-Camera Threshold Tuning:** Each physical camera can have its own recognition strictness override, allowing tighter thresholds in well-lit lobbies and looser thresholds in dimly lit warehouses.
8. **Interactive Feedback Loop:** Administrators can correct false detections directly from the dashboard; the system instantly re-indexes corrected identities and discards false detection artifacts.
9. **Edge-Cloud Sync:** Edge cameras authenticate via API keys and sync attendance logs to the central PostgreSQL database, with identity spoofing protection enforced at the backend.
10. **JWT Authentication & RBAC:** Full role-based access control (platform_owner → org_admin → manager → viewer → kiosk) with bcrypt password hashing, short-lived access tokens, and long-lived refresh tokens.
11. **Storytelling Landing Page:** A premium marketing landing page with scroll-driven animations, glassmorphism effects, and AI-generated section backgrounds.

## Target Users
- **HR & Payroll Managers:** Need accurate, unforgeable timesheets and live attendance dashboards.
- **Security Teams:** Need a mobile application to verify individuals on the floor instantly.
- **System Administrators:** Require a local-first system that doesn't leak data to third-party cloud providers.
- **Enterprise IT:** Need multi-tenant isolation, RBAC, and audit trails for compliance (BIPA/GDPR/DPDP).

## Technology Stack
- **Backend / AI:** Python 3.12, Flask, PyTorch, OpenCV, MediaPipe BlazeFace, Scikit-Learn (KNN), DeepFace (FaceNet512).
- **Database:** PostgreSQL (multi-tenant cloud mode) with SQLAlchemy ORM and Alembic migrations. JSON/Pickle fallback for single-tenant local mode.
- **Authentication:** JWT (HS256) with bcrypt password hashing, RBAC middleware, API key authentication for edge cameras.
- **Frontend Web:** React 18, Vite, Framer Motion, GSAP, Axios, CSS Variables design system.
- **Frontend Mobile:** React Native, Expo, Expo Camera, React Navigation.

## High Level Architecture
The system follows a layered Client-Server architecture with strict authentication enforcement at every layer.

```mermaid
graph TD
    subgraph Clients
        W[Web Dashboard <br/> React + Vite]
        M[Mobile App <br/> Expo + React Native]
        LP[Landing Page <br/> Marketing Site]
    end

    subgraph Auth Layer
        JWT[JWT Middleware <br/> @require_auth]
        APIKey[API Key Middleware <br/> @require_api_key]
    end

    subgraph Edge Server
        F[Flask REST API]
        MW[Middleware <br/> RBAC + Org Isolation]
        
        subgraph AI Pipeline
            MP[MediaPipe BlazeFace <br/> Face Detection]
            LV[Liveness Detection <br/> Anti-Spoofing]
            DF[DeepFace/FaceNet512 <br/> KNN Index + TTA]
            MN[MobileNetV2 <br/> PyTorch SOTA]
            ENS[Ensemble Voter]
        end
        
        subgraph Data Layer
            PG[(PostgreSQL <br/> Multi-Tenant)]
            FS[(Local Storage <br/> JSON & Pickle)]
        end
    end

    subgraph Edge Cameras
        CAM[Physical Cameras <br/> Kiosks & Gates]
    end

    W -- JWT Bearer --> JWT
    M -- JWT Bearer --> JWT
    CAM -- X-API-Key --> APIKey
    
    JWT --> F
    APIKey --> F
    F --> MW
    MW --> AI Pipeline
    AI Pipeline --> Data Layer
```

## Repository Overview
- `/backend`: Python Flask API, ML models, SQLAlchemy database models, JWT auth, and inference logic.
- `/frontend`: React/Vite SPA — Web Dashboard, Landing Page, and admin console.
- `/mobile`: Expo/React Native mobile application for portable biometric scanning.
- `/docs`: Enterprise technical documentation (this directory).
- `/backend/database`: SQLAlchemy ORM models and database session management.
- `/backend/migrations`: Alembic database migration scripts.
- `start.bat`: Automated orchestration script to launch all services on Windows.
- `docker-compose.yml`: Container orchestration for production deployments.

## Development Workflow
1. **Local Bootstrapping**: Developers run `start.bat` which verifies Python/Node installations, installs missing dependencies, and spins up both the Flask backend and Vite frontend.
2. **Database Setup**: For multi-tenant mode, configure `DATABASE_URL` in `backend/.env` and run `alembic upgrade head` to create tables.
3. **Mobile Testing**: Developers open a new terminal, navigate to `/mobile`, and run `npx expo start` to test on physical devices via Expo Go.
4. **Model Refinement**: Use the Web Dashboard's Training page or `/api/retrain` endpoint to regenerate the `encodings.pickle` index and `.pth` model weights.
