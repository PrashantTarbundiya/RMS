# RMS Face AI — Enterprise Facial Recognition System

## Project Overview
RMS Face AI is a production-ready, edge-optimized facial recognition system designed for enterprise environments. Its primary goal is to seamlessly track employee in/out activity at entry and exit gates, compute productive working hours, and provide strict, high-confidence verification. 

## Current Scenario & Scope
The system is built to be deployed on edge hardware (such as gate cameras or local kiosks) with a strict requirement for **Binary Verification**—it either confirms an individual's identity with high confidence or rejects them. This prevents "half-hearted" assumptions and ensures accurate payroll and security tracking.

### Key Capabilities
1. **Instant Edge Enrollment**: Adding a new employee (requiring ~15 images) takes less than 10 seconds. The system bypasses heavy neural network retraining on edge devices in favor of instant embedding extraction (FaceNet) and K-Nearest Neighbors (KNN) indexing.
2. **Ensemble AI Engine**: The backend utilizes a dual-model approach:
   - **DeepFace (FaceNet512)** for rapid, high-accuracy structural embeddings.
   - **MobileNetV2 (SOTA)** for deep classification.
3. **Cross-Platform Access**: Administrators and security personnel can interface with the system via a premium Web Dashboard or a mobile-native application.

## Architecture & Tech Stack
- **Backend Model & API**: Python, Flask, DeepFace, PyTorch, Scikit-Learn.
- **Web Frontend**: React, Vite, Framer Motion, Lucide Icons.
- **Mobile Application**: React Native, Expo, Expo Camera, React Navigation.

## Documentation Directory
- [Frontend UI Design Guide](./frontend_ui.md)
- [Mobile UI Design Guide](./mobile_ui.md)
