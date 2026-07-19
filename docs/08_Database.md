# 08 Database Architecture

## Overview
RMS Face AI currently employs a **File-Based, Non-Relational Data Storage** strategy. Due to the high-velocity, edge-computing nature of the project (where complex relational SQL databases would add unnecessary installation overhead and latency), the system relies heavily on `Pickle`, `JSON`, and the underlying OS File System.

## Architecture & "Tables" (Collections)

### 1. The KNN Index (`encodings.pickle`)
- **Format:** Python Pickle Serialization.
- **Location:** `/backend/data/encodings.pickle`.
- **Purpose:** Acts as the ultra-fast NoSQL store for all enrolled personnel.
- **Schema:** 
  ```python
  {
    "names": ["John_Doe", "John_Doe", "Jane_Doe"],
    "encodings": [
       [0.45, 0.12, ... 512 floats],
       [0.41, 0.10, ... 512 floats],
       [0.99, 0.88, ... 512 floats]
    ]
  }
  ```
- **Indexes:** The nature of K-Nearest Neighbors serves as the index. A query mathematically scans this entire dictionary in O(N) time (which is negligible for < 10,000 embeddings).

### 2. Recognition Log (`recognition_history.json`)
- **Format:** JSON.
- **Location:** `/backend/data/recognition_history.json`.
- **Purpose:** The permanent ledger of every face detected by the system.
- **Schema Design:** A single flat array of JSON objects.
  ```json
  [
    {
      "timestamp": "2026-07-19T08:30:00",
      "label": "John_Doe",
      "confidence": 0.89,
      "method": "Ensemble (DeepFace + SOTA)",
      "status": "success",
      "prediction_id": "pred_8a7b6c5d"
    }
  ]
  ```
- **Why this design?** JSON is natively supported by Python and JavaScript, meaning the frontend can fetch and render this log without an intermediary ORM (Object-Relational Mapping) layer. It is capped at 100 entries locally to prevent memory ballooning on edge devices.

### 3. Application Config (`config.json`)
- **Format:** JSON.
- **Location:** `/backend/data/config.json`.
- **Schema Design:** Key-value store for application parameters.
  ```json
  {
    "CONFIRM_THRESHOLD": 0.55
  }
  ```
- **Why this design?** Allows administrators to adjust AI strictness on the fly via the Web Dashboard without requiring a hard server restart (which environment variables would require).

### 4. Structural Datasets (`/dataset` & `/dataset_cleaned`)
- **Format:** OS File System.
- **Purpose:** Stores the raw enrollment photos (`/dataset`) and the normalized, cropped training data (`/dataset_cleaned`).
- **Relationships:** The folder name natively acts as the Foreign Key mapping to the `names` array in `encodings.pickle` and the neural network output classes.

## Migration Strategy & Future Database
**Current Limitation:** JSON arrays are not scalable for querying years of attendance history or performing complex joins (e.g., "Find all times John Doe was late in October").

**Recommendation:** As the enterprise deployment scales, the `recognition_history.json` should be migrated to **PostgreSQL**.
- **Migration Plan:** Create an SQLAlchemy ORM layer. Map the JSON `label` to an `employees` table, and `timestamp` to an `attendance_logs` table with standard B-Tree indexing on the timestamp and employee ID.
