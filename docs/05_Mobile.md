# 05 Mobile Application

## Overview
The mobile app provides a portable interface for the RMS Face AI system. Built with React Native and Expo, it allows security personnel to use their mobile device cameras to scan individuals in real-time, enroll new employees on the spot, and check system health.

## Project Structure
```text
/mobile
 ├── assets/             # Images, icons, and splash screens
 ├── src/
 │   ├── screens/        # React Navigation Screens
 │   ├── services/       # Network and API logic (`api.js`)
 │   └── theme.js        # Centralized styling variables
 ├── App.js              # Entry point and Navigation Container
 ├── app.json            # Expo configuration
 └── package.json        # Dependencies
```

## Expo & Navigation
- **Expo:** Chosen to eliminate the need for complex native iOS/Android build environments (`xcode`, `android studio`). Developers can run `npx expo start` and test directly on their physical devices using the Expo Go app.
- **Navigation:** Powered by `@react-navigation/native-stack` (for modals like the camera) and `@react-navigation/bottom-tabs` (for the primary app shell).

## Screens
1. **DashboardScreen.js:** The mobile equivalent of the web dashboard. Displays connection status to the edge server.
2. **RecognizeScreen.js:** The primary testing ground. Users launch the camera, take a photo, and the screen displays a strictly binary `CONFIRMED` (green) or `NOT FOUND` (red) alert.
3. **AddPersonScreen.js:** The enrollment flow. Users input a name, take ~15 photos rapidly, and upload them to the backend for instant KNN indexing.
4. **CameraCaptureScreen.js:** A dedicated, isolated Stack Screen. 
   - *Architecture Note:* The camera is explicitly decoupled from the Bottom Tab navigator. This prevents z-index issues where the bottom tab bleeds over the camera viewfinder or capture button. It operates as a full-screen modal that takes a photo, returns the URI to the invoking screen, and gracefully dismisses itself.

## API Communication (`api.js`)
Mobile networking presents unique challenges, especially when testing via the Expo Web simulator or physical devices on a Wi-Fi network.
- **Dynamic IP Resolution:** The mobile app cannot use `localhost` because that refers to the phone itself, not the backend PC. The `api.js` relies on a configured IP address (e.g., `http://192.168.1.50:5000/api`).
- **File Formulation:** `getFileObject()` normalizes URIs. If running on Expo Web, it intelligently intercepts `blob:` URIs, explicitly appends `.jpg`, and converts them into standard Blob objects to satisfy the Flask backend's strict MIME-type and extension validation rules.
- **Timeouts:** Includes an `AbortController` in `pingServer()` to prevent the app from hanging infinitely if the local server goes down.

## Permissions
- **Camera:** The app uses `expo-camera`. Upon first launch of `CameraCaptureScreen.js`, the app explicitly requests `Camera.requestCameraPermissionsAsync()`. If denied, the UI displays a fallback message guiding the user to OS settings.

## Offline Support
Currently, the mobile application acts as a "thin client". It requires a continuous connection to the local Wi-Fi network where the Flask Edge Server resides. There is no offline facial recognition capability, as bundling the 100MB+ PyTorch and DeepFace models into the React Native binary would violate the lightweight design goals.

## Build Process & Deployment
- **Development:** `npx expo start`
- **Production (Android):** `eas build -p android --profile preview` to generate an `.apk`.
- **Production (iOS):** Requires an Apple Developer account to run `eas build -p ios`.
