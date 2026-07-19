# 00 Project Overview

## Project Purpose
RMS Face AI is a production-ready, edge-optimized enterprise facial recognition system. Its primary purpose is to seamlessly track and verify employee identity for attendance, security, and access control environments without relying on continuous cloud connectivity or expensive cloud GPU bills.

## Problem Statement
Traditional attendance systems rely on physical RFID cards (which can be swapped), PIN codes (which are easily forgotten or shared), or slow biometric scanners that cause bottlenecks at entry points. Cloud-based facial recognition systems suffer from latency, high API costs, and privacy concerns regarding employee data leaving the local network. 

## Goals
- **Instant Recognition:** Perform real-time inference on edge devices (laptops, kiosks, local servers).
- **Binary Verification:** Provide a definitive "Confirmed" or "Not Found" result rather than ambiguous confidence percentages.
- **Rapid Enrollment:** Add new employees to the system in seconds without waiting for a full neural network retraining cycle.
- **Cross-Platform Accessibility:** Provide a premium Web Dashboard for administrators and a Mobile Application for security personnel.

## Features
1. **Live Attendance Tracking:** Automatically logs check-in/check-out times, calculates hours worked, and determines attendance status (On Time, Late, Incomplete).
2. **Dual-Model AI Engine:** Combines lightning-fast structural embeddings (DeepFace/FaceNet512) with high-accuracy Convolutional Neural Networks (MobileNetV2).
3. **Instant Edge Enrollment:** Extracts embeddings for new personnel instantly using K-Nearest Neighbors (KNN), making them immediately searchable while a background process fine-tunes the deep learning model.
4. **False Positive Rejection:** Tuned Haar Cascades and strict distance thresholds prevent background objects or shadows from being logged as human faces.
5. **Interactive Feedback Loop:** Administrators can correct false detections directly from the dashboard; the system instantly discards `FALSE_DETECTION` artifacts or re-indexes corrected identities.

## Target Users
- **HR & Payroll Managers:** Need accurate, unforgeable timesheets and live attendance dashboards.
- **Security Teams:** Need a mobile application to verify individuals on the floor instantly.
- **System Administrators:** Require a local-first system that doesn't leak data to third-party cloud providers.

## Technology Stack
- **Backend / AI:** Python, Flask, PyTorch, OpenCV, Scikit-Learn (KNN), DeepFace (FaceNet512).
- **Frontend Web:** React, Vite, Framer Motion, Axios.
- **Frontend Mobile:** React Native, Expo, Expo Camera, React Navigation.
- **Data Storage:** JSON (Config & History), Pickle (Embeddings), File System (Datasets).

## High Level Architecture
The system follows a standard Client-Server architecture but heavily emphasizes local edge processing. 
- The **Clients** (Web Dashboard, Mobile App) capture frames or upload images and submit them to the backend over HTTP.
- The **Flask API** acts as the orchestrator, receiving images, performing Haar Cascade face detection, and passing cropped faces to the Ensemble ML pipeline.
- The **Ensemble ML Pipeline** extracts embeddings, calculates KNN distances, runs a forward pass on the fine-tuned MobileNetV2 model, and returns a verified decision.

## System Diagram
```mermaid
graph TD
    subgraph Clients
        W[Web Dashboard <br/> React + Vite]
        M[Mobile App <br/> Expo + React Native]
    end

    subgraph Edge Server
        F[Flask REST API]
        C[Image Processing <br/> OpenCV Haar Cascade]
        
        subgraph Ensemble Engine
            DF[DeepFace/FaceNet512 <br/> KNN Index]
            MN[MobileNetV2 <br/> PyTorch SOTA]
        end
        
        D[(Local Storage <br/> JSON & Pickle)]
    end

    W -- HTTP POST /predict --> F
    M -- HTTP POST /predict --> F
    
    F --> C
    C --> Ensemble Engine
    Ensemble Engine --> D
    Ensemble Engine --> F
    F -- JSON Response --> W
    F -- JSON Response --> M
```

## Repository Overview
- `/backend`: Contains the Python Flask API, ML models, dataset generation scripts, and inference logic.
- `/frontend`: Contains the React/Vite source code for the Web Dashboard.
- `/mobile`: Contains the Expo/React Native source code for the mobile application.
- `/docs`: Contains all enterprise technical documentation.
- `start.bat`: The automated orchestration script to launch all services on Windows.

## Development Workflow
1. **Local Bootstrapping**: Developers run `start.bat` which verifies Python/Node installations, installs missing dependencies, and spins up both the Flask backend and Vite frontend.
2. **Mobile Testing**: Developers open a new terminal, navigate to `/mobile`, and run `npx expo start` to test on physical devices via Expo Go.
3. **Model Refinement**: When changes are made to the AI pipeline, developers use the `/api/retrain` endpoint or the Web Dashboard's "Training" page to safely regenerate the `encodings.pickle` index and the `.pth` model weights.
