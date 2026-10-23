# RMS Face AI — Enterprise User & Administrator Operations Guide
**Version:** 5.0 Enterprise Edition  
**Target Audience:** Enterprise Clients, HR Administrators, Operations Managers, Security Officers  
**Deployment URL:** `http://13.60.225.165` (or custom enterprise domain)  

---

## 1. Executive Summary & Architecture

**RMS Face AI** is a state-of-the-art biometrics attendance and identity verification platform engineered for real-time edge processing and scalable multi-tenant enterprise environments.

### Core Capabilities
* **Touchless High-Speed Attendance:** Sub-second facial verification for employees and visitors.
* **Multi-Angle & Profile Invariance:** Proprietary 3D head-pose yaw estimation allowing recognition from frontal, left-profile (-45°), and right-profile (+45°) angles.
* **Dual-Threshold Temporal Consensus:**
  * **$\ge 90\%$ Confidence:** Immediate match and zero-latency check-in.
  * **$70\% - 89\%$ Confidence:** Temporal consensus verification across consecutive video frames to prevent false positives.
  * **$< 60\%$ Confidence:** Rejection as `Unknown` with nearest candidate diagnostics to prevent false alarms.
* **Anti-Spoofing & Liveness Protection:** MediaPipe BlazeFace with edge gradient variance analysis to reject printed photos, screen replays, and digital masks.
* **Progressive Web App (PWA):** Installs natively on iOS, Android, macOS, and Windows with offline-first local verification fallback.

---

## 2. Role-Based Access Control (RBAC)

RMS Face AI uses strict hierarchical role segregation:

| Role | Access Level | Primary Responsibilities |
| :--- | :--- | :--- |
| **Org Admin** | Full Organization Control | Personnel enrollment, camera streams, model training, employee management, audit logs. |
| **Manager** | Operational Control | Camera testing console, Kiosk mode deployment, daily attendance approvals, live logs. |
| **Viewer** | Read-Only Access | Dashboard analytics, personal attendance viewing, profile management. |
| **Kiosk** | Dedicated Device Mode | Locked, full-screen touchless check-in terminal with camera access only. |

---

## 3. Personnel Face Enrollment & Photo Guidelines

Enrolling employees with high-quality reference imagery is the foundation of high-accuracy recognition. Navigate to **Upload** (`/upload`) in the navigation bar.

### A. Photo Capture Best Practices
To ensure $> 99.5\%$ real-world recognition accuracy:
1. **Lighting:** Ensure even, diffused lighting on the face. Avoid strong backlights or harsh shadows across the eyes and nose.
2. **Expressions:** Provide photos with natural neutral expressions, mild smiles, and natural head orientations.
3. **Accessories:** If the subject routinely wears spectacles, capture at least 2 photos with glasses and 2 without. Avoid tinted sunglasses or hats that cast deep shadows over the forehead and eyes.
4. **Resolution:** Recommended minimum size is $300 \times 300$ pixels. Images are automatically normalized and optimized.

---

### B. Enrollment Methods Available

#### Method 1: Smart Auto-Sort (Recommended)
1. Select the **Smart Auto-Sort** tab.
2. Enter the **Subject Identifier** (e.g. `Samarth_Thakkar` or `John_Doe` — alphanumeric with underscores).
3. Set **Training Epochs** (Default: `15`).
4. Drag and drop **5 to 15 photos** directly into the unified dropzone, or click **Start Camera** to capture live snapshots.
5. The system automatically computes 3D head-pose yaw and classifies photos into:
   * **Frontal** ($-15^\circ$ to $+15^\circ$)
   * **Left Profile** ($<-15^\circ$)
   * **Right Profile** ($>+15^\circ$)
6. Click **Enroll Person**. The embeddings are computed and hot-reloaded into the recognition models instantly.

#### Method 2: Manual Angle Slots
1. Select **Manual Angle Slots**.
2. Allocate photos specifically into dedicated slots:
   * **Frontal Photo:** Clear straight-on face.
   * **Left Angle Photo:** Head turned slightly to the left.
   * **Right Angle Photo:** Head turned slightly to the right.
   * **Extra Angle Photo:** Mild smile, tilted head, or alternate lighting.
3. Click **Submit Enrollment**.

#### Method 3: Bulk ZIP Archive
For onboarding whole departments or large workforces simultaneously:
1. Prepare a `.zip` file where each sub-folder is named after an employee code or name:
   ```text
   employees_batch_01.zip
   ├── EMP001_John_Doe/
   │   ├── photo1.jpg
   │   ├── photo2.jpg
   │   └── photo3.jpg
   ├── EMP002_Jane_Smith/
   │   ├── img_front.jpg
   │   └── img_side.jpg
   ```
