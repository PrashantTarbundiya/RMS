# 10 Data Flow

This document maps out the specific paths data takes through the system for key operations.

## 1. User Authentication (Login)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Web/Mobile App
    participant MW as Middleware
    participant API as server.py
    participant AUTH as auth.py
    participant DB as PostgreSQL
    
    User->>Client: Enter email + password
    Client->>API: POST /api/auth/login {email, password}
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: User record (password_hash)
    API->>AUTH: bcrypt.checkpw(password, hash)
    AUTH-->>API: Valid ✓
    API->>AUTH: create_access_token(user_id, org_id, role)
    AUTH-->>API: JWT access_token (15m)
    API->>AUTH: create_refresh_token(user_id)
    AUTH-->>API: JWT refresh_token (7d)
    API-->>Client: 200 {access_token, refresh_token, user}
    Client->>Client: Store tokens in localStorage
```

## 2. Face Detection & Inference (Human User — Test Mode)

When an admin tests the AI from the Web Dashboard:

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Client as Web Dashboard
    participant MW as Middleware (Auth + RBAC)
    participant API as server.py
    participant MP as MediaPipe BlazeFace
    participant LV as Liveness Check
    participant KNN as DeepFace/FaceNet512 + TTA
    participant CNN as MobileNetV2 SOTA
    participant ENS as Ensemble Voter
    
    Admin->>Client: Captures Photo / Webcam Frame
    Client->>MW: POST /api/predict (Bearer JWT, FormData image)
    MW->>MW: Validate JWT, extract org_id
    MW->>MW: auth_type = 'user' → FORCE test_mode = True
    MW->>API: Authorized (org_id, test_mode=True)
    API->>MP: detect_faces(image)
    MP-->>API: Bounding Boxes [{x, y, w, h}]
    
    loop For each detected face
        API->>LV: evaluate_liveness(face_crop)
        alt Spoof Detected
            LV-->>API: {is_live: false, reason: "presentation attack"}
            API->>API: Label as "SPOOF DETECTED"
        else Live Face
            LV-->>API: {is_live: true, score: 0.92}
            API->>KNN: TTA embed → query KNN index
            KNN-->>API: {label: "John_Doe", distance: 0.42, confidence: 0.91}
            API->>CNN: forward_pass(face_crop)
            CNN-->>API: {label: "John_Doe", confidence: 0.87}
            API->>ENS: 4-gate confirmation pipeline
            ENS-->>API: {confirmed: true, label: "John_Doe"}
        end
    end
    
    Note right of API: test_mode=True → NO attendance logged
    API-->>Client: 200 {faces: [...], message: "Test mode"}
    Client->>Admin: Renders green/red bounding boxes
```

## 3. Face Detection & Inference (Edge Camera — Production)

When a physical camera detects a face at a gate or kiosk:

```mermaid
sequenceDiagram
    autonumber
    participant CAM as Edge Camera
    participant MW as Middleware (API Key)
    participant API as server.py
    participant ML as Full AI Pipeline
    participant DB as PostgreSQL
    
    CAM->>MW: POST /api/predict (X-API-Key, FormData image)
    MW->>MW: Validate API key against cameras table
    MW->>MW: auth_type = 'camera' → test_mode = False
    MW->>API: Authorized (camera_id, org_id)
    API->>ML: Full pipeline (detect → liveness → ensemble)
    ML-->>API: {confirmed: true, label: "John_Doe", confidence: 0.91}
    API->>DB: INSERT INTO attendance_logs (org_id, employee_id, ...)
    API-->>CAM: 200 {faces: [...], attendance_status: "Logged"}
```

## 4. New Person Enrollment

How zero-shot KNN indexing allows for immediate identity recognition:

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Dashboard as Web Dashboard
    participant MW as Auth Middleware
    participant API as server.py
    participant FileSys as Dataset Storage
    participant KNN as Pickle Index
    participant DB as PostgreSQL
    participant PyTorch as Background Thread
    
    Admin->>Dashboard: Uploads Name + 15 Images
    Dashboard->>MW: POST /api/add_person (Bearer JWT)
    MW->>MW: Validate JWT, check role >= org_admin
    MW->>API: Authorized (org_id)
    API->>DB: INSERT INTO employees (org_id, name, image_count)
    API->>FileSys: Save images to dataset_cleaned/orgs/{org_id}/Name
    
    loop For each image
        API->>KNN: Extract FaceNet512 Embedding (TTA)
    end
    API->>KNN: Compute Mean Embedding (Centroid)
    API->>KNN: Append to orgs/{org_id}/encodings.pickle
    
    API-->>Dashboard: 200 "Person Enrolled & Searchable"
    Dashboard-->>Admin: Success Notification
    
    Note right of API: Async Execution
    API->>PyTorch: Trigger sota_finetune/finetune.py
    PyTorch->>PyTorch: Run 25 Epochs Backpropagation
    PyTorch->>FileSys: Overwrite best_mobile_sideface.pth
```

## 5. Edge-Cloud Attendance Sync

How edge cameras securely push attendance logs to the central database:

```mermaid
sequenceDiagram
    autonumber
    participant CAM as Edge Camera
    participant MW as API Key Middleware
    participant API as server.py
    participant DB as PostgreSQL
    
    CAM->>MW: POST /api/sync (X-API-Key, JSON logs)
    MW->>MW: Validate API key
    MW->>MW: Extract camera_id, org_id from DB
    MW->>API: Authorized
    
    API->>API: Override payload org_id with authenticated org_id
    API->>API: Override payload camera_id with authenticated camera_id
    
    loop For each attendance log
        API->>DB: UPSERT INTO attendance_logs
    end
    
    API-->>CAM: 200 {synced: 5, status: "success"}
```

## 6. Human-in-the-Loop Feedback

Correcting false predictions and updating the ML index:

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Dashboard as Test Page Modal
    participant MW as Auth Middleware
    participant API as feedback_learner.py
    participant KNN as Pickle Index
    participant DB as PostgreSQL
    
    Admin->>Dashboard: Clicks "Incorrect" on a prediction
    Dashboard->>Dashboard: Opens 3-step Feedback Modal
    Admin->>Dashboard: Selects correct person or "FALSE_DETECTION"
    Dashboard->>MW: POST /api/predict/feedback (Bearer JWT)
    MW->>API: Authorized (org_id)
    
    alt FALSE_DETECTION
        API->>API: Delete image from disk
        API->>KNN: Recalculate centroids without the bad image
    else Correct Person Selected
        API->>API: Move image to correct person's folder
        API->>KNN: Recompute embedding centroid for corrected person
    end
    
    API->>DB: INSERT INTO feedback_logs (audit trail)
    API-->>Dashboard: 200 "Feedback Processed"
```
