# 07 API Documentation

## Base URL
All endpoints are relative to the root URL (e.g., `http://localhost:5000`).

---

## 1. System Health & Status

### `GET /api/health`
**Description:** Returns the health of the Flask API and the loaded status of the ML models.
**Authentication:** None.
**Response (200 OK):**
```json
{
  "status": "ok",
  "requires_retrain": false,
  "models": {
    "deepface": true,
    "sota": true
  }
}
```

### `GET /api/ping`
**Description:** A lightweight endpoint for the mobile app to verify network connectivity before dispatching heavy image payloads.
**Response (200 OK):**
```json
{ "pong": true }
```

### `GET /api/training_status`
**Description:** Server-Sent Events (SSE) endpoint providing real-time updates on the PyTorch MobileNetV2 retraining process.
**Response (200 OK - text/event-stream):**
```text
data: {"is_training": true, "progress": 45, "current_epoch": "12/25"}
```

---

## 2. Core Inference

### `POST /api/predict`
**Description:** Accepts an image via `multipart/form-data`, extracts bounding boxes, and returns Ensemble ML predictions for every face detected.
**Body:** `FormData` containing `image: (binary)`
**Example Response (200 OK):**
```json
{
  "faces": [
    {
      "box": [120, 85, 200, 200],
      "ensemble": {
        "label": "John_Doe",
        "confidence": 0.89,
        "is_recognized": true,
        "method": "Ensemble (DeepFace + SOTA)"
      },
      "predictions": {
        "deepface": {"label": "John_Doe", "distance": 0.45},
        "sota": {"label": "John_Doe", "confidence": 0.92}
      },
      "prediction_id": "pred_8a7b6c5d"
    }
  ],
  "attendance_status": "Logged successfully"
}
```

---

## 3. Human-in-the-Loop Feedback

### `POST /api/predict/feedback`
**Description:** Allows an admin to correct a prediction (false positive or misidentification). The backend will physically move the image in the dataset and update the KNN index.
**Body (JSON):**
```json
{
  "prediction_id": "pred_8a7b6c5d",
  "is_correct": false,
  "actual_person": "Jane_Doe" // Or "FALSE_DETECTION"
}
```
**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Feedback processed. Image moved to Jane_Doe."
}
```

---

## 4. Personnel Management

### `GET /api/persons`
**Description:** Lists all enrolled identities and the number of reference images available for each.
**Response (200 OK):**
```json
{
  "persons": [
    { "name": "John_Doe", "image_count": 15 },
    { "name": "Jane_Doe", "image_count": 18 }
  ]
}
```

### `POST /api/add_person`
**Description:** Enrolls a new person. Immediately extracts FaceNet embeddings (0-shot) and triggers an asynchronous MobileNetV2 retraining cycle.
**Body:** `FormData` containing `name: "String"` and multiple `images: (binary)` blobs.
**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Person enrolled and searchable now. Model refinement running in background."
}
```

### `POST /api/retrain`
**Description:** Force-starts the PyTorch retraining cycle. Returns an error if training is already in progress.
**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Training started."
}
```

---

## 5. Analytics & History

### `GET /api/attendance`
**Description:** Returns the live, parsed attendance log (derived from `recognition_history.json`).
**Response (200 OK):**
```json
{
  "attendance": [
    {
      "name": "John_Doe",
      "check_in": "2026-07-19T08:30:00",
      "status": "On Time"
    }
  ]
}
```

---
## Error Codes
- `400 Bad Request`: Missing file, invalid extension, or malformed JSON.
- `404 Not Found`: Attempting to correct a `prediction_id` that does not exist in memory.
- `500 Internal Server Error`: PyTorch CUDA out-of-memory or OpenCV decoding failures.