2. Upload the `.zip` in the **Bulk ZIP Archive** tab.
3. The server automatically unzips, cleans face crops, generates embeddings, and enrolls all personnel in a single automated batch.

---

## 4. Touchless Kiosk Mode (`/kiosk`)

The **Kiosk Mode** is designed for tablets, wall-mounted iPads, reception desks, and edge turnstiles.

### Setup Steps
1. Navigate to **Kiosk Mode** from the navigation menu or directly open `http://13.60.225.165/kiosk`.
2. Allow camera permissions in the browser prompt.
3. Select the preferred camera input (e.g. Built-in HD Webcam or USB Wide-Angle Camera).
4. Tap **Full Screen** (or press `F11`) to lock the interface into kiosk mode.

### How Employees Use the Kiosk
1. The employee approaches the terminal and glances at the camera within the visual reticle (optimal distance: 0.5m – 1.8m).
2. The AI detects the face and highlights it with a color-coded bounding box:
   * **Green Reticle ($\ge 70\%$):** Positive recognition. The employee's name, department, and timestamp flash on-screen with an audible confirmation chime.
   * **Yellow Reticle ($60\% - 69\%$):** Consensus verification in progress.
   * **Red / Amber Reticle ($< 60\%$):** Unrecognized subject or visitor.
3. Anti-spam throttling automatically prevents duplicate check-ins within a 60-second window.

---

## 5. Live Camera Testing & Diagnostic Console (`/test`)

The **Test Camera** console allows administrators and managers to calibrate recognition sensitivity and inspect real-time inference scores.

### Key Controls
* **Detection Threshold Slider:**
  * **Default (70%):** Optimal balance for general enterprise environments.
  * **High Security (80% - 90%):** Recommended for server rooms and restricted access zones.
  * **Relaxed (60%):** Recommended for outdoor gates with variable lighting or challenging angles.
* **Candidate Diagnostics:** If a face is below the active threshold, the console displays the nearest candidate name and exact similarity score, making false-reject troubleshooting effortless.
* **Multi-Face Inference:** Simultaneously recognizes up to 8 individuals in the same frame.

---

## 6. Attendance Records & Reporting (`/attendance`)

Access complete audit trails of all check-in events:
1. **Filtering:** Filter records by Date, Department, Status (`Present`, `Late`, `Half-Day`), or Search by Name.
2. **Live Site View (`/attendance/live`):** View an interactive card feed showing the most recent check-ins with employee avatars and exact timestamps.
3. **Data Export:** Click **Export CSV** to download payroll-ready attendance reports compatible with SAP, Workday, QuickBooks, and Excel.

---

## 7. Progressive Web App (PWA) Installation

The application functions as an installable native app on all modern platforms:
* **Google Chrome / Microsoft Edge (Desktop):** Click the **Install** icon in the address bar or the **Install App** button in the sidebar footer.
* **Apple iOS (iPhone/iPad):** Open the site in Safari $\rightarrow$ tap the **Share** button $\rightarrow$ select **Add to Home Screen**.
* **Android:** Tap the three dots menu in Chrome $\rightarrow$ select **Install app**.

---

## 8. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: The camera feed shows a black screen or permission error.
* **Solution:** Ensure the browser has camera access enabled in site permissions. On iOS, navigate to *Settings $\rightarrow$ Safari $\rightarrow$ Camera $\rightarrow$ Allow*.

### Q2: An employee is recognized with lower confidence or marked Unknown.
* **Solution:** Navigate to `/upload`, enter the employee's existing name, select the **Update** mode, and add 2–3 new photos taken under the current facility lighting. The system incrementally refines their biometric signature without overwriting previous data.

### Q3: How do we prevent false attendance from a printed photo or phone screen?
* **Solution:** RMS Face AI has built-in active and passive liveness detection. The system analyzes skin texture, micro-reflections, and edge gradients to ensure the presence of a living human subject.

### Q4: What happens if internet connectivity drops temporarily?
* **Solution:** The PWA Service Worker caches the local model weights and client shell. In edge appliance mode, local attendance logs are stored in encrypted SQLite storage and automatically synchronized to the cloud once network connectivity is restored.

---

*Enterprise Support Desk: support@rms-ai.io | Technical Hotline: +1 (800) 555-RMS1*  
*Document Version: 5.0.2 | Confidential & Proprietary — RMS Face AI Solutions*
