# Face Detection & Accuracy Upgrade — Implementation & Architecture Plan

## Executive Summary
This document outlines the architecture, mathematical methods, and verified implementation of the **4-Pass MediaPipe FaceLandmarker + solvePnP 3D Head Pose + CLAHE Illumination** face detection upgrade implemented in [`backend/face_detection.py`](file:///e:/RMS/backend/face_detection.py) and [`backend/server.py`](file:///e:/RMS/backend/server.py).

---

## 1. Multi-Pass Detection Cascade

```mermaid
flowchart TD
    A[Input Frame] --> B["CLAHE Illumination Normalization (L-Channel in LAB)"]
    B --> C{"Pass 1: MediaPipe FaceLandmarker\n(478 3D Landmarks + solvePnP)"}
    C -->|Detected| G[Extract BBox + 3D Pose Yaw/Pitch/Roll]
    C -->|No Face| D{"Pass 2: FaceLandmarker Flipped\n(Catches Extreme 70°-80° Angles)"}
    D -->|Detected| H[Unflip Coords & Invert Direction]
    D -->|No Face| E{"Pass 3: Haar Profile Cascade\n(90° Edge Profiles)"}
    E -->|Detected| I[Assign 90° Profile BBox]
    E -->|No Face| F{"Pass 4: Haar Frontal Cascade\n(Emergency Fallback)"}
    F -->|Detected| J[Assign Frontal BBox]
    F -->|No Face| K[Return Empty []]
    
    G --> L[NMS Deduplication IoU 0.40]
    H --> L
    I --> L
    J --> L
    L --> M[Sorted Output Left-to-Right by X-coordinate]
```

### Cascade Details:
1. **Pass 1 — FaceLandmarker (`vision.FaceLandmarker`)**:
   * Uses MediaPipe Tasks API with `backend/data/face_landmarker.task` (478 3D landmarks, `num_faces=10`, `min_detection_confidence=0.45`).
   * Generates tight facial bounding boxes with a +15% margin for complete facial coverage.
2. **Pass 2 — Horizontally Flipped Detection (`_run_face_mesh_flipped`)**:
   * Horizontally flips frame and detects faces, then un-flips coordinates ($x_{orig} = w - (x_{flip} + w_{box})$) and inverts yaw/direction (`left_profile` $\leftrightarrow$ `right_profile`).
3. **Pass 3 — OpenCV Haar Profile Cascade (`haarcascade_profileface.xml`)**:
   * Runs on both original and flipped CLAHE-enhanced grayscale images to catch 90° extreme edge profiles.
4. **Pass 4 — OpenCV Haar Frontal Cascade (`haarcascade_frontalface_alt2.xml`)**:
   * Emergency fallback for extreme low-resolution or high-contrast frontal faces.

---

## 2. 3D Head Pose Estimation via `solvePnP`

To replace inaccurate 2D heuristics with real-world angular geometry:

### Canonical 3D Model Points (in mm):
* **Nose tip (`#1`)**: `[0.0, 0.0, 0.0]`
* **Chin (`#152`)**: `[0.0, -330.0, -65.0]`
* **Left eye outer corner (`#33`)**: `[-225.0, 170.0, -135.0]`
* **Right eye outer corner (`#263`)**: `[225.0, 170.0, -135.0]`
* **Left mouth corner (`#61`)**: `[-150.0, -150.0, -125.0]`
* **Right mouth corner (`#291`)**: `[150.0, -150.0, -125.0]`

### Computation:
* Camera intrinsic matrix: Focal length $f_x = f_y = w$, optical center $c_x = w/2, c_y = h/2$.
* `cv2.solvePnP(MODEL_POINTS_3D, image_points_2D, camera_matrix, dist_coeffs)`
* `cv2.Rodrigues(rvec)` $\to$ Rotation matrix $R$.
* `cv2.RQDecomp3x3(R)` $\to$ Euler angles:
  * **Yaw**: Rotation around vertical Y axis ($\text{Yaw} > +15^\circ \implies \text{right\_profile}$, $\text{Yaw} < -15^\circ \implies \text{left\_profile}$, else $\text{frontal}$)
  * **Pitch**: Looking up / down
  * **Roll**: Head tilt left / right

---

## 3. Illumination Normalization (CLAHE)

* Converts input frame from BGR to LAB color space.
* Applies Contrast Limited Adaptive Histogram Equalization (`clipLimit=2.0, tileGridSize=(8, 8)`) exclusively to the L (luminance) channel.
* Converts back to BGR.
* Eliminates shadow imbalance and backlighting without altering chromatic hue.

---

## 4. Contract & Data Integrity

### Fixed Contract Keys:
```python
{
    'bbox': {'x': int, 'y': int, 'w': int, 'h': int},
    'confidence': float,
    'direction': 'frontal' | 'left_profile' | 'right_profile',
    'angle': float,               # Yaw angle (0.0 to 90.0 degrees)
    'angle_label': str,           # 'frontal' | 'left_profile' | 'right_profile' (fixes inference.py bug)
    'profile_confidence': float,  # 0.0 to 100.0%
    'keypoints': [{'x': int, 'y': int}, ...],
    'soft_biometrics': {
        'yaw': float,
        'pitch': float,
        'roll': float,
        'head_pose_angle': float,
        'direction': str,
        'profile_confidence': float
    }
}
```

---

## 5. Live Inference Bug Fix in `server.py`

In `handle_stream_frame` (WebSocket live inference):
* Extracted `edge_encodings`, `f_encodings`, `i_encodings`, `v_encodings` from `org_models` before executing per-model workers.
* Resolves `Not Trained` / `Disabled` status during WebSocket live camera testing.

---

## 6. Verification Summary

| Test | Output | Status |
|---|---|:---:|
| **SideFaceDetector Init** | Loaded Tasks API + `face_landmarker.task` | ✅ **PASS** |
| **solvePnP Pose Calculation** | Computed Euler angles | ✅ **PASS** |
| **Pipeline Warmup** | Facenet512, InsightFace, GhostFaceNet, VGG-Face loaded | ✅ **PASS** |
| **Frontend Vite Build** | Exit code 0 | ✅ **PASS** |
