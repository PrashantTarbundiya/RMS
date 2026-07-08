# RMS Face AI v2.0 — Deployment Guide

## Quick Start (Windows)

```bash
# 1. Clone or navigate to the project
cd E:\RMS\RMS

# 2. Run the startup script (handles everything)
start.bat
```

The startup script will:
1. ✅ Detect Python 3.13 (or system Python)
2. ✅ Install missing Python dependencies
3. ✅ Check Node.js is installed
4. ✅ Install frontend npm packages if needed
5. ✅ Launch Flask API + React frontend

---

## Manual Setup

### Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| Python | 3.10+ (3.13 recommended) | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Git | Any | [git-scm.com](https://git-scm.com) |

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 3: Start the Backend

```bash
python frontend/api/server.py
```

The server will:
- Load 3 ML models (DeepFace, Custom CNN, MobileNetV2)
- Start on `http://0.0.0.0:5000`
- Print your local IP for mobile app connection

### Step 4: Start the Frontend

```bash
cd frontend
npm run dev
```

Opens on `http://localhost:5173`

### Step 5: (Optional) Start Mobile App

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## Mobile App Setup

1. Ensure your **phone and computer are on the same WiFi network**
2. Find your PC's IP address:
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac/Linux: `ifconfig` → look for inet under Wi-Fi
3. In the mobile app, go to **Settings** → enter `http://YOUR_IP:5000/api`
4. Test connection with the **Refresh** button

---

## Project Structure

```
RMS/
├── frontend/
│   ├── api/
│   │   ├── server.py         # Flask API (main backend)
│   │   └── ensemble.py       # Ensemble voting logic
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # Navbar, etc.
│   │   └── index.css         # Design system v2.0
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── screens/          # React Native screens
│   │   ├── services/api.js   # API client
│   │   └── theme.js          # Mobile design system
│   └── package.json
├── custom_cnn/               # Custom CNN model files
├── sota_finetune/            # MobileNetV2 fine-tuning
├── dataset_cleaned/          # Processed face dataset
├── requirements.txt          # Python dependencies
├── start.bat                 # One-click launcher (Windows)
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ping` | Connection test |
| GET | `/api/health` | Model status check |
| GET | `/api/persons` | List registered people |
| POST | `/api/upload` | Upload face photos + start training |
| GET | `/api/train/status` | SSE stream for training logs |
| POST | `/api/predict` | Run face recognition on an image |
| POST | `/api/export-onnx` | Export MobileNetV2 to ONNX |
| GET | `/api/download-model` | Download exported ONNX model |
| POST | `/api/models/reset` | Delete all models and data |

---

## Troubleshooting

### Server won't start
- Check Python version: `python --version` (need 3.10+)
- Install deps: `pip install -r requirements.txt`
- Check port 5000 isn't in use: `netstat -ano | findstr :5000`

### Webcam not working
- Must access via `http://localhost:5173` (not IP address)
- HTTPS required for non-localhost webcam access
- Close other apps using the camera

### Mobile can't connect
- Same WiFi network required
- Check IP with `ipconfig` on Windows
- URL format: `http://192.168.x.x:5000/api`
- Firewall may block port 5000

### Models not recognizing faces
- Upload 3+ photos per person from different angles
- After upload, wait for training to complete
- Check the Models page to verify model status
- Try retraining with more epochs (10-15)
