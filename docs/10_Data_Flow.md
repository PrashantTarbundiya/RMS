# 10 Data Flow

This document maps out the specific paths data takes through the system for key operations using Mermaid sequence diagrams.

## 1. Face Detection & Inference (Prediction)
When a user approaches a kiosk or a security guard snaps a photo:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Web/Mobile App
    participant API as server.py
    participant CV as OpenCV (face_detection.py)
    participant KNN as DeepFace Index
    participant CNN as MobileNetV2
    
    User->>Client: Captures Photo
    Client->>API: POST /api/predict (FormData image)
    API->>CV: cv2.imdecode & detectMultiScale()
    
    alt No Face Detected
        CV-->>API: Empty Array []
        API-->>Client: 200 OK {faces: [], error: "No faces found"}
    else Face Detected
        CV-->>API: Bounding Box [x, y, w, h]
        API->>CV: Crop image to bounding box
        API->>KNN: Calculate Euclidean Distance
        KNN-->>API: {label: "John", distance: 0.45}
        API->>CNN: Forward Pass
        CNN-->>API: {label: "John", confidence: 0.98}
        
        API->>API: Average predictions (ensemble_predict)
        API->>API: Log to recognition_history.json
        API-->>Client: 200 OK {status: "CONFIRMED", label: "John"}
    end
    Client->>User: Renders Green/Red Overlay
```

## 2. New Person Enrollment
How zero-shot indexing allows for immediate edge deployment.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Dashboard as Web Dashboard
    participant API as server.py
    participant FileSys as Dataset Storage
    participant KNN as Pickle Index
    participant PyTorch as Background Thread
    
    Admin->>Dashboard: Uploads Name + 15 Images
    Dashboard->>API: POST /api/add_person
    API->>FileSys: Save raw images to /dataset/Name
    API->>API: Crop and move to /dataset_cleaned/Name
    
    loop For each image
        API->>KNN: Extract FaceNet512 Embedding
    end
    API->>KNN: Compute Mean Embedding (Centroid)
    API->>KNN: Append Centroid to encodings.pickle
    
    API-->>Dashboard: 200 OK "Person Enrolled & Searchable"
    Dashboard-->>Admin: Success Notification
    
    Note right of API: Async Execution
    API->>PyTorch: Trigger sota_finetune/finetune.py
    PyTorch->>PyTorch: Run 25 Epochs Backpropagation
    PyTorch->>FileSys: Overwrite best_mobile_sideface.pth
```

## 3. The Human-in-the-Loop Feedback Flow
Correcting false positives mathematically purges them from the KNN index.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Dashboard as Test Page Modal
    participant API as feedback_learner.py
    participant KNN as Pickle Index
    
    Admin->>Dashboard: Clicks "Incorrect" on a prediction
    Dashboard->>Dashboard: Opens Feedback Modal
    Admin->>Dashboard: Selects "FALSE_DETECTION"
    Dashboard->>API: POST /api/predict/feedback {is_correct: false}
    
    API->>API: Find image using prediction_id
    API->>API: Delete image from disk entirely
    API->>KNN: Recalculate centroids without the bad image
    API-->>Dashboard: 200 OK "Feedback Processed"
```
