# 15 Developer Guide

Welcome to the RMS Face AI repository! This guide provides everything a new engineer needs to clone, test, and contribute to the system.

## Setup & Installation

### 1. Cloning the Repository
```bash
git clone https://github.com/your-org/rms-face-ai.git
cd rms-face-ai
```

### 2. Quick Start (Windows)
The repository includes an automated batch script that handles environment creation, dependency installation, and server launching.
```bash
.\start.bat
```
*(This will launch the Flask API on port 5000 and the Vite Frontend on port 5173).*

### 3. Manual Installation (macOS/Linux)
If you are developing on a Unix-based system, follow these steps:
```bash
# Setup Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py

# Setup Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

### 4. Running the Mobile App
You must have the Expo Go app installed on your physical smartphone.
```bash
cd mobile
npm install
npx expo start
```
Press `w` to open in a web simulator, or scan the QR code with your phone.

## Folder Conventions & Architecture
Always respect the strict decoupling of the architecture:
- Do NOT place database logic in `server.py`. Use the utility files in `/backend`.
- Do NOT place heavy CSS in React files. Use CSS Variables in `/frontend/src/index.css`.
- ML Model edits belong strictly in `/backend/models`.

## Coding Standards & Naming Conventions
- **Python:** PEP 8 compliance. Use `snake_case` for variables/functions and `PascalCase` for PyTorch classes. Use docstrings `""" """` for all major functions.
- **JavaScript (React):** `PascalCase` for components (e.g., `LiveAttendancePage.jsx`). Functional components with Hooks only. No Class components.
- **CSS:** Use descriptive semantic variable names (e.g., `var(--bg-card)`) rather than hardcoded hex values.

## Branch Strategy
- `main`: Production-ready code. Must always be deployable.
- `develop`: Staging area for integration.
- `feature/<name>`: For implementing new components or models (e.g., `feature/jwt-auth`).
- `bugfix/<name>`: For patching critical errors (e.g., `bugfix/camera-crash`).

## Common Errors & Debugging

**Error:** `500 Internal Server Error` on Mobile App.
**Fix:** The mobile app's `api.js` is likely pointing to the wrong IP address. Find your local IP (e.g., `192.168.1.10`) and update it, ensuring your firewall is not blocking Port `5000`.

**Error:** `RuntimeError: CUDA out of memory.`
**Fix:** The PyTorch batch size during retraining is too high for your GPU. Decrease it in `sota_finetune/finetune.py`.

**Error:** "Unsupported file type" during upload.
**Fix:** Ensure the frontend/mobile client is explicitly passing `.jpg` or `.png` in the `FormData` filename field.

## How to Add a Feature
1. **Plan:** Read `01_Architecture.md` to determine which layers (ML, Backend, UI) are affected.
2. **Backend First:** Implement the logic in Python and expose it via a new `@app.route` in `server.py`.
3. **Test API:** Use Postman or cURL to verify the JSON output.
4. **Frontend Integration:** Create or update a React component in `/frontend/src/components` to call the new endpoint using Axios.
5. **Mobile Parity:** If applicable, replicate the UI component in the `/mobile` directory.

## Deployment Checklist
Before pushing to `main` for a cloud deployment (Render/AWS):
- [ ] Run `npm run build` in `/frontend` to verify Vite compiles without minification errors.
- [ ] Verify `FRONTEND_URL` is configured correctly for CORS in the environment settings.
- [ ] Ensure all API endpoints still function under expected network latencies.
