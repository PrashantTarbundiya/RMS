# 11 Features Documentation

## 1. Zero-Shot Edge Enrollment
**Purpose:** Adding a new employee takes seconds, not hours, so security check-ins are never bottlenecked by ML training cycles.
**Architecture:**
- **Frontend:** Uploads 15+ varying images organized into Left/Front/Right/Extra category slots via drag-and-drop.
- **Backend:** Skips Neural Network Backpropagation. Extracts 512-dimensional FaceNet vectors using Test-Time Augmentation (5 augmented variants averaged per image) and appends centroids directly to the KNN Pickle index.
- **Database:** `encodings.pickle` (immediate) + `employees` table (PostgreSQL).
- **Result:** The new employee is instantly searchable by KNN within seconds of enrollment.
- **Background:** MobileNetV2 fine-tuning is triggered asynchronously and runs in the background.

## 2. Live Attendance Tracking
**Purpose:** Replaces physical punch-cards with automated biometric attendance.
**Architecture:**
- **Edge Cameras:** Physical cameras authenticate via API keys and submit frames to `/api/predict`.
- **Backend:** When the 4-gate ensemble pipeline yields a `CONFIRMED` result, it logs an `AttendanceLog` record with employee ID, timestamp, confidence, method, and status (on_time, late, early_departure).
- **Frontend (`LiveAttendancePage.jsx`):** Displays a real-time grid of currently on-site employees with check-in timestamps and elapsed duration timers.
- **Frontend (`AttendancePage.jsx`):** Tabular historical view with date filtering, search, and CSV export.
- **Debouncing:** The system prevents duplicate attendance logs for the same person within a configurable time window.

## 3. Strict 4-Gate Binary Confirmation
**Purpose:** Enterprise clients need a definitive YES or NO — not ambiguous percentages.
**Architecture:**
- **Gate 1 — Distance Threshold:** DeepFace cosine distance must be below `CONFIRM_THRESHOLD`.
- **Gate 2 — Binary Classifier Agreement:** Checks if DeepFace and MobileNetV2 agree on the identity label. Agreement earns a confidence bonus.
- **Gate 3 — Adaptive Threshold:** Dynamically adjusted based on per-camera overrides and match confidence.
- **Gate 4 — Confidence Level:** Final score classified as `confirmed`, `uncertain`, or `rejected`.
- **Frontend:** Renders only Green "CONFIRMED" or Red "NOT FOUND" — no raw percentages shown to operators.

## 4. Liveness Detection (Anti-Spoofing)
**Purpose:** Prevent presentation attacks where someone holds a photo or plays a video of an employee to fool the camera.
**Architecture:**
- **Backend (`liveness.py`):** Evaluates three signals before ML inference:
  1. **Edge Density:** Laplacian variance — real faces have richer texture than flat prints.
  2. **Color Variance:** Natural skin has gradients; printed photos have uniform blocks.
  3. **Texture Analysis:** Frequency-domain checks for printing dots or screen pixel grids.
- **Frontend:** Spoofed faces are displayed with yellow "SPOOF" labels instead of red/green.

## 5. Per-Camera Threshold Tuning
**Purpose:** Different camera locations have different lighting and environmental conditions.
**Architecture:**
- **Database:** Each `Camera` record has a `confirm_threshold_override` column (nullable Float).
- **Backend:** When a prediction request arrives from an API-key-authenticated camera, the system checks for a threshold override. If present, it uses the camera-specific threshold instead of the organization default.
- **Use Cases:** Strict `0.40` threshold for well-lit lobby cameras; looser `0.60` for dimly lit warehouse cameras.

## 6. Human-in-the-Loop Feedback Engine
**Purpose:** ML models degrade from data drift. The system must learn from its mistakes without requiring a data scientist.
**Architecture:**
- **Frontend (`TestPage.jsx`):** Structured 3-step feedback modal:
  1. "Is this a person?" (filter false detections)
  2. "Is the prediction correct?" (validate identity)
  3. "Who is this person?" (select from dropdown or type new name)
- **Backend (`feedback_learner.py`):** If flagged as "Not a Person" → image deleted. If corrected to Person X → image moved to `dataset_cleaned/Person_X` and KNN centroid recalculated.
- **Audit Trail:** All corrections are logged in the `feedback_logs` database table with prediction ID, original label, corrected label, distance, and model version.

## 7. Background Model Fine-Tuning
**Purpose:** While KNN is fast, CNNs like MobileNetV2 are more robust to lighting and angle variations.
**Architecture:**
- **Backend (`retrain_all.py`):** Runs asynchronously via `threading.Thread`. Loads MobileNetV2 with ImageNet weights, freezes base layers, and trains a new classification head.
- **SSE Progress:** `GET /api/training_status` streams real-time progress (epoch, loss, accuracy) to the frontend.
- **Frontend (`TrainingPage.jsx`):** Live progress bar with epoch counter and training history.
- **Data Augmentation:** RandomHorizontalFlip, RandomRotation, ColorJitter, RandomErasing, GaussianBlur.

## 8. Multi-Tenant Organization Isolation
**Purpose:** Support multiple paying customers on a single deployment with complete data isolation.
**Architecture:**
- **Database:** Every table has an `org_id` foreign key to `organizations`.
- **Backend:** `@inject_org_id` middleware ensures every query is scoped to the authenticated org.
- **File System:** `org_storage.py` routes data to `data/orgs/{org_id}/` directories.
- **Models:** Each org has its own `encodings.pickle` and can have its own SOTA model weights.

## 9. Edge-Cloud Sync
**Purpose:** Physical cameras at remote sites operate independently and periodically sync attendance logs to the central database.
**Architecture:**
- **Backend (`/api/sync`):** Accepts bulk attendance log uploads from API-key-authenticated cameras.
- **Security:** Backend overrides all `org_id`/`camera_id` values in the payload with the authenticated camera's identity — prevents identity spoofing.
- **Idempotency:** Uses UUID primary keys to prevent duplicate log entries.

## 10. JWT Authentication & RBAC
**Purpose:** Secure the entire platform with proper identity management.
**Architecture:**
- **Auth Flow:** bcrypt password hashing → JWT access tokens (15m) + refresh tokens (7d).
- **Role Hierarchy:** `platform_owner > org_admin > manager > viewer > kiosk`.
- **Frontend:** `AuthContext.jsx` manages token lifecycle with automatic refresh and 401 redirect.
- **API Key Auth:** Separate authentication path for edge cameras via `X-API-Key` header.

## 11. Storytelling Landing Page
**Purpose:** Premium marketing presence to attract enterprise clients.
**Architecture:**
- **9 Section Components:** Hero with animated reticle, Problem Statement, AI Pipeline, Live Proof Terminal, Bento Grid Features, Data Sovereignty, Statistics, FAQ, and CTA.
- **Scroll Animations:** GSAP-driven scroll triggers with parallax effects and intersection observers.
- **Design:** Liquid glassmorphism with AI-generated background images, dark mode, and responsive layouts.
- **Navbar:** Scroll-aware capsule navbar that appears/hides based on scroll direction, with active section indicators.

## 12. Biometric Consent Tracking
**Purpose:** Legal compliance with BIPA (Illinois), GDPR (EU), and DPDP (India) biometric data regulations.
**Architecture:**
- **Database:** `consent_records` table tracks when consent was given, by whom, and from which IP.
- **Employee Model:** `consent_given_at` and `consent_revoked_at` timestamps on every employee record.
- **Audit Trail:** Full history preserved for regulatory inspection.
