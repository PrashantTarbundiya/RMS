# 02 Folder Structure

This document recursively explains the purpose, responsibility, and important files within every directory of the RMS Face AI repository.

## Root Directory (`/`)
**Purpose:** Acts as the entry point for the orchestrator, containerization scripts, and global configurations.
**Responsibility:** Ensures all disparate parts of the system (backend, frontend, mobile) can be launched, built, or deployed coherently.
- `start.bat`: The primary bootstrap script for Windows local development. It detects Python and Node, installs dependencies automatically, and launches the Flask and Vite servers concurrently.
- `requirements.txt`: Global Python dependency list.
- `render.yaml`: Infrastructure-as-code configuration for deploying the system to the Render cloud platform.

---

## `/backend`
**Purpose:** The core intelligence layer of the application.
**Responsibility:** Houses the Flask API, the image processing pipelines, the machine learning models, and dataset management scripts.
**How it interacts:** Accepts HTTP POST requests from `/frontend` and `/mobile`, processes images, and reads/writes to `/dataset_cleaned`.

### `/backend/models`
**Purpose:** Stores PyTorch model definitions and saved state dictionaries (`.pth`).
**Important Files:** 
- `/sota_finetune/finetune.py`: Contains the actual MobileNetV2 PyTorch architecture definition, the custom classification head, and the training loop logic.

### `/backend/data`
**Purpose:** Serves as the lightweight, local JSON/Pickle database.
**Important Files:**
- `config.json`: Stores the admin-configurable `CONFIRM_THRESHOLD` used to determine binary True/False identity matching.
- `recognition_history.json`: Flat-file database appending every live detection event.
- `encodings.pickle`: The compiled FaceNet512 high-dimensional vector index used by K-Nearest Neighbors for instant identity resolution.

### `/backend/` (Root Files)
- `server.py`: The Flask entry point. Defines all REST routes, handles file uploads, manages CORS, and returns JSON.
- `inference.py`: Extracts OpenCV bounding boxes, crops faces, and invokes the ML models.
- `ensemble.py`: Averages predictions between FaceNet and MobileNetV2.
- `feedback_learner.py`: Handles corrections submitted by users, moves images into the correct folders, and deletes false positives.
- `haarcascade_frontalface_default.xml`: The pre-trained OpenCV cascade classifier used for rapid structural face detection.

---

## `/frontend`
**Purpose:** The Web Dashboard interface.
**Responsibility:** Provides HR, admins, and users a visual interface to monitor live attendance, enroll new personnel, and view system health.
**How it interacts:** Makes Axios REST calls to `localhost:5000` (the backend).

### `/frontend/src/pages`
**Purpose:** React route components.
- `DashboardPage.jsx`: The main overview with KPI metrics.
- `LiveAttendancePage.jsx`: A grid view showing "who is currently on site" with auto-refreshing elapsed timers.
- `AttendancePage.jsx`: A tabular view of historical check-ins with CSV export capabilities.
- `TestPage.jsx`: The testing interface featuring the custom Feedback Modal to correct false detections.

### `/frontend/src/components`
**Purpose:** Reusable UI components.
- `Navbar.jsx`: The main navigation sidebar (desktop) and bottom tab (mobile viewport). 

### `/frontend/` (Root & Config Files)
- `vite.config.js`: Configuration for the Vite bundler.
- `src/index.css`: The global stylesheet defining the "Premium AI SaaS Glassmorphism" theme (CSS variables, backdrop-filters, gradients).

---

## `/mobile`
**Purpose:** The Expo React Native application.
**Responsibility:** Provides a physical, portable camera interface for security personnel to scan individuals on the move.
**How it interacts:** Communicates over the local network to the backend API (`http://<LOCAL_IP>:5000`).

### `/mobile/src/screens`
**Purpose:** React Navigation stack and tab screens.
- `CameraCaptureScreen.js`: A dedicated modal screen isolating the `expo-camera` component. Ensures the camera viewfinder never clashes with bottom navigation tabs.
- `RecognizeScreen.js`: Takes the captured photo, submits it via `api.js`, and displays the Confirmed/Not Found UI.
- `DashboardScreen.js`: A mobile-optimized view of the system health.

### `/mobile/src/services`
**Purpose:** Business logic and external communication.
- `api.js`: Handles network requests, handles base64-to-blob conversions for the Expo Web Simulator, and dynamically injects `.jpg` extensions to satisfy backend security filters.

---

## `/dataset` & `/dataset_cleaned`
**Purpose:** Structural image storage.
**Responsibility:** Holds raw uploaded photos (`/dataset`) and the tightly cropped, normalized face arrays used for ML training (`/dataset_cleaned`).
**Expected Future Files:** As users are enrolled, this directory will dynamically generate folders named after the employee (e.g., `/dataset_cleaned/John_Doe/001.jpg`).

---

## `/docs`
**Purpose:** Enterprise technical documentation.
**Responsibility:** Onboarding new engineers and preserving architectural knowledge.
