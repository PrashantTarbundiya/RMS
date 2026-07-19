# 13 Configuration

This document lists all configuration files spanning the backend, frontend, and mobile environments, explaining the critical settings within each.

## 1. Backend Configuration

### `requirements.txt`
**Purpose:** Defines the Python dependency matrix.
**Important Settings:**
- `Flask==3.0.0`: The API framework.
- `torch==2.1.2`, `torchvision==0.16.2`: PyTorch ML libraries.
- `opencv-python-headless`: Used instead of `opencv-python` to prevent X11 server crashes in headless Linux environments (Render/Docker).
- `deepface`: High-level wrapper for FaceNet512.

### `/backend/data/config.json`
**Purpose:** Dynamic, runtime-editable application variables.
**Important Settings:**
- `CONFIRM_THRESHOLD` (Float): Determines how strict the Ensemble Engine is. Lower is stricter (e.g., `0.40`). Higher allows more false positives (e.g., `0.65`). Default is typically `0.55`.

---

## 2. Frontend Configuration

### `vite.config.js`
**Purpose:** Configures the Vite bundler.
**Important Settings:**
- `server.port`: Forces the development server to run on port `5173`.
- `plugins: [react()]`: Enables Fast Refresh for React components.

### `eslint.config.js`
**Purpose:** Enforces code quality and catches syntactic errors.
**Important Settings:**
- Configured specifically for React Hooks, ensuring dependency arrays in `useEffect` are properly maintained.

### `package.json`
**Purpose:** NPM dependency map.
**Important Settings:**
- `framer-motion`: Handles UI animations.
- `lucide-react`: SVG icon library.
- `axios`: Handles HTTP networking to the Flask API.

---

## 3. Mobile Configuration

### `app.json`
**Purpose:** The central Expo configuration file.
**Important Settings:**
- `expo.name`: The display name of the app on the phone's home screen.
- `expo.plugins`: Defines necessary native permissions. Critically, it requests `CAMERA` permissions.
- `expo.android.package` / `expo.ios.bundleIdentifier`: Required for compiling the app into native binaries via EAS.

### `babel.config.js`
**Purpose:** Transpiles modern JavaScript and JSX for React Native.
**Important Settings:**
- `preset-expo`: The standard preset required by Expo for module resolution.

### `package.json`
**Purpose:** React Native dependencies.
**Important Settings:**
- `expo-camera`: The core library enabling hardware camera access.
- `@react-navigation/*`: Stack and Tab navigator modules.

---

## 4. Deployment Configuration

### `render.yaml`
**Purpose:** Infrastructure-as-code for Render.com.
**Important Settings:**
- Defines the `buildCommand` and `startCommand`.
- Sets environment variables specifically tailored for the Render cloud environment, ensuring CORS origins match the Render dashboard URL.
