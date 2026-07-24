# 03 Backend Architecture & Implementation

## Overview
The RMS Face AI Backend is a Python Flask application that orchestrates authentication, multi-tenant data isolation, file uploads, edge-based image processing, and a dual-model Machine Learning pipeline. It supports two deployment modes: **Cloud** (multi-tenant PostgreSQL with full JWT authentication) and **Local** (single-tenant file-based storage with no-auth passthrough).

## Server Startup (`server.py`)
Upon launching `python server.py`, the backend performs the following initialization:
1. **Environment Loading:** Reads `.env` via `python-dotenv` for `DEPLOYMENT_MODE`, `DATABASE_URL`, `LAZY_LOAD_MODELS`, `JWT_SECRET_KEY`, etc.
2. **Database Initialization:** If `DATABASE_URL` is set, initializes SQLAlchemy engine, creates session factory, and runs Alembic migration checks.
3. **Directory Generation:** Validates and auto-creates `/backend/data`, `/dataset`, and `/dataset_cleaned`.
4. **CORS Configuration:** Reads `FRONTEND_URL` for production origin restriction. Falls back to open CORS in local dev.
5. **Rate Limiting:** Configures Flask-Limiter for API abuse protection.
6. **Model Loading (Lazy or Eager):**
   - If `LAZY_LOAD_MODELS=true`: Models load on the first `/api/predict` request to save startup RAM.
   - If `LAZY_LOAD_MODELS=false`: Pre-loads MediaPipe, FaceNet512 encodings, and MobileNetV2 weights into memory at startup.
7. **Blueprint Registration:** Registers `employees_bp`, `analytics_bp`, and other route Blueprints.

## Authentication & Security (`middleware.py`, `auth.py`)

### JWT Token Management (`auth.py`)
- **Password Hashing:** `bcrypt` with 12 salt rounds.
- **Access Tokens:** JWT (HS256), 15-minute expiry. Payload: `{sub: user_id, org_id, role, type: "access"}`.
- **Refresh Tokens:** JWT (HS256), 7-day expiry. Payload: `{sub: user_id, type: "refresh"}`.
- **Token Validation:** Decodes and verifies expiry, signature, and token type.

### Middleware Decorators (`middleware.py`)
- **`@require_auth`**: Extracts JWT from `Authorization: Bearer <token>` header. Injects `g.current_user = {user_id, org_id, role}`. In single-tenant mode, this is a no-op passthrough granting `org_admin` access.
- **`@require_api_key`**: Validates `X-API-Key` header against the `Camera.api_key` column in PostgreSQL. Injects `g.current_camera = {camera_id, org_id}`.
- **`@require_api_key_or_auth`**: Hybrid decorator for `/api/predict`. Checks for API key first, falls back to JWT. Sets `g.auth_type = 'camera'` or `'user'` to enforce production vs. test mode.
- **`@require_role(*roles)`**: Checks `g.current_user.role` against a hierarchical role ladder: `platform_owner > org_admin > manager > viewer > kiosk`.
- **`@inject_org_id`**: Extracts `org_id` from `g.current_user` and passes it as a keyword argument to the route function. This is the SINGLE enforcement point — no route ever trusts a client-provided `org_id`.

### Security Enforcement on `/api/predict`
- **Camera (API Key):** `auth_type = 'camera'` → `test_mode = False` → attendance is logged, feedback embeddings are stored.
- **Human (JWT):** `auth_type = 'user'` → `test_mode = True` → backend FORCES test mode regardless of client payload. No attendance logging, no feedback storage. This prevents employees from forging attendance via the Test Console.

## Face Detection (`face_detection.py`)
- **Algorithm:** MediaPipe BlazeFace deep learning model (replaced legacy Haar Cascade classifier).
- **Capabilities:** Detects faces at extreme angles (0°–90° yaw), partial occlusions, and varying lighting.
- **Landmark Estimation:** Uses facial mesh landmarks to classify head pose as `Frontal`, `Left Profile`, or `Right Profile`.
- **CLAHE Preprocessing:** Applies Contrast Limited Adaptive Histogram Equalization to normalize shadows and harsh lighting.

## Liveness Detection (`liveness.py`)
- **Purpose:** Anti-spoofing to reject printed photos, screen replays, and presentation attacks.
- **Method:** Evaluates three signals:
  1. **Edge Density:** Laplacian variance — real faces have richer texture detail than printed photos.
  2. **Color Variance:** Real faces exhibit natural color gradients; printed photos show uniform color blocks.
  3. **Texture Analysis:** Frequency-domain analysis to detect printing artifacts.

## Inference Engine (`inference.py`)
- Iterates over bounding boxes from MediaPipe.
- Crops face with 15% margin padding.
- Runs liveness detection on each crop.
- **DeepFace (FaceNet512 + TTA):** Generates 5 augmented embeddings per face (Test-Time Augmentation), averages them, and queries the KNN index with cosine distance.
- **MobileNetV2 (SOTA):** Forward pass on the fine-tuned model for categorical classification.
- **Ensemble Voter:** 4-gate confirmation pipeline combining both model outputs.

## Multi-Tenant Data Isolation (`org_storage.py`)
Each organization gets its own isolated data directory:
```
backend/data/orgs/{org_id}/encodings.pickle
backend/data/orgs/{org_id}/feedback_log.json
backend/data/orgs/{org_id}/recognition_history.json
backend/data/orgs/{org_id}/config.json
dataset_cleaned/orgs/{org_id}/{employee_name}/frontal/...
```
When `org_id = None` (single-tenant mode), paths fall back to the global locations for backward compatibility.

## Employee Management (`employees.py`)
Flask Blueprint providing CRUD operations for the `employees` database table:
- `GET /api/employees`: List all employees for the authenticated org.
- `POST /api/employees`: Create a new employee record.
- `PUT /api/employees/<id>`: Update employee details.
- `DELETE /api/employees/<id>`: Soft-delete (set status to `terminated`).

## Edge-Cloud Sync (`server.py: /api/sync`)
- **Purpose:** Edge cameras push attendance logs to the central database.
- **Security:** Protected by `@require_api_key`. The backend overrides any `org_id` or `camera_id` in the payload with the authenticated camera's identity, preventing identity spoofing.
- **Idempotency:** Uses the log's UUID primary key to prevent duplicate entries.

## Error Handling & Logging
- Uses Python's `logging` library with the `rms-api` logger.
- API errors return predictable JSON shapes: `{"error": "Description"}` with appropriate HTTP status codes.
- Stack traces are included in 500 responses during development but sanitized in production.

## Configuration & Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `DEPLOYMENT_MODE` | `local` or `cloud` | `local` |
| `DATABASE_URL` | PostgreSQL connection string | None (file-based) |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens | `dev-jwt-secret-...` |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | Access token lifetime | `15` |
| `JWT_REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token lifetime | `7` |
| `LAZY_LOAD_MODELS` | Defer model loading to first request | `true` |
| `FRONTEND_URL` | Allowed CORS origin for production | None (open CORS) |
| `STORAGE_DIR` | Override dataset directory root | Project root |
| `LOCAL_CAMERA_KEY` | API key for local single-tenant cameras | `default-local-camera-key` |

## Performance & Caching
- **Per-Org Model Cache:** `_org_model_cache` holds loaded models per organization to avoid reloading on every request.
- **Lazy Loading:** Models only load when the first `/api/predict` request arrives, saving ~2GB RAM on startup.
- **No Redis:** Session caching is not utilized; JWT tokens are stateless.
- **Rate Limiting:** Flask-Limiter protects against API abuse (e.g., 1000 requests/hour on `/api/predict`).
