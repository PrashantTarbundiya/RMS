# RMS Face AI — 100% Free Production Deployment Guide

This guide details how to deploy the React Web Frontend to **Vercel (Free Tier)** and the Python Flask Backend to **Render (Free Tier)** without paying anything.

---

## Architecture Overview

```mermaid
graph LR
  User([User Browser]) -->|Vite/React App| Vercel[Vercel Frontend]
  User -->|API Requests| Render[Render Python Backend]
  Render -->|PostgreSQL DB| Postgres[(Render Postgres / Supabase)]
```

* **Frontend:** Hosted on Vercel's edge network (free sub-domain: `your-app.vercel.app`).
* **Backend:** Hosted on Render's Python environment (free sub-domain: `rms-backend.onrender.com`).
* **Database Modes:**
  * **Single-Tenant Mode (`DEPLOYMENT_MODE=local`):** Bypasses SQL database checks, using local directories and flat JSON files. Ideal for offline/appliance demos.
  * **Multi-Tenant Mode (`DEPLOYMENT_MODE=cloud`):** Connects to a PostgreSQL database instance to manage multi-tenant user authentication, organizations, subscription states, and inference metrics.

---

## Step 1: Deploy Database (For Cloud/Multi-Tenant Mode)
If deploying in Cloud mode, create a free PostgreSQL database instance:
1. Create an account at [Supabase](https://supabase.com) or [Render PostgreSQL](https://render.com).
2. Create a new database project and copy the connection string:
   `postgresql://postgres:password@db-host:5432/postgres`

---

## Step 2: Deploy Backend to Render (Free)

1. Create a free account at [Render](https://render.com/).
2. Push your project to a GitHub repository.
3. Click **New +** → **Web Service** in the Render Dashboard.
4. Connect your Git repository.
5. Configure the Web Service settings:
   * **Name:** `rms-face-ai-backend`
   * **Environment:** `Python`
   * **Region:** Select closest region to your users
   * **Branch:** `main`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `cd backend && gunicorn server:app --bind 0.0.0.0:$PORT --timeout 300 --workers 1`
   * **Instance Type:** `Free`
6. Expand **Advanced** and add the following **Environment Variables**:
   * `DEPLOYMENT_MODE`: `cloud` (or `local` for flat-file single-tenant demos)
   * `DATABASE_URL`: `postgresql://...` (your PostgreSQL connection string - omit if local)
   * `LAZY_LOAD_MODELS`: `true` (Crucial for Vercel/Render free tiers to fit within the 512MB RAM limit)
   * `FRONTEND_URL`: `https://YOUR_APP_NAME.vercel.app` (your Vercel app URL - you can update this after Step 3)
7. Click **Create Web Service**. Wait for the build and deployment logs to finish.
8. Copy your Render Service URL (e.g., `https://rms-face-ai-backend.onrender.com`).

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Create a free account at [Vercel](https://vercel.com/).
2. Click **Add New** → **Project** in the Vercel Dashboard.
3. Import your Git repository.
4. Configure the Project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
5. Expand **Environment Variables** and add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://YOUR_RENDER_URL.onrender.com/api` (The backend URL copied in Step 2 + `/api`)
6. Click **Deploy**. Vercel will host your site in less than a minute.
7. Note down your Vercel URL (e.g., `https://rms-face-ai.vercel.app`).

---

## Step 4: Configure CORS (Final Link)

Go back to your Render Dashboard for the backend service:
1. In settings, go to **Environment Variables**.
2. Update the `FRONTEND_URL` value to match your actual Vercel URL: `https://YOUR_APP_NAME.vercel.app`.
3. Save changes. Render will automatically redeploy the backend with the new CORS permissions.

---

## Troubleshooting

### Cold Starts
Render's free tier spins down after 15 minutes of inactivity. The first request takes ~30-60 seconds to boot the server and load the dashboard. This is expected behavior.

### Gateway Timeouts
Training models on a free CPU tier takes computational time. Keep epochs count low (e.g., 5 epochs) to avoid timeouts. The Gunicorn server has been configured with `--timeout 300` (5 minutes) to handle longer training tasks.

### Multi-Tenant Database Migration
If you need to update table schemas in Cloud mode, activate your virtual environment locally and run Alembic migrations:
```bash
cd backend
alembic upgrade head
```
