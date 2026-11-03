# AuraPass™ Enterprise — System Architecture, Business Economics & Go-To-Market Blueprint

> **Executive Authority**: Technical & Commercial Operating Manual for AuraPass™ Enterprise  
> **Target Audience**: Organization Founders, Executive Sales, Solutions Architects & Enterprise IT Buyers  
> **Classification**: Commercial & Engineering Strategy (Proprietary)

---

## 1. System Architecture & End-to-End Working

AuraPass™ Enterprise is an autonomous, high-throughput biometric presence and physical access orchestration platform. It is engineered with a **dual-engine architecture** supporting both **100% Air-Gapped Local Edge Sovereign Mode** and **Multi-Tenant Hybrid Cloud Mode**.

### High-Level Dataflow Architecture

```mermaid
flowchart TD
    subgraph INGESTION["1. Hardware & Ingestion Layer"]
        C1["Existing CCTV / IP Cameras (RTSP / ONVIF)"]
        C2["Interactive Kiosk / Tablet Webcams (WebRTC)"]
        C3["Security Gate Multi-Cam Feeds (HTTP / MJPEG)"]
    end

    subgraph PREPROCESSING["2. Quality & Conditioning Layer"]
        Q1["Frame Capture & Downsampling (Max 1280px)"]
        Q2["CLAHE Illumination Equalization"]
        Q3["Motion Blur & Minimum Spec Filtering"]
    end

    subgraph BIOMETRICS["3. Biometric ML Vision Pipeline"]
        D1["Multi-Scale Face Detection (YuNet / RetinaFace)"]
        A1["2D/3D Affine Landmark Pose Alignment (up to 60° Yaw)"]
        L1["Anti-Spoofing & Liveness Filter (Texture + FFT + YCbCr)"]
        E1["Dual-Backbone Feature Extraction: FaceNet512 + ArcFace"]
    end

    subgraph MATCHING["4. Multi-Tenant Decision Engine"]
        M1["Tenant-Isolated Vector Store (512-d unit sphere)"]
        M2["Cosine / Euclidean Distance Nearest Neighbor Search"]
        M3["Dynamic Confirmation Gating & Threshold Calibration"]
    end

    subgraph OUTPUT["5. Transaction & Integration Layer"]
        O1["Attendance Ledger (SQLite / PostgreSQL)"]
        O2["Real-Time Admin Dashboard (WebSockets)"]
        O3["Physical Access Relays (Turnstiles / Wiegand Gates)"]
        O4["Executive Analytics & Payroll Exports (PDF / CSV)"]
    end

    INGESTION --> PREPROCESSING
    PREPROCESSING --> BIOMETRICS
    BIOMETRICS --> MATCHING
    MATCHING --> OUTPUT
```

---

### Step-by-Step Processing Pipeline (In Plain English)

1. **Camera Feed Ingestion**:
   - The system connects to any standard IP surveillance camera or kiosk camera and captures video frames in real time.
2. **Image Normalization & CLAHE**:
   - Faces can appear under harsh sunlight, fluorescent bulbs, or dark shadows. The system uses **Contrast Limited Adaptive Histogram Equalization (CLAHE)** to normalize illumination across the facial structure without blowing out highlights.
3. **Multi-Scale Face Detection**:
   - Detects all human faces in the frame in under $30\text{ms}$. Even if 3 to 5 people walk through a gate together, each face is isolated into a separate bounding box.
4. **Pose Alignment & Landmark Correction**:
   - People rarely look straight into security cameras. The system extracts 5 key facial landmarks (eyes, nose, mouth corners) and applies a mathematical **affine transformation**. This aligns the face as if they were looking directly forward, even at head-turn angles up to 60 degrees.
5. **Anti-Spoofing & Liveness Gate (ISO/IEC 30107 PAD)**:
   - Before identification, the face undergoes three passive liveness tests:
     - **Texture Analysis (Local Binary Patterns)**: Detects printed paper grain and tablet pixel moiré patterns.
     - **Frequency Spectrum (FFT)**: Identifies high-frequency screen border artifacts.
     - **Color Distortion (YCbCr/HSV)**: Flags unnatural screen phosphors and reflections.
     - *If spoofing is detected, the transaction is rejected instantly.*
6. **Feature Extraction (Embeddings)**:
   - The aligned crop is converted into a **512-dimensional mathematical fingerprint vector** using the FaceNet512 / InsightFace deep neural network. No actual raw photos are compared—only mathematical coordinates.
