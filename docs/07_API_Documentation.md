# 07 API Documentation

## Base URL
All endpoints are relative to the root URL (e.g., `http://localhost:5000`).

## Authentication
All protected endpoints require one of the following authentication methods:

### JWT Bearer Token (Human Users)
```
Authorization: Bearer <access_token>
```
Obtained via `POST /api/auth/login`. Access tokens expire after 15 minutes. Use `/api/auth/refresh` to obtain a new access token.

### API Key (Edge Cameras)
```
X-API-Key: <camera_api_key>
```
Assigned to physical cameras via the Camera management interface. Used for production attendance logging and edge-cloud sync.

---

## 1. Authentication

### `POST /api/auth/register`
**Description:** Register a new organization and admin user.
**Authentication:** None.
**Body (JSON):**
```json
{
  "org_name": "Acme Corp",
  "email": "admin@acme.com",
  "password": "secure_password",
  "name": "Admin User"
}
```
**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": { "id": "uuid", "email": "admin@acme.com", "role": "org_admin" }
}
```

### `POST /api/auth/login`
**Description:** Authenticate and receive JWT tokens.
**Authentication:** None.
**Body (JSON):**
```json
{
  "email": "admin@acme.com",
  "password": "secure_password"
}
```
**Response (200 OK):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": { "id": "uuid", "email": "admin@acme.com", "role": "org_admin", "org_id": "uuid" }
}
```

### `POST /api/auth/refresh`
**Description:** Refresh an expired access token using a valid refresh token.
**Body (JSON):**
```json
{ "refresh_token": "eyJ..." }
```
**Response (200 OK):**
```json
{ "access_token": "eyJ..." }
```

### `GET /api/auth/me`
**Description:** Get the currently authenticated user's profile.
**Authentication:** JWT Bearer.
**Response (200 OK):**
```json
{
  "user": { "id": "uuid", "email": "admin@acme.com", "name": "Admin", "role": "org_admin" }
}
```

---

## 2. System Health & Status

### `GET /api/health`
**Description:** Returns system health, loaded model status, and enrolled personnel count.
**Authentication:** JWT Bearer.
**Response (200 OK):**
```json
{
  "status": "ok",
  "requires_retrain": false,
  "models": { "deepface": true, "sota": true },
  "persons_count": 25
}
```

### `GET /api/ping`
**Description:** Lightweight endpoint for connectivity verification.
**Authentication:** None.
**Response (200 OK):**
```json
{ "pong": true }
```

### `GET /api/training_status`
**Description:** SSE endpoint providing real-time updates on MobileNetV2 retraining.
**Authentication:** JWT Bearer.
**Response (200 OK - text/event-stream):**
```text
data: {"is_training": true, "progress": 45, "current_epoch": "12/25"}
```

---

## 3. Core Inference

### `POST /api/predict`
**Description:** Accepts an image, detects faces, runs liveness checks, and returns ensemble ML predictions.
**Authentication:** JWT Bearer (forces test mode) OR API Key (enables production logging).
**Body:** `FormData` containing `image: (binary)`
**Optional Fields:** `camera_id` (for per-camera threshold tuning)
**Security Note:** When authenticated via JWT (human user), the backend **forces test mode** — no attendance is logged and no feedback embeddings are stored, regardless of any `test_mode` parameter sent by the client.
**Response (200 OK):**
```json
{
  "faces": [
    {
      "bbox": {"x": 120, "y": 85, "w": 200, "h": 200},
      "ensemble": {
        "label": "John_Doe",
        "confidence": 0.89,
        "is_recognized": true,
        "is_confirmed": true,
        "confidence_level": "confirmed",
        "method": "Ensemble (DeepFace + SOTA)",
        "display": "CONFIRMED: John_Doe"
      },
      "predictions": {
        "deepface": {"label": "John_Doe", "confidence": 0.92, "confidence_level": "confirmed"},
        "sota": {"label": "John_Doe", "confidence": 0.87}
      },
      "prediction_id": "pred_8a7b6c5d"
    }
  ],
  "message": "Detected 1 face(s)"
}
```

---

## 4. Human-in-the-Loop Feedback

### `POST /api/predict/feedback`
**Description:** Correct a false prediction. Moves images in the dataset and re-indexes the KNN embeddings.
**Authentication:** JWT Bearer.
**Body (JSON):**
```json
{
  "prediction_id": "pred_8a7b6c5d",
  "is_correct": false,
  "actual_person": "Jane_Doe"
}
```
**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Feedback processed. Image moved to Jane_Doe."
}
```

---

## 5. Personnel Management

### `GET /api/persons`
**Description:** Lists all enrolled identities and image counts.
**Authentication:** JWT Bearer.

### `POST /api/add_person`
**Description:** Enrolls a new person. Instantly extracts FaceNet embeddings (zero-shot) and triggers async MobileNetV2 retraining.
**Authentication:** JWT Bearer. **Role Required:** `org_admin`.
**Body:** `FormData` with `name: "String"` and multiple `images: (binary)`.

### `POST /api/retrain`
**Description:** Force-starts the PyTorch retraining cycle.
**Authentication:** JWT Bearer. **Role Required:** `org_admin`.

---

## 6. Employee Management

### `GET /api/employees`
**Description:** List all employees for the authenticated organization.
**Authentication:** JWT Bearer.

### `POST /api/employees`
**Description:** Create a new employee record.
**Authentication:** JWT Bearer. **Role Required:** `manager` or higher.

### `PUT /api/employees/<id>`
**Description:** Update employee details.
**Authentication:** JWT Bearer. **Role Required:** `manager` or higher.

### `DELETE /api/employees/<id>`
**Description:** Soft-delete an employee (set status to `terminated`).
**Authentication:** JWT Bearer. **Role Required:** `org_admin`.

---

## 7. Edge-Cloud Sync

### `POST /api/sync`
**Description:** Edge cameras push attendance logs to the central database.
**Authentication:** API Key (`X-API-Key` header) **only**. JWT Bearer is NOT accepted.
**Security:** The backend overrides any `org_id` or `camera_id` in the JSON payload with the authenticated camera's identity, preventing identity spoofing by compromised devices.
**Body (JSON):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "checkin_time": "2026-07-19T08:30:00Z",
      "confidence": 0.89,
      "method": "Ensemble",
      "status": "on_time"
    }
  ]
}
```

---

## 8. Analytics & History

### `GET /api/history`
**Description:** Retrieve recognition history log.
**Authentication:** JWT Bearer.

### `DELETE /api/history`
**Description:** Clear recognition history.
**Authentication:** JWT Bearer. **Role Required:** `org_admin`.

### `GET /api/attendance`
**Description:** Returns parsed attendance records with check-in times and status.
**Authentication:** JWT Bearer.

---

## Error Codes
| Code | Description |
|------|-------------|
| `400 Bad Request` | Missing file, invalid extension, malformed JSON, or validation error. |
| `401 Unauthorized` | Missing, invalid, or expired authentication token/API key. |
| `403 Forbidden` | Authenticated but insufficient role permissions. |
| `404 Not Found` | Requested resource (person, prediction_id, employee) not found. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `500 Internal Server Error` | PyTorch/OpenCV failures or unhandled exceptions. |
| `503 Service Unavailable` | Database connection unavailable. |
