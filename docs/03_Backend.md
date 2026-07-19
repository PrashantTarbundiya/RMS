# 03 Backend Architecture & Implementation

## Overview
The RMS Face AI Backend is a Python Flask application that orchestrates file uploads, edge-based image processing, and a dual-model Machine Learning pipeline. It is intentionally designed to be synchronous to avoid complex thread-locking issues with PyTorch tensors and OpenCV rendering on edge devices.

## Server Startup (`server.py`)
Upon launching `python server.py`, the backend performs a rigorous initialization sequence:
1. **Directory Generation:** Validates and auto-creates `/backend/data`, `/dataset`, and `/dataset_cleaned`.
2. **CORS Configuration:** Reads the `FRONTEND_URL` environment variable. If missing (local dev), it opens CORS entirely. If present, it restricts origins for security.
3. **Model Loading into VRAM/RAM:** 
   - Pre-loads the `haarcascade_frontalface_default.xml` for structural detection.
   - Loads the FaceNet512 `encodings.pickle` index into memory.
   - Instantiates the PyTorch MobileNetV2 architecture and loads the `.pth` weights (if they exist).

## Middleware & Validation
- **File Validation:** Uses the `_allowed_file(file_obj)` function to strictly enforce MimeType (`image/`) and extension checks (`png, jpg, jpeg, webp, bmp`). This prevents arbitrary code execution vulnerabilities.
- **Payload Limits:** Flask's `MAX_CONTENT_LENGTH` is set to 50MB to gracefully reject excessively large high-resolution payloads before processing them.

## Business Logic & Services
The backend relies on discrete service files rather than keeping all logic in `server.py`:

### Image Processing (`face_detection.py`)
- Reads raw image bytes directly into a `numpy` array via `cv2.imdecode`.
- Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) via `model.py` to normalize lighting conditions.
- Uses `cv2.CascadeClassifier.detectMultiScale` (with `minNeighbors=8`, `minSize=(60, 60)`) to aggressively filter out false positive background artifacts.

### The Inference Engine (`inference.py`)
- Iterates over the bounding boxes provided by the face detector.
- Crops the image precisely to the coordinates of the face.
- Passes the cropped face to the Ensemble pipeline.

### The Ensemble Logic (`ensemble.py`)
- **KNN Lookup:** First, it gets the FaceNet512 embedding and queries the K-Nearest Neighbors model.
- **SOTA Lookup:** Second, it runs a forward pass on the fine-tuned MobileNetV2 model.
- **Confirmation Logic:** Converts the raw distances to a boolean `is_confirmed = (distance <= CONFIRM_THRESHOLD)`. This abstracts away abstract percentages from the frontend, delivering a strict "CONFIRMED" or "NOT FOUND" result.

### Enrollment Service (`add_person_utils.py`)
- When an admin enrolls a new employee via `/api/add_person`, this utility extracts embeddings for the uploaded photos immediately.
- It injects these new embeddings into the `encodings.pickle` dictionary in memory and writes it to disk. This makes the employee **instantly searchable** by the KNN engine without waiting for PyTorch to retrain.
- It triggers a background task to rebuild the deep learning model.

### Feedback Loop (`feedback_learner.py`)
- If the AI makes a mistake, the user submits a correction via `/api/predict/feedback`.
- If the user selects "Not a Person" (`FALSE_DETECTION`), the image is quietly discarded.
- If the user selects a valid person, the image is physically moved to that person's folder in `/dataset_cleaned` and `add_person_to_all_models` is invoked to recalculate the embedding centroid for that identity.

## Error Handling & Logging
- The application uses Python's standard `logging` library. Custom formats `[%(asctime)s] %(levelname)s - %(message)s` are defined.
- API errors return predictable JSON shapes: `{"error": "Description of the failure"}`, mapped to HTTP status codes (400 for bad uploads, 500 for model failures).

## Configuration & Environment Variables
- `STORAGE_DIR`: Allows mapping the dataset directory outside the project root (crucial for Docker volumes).
- `FRONTEND_URL`: Locks down CORS in production.
- `CONFIRM_THRESHOLD`: Read dynamically from `backend/data/config.json`. Allows admins to tweak the strictness of the AI on-the-fly without restarting the Flask server.

## Performance & Caching
Because this is designed for edge hardware:
- **No Redis:** Session caching is not utilized; the ML models reside perpetually in local RAM.
- **Single-Threaded Bottleneck:** PyTorch on CPU blocks the event loop. In future high-traffic deployments, Gunicorn with multi-processing (rather than multi-threading) should be used to duplicate the memory footprint across cores.
