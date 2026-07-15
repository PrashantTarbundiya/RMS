# RMS Face AI — Complete Project Guide

## What is This Project?

**RMS Face AI** is a face recognition system that uses **3 AI models working together** (ensemble) to identify people. It has:
- A **web dashboard** (React) to manage people, train models, and test recognition
- A **Python backend** (Flask) that runs the AI models
- A **mobile app** (React Native/Expo) for on-device face detection

---

## How Face Recognition Works (Simple Explanation)

### The 3 Models

| Model | What it does | How it works | Strengths |
|-------|-------------|-------------|-----------|
| **DeepFace (Facenet512)** | Creates a "fingerprint" of each face | Converts each face photo into a 512-number vector (embedding). To recognize someone, it compares the test photo's vector to all stored vectors using cosine distance | Best with few images. No training needed — just add more photos |
| **Custom CNN** | Learns face patterns from scratch | 4-layer convolutional neural network that learns to classify faces by looking at pixel patterns | Gets better with more training data |
| **SOTA MobileNetV2** | Uses Google's pre-trained vision model | Starts with a model pre-trained on 1M+ images (ImageNet), then fine-tunes on your faces. Only the last layers are retrained | Best generalization — the ImageNet backbone already "understands" what faces look like |

### Ensemble Voting

When you test a photo, all 3 models make their prediction independently. Then the **ensemble voter** combines them:

```
Custom CNN:     "Vatsal" (100% confident)    weight: 0.25
SOTA MobileNet: "Vatsal" (86% confident)     weight: 0.35
DeepFace:       "Vatsal" (72% confident)     weight: 0.40

→ Weighted vote: "Vatsal" with ~85% confidence ✅
```

If models disagree, the one with higher weight (DeepFace) has more influence. If the combined confidence is below 25%, it shows "Unknown".

---

## Project Folder Structure

```
RMS/
├── backend/                     # Python Flask API server
│   ├── server.py                # Main API server (all endpoints)
│   ├── model.py                 # DeepFace embedding generation + CLAHE preprocessing
│   ├── inference.py             # KNN matching logic for DeepFace
│   ├── ensemble.py              # Combines 3 model predictions into final result
│   ├── add_person_utils.py      # Training pipeline: adds person to all 3 models
│   ├── face_detection.py        # MediaPipe face detector (detects face angle)
│   ├── clean_dataset.py         # Crops faces from raw images
│   ├── soft_biometrics.py       # Extra face measurements (nose ratio, eye spacing)
│   ├── dataset_setup.py         # Webcam capture tool for collecting training photos
│   ├── download_dataset.py      # Downloads LFW dataset for pre-training
│   ├── retrain_all.py           # One-click retrain all models with max accuracy
│   ├── benchmark_models.py      # Tests model accuracy on your dataset
│   ├── data/
│   │   ├── encodings.pickle     # DeepFace embeddings database
│   │   ├── recognition_history.json  # Log of past predictions
│   │   ├── class_centroids.json      # Average embeddings per person
│   │   └── label_map.json            # Person name ↔ index mapping
│   ├── models/
│   │   ├── custom_cnn/
│   │   │   ├── model.py              # CNN architecture (4 conv layers)
│   │   │   ├── best_face_model.pth   # Trained CNN weights
│   │   │   └── class_names.txt       # List of known people for CNN
│   │   └── sota_finetune/
│   │       ├── finetune.py           # MobileNetV2 architecture + training
│   │       ├── best_mobile_sideface.pth  # Trained SOTA weights
│   │       └── mobile_classes.txt    # List of known people for SOTA
│   └── venv/                    # Python virtual environment
│
├── frontend/                    # React web dashboard (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx     # Overview: people count, model status
│   │   │   ├── UploadPage.jsx        # Add new person with photos
│   │   │   ├── TestPage.jsx          # Test recognition on images/webcam
│   │   │   ├── TrainingPage.jsx      # Monitor training progress
│   │   │   ├── ManagePersonPage.jsx  # Edit/delete person photos
│   │   │   └── ModelsPage.jsx        # Export/reset models
│   │   └── config.js            # API URL configuration
│   ├── .env                     # Local API URL
│   └── .env.production          # Production API URL (Render)
│
├── mobile/                      # React Native Expo app
│   ├── App.js                   # Main mobile app
│   └── src/                     # Mobile screens and components
│
├── dataset/                     # Raw uploaded photos (unprocessed)
├── dataset_cleaned/             # Face-cropped training images
│   ├── PersonName/
│   │   ├── frontal/             # Front-facing photos
│   │   ├── left/                # Left profile photos
│   │   └── right/               # Right profile photos
│
├── requirements.txt             # Python dependencies
├── DEPLOY.md                    # Deployment guide (Vercel + Render)
├── render.yaml                  # Render deployment config
└── start.bat                    # One-click startup script
```

---

## How to Use the System

### Adding a New Person
1. Go to **Upload** page in the web dashboard
2. Enter the person's name
3. Upload photos: front, left profile, right profile (more = better accuracy)
4. Click "Upload" — training starts automatically
5. Wait for training to complete (watch the **Training** page for progress)

### Testing Recognition
1. Go to **Test** page
2. Upload a photo or use your webcam
3. The system shows:
   - Face bounding box
   - Individual model predictions (CNN, SOTA, DeepFace)
   - Final ensemble result with confidence %

### Retraining for Better Accuracy
```bash
cd backend
.\\venv\\Scripts\\activate
python retrain_all.py
```
This retrains all 3 models with more epochs for maximum accuracy.

---

## How to Deploy (100% Free)

### Frontend → Vercel (Free)
1. Go to [vercel.com](https://vercel.com) → Sign up free
2. Click "Add New Project" → Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL` = `https://YOUR-BACKEND.onrender.com/api`
5. Click Deploy

### Backend → Render (Free)
1. Go to [render.com](https://render.com) → Sign up free
2. Click "New Web Service" → Connect your GitHub repo
3. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn server:app --bind 0.0.0.0:$PORT --timeout 300 --workers 1`
   - **Instance Type**: Free
4. Add environment variables:
   - `LAZY_LOAD_MODELS` = `true`
   - `FRONTEND_URL` = `https://YOUR-APP.vercel.app`
5. Click "Create Web Service"

### After Both Are Deployed
- Update Render's `FRONTEND_URL` with your actual Vercel URL
- Update Vercel's `VITE_API_URL` with your actual Render URL
- Both will auto-redeploy

> **Note**: Render free tier sleeps after 15 min of inactivity. First request takes ~30-60s to wake up.

---

## Key Configuration Values

| Setting | File | Current Value | What it does |
|---------|------|--------------|--------------|
| `NUM_AUGMENTS` | `model.py` | 5 | How many augmented variants per training image |
| `KNN_K` | `inference.py` | 5 | Number of nearest neighbors for DeepFace voting |
| `MAX_DISTANCE` | `inference.py` | 0.55 | Max cosine distance to accept a match |
| `MIN_CONFIDENCE_THRESHOLD` | `ensemble.py` | 0.25 | Below this → "Unknown" |
| `AGREEMENT_BONUS` | `ensemble.py` | 0.10 | Bonus when 2+ models agree |
