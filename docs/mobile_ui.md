# Mobile App UI Documentation

## Aesthetic & Design System
The Mobile Application is built using **React Native (Expo)** and targets both iOS and Android natively. It follows an **Apple-inspired Glassmorphism** design language.

### Core Traits
- **Navigation**: Floating pill-shaped bottom tab bar.
- **Components**: High-radius rounded corners (`border-radius: 14px - 20px`).
- **Surfaces**: Frosted glass transparencies over dynamic backgrounds, particularly emphasizing camera layers.

## Core Workflows

### 1. The Face Scanner (`RecognizeScreen`)
This is the main operational screen for on-the-go verification.
- **Dynamic Camera Viewfinder**: When the camera is active, the tab bar dynamically disappears. This gives the operator full access to the capture button and maximizes screen real estate for face alignment.
- **Hardware Integration**: Interfaces directly with the device's native camera API. Once a photo is snapped, it sends a payload (without explicit manual multipart boundaries to avoid React Native fetch bugs) to the Flask API.
- **Overlay Validation**: If the ensemble engine returns a confident match, an overlay badge appears confirming the individual's identity.

### 2. Dataset Collection (`AddPersonScreen`)
- Designed to facilitate the strict requirement of collecting multiple images for accurate enrollment.
- Users can input the employee's name and either upload from the device gallery or take multiple rapid shots using the integrated camera.
- Hides the navigation tab bar when the camera is engaged to prevent accidental navigation during the crucial capture phase.

### 3. Analytics on the Go
- Provides a mobile-optimized view of the primary Dashboard KPIs, allowing security personnel and administrators to monitor server uptime and ensemble success rates away from their desk.
