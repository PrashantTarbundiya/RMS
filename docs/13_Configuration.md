# 13 Configuration

This document lists all configuration files and environment variables across the backend, frontend, and mobile environments.

## 1. Backend Configuration

### `.env` (Environment Variables)
**Location:** `backend/.env` (create from `backend/.env.example`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEPLOYMENT_MODE` | No | `local` | `local` (single-tenant, no DB) or `cloud` (multi-tenant PostgreSQL) |
| `DATABASE_URL` | Cloud only | None | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`) |
| `SECRET_KEY` | Yes | `change-me-...` | Flask session and cryptographic operations secret |
| `JWT_SECRET_KEY` | Yes | `change-me-...` | Secret for signing JWT access/refresh tokens (HS256) |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | No | `15` | Access token lifetime in minutes |
| `JWT_REFRESH_TOKEN_EXPIRES_DAYS` | No | `7` | Refresh token lifetime in days |
| `FRONTEND_URL` | Production | None | Allowed CORS origin (e.g., `https://app.vercel.app`). If not set, CORS is open. |
| `LAZY_LOAD_MODELS` | No | `true` | If `true`, ML models load on first request (saves startup RAM) |
| `STORAGE_DIR` | No | Project root | Override root directory for dataset storage |
| `LOCAL_CAMERA_KEY` | No | `default-local-camera-key` | API key for local single-tenant camera auth |

### `backend/data/config.json` (Runtime Config)
**Purpose:** Dynamic, runtime-editable application variables. Changed via the Settings page without server restart.
```json
{
  "CONFIRM_THRESHOLD": 0.55
}
```
- `CONFIRM_THRESHOLD` (Float): KNN distance threshold. Lower = stricter (fewer false positives, more false negatives). Higher = looser.

### `requirements.txt`
**Key Dependencies:**
- `Flask>=3.0.0`: API framework
- `flask-cors`: Cross-Origin Resource Sharing
- `flask-limiter`: Rate limiting
- `torch>=2.1.0`, `torchvision>=0.16.0`: PyTorch ML
- `opencv-python-headless`: OpenCV (headless for server environments)
- `mediapipe`: BlazeFace face detection
- `deepface`: FaceNet512 embeddings
- `scikit-learn`: KNN classifier
- `SQLAlchemy>=2.0`: ORM for PostgreSQL
- `alembic`: Database migration tool
- `bcrypt`: Password hashing
- `PyJWT`: JWT token creation/validation
- `python-dotenv`: Environment variable loading
- `gunicorn`: Production WSGI server

### `alembic.ini`
**Purpose:** Alembic migration tool configuration.
- `sqlalchemy.url`: Reads from `DATABASE_URL` env var via `env.py`.

### `gunicorn.conf.py`
**Purpose:** Production WSGI server settings.
- Workers, timeout (300s), and bind address configuration.

---

## 2. Frontend Configuration

### `vite.config.js`
- `server.port`: Development server port (default `5173`).
- `plugins: [react()]`: Enables Fast Refresh for React.
- `server.proxy`: Optional API proxying for development.

### Environment Variables
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g., `http://localhost:5000/api` or `https://backend.onrender.com/api`) |

### `src/config.js`
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export default API_URL;
```

### `package.json` — Key Dependencies
- `react`, `react-dom`: UI framework
- `react-router-dom`: Client-side routing
- `axios`: HTTP networking
- `framer-motion`: Page transitions and animations
- `gsap`: Scroll-driven landing page animations
- `lucide-react`: SVG icon library
- `@dnd-kit/*`: Drag-and-drop for photo relocation

### `eslint.config.js`
- React Hooks lint rules ensuring `useEffect` dependency arrays are correct.

---

## 3. Mobile Configuration

### `app.json`
- `expo.name`: Display name on the device home screen.
- `expo.plugins`: Native permissions (Camera).
- `expo.android.package` / `expo.ios.bundleIdentifier`: Required for EAS builds.

### `src/theme.js`
Centralized liquid glass color palette and spacing tokens:
```javascript
export const Colors = {
  background: '#000000',
  cardBg: 'rgba(255,255,255,0.05)',
  primary: '#5E6AD2',
  // ...
};
```

### `src/services/api.js`
- `API_BASE`: Must be set to the local network IP of the Flask server (e.g., `http://192.168.1.50:5000/api`).

### `package.json` — Key Dependencies
- `expo`, `expo-camera`: Expo framework and camera
- `@react-navigation/*`: Stack and Tab navigators
- `react-native-reanimated`: 60fps native-driver animations

---

## 4. Deployment Configuration

### `render.yaml`
Infrastructure-as-code for Render.com:
- Defines build command, start command, and environment variables.
- Maps CORS origins to the Render dashboard URL.

### `docker-compose.yml`
Container orchestration with service definitions for frontend and backend.

### `Dockerfile` (Backend)
- Base: `python:3.12-slim`
- Installs: `libgl1-mesa-glx`, `libglib2.0-0` (for OpenCV and MediaPipe)
- Copies `requirements.txt` and installs dependencies.
- Exposes port and runs via Gunicorn.

### `Procfile`
Heroku/Render process definition:
```
web: cd backend && gunicorn server:app --bind 0.0.0.0:$PORT --timeout 300
```
