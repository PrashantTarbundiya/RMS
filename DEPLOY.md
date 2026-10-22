# RMS Face AI — Complete Enterprise & Cloud Deployment Manual

This manual provides the complete, authoritative setup, deployment, and operational guide for **RMS Face AI v2.0**. It covers cloud deployment on **AWS EC2 / VPS**, on-premise air-gapped appliances, webcam access, downloading trained models, and offline edge execution.

---

## 🏗️ 1. System Architecture

```mermaid
graph TD
    ClientBrowser[Desktop Browser / Mobile PWA / Kiosk Tablet] -->|Port 80 / 443| NginxProxy[Frontend Nginx Container :80]
    
    subgraph "Docker Microservices Network (rms_internal)"
        NginxProxy -->|Static PWA Assets| FrontendApp[React + Vite Single Page Application]
        NginxProxy -->|/api/* (Dynamic Proxy)| FlaskAPI[Flask Gunicorn API Server :8000]
        NginxProxy -->|/socket.io/* WebSockets| FlaskAPI
        
        FlaskAPI -->|Row-Isolated Multi-Tenant SQL| Postgres[(PostgreSQL 15 Database :5432)]
        FlaskAPI -->|Enqueue Background Retraining| Redis[(Redis 7 Broker :6379)]
        Redis -->|Task Consumption| CeleryWorker[Celery ML Worker: ONNX / MobileNetV2]
        
        FlaskAPI -->|Read/Write Model Weights & Pickles| SharedVolume[(Docker Volume: /app/data)]
        CeleryWorker -->|Read/Write Checkpoints| SharedVolume
    end
```

---

## 🚀 2. AWS EC2 / Ubuntu VPS Production Setup (Step-by-Step)

### Step 1: Server Provisioning & Docker Installation
On a fresh Ubuntu 22.04 or 24.04 instance (recommended: AWS EC2 `t3.large` or `t3.xlarge` with at least 8GB RAM):

```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Docker, Docker Compose plugin, and essential utilities
sudo apt install -y docker.io docker-compose-v2 git curl unzip
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

> **AWS Security Group Inbound Rules Required:**
> - `Port 22` (SSH) — Your IP
> - `Port 80` (HTTP) — `0.0.0.0/0`
> - `Port 443` (HTTPS) — `0.0.0.0/0` (if using SSL domain)

---

### Step 2: Clone Repository & Configure Environment

```bash
# Clone the repository
git clone https://github.com/PrashantTarbundiya/RMS.git ~/RMS
cd ~/RMS

# Set up the production Docker environment
cp .env.docker .env
```

Ensure `.env` contains:
```env
# Database & Cache
DATABASE_URL=postgresql://rms_user:rms_secure_pass_2026@postgres:5432/rms_db
REDIS_URL=redis://redis:6379/0

# Security Keys
SECRET_KEY=rms-production-super-secret-key-change-me-in-prod
JWT_SECRET=rms-jwt-production-secret-key-change-me-in-prod

# Multi-Tenancy & Auth
AUTH_REQUIRED=true
DEPLOYMENT_MODE=local
STORAGE_DIR=/
```

---

### Step 3: Build & Start All Microservices

```bash
# Launch all 5 containers (Postgres, Redis, API, ML Worker, Frontend Nginx)
sudo docker compose -f docker-compose.prod.yml up -d --build
```

Verify that all 5 containers are running and healthy:
```bash
sudo docker ps
```

Expected containers:
- `rms_frontend` (Port `0.0.0.0:80->80/tcp`)
- `rms_api` (Internal Port `8000`)
- `rms_ml_worker` (Celery background worker)
- `rms_postgres` (Port `5432` healthy)
- `rms_redis` (Port `6379` healthy)

---

### Step 4: Database Seeding & Administrator User Setup

If setting up the system for the first time, initialize the database tables and create the default organization admin account:

```bash
# 1. Run database migrations inside the API container
sudo docker exec -it rms_api python3 -c "from database.db import init_db; init_db()"

# 2. Create the initial Org Administrator
sudo docker exec -it rms_api python3 -c "
from database.db import get_session
from database.models import User, Organization
import bcrypt

