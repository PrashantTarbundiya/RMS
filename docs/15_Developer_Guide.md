# 15 Developer Guide

Welcome to the RMS Face AI repository! This guide provides everything a new engineer needs to clone, configure, and contribute to the system.

## Prerequisites
- **Python 3.10+** (3.12 recommended)
- **Node.js 18+** with npm
- **PostgreSQL 14+** (optional — only for multi-tenant cloud mode)
- **Git**

---

## Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/rms-face-ai.git
cd rms-face-ai
```

### 2. Quick Start (Windows)
```bash
.\start.bat
```
This automatically creates a Python venv, installs dependencies, and launches Flask (port 5000) + Vite (port 5173).

### 3. Manual Installation

#### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### Environment Configuration
Copy the example environment file and configure:
```bash
cp .env.example .env
```

**For Local/Demo Mode** (no database required):
```env
DEPLOYMENT_MODE=local
SECRET_KEY=your-random-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
LAZY_LOAD_MODELS=true
```

**For Cloud/Multi-Tenant Mode** (PostgreSQL required):
```env
DEPLOYMENT_MODE=cloud
DATABASE_URL=postgresql://user:password@localhost:5432/rms_faceai
SECRET_KEY=your-random-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
FRONTEND_URL=http://localhost:5173
LAZY_LOAD_MODELS=true
```

#### Database Setup (Cloud Mode Only)
```bash
cd backend
alembic upgrade head
```
This creates all 8 tables (organizations, users, employees, cameras, attendance_logs, feedback_logs, subscriptions, consent_records).

#### Start the Backend
```bash
python server.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Running the Mobile App
Install the Expo Go app on your smartphone.
```bash
cd mobile
npm install
npx expo start
```
Press `w` for web simulator or scan the QR code with your phone.

**Important:** Update the API base URL in `mobile/src/services/api.js` to your computer's local IP (e.g., `http://192.168.1.50:5000/api`).

---

## Authentication for Development

### Local Mode
In local mode (`DEPLOYMENT_MODE=local`), authentication is bypassed. All middleware decorators act as passthroughs, granting `org_admin` access. You can access all pages without logging in.

### Cloud Mode
1. Start the server with `DATABASE_URL` configured.
2. Navigate to `http://localhost:5173/register` to create your organization and admin account.
3. Login at `http://localhost:5173/login`.
4. JWT tokens are automatically managed by the `AuthContext`.

---

## Folder Conventions & Architecture
Always respect the strict decoupling:
- **Database logic** → `database/models.py` and `database/db.py`. Never put raw SQL in `server.py`.
- **Authentication** → `auth.py` and `middleware.py`. Never validate tokens in route handlers directly.
- **Multi-tenant paths** → Always use `org_storage.py` helpers. Never hardcode file paths.
- **Styling** → Use CSS Variables in `index.css`. Never use inline styles or hardcoded hex values in React components.
- **ML Models** → `models/` directory. Never modify model architecture in `server.py`.

## Coding Standards

### Python (PEP 8)
- `snake_case` for variables and functions.
- `PascalCase` for classes (SQLAlchemy models, PyTorch modules).
- Docstrings `""" """` for all major functions.
- Type hints encouraged for function signatures.

### JavaScript (React)
- `PascalCase` for components (e.g., `LiveAttendancePage.jsx`).
- Functional components with Hooks only — no Class components.
- Destructure props. Use `useCallback` for stable function references.

### CSS
- Use semantic CSS variable names (e.g., `var(--bg-card)`, `var(--border)`).
- Never use hardcoded hex values directly in component styles.
- Glassmorphism utilities: `.liquid-glass`, `.liquid-glass-strong`, `.liquid-glass-subtle`.

---

## Branch Strategy
- `main`: Production-ready code. Must always be deployable.
- `develop`: Staging area for integration testing.
- `feature/<name>`: New components or features (e.g., `feature/stripe-billing`).
- `bugfix/<name>`: Critical error patches (e.g., `bugfix/camera-crash`).

---

## Common Errors & Debugging

### `401 Unauthorized` on all API calls
**Fix:** You're in cloud mode but haven't registered/logged in. Go to `/register` to create an account, or switch to `DEPLOYMENT_MODE=local` for no-auth development.

### `[UNTRAINED]` showing in Test Console
**Fix:** The SOTA MobileNetV2 model hasn't been trained yet for this organization. Go to the Training page and run a retraining cycle. The DeepFace KNN system will still work for recognition in the meantime.

### `500 Internal Server Error` on Mobile App
**Fix:** The mobile app's `api.js` is pointing to the wrong IP. Find your local IP (e.g., `ipconfig` on Windows) and update it. Ensure your firewall allows Port `5000`.

### `CORS Error` in browser console
**Fix:** Set `FRONTEND_URL=http://localhost:5173` in your `.env` file. In production, this must match your exact Vercel/deployment URL.

### `alembic upgrade head` fails
**Fix:** Ensure `DATABASE_URL` is set in `.env` and the PostgreSQL server is running. Check that the database exists and the user has CREATE TABLE permissions.

### Out of memory during training
**Fix:** Decrease batch size in `models/sota_finetune/finetune.py`. On free cloud tiers, set `LAZY_LOAD_MODELS=true` and keep epoch count low (5-10).

---

## How to Add a Feature
1. **Read Docs:** Review `01_Architecture.md` to understand which layers are affected.
2. **Database (if needed):** Add SQLAlchemy model in `database/models.py`, generate Alembic migration.
3. **Backend:** Implement logic in a service file, expose via `@app.route` in `server.py` with proper auth decorators.
4. **Test API:** Use Postman or cURL with a valid JWT Bearer token.
5. **Frontend:** Create/update React component, use `apiClient` from `AuthContext` for authenticated requests.
6. **Mobile (if applicable):** Replicate in `/mobile`.

---

## Deployment Checklist
Before pushing to `main` for production:
- [ ] Run `npm run build` in `/frontend` — verify Vite compiles without errors.
- [ ] Run `python -m py_compile server.py` — verify no Python syntax errors.
- [ ] Run `alembic upgrade head` — verify migrations apply cleanly.
- [ ] Verify `FRONTEND_URL` is configured for CORS.
- [ ] Verify `JWT_SECRET_KEY` is a strong random string (not the default).
- [ ] Verify `LAZY_LOAD_MODELS=true` if deploying to memory-constrained environments.
- [ ] Test login/register flow end-to-end.
- [ ] Test `/api/predict` with both JWT and API key authentication.