7. **Nearest Neighbor Search & Confirmation**:
   - The vector is compared against enrolled employees within the organization's isolated database. If the distance metric meets the calibrated threshold ($<0.32$), identity is verified.
8. **Logging & Physical Relay Trigger**:
   - Attendance is written to the database in under $10\text{ms}$, a WebSocket event updates the live dashboard, and a signal is emitted to open the turnstile or magnetic door lock.

---

## 2. Hardware Compatibility: Connecting to Existing CCTV Cameras

### "Can AuraPass connect to our existing cameras, or do we need new hardware?"
**Yes, AuraPass works with virtually ANY IP or CCTV camera already installed in the facility.**

### Supported Ingestion Protocols
1. **RTSP (Real-Time Streaming Protocol)**:
   - **Supported Brands**: Hikvision, Dahua, Axis, CP Plus, Hanwha (Samsung), Uniview, Bosch, TP-Link Vigi, Milesight, Amcrest, Reolink.
   - **How it connects**: Every standard IP camera or NVR/DVR outputs an RTSP video stream on the local network (e.g., `rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101`).
   - AuraPass opens this stream directly using its hardware-accelerated OpenCV/FFmpeg ingestion engine.
2. **ONVIF (Open Network Video Interface Forum)**:
   - Industry-standard protocol supported by 99% of commercial security equipment. AuraPass can auto-discover ONVIF cameras on the local subnet.
3. **USB & Built-in Webcams (UVC Standard)**:
   - Any USB webcam (Logitech Brio, C920) or laptop webcam.
4. **Interactive Kiosk / Tablet Webcams**:
   - Standard iPads, Android tablets, or touch terminals running Google Chrome or Edge connect to AuraPass via secure WebRTC / HTML5 camera APIs.

### Minimum Camera Hardware Specifications

| Spec Dimension | Minimum Requirement | Recommended Enterprise Spec | Why It Matters |
| :--- | :--- | :--- | :--- |
| **Resolution** | 720p HD ($1280 \times 720$) | 1080p Full HD ($1920 \times 1080$) | Minimum 80 pixels across the face for accurate 512-d embeddings |
| **Frame Rate** | 15 FPS | 25 – 30 FPS | Eliminates motion blur as people walk through gates at normal pace |
| **Mounting Height** | 1.8m – 2.2m (down-angle $\le 20^\circ$) | 1.5m – 1.8m (eye-level alignment) | Keeps vertical pitch angle within 30 degrees |
| **Lighting** | 150 Lux (standard office) | 300+ Lux (diffused LED backlight) | Prevents heavy facial shadowing; CLAHE handles the rest |

---

## 3. Business Model, Pricing Economics & Cloud Costs

### Operating Modes & Cost Comparison

```mermaid
flowchart LR
    subgraph ONPREM["Model A: On-Premise Local Sovereign (Zero Cloud Cost)"]
        O_HW["Local Mini-PC / Edge Box ($250 - $450 one-time)"]
        O_RUN["Running Cost: $3/mo electricity"]
        O_REV["Client Pays: $1,500 - $3,500/year license"]
        O_NET["Gross Margin: 95%+"]
    end

    subgraph SAAS["Model B: Multi-Tenant Hybrid Cloud SaaS"]
        S_HW["Cloud VPS / Hetzner / AWS ($60 - $180/mo total)"]
        S_RUN["Database & Backup: $40/mo"]
        S_REV["Client Pays: $99 - $999/mo subscription"]
        S_NET["Gross Margin: 85%+ after 3 clients"]
    end
```

---

### Monthly Running & Infrastructure Costs (Real Sizing)

#### 1. On-Premise Edge Deployment (Per Customer Facility)
* **Compute Hardware**: Intel 12th/13th Gen Mini-PC (Intel N100 / i5-1240P, 16GB RAM, 512GB NVMe SSD): **$250 – $380 (one-time)**.
* **Monthly Cloud Cost**: **\$0.00 / month** (100% air-gapped, zero external egress).
* **Power Consumption**: ~25W active ($\approx \$2.50 – \$4.00/\text{month}$ electricity).