with get_session() as session:
    org = session.query(Organization).filter_by(id='default-org').first()
    if not org:
        org = Organization(id='default-org', name='Default Organization', slug='default-org', plan='enterprise', is_active=True)
        session.add(org)
        session.flush()

    user = session.query(User).filter_by(email='vatsalvadgama02@gmail.com').first()
    pw_hash = bcrypt.hashpw('12345678'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    if not user:
        user = User(id='user-admin', org_id=org.id, email='vatsalvadgama02@gmail.com', name='System Admin', password_hash=pw_hash, role='org_admin', is_active=True)
        session.add(user)
    else:
        user.password_hash = pw_hash
        user.org_id = org.id
        user.role = 'org_admin'
        user.is_active = True
    session.commit()
    print('Administrator account ready.')
"
```

---

### Step 5: Benchmark Weights & Pre-Trained Dataset Import

RMS includes 70 pre-trained identities with 1,042 multi-angle embeddings across Facenet512, InsightFace ArcFace, and GhostFaceNet.

To import or sync them immediately:
1. Log into `http://<your-server-ip>/login` (e.g. `vatsalvadgama02@gmail.com` / `12345678`).
2. Navigate to **Models** (`/models`).
3. Click the purple button: **"Import 70 Personnel & AI Weights"**.
4. Both **Facenet512** and **InsightFace ArcFace** will load into memory with 1,000+ encodings.

---

## 📷 3. Camera & Webcam Access on Public IP (HTTP)

> [!IMPORTANT]
> **Browser Security Policy:** Modern browsers (Chrome, Edge, Brave, Safari) block `getUserMedia` (camera/mic) on raw HTTP IP addresses (anything other than `localhost` or HTTPS).

### Option A: Enable Chrome / Edge Flag (Takes 30 Seconds — Recommended for IP testing)
1. In your browser address bar, paste:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
2. Set the flag to **Enabled**.
3. In the text box below it, enter your server URL:
   ```text
   http://<your-server-ip>
   ```
   *(e.g., `http://13.60.225.165`)*
4. Click the blue **Relaunch** button at the bottom-right.
5. Visit `http://<your-server-ip>/test` — the camera permission prompt will now appear and work seamlessly.

---

### Option B: Free Production SSL with Domain (Let's Encrypt)
If you point a domain (e.g., `face.yourdomain.com`) to your server IP:

```bash
# 1. Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. Issue SSL Certificate for your domain
sudo certbot certonly --standalone -d face.yourdomain.com

# 3. Mount the SSL certificates in frontend/nginx.conf or run Certbot in front of Docker port 80.
```

---

## 📥 4. Where to Download Models & Weights

RMS allows administrators to export all trained neural network weights and vector databases for edge deployments, offline appliances, or disaster recovery.

### In the Web Dashboard:
1. **Model Management (`/models`):**
   - Scroll down to the **"Edge & Offline Model Exports"** card.
   - Click **Download** next to any model file:
     - `encodings.pickle`: 512-dimensional Facenet512 KNN metric index.
     - `encodings_InsightFace.pickle`: InsightFace ArcFace ONNX embedding index.
     - `best_mobile_sideface.pth`: SOTA MobileNetV2 PyTorch multi-view classification weights.
     - `w600k_mbf.onnx`: Raw InsightFace ArcFace ONNX backbone for offline CPU/GPU edge execution.
     - `class_centroids.json`: Normalized centroids map for low-power edge lookup.
2. **Training Console (`/train`):**
   - When training completes, the **"Encodings & Weights"** panel displays direct download buttons for all updated model files.
3. **Backup & Restore (`/models`):**
   - Click **Create Backup** to generate a complete `.tar.gz` archive of all identity data, images, and model weights.

### Via Authenticated API:
```bash
# Fetch available model files and sizes
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" http://<server-ip>/api/download-list

# Download Facenet512 Encodings
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" "http://<server-ip>/api/download-file?name=encodings.pickle" -o encodings.pickle

# Download InsightFace ArcFace Encodings
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" "http://<server-ip>/api/download-file?name=encodings_InsightFace.pickle" -o encodings_InsightFace.pickle

# Download ONNX Backbone
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" "http://<server-ip>/api/download-file?name=w600k_mbf.onnx" -o w600k_mbf.onnx
```

---

## 🔌 5. How to Run Models Offline

RMS is architected for complete data sovereignty and air-gapped operation. You can run models offline in 4 different topologies:

### Mode 1: Fully Air-Gapped On-Premises Server
- Deploy the standard Docker stack on any local machine, Intel NUC, or on-premise server.
- The system binds to `http://localhost` or `http://192.168.x.x` (Local Area Network).
- **Zero outbound telemetry:** No data is sent to external cloud APIs. All face detection (MediaPipe), feature extraction (Facenet512 & InsightFace ONNX), and verification (KNN) execute entirely on local CPU or GPU.

### Mode 2: Offline Tablet / Kiosk Mode (`/kiosk`)
- RMS is a Progressive Web App (PWA).
- Open `http://<server-ip>/kiosk` and install it to the home screen or desktop.
- **Offline Resilient Attendance:** When internet connectivity is lost, the kiosk continues running facial verification and logs punches to browser IndexedDB/LocalStorage (`@rms_offline_queue`). As soon as network connectivity is restored, punches automatically synchronize with the server.

### Mode 3: Edge Devices (Raspberry Pi / Jetson / Smart Cameras)
- Download `encodings.pickle` or `encodings_InsightFace.pickle` and `w600k_mbf.onnx` from `/models`.
- Transfer these files to your edge device.
- Use the lightweight Python inference script:
  ```python
  import cv2, pickle, numpy as np
  from sklearn.neighbors import NearestNeighbors

  with open('encodings.pickle', 'rb') as f:
      data = pickle.load(f)

  # Match live camera crop embeddings locally at 30+ FPS
  ```
- No video feeds ever leave the local network.

### Mode 4: Air-Gapped Firmware & Model Updates
- In **Settings / Profile** (`/profile`), administrators can perform **Offline / Air-Gapped Updates**.
- Upload a pre-built `.tar.gz` update package directly through the UI. The server verifies HMAC signatures and SHA-256 checksums offline before applying updates.

---

## 🛠️ 6. Useful Maintenance & Troubleshooting Commands

```bash
# View live API logs
sudo docker logs -f rms_api

# View live Nginx access / error logs
sudo docker logs -f rms_frontend

# View Celery ML worker background jobs
sudo docker logs -f rms_ml_worker

# Restart the application stack
sudo docker compose -f docker-compose.prod.yml restart

# Check active model weights in memory
sudo docker exec rms_api python3 -c "
from org_storage import get_encodings_path
import pickle, os
for m in ['Facenet512', 'InsightFace', 'GhostFaceNet']:
    p = get_encodings_path('default-org', m)
    if os.path.exists(p):
        with open(p, 'rb') as f:
            d = pickle.load(f)
            print(f'{m}: {len(d[\"encodings\"])} encodings across {len(set(d[\"names\"]))} identities')
"
```
