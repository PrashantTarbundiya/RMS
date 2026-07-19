# 11 Features Documentation

## 1. Zero-Shot Edge Enrollment
**Purpose:** Ensure adding a new employee takes seconds, not hours, so that security check-ins are never bottlenecked by ML training cycles.
**Architecture:** 
- **Frontend:** Uploads 15 varying images of the person.
- **Backend:** Skips Neural Network Backpropagation. Extracts 512-dimensional FaceNet vectors and appends them directly to a local Pickle dictionary.
- **Database:** `encodings.pickle`
**Edge Cases:** If an admin uploads a blurry photo during enrollment, the KNN centroid will be skewed. **Future Improvement:** Add a laplacian variance blur-check before accepting an enrollment photo.

## 2. Live Attendance Tracking
**Purpose:** Replaces physical punch-cards with an automated log.
**Architecture:**
- **Backend:** When `ensemble_predict` yields a `CONFIRMED` result, it parses the system clock and writes a JSON entry to `recognition_history.json`.
- **Frontend (`LiveAttendancePage.jsx`):** Parses this JSON, aggregates check-ins by `name`, and calculates the elapsed time since the first check-in to determine hours worked.
**Edge Cases:** If a person walks past the camera 5 times in 10 minutes, the JSON log will bloat. The frontend must debounce or group by day.

## 3. Strict Binary Thresholding
**Purpose:** Enterprise clients (HR) do not want to see "78% confidence." They need a definitive YES or NO to grant physical access.
**Architecture:**
- **Backend (`ensemble.py`):** Converts the raw Euclidean distance (e.g., `0.45`) against a strict threshold defined in `config.json` (e.g., `0.55`). If the distance is strictly lesser, it outputs `is_recognized = true`.
- **Frontend/Mobile:** Ignores the raw `confidence` metric in the UI entirely, rendering only a Green "CONFIRMED" or Red "NOT FOUND" badge.
**Future Improvements:** Allow setting specific thresholds per-camera (e.g., the front lobby camera with perfect lighting gets a strict `0.40`, while a dimly lit warehouse camera gets a looser `0.60`).

## 4. Human-in-the-Loop Feedback Engine
**Purpose:** ML Models degrade or suffer from data drift. The system must learn from its mistakes without requiring a data scientist to manually clean the dataset.
**Architecture:**
- **Frontend (`TestPage.jsx`):** Provides a dropdown modal to flag an image as "Not a Person" or "Actually Person X".
- **Backend (`feedback_learner.py`):** Intercepts the `prediction_id`. If flagged as Not a Person, it physically unlinks and deletes the image. If flagged as Person X, it moves the `.jpg` into `/dataset_cleaned/Person_X` and recalculates the KNN index.
**Edge Cases:** Malicious admins could flag a photo of a dog as "CEO", breaking the CEO's embedding centroid.

## 5. Background Model Finetuning
**Purpose:** While KNN is fast, Convolutional Neural Networks (CNN) like MobileNetV2 are more robust to lighting and angles.
**Architecture:**
- **Backend (`sota_finetune.py`):** Runs asynchronously via `threading.Thread`. Loads `MobileNetV2` with ImageNet weights, slices off the final layer, and trains a new Linear layer targeting the specific number of enrolled employees.
- **API:** `GET /api/training_status` streams SSE (Server Sent Events) back to the frontend so the admin sees a live progress bar without polling.
**Limitations:** Freezes the CPU on lower-end devices. Must be run overnight if thousands of images are present.