#### 2. Multi-Tenant Cloud Deployment (Serving 50 to 100 Organizations)
* **Application & API Server**: 8 vCPU, 32GB RAM (Hetzner Dedicated Server or AWS c6i.2xlarge): **\$70 – \$140 / month**.
* **Managed Database**: PostgreSQL with automated point-in-time recovery: **\$35 – \$60 / month**.
* **Object / Storage Backup**: S3-compatible daily encrypted backups: **\$10 – \$20 / month**.
* **Monitoring & SSL/TLS**: Cloudflare Pro + uptime telemetry: **\$20 / month**.
* **Total Cloud Operational Expense**: **$\approx \$135 – \$240 / \text{month}$** for the entire platform.

---

### Subscription Tiers & Revenue Projections

| Tier | Maximum Capacity | Monthly Subscription | Annual Pre-paid | Target Market |
| :--- | :--- | :---: | :---: | :--- |
| **Starter** | Up to 200 Employees, 5 Cameras | **\$99 / mo** | \$990 / yr | Small offices, gyms, clinics, single-shift agencies |
| **Business** | Up to 500 Employees, 20 Cameras | **\$299 / mo** | \$2,990 / yr | Manufacturing plants, warehouses, schools, corporate floors |
| **Enterprise** | Up to 10,000 Employees, 100 Cameras | **\$899 / mo** | \$8,990 / yr | Multi-facility factories, IT parks, hospital campuses, logistics |
| **On-Premise Sovereign** | Unlimited Employees (1 site) | **\$2,500 / yr** | \$6,500 (3 yrs) | Government, defense, defense contractors, banking, air-gapped sites |

---

### Break-Even & Profit Threshold Analysis

$$\text{Fixed Monthly Overhead} = \$300 \quad (\text{Cloud VPS} + \text{Domain} + \text{Payment Gateway} + \text{Backups})$$

* **Break-Even Point (SaaS)**:
  - Just **1 Enterprise Client** (\$899/mo) = **+$599/mo Net Profit**.
  - Or **2 Business Clients** ($2 \times \$299 = \$598/\text{mo}$) = **+\$298/mo Net Profit**.
  - Or **4 Starter Clients** ($4 \times \$99 = \$396/\text{mo}$) = **+\$96/mo Net Profit**.
* **At 20 Organizations** (10 Starter + 7 Business + 3 Enterprise):
  $$\text{Monthly Revenue} = (10 \times 99) + (7 \times 299) + (3 \times 899) = \$990 + \$2,093 + \$2,697 = \mathbf{\$5,780 / \text{month}}$$
  $$\text{Net Operating Profit} = \$5,780 - \$300 = \mathbf{\$5,480 / \text{month}} \quad (\mathbf{94.8\% \text{ Gross Margin}})$$
  $$\text{Annual Recurring Revenue (ARR)} = \mathbf{\$69,360 / \text{year}}$$

---

## 4. How to Pitch & Sell AuraPass to Organizations

### A. The Pitch to Companies with NO Biometrics (Manual Registers or RFID Cards)
> *"Every morning, your employees line up to sign paper registers or tap access cards. But cards get lost, forgotten, shared, or 'buddy-punched' by coworkers. Studies show businesses lose 2.2% to 4.5% of their total payroll to time theft and manual attendance discrepancies.*  
>  
> *AuraPass eliminates buddy-punching completely. Employees walk past the door, their face is verified in 250 milliseconds without stopping, and attendance is logged instantly. No touch, no cards to replace, no payroll disputes."*

### B. The Pitch to Companies with Old Fingerprint Machines
> *"Fingerprint terminals are slow, unsanitary, and constantly fail on dusty, wet, or worn hands—especially in manufacturing, construction, logistics, and kitchen environments. During shift change, 50 workers take 10 minutes to clock in, creating bottlenecks and delays.*  
>  
> *AuraPass is 100% contactless. Workers walk through the entrance at a normal pace—even 3 people side-by-side—and the camera clocks all three simultaneously. Onboarding a new worker takes 30 seconds from their smartphone."*

### C. The Pitch to Companies with CCTV Cameras Already Installed
> *"You've already invested thousands of dollars in CCTV cameras around your building. Right now, those cameras only sit there recording hours of video that nobody watches until something goes wrong.*  
>  
> *With AuraPass, we connect directly to your existing CCTV cameras over your local network. You don't need to purchase single piece of new hardware. Overnight, your existing surveillance cameras become an intelligent, automated attendance and access tracking system."*

