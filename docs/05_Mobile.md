# 05 Mobile Application

## Overview
The mobile app provides a portable interface for the RMS Face AI system. Built with React Native and Expo, it features a premium **Liquid Glass** UI design with frosted glassmorphism effects, vibrant gradients, and micro-animations. It allows security personnel to authenticate, scan individuals in real-time, enroll new employees on the spot, and manage model settings.

## Project Structure
```text
/mobile
 ├── assets/              # Images, icons, and splash screens
 ├── src/
 │   ├── screens/         # React Navigation Screens
 │   │   ├── LoginScreen.js
 │   │   ├── DashboardScreen.js
 │   │   ├── RecognizeScreen.js
 │   │   ├── AddPersonScreen.js
 │   │   ├── CameraCaptureScreen.js
 │   │   └── ModelsScreen.js
 │   ├── components/
 │   │   └── BackgroundOrbs.js  # Animated gradient orb backgrounds
 │   ├── services/
 │   │   └── api.js        # Network and API logic
 │   └── theme.js          # Centralized liquid glass color palette
 ├── App.js               # Entry point and Navigation Container
 ├── app.json             # Expo configuration
 └── package.json         # Dependencies
```

## Expo & Navigation
- **Expo:** Eliminates the need for complex native build environments. Developers run `npx expo start` and test on physical devices via Expo Go.
- **Navigation:** `@react-navigation/native-stack` for modal screens (camera) and `@react-navigation/bottom-tabs` for the primary app shell.

## Screens

### Authentication
1. **LoginScreen.js:** Mobile JWT authentication. Submits credentials, stores tokens, and navigates to the dashboard upon success. Features a liquid glass card design with gradient background.

### Core Functionality
2. **DashboardScreen.js:** Mobile-optimized system health view. Shows connection status to the edge server, model readiness, and quick-access action cards with frosted glass effects.
3. **RecognizeScreen.js:** The primary scanning interface. Users launch the camera, capture a photo, and receive a strictly binary `CONFIRMED` (green) or `NOT FOUND` (red) result with liquid glass result cards.
4. **AddPersonScreen.js:** Mobile enrollment flow. Users input a name, rapidly capture ~15 photos, and upload them to the backend for instant KNN indexing.
5. **ModelsScreen.js:** Model configuration screen with toggles for DeepFace/Ensemble settings and threshold adjustments.

### Hardware Integration
6. **CameraCaptureScreen.js:** Dedicated, isolated Stack Screen for camera access.
   - *Architecture Note:* Explicitly decoupled from the Bottom Tab navigator to prevent z-index issues where tabs bleed over the camera viewfinder. Operates as a full-screen modal that captures a photo, returns the URI, and dismisses itself.

## UI Design: Liquid Glass Morphism
The mobile app implements a premium **Liquid Glass** design language:
- **Frosted Glass Cards:** Semi-transparent backgrounds with blur effects.
- **Animated Gradient Orbs:** `BackgroundOrbs.js` renders floating, animated gradient circles behind content.
- **Vibrant Color Palette:** Defined in `theme.js` — deep dark backgrounds with iridescent accent colors.
- **Micro-Animations:** Smooth transitions and haptic feedback for interactive elements.

## API Communication (`api.js`)
- **Dynamic IP Resolution:** Cannot use `localhost` (refers to the phone itself). Requires configured IP address (e.g., `http://192.168.1.50:5000/api`).
- **JWT Token Management:** Stores and injects Bearer tokens for authenticated requests.
- **File Normalization:** `getFileObject()` normalizes URIs across platforms. On Expo Web, intercepts `blob:` URIs, appends `.jpg`, and converts to standard Blob objects.
- **Timeouts:** `AbortController` in `pingServer()` prevents infinite hangs if the server goes down.

## Permissions
- **Camera:** Uses `expo-camera`. Explicitly requests `Camera.requestCameraPermissionsAsync()` on first launch. Shows fallback guidance if denied.

## Offline Support
The mobile app acts as a "thin client" requiring a continuous connection to the local Wi-Fi network where the Flask Edge Server resides. No offline facial recognition capability — bundling 100MB+ ML models into the React Native binary would violate lightweight design goals.

## Build Process & Deployment
- **Development:** `npx expo start`
- **Production (Android):** `eas build -p android --profile preview` to generate `.apk`.
- **Production (iOS):** Requires Apple Developer account — `eas build -p ios`.
