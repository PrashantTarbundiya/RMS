# RMS Face AI — Complete Enterprise & Cloud Deployment Manual

This guide covers all deployment topologies for RMS Face AI: from **Docker Compose (Single-Server / VPS)** to **100% Free Cloud (Vercel + Render)**, **Managed Enterprise Cloud (AWS/DigitalOcean)**, and **On-Premise Air-Gapped Appliances**.

---

## 🏗️ 1. Architecture Overview

```mermaid
graph TD
    ClientBrowser[Desktop Browser / Mobile PWA / Kiosk Tablet] -->|HTTPS Port 443 / 80| NginxProxy[Nginx Web Server & Static Cache]
    
    subgraph "Docker Microservices Network (rms_internal)"
        NginxProxy -->|Static PWA Assets| FrontendApp[React + Vite Single Page Application]
        NginxProxy -->|/api/* Requests| FlaskAPI[Flask Gunicorn API Server :8000]
        NginxProxy -->|/socket.io/* WebSockets| FlaskAPI
        
        FlaskAPI -->|Row-Isolated SQL Queries| Postgres[(PostgreSQL 15 Database :5432)]
        FlaskAPI -->|Enqueue Heavy Background Jobs| Redis[(Redis 7 Broker :6379)]
        Redis -->|Task Consumption| CeleryWorker[Celery ML Worker: MobileNetV2 Retraining]
        
        FlaskAPI -->|Read/Write Model Weights & Pickle Indexes| SharedVolume[(Shared Storage: /app/data)]
        CeleryWorker -->|Read/Write Checkpoints| SharedVolume
    end
```

---

## 🚀 2. Deployment Option A: Full Production Docker Stack (Recommended)

Best for: **Any VPS (Ubuntu 22.04 / 24.04), Dedicated Server, DigitalOcean Droplet, Hetzner, or AWS EC2.**
Provides: **All 5 microservices (Postgres, Redis, Flask API, Celery ML Worker, React Nginx) running in isolated containers with zero host dependencies.**

### Step 1: Server Prerequisites
On a fresh Ubuntu/Debian server:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git curl
sudo systemctl enable --now docker
```

### Step 2: Clone Repository & Configure Environment
```bash
git clone <your-repository-url> rms
cd rms

# Copy the pre-configured production Docker environment template
cp .env.docker .env

# (Optional) Generate secure random keys for production:
# python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 3: Launch Containers
```bash
# Build and start all microservices in the background
docker compose up -d --build
```

### Step 4: Verify System Status
```bash
# Check that all 5 containers are running and healthy
docker compose ps

# View live consolidated API & ML logs
docker compose logs -f api
```

The system is now live at `http://your-server-ip`!

---

## 🌐 3. Deployment Option B: 100% Free Tier (Vercel + Render + Supabase)

Best for: **Academic evaluations, client proof-of-concept demos, and zero-budget testing.**

### Step 1: Deploy PostgreSQL on Supabase (Free)
1. Go to [Supabase](https://supabase.com/) and create a free project.
2. In **Project Settings** $\rightarrow$ **Database**, copy the **URI Connection String**:
   `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Step 2: Deploy Backend to Render (Free)
1. Sign up at [Render](https://render.com/).
2. Click **New +** $\rightarrow$ **Web Service** and link your Git repository.
3. Configure the settings:
   - **Root Directory:** *(leave blank)*
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements-render.txt`
   - **Start Command:** `cd backend && gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker server:app --bind 0.0.0.0:$PORT --timeout 300 --workers 1 --worker-connections 100 --max-requests 100 --max-requests-jitter 10`
   - **Plan:** `Free`
4. In **Advanced** $\rightarrow$ **Environment Variables**, add:
   - `DEPLOYMENT_MODE` = `cloud`
   - `DATABASE_URL` = *(Your Supabase connection string)*
   - `LAZY_LOAD_MODELS` = `true` *(Crucial to fit in free tier 512MB RAM)*
   - `FRONTEND_URL` = `https://your-app.vercel.app` *(Update after Step 3)*
5. Click **Create Web Service** and note your URL (e.g. `https://rms-backend.onrender.com`).

### Step 3: Deploy Frontend to Vercel (Free)
1. Sign up at [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your repository.
3. Configure build settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://rms-backend.onrender.com/api`
5. Click **Deploy**. Note your live URL (e.g. `https://rms-face-ai.vercel.app`).
6. Update `FRONTEND_URL` on Render to match your Vercel URL for CORS authorization.

---

## 🔒 4. Production SSL & Domain Setup (Nginx + Let's Encrypt)

> [!IMPORTANT]
> **PWA & Webcam Requirement:** Modern browsers (Chrome, Safari, Edge) strictly require **HTTPS (SSL)** to access webcams and enable PWA standalone app installation on external networks.

If you have a domain (e.g., `rms.yourcompany.com`) pointing to your VPS:

### Step 1: Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Configure Host Nginx
Create `/etc/nginx/sites-available/rms`:
```nginx
server {
    server_name rms.yourcompany.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }
}
```

### Step 3: Issue Free SSL Certificate
```bash
sudo ln -s /etc/nginx/sites-available/rms /etc/nginx/sites-enabled/
sudo certbot --nginx -d rms.yourcompany.com
```
Certbot will configure HTTPS automatically with auto-renewal every 90 days.

---

## 📱 5. PWA (Progressive Web App) Operation

Once deployed over HTTPS (or on `http://localhost` during local evaluation):
1. **Desktop Users:**
   - Chrome/Edge will display an **"Install App"** icon in the URL bar.
   - Or click the **"Install App (PWA)"** button in the sidebar navigation.
   - The app runs in a dedicated window without browser URL bars or tabs.
2. **Kiosk Devices & Tablets:**
   - Navigate to `/kiosk`.
   - The application runs in full-screen hardware-accelerated kiosk mode.
   - If internet connectivity drops, punches are queued locally in browser IndexedDB/LocalStorage and automatically synchronized upon reconnection.
3. **Seamless Over-The-Air Updates:**
   - The Service Worker checks for new builds in the background on every launch.
   - When a new deployment is detected, a banner notifies the user: *"New System Update Ready — Click to Update Now"*.
   - Clicking it updates the application instantly without manual file downloads.

---

## 🛠️ 6. Pre-Flight Verification Checklist

Before opening the system to end-users or clients, verify:

- [ ] **Health Endpoint:** `curl http://localhost:8000/api/health` returns `{"status": "ok"}`.
- [ ] **Database Connection:** `is_db_available()` returns `True` in API logs.
- [ ] **Webcam Permission:** Browser allows camera access in Kiosk Mode (`/kiosk`) and Live Attendance (`/attendance/live`).
- [ ] **Offline License:** `backend/license.key` is validated with `LicenseStatus.VALID`.
- [ ] **Model Configuration:** Primary models (Facenet512, InsightFace) are active in `/models`.
- [ ] **CORS Configuration:** `FRONTEND_URL` matches your frontend domain.