---

## 5. Game-Changing Features That Win Deals

1. **Zero Hardware Lock-In**:
   - Clients never buy proprietary readers. They can use any existing camera, any tablet, or an off-the-shelf \$25 webcam.
2. **Sub-300ms Walk-Through Recognition**:
   - No stopping, no posing. Workers walk through gates naturally.
3. **60° Profile & Multi-Angle Recognition**:
   - Most competitors fail if the person isn't staring directly into the lens. AuraPass utilizes landmark pose normalization up to 60 degrees.
4. **Hardware Anti-Spoofing (Liveness Detection)**:
   - Defeats printed photos, iPad video playbacks, and 3D silicone masks using combined frequency analysis and texture detection.
5. **Biometric Data Sovereignty & GDPR/BIPA Compliance**:
   - Unlike cloud AI vendors (AWS Rekognition, Azure Face) that transmit employee photos to third-party cloud servers, AuraPass runs **100% locally**. Biometric vectors never leave the building.
6. **Department Rostering & Grace Period Engine**:
   - Built-in working hours, department shift rules, and grace periods (e.g. 15-minute grace before marking "Late Arrival"), with automated PDF executive reports ready for payroll.
7. **Offline Fault Tolerance (Zero Lockout)**:
   - If the internet goes down, AuraPass continues logging attendance locally on SQLite. When internet returns, it synchronizes seamlessly.

---

## 6. Enterprise Customization Strategy

When a high-value enterprise asks for custom workflow adaptations:

```mermaid
flowchart TD
    REQ["Enterprise Customization Request"]
    
    subgraph STRATEGY["Monetization & Implementation Strategy"]
        C1["HRMS / Payroll Integration: SAP, Workday, Zoho People, BambooHR, Darwinbox"]
        C2["Physical Turnstile Relay Integration: Wiegand / GPIO / TCP-Relay"]
        C3["Custom Shift Schedules: Multi-rotation night shifts, overtime rules"]
    end

    subgraph BILLING["Revenue Structure"]
        B1["One-Time Professional Services Fee: $2,500 - $10,000"]
        B2["Annual Premium Maintenance SLA: +20% of contract value"]
    end

    REQ --> STRATEGY
    STRATEGY --> BILLING
```

1. **Turnstile & Physical Door Integration**:
   - Connect an IP Relay Module (e.g. Advantech ADAM-6060 or \$25 ESP32 relay board) over LAN.
   - When AuraPass verifies identity, it fires a 200ms HTTP/TCP pulse to the relay, releasing the magnetic door lock or turnstile gate.
2. **HRMS & Payroll Synchronization**:
   - AuraPass exposes a clean REST API (`GET /api/attendance/recent`, `POST /api/attendance/export`).
   - Standard connectors can be deployed for **Workday, SAP SuccessFactors, Zoho People, Keka, and BambooHR**.
3. **Customization Pricing Rule**:
   - Never perform custom engineering for free. Bill an upfront **Integration & Setup Fee (\$2,500 – \$10,000)** plus a recurring annual **SLA / Maintenance Surcharge**.

---

## 7. Security, Reliability, Resilience & Fault Tolerance

| Security & Resilience Dimension | AuraPass™ Implementation | Enterprise Audit Proof |
| :--- | :--- | :--- |
| **Biometric Privacy Sovereignty** | Vectors are non-invertible mathematical projections (512-d embeddings). Raw photos can be purged after training. | Meets GDPR Art. 9, CCPA, and Illinois BIPA compliance. |
| **Anti-Spoofing Resilience** | ISO/IEC 30107-3 compliant PAD with texture analysis, FFT spectrum filtering, and color distortion detection. | Blocks paper photo prints, smartphone photo display, and video replay attacks. |
| **Network Failure Tolerance** | Local SQLite transaction spooling when database or network drops. | Attendance records are never lost during network outages; spooled records sync when connection restores. |
| **Multi-Tenant Cryptographic Isolation** | Every tenant's embeddings and personnel models are stored in dedicated directories (`dataset_cleaned/orgs/<org_id>/`). | Eliminates cross-organization biometric vector contamination. |
| **License Expiry Grace Protection** | Cryptographic offline JWT licenses with a 14-day warning and 30-day degraded grace period. | **Zero Lockout Guarantee**: Employees are never stranded at the entrance doors due to administrative license delays. |

