# AuraPass™ Enterprise — System Architecture, OTA Synchronization & IP Protection Specification

> **Document Version**: v2026.2.0-LTS  
> **Target Audience**: Technical Leadership, Engineering, DevOps, and Enterprise Clients  
> **Classification**: Confidential / Core Architecture  

---

## 1. Executive Summary & Core Philosophy

The primary market differentiator of **AuraPass™ Enterprise** is **Sovereign On-Premise Biometric Computing**. 

Unlike conventional cloud-based facial recognition attendance systems (which transmit live video frames, sensitive employee face crops, and biometric vectors across the public internet to third-party cloud servers), AuraPass processes 100% of video decoding, face detection, biometric embedding extraction, and attendance logging **locally inside the client's internal network (LAN)**.

This creates an apparent engineering paradox:
1. **Client Privacy Requirement**: Zero biometric data egress (complying strictly with DPDP Act 2023, GDPR Article 9, and ISO/IEC 30107-3).
2. **Business & SaaS Requirement**: AuraPass must deliver regular bug fixes, feature releases, model improvements, enforce monthly/annual subscriptions, monitor server health, and protect proprietary algorithms and business secrets from unauthorized replication, cracking, or unauthorized resale.

To resolve this, AuraPass operates on a **Dual-Plane Architecture**:
- **Data Plane (100% Local / Zero Egress)**: Video streams, face recognition, turnstile relays, and attendance databases operate entirely offline within the client's edge hardware.
- **Control Plane (Encrypted Outbound Telemetry & Licensing)**: A lightweight, low-bandwidth outbound HTTPS channel connects to AuraPass HQ for cryptographic license renewal, version checking, and signed patch downloads.

---

## 2. High-Level Dual-Plane System Architecture

```mermaid
flowchart TD
    subgraph ClientLAN["Client Private Local Network (On-Premise / Edge Enclave)"]
        direction TB
        
        subgraph Sensors["Hardware Capture Layer"]
            CCTV["CCTV IP Cameras<br/>(RTSP / H.264 / H.265)"]
            Kiosk["Tablets / USB Webcams<br/>(Kiosk Front Gate)"]
            Turnstile["Entrance Turnstiles<br/>(Relay / Dry Contact / MQTT)"]
        end

        subgraph LocalEdge["AuraPass Edge Gateway (Mini-PC / On-Prem Server)"]
            StreamManager["Hardware RTSP Stream Manager<br/>(Frame Sampler & Drop-Recovery)"]
            DecryptedRAM["Encrypted Memory Enclave (RAM)<br/>• Decrypted ONNX Weights<br/>• Zero Plaintext on Disk"]
            InferenceEngine["Multi-Engine Biometric Pipeline<br/>• FaceNet-512 (99.65%)<br/>• InsightFace ArcFace (99.83%)<br/>• GhostFaceNet (4.2ms edge)<br/>• ISO 30107-3 Anti-Spoofing"]
            LocalDB[("Local SQLite / PostgreSQL<br/>• AES-256 Encrypted Embeddings<br/>• Local Attendance Logs")]
            LocalUI["Local Web UI / Kiosk App<br/>(Nginx / Vite Embedded / LAN:5000)"]
            LocalDaemon["AuraPass Sentinel Daemon<br/>• License Enforcement<br/>• Machine Hardware Lock<br/>• OTA Patch Unpacker"]
        end

        CCTV -->|RTSP Stream| StreamManager
        Kiosk -->|WebRTC / HTTPS| StreamManager
        StreamManager --> InferenceEngine
        DecryptedRAM -.->|Direct Pointer| InferenceEngine
        InferenceEngine -->|Matched Identity| LocalDB
        InferenceEngine -->|Trigger Signal| Turnstile
        LocalDB <--> LocalUI
    end

    subgraph AuraPassCloud["AuraPass Sovereign Cloud Control Plane (AWS / AuraPass HQ)"]
        direction TB
        LicenseServer["Cryptographic License Authority<br/>(Ed25519 Signed Tokens)"]
        PatchCDN["Patch Distribution Network<br/>(Signed Binary Delta Updates)"]
        TelemetryCollector["Anonymized Telemetry Hub<br/>(CPU load, FPS, DB Latency)"]
        BillingServer["Subscription & Billing Engine<br/>(Stripe / Razorpay Webhooks)"]
    end

    %% Control plane interactions (Outbound HTTPS only)
    LocalDaemon -->|1. Daily Heartbeat / License Validate| LicenseServer
    LocalDaemon -->|2. Check for Signed Updates| PatchCDN
    LocalDaemon -->|3. Send System Health Pings| TelemetryCollector
    BillingServer --> LicenseServer
```

---

## 3. How Software Updates, Code Sync & Maintenance Work (OTA Pipeline)

When AuraPass is installed on a client’s machine (whether a Windows Mini-PC, an Ubuntu edge server, or a Docker host), updates do **not** require manual re-installation or physical visits by engineers.

### 3.1 The Outbound-Only Heartbeat (No Inbound Ports Needed)
Corporate IT firewalls block incoming connections from the outside world. AuraPass never asks clients to open inbound ports or port-forward through their router.

Instead, the **AuraPass Sentinel Daemon** running locally initiates an **outbound HTTPS (TLS 1.3, port 443)** call to `https://updates.aurapass.in/v1/check-updates` once every 24 hours (or whenever manually triggered by an admin in the console).

### 3.2 Cryptographic Update Signature Verification
To prevent Man-in-the-Middle (MITM) attacks or code tampering:
1. Every release bundle (`patch-v2026.2.X.tar.gz`) is compiled and signed at AuraPass build headquarters using an **Ed25519 Private Key**.
2. The local client machine stores only the corresponding **AuraPass Public Key**.
3. When an update is downloaded, the client daemon verifies the SHA-256 hash and digital signature before extracting a single file. If the signature does not match, the file is immediately discarded.

```mermaid
sequenceDiagram
    autonumber
    participant Admin as Client Admin Dashboard
    participant Daemon as AuraPass Local Sentinel
    participant Cloud as AuraPass Cloud Update CDN
    participant Engine as Local Biometric Service

    Admin->>Daemon: Trigger System Update (or 24h cron)
    Daemon->>Cloud: GET /v1/updates/check (Current: v2026.2.0, MachineId: HASH)
    Cloud-->>Daemon: 200 OK: { version: "v2026.2.1", url: "...", sha256: "...", sig: "..." }
    Daemon->>Cloud: Download Encrypted Patch Delta
    Cloud-->>Daemon: Deliver patch.bundle
    Daemon->>Daemon: Verify Ed25519 Digital Signature & Hash
    alt Signature Valid
        Daemon->>Engine: Graceful Drain (Complete active frames)
        Daemon->>Engine: Hot-Swap Binary Artifacts & Run DB Migrations (Alembic)
        Daemon->>Engine: Restart Service (Zero Downtime / <1.5s switchover)
        Daemon->>Admin: UI Notification: "Successfully updated to v2026.2.1"
    else Signature Invalid / Corrupt
        Daemon->>Daemon: Abort & Rollback to previous working snapshot
        Daemon->>Admin: UI Warning: "Update integrity failed; rollback preserved"
    end
```

### 3.3 Three Supported Enterprise Update Methods
1. **Automated 1-Click Cloud OTA (Standard)**: For internet-connected offices. Admin clicks "Update to v2026.2.1" in the Admin Settings panel; the software downloads, tests, applies migrations, and restarts in seconds.
2. **Container Pull (Docker / Kubernetes)**: For enterprise IT departments. Managed via private container registry (`docker pull ghcr.io/aurapass/edge-engine:v2026.2.1`).
3. **Air-Gapped Offline Patch (Defense / High-Security Banking)**: For networks strictly prohibited from having internet access. AuraPass issues an encrypted `.aurapatch` file that the client IT admin uploads via local LAN browser file upload.

---

## 4. Intellectual Property & AI Model Protection Strategy

One of the greatest risks in distributing software on client machines is **theft of business secrets, unauthorized resale, or competitive reverse-engineering**.

AuraPass applies a multi-layered **Defense-in-Depth IP Security Framework**:

```mermaid
flowchart LR
    A["Proprietary Python<br/>& AI Code"] -->|Nuitka / Cython<br/>C++ Compilation| B["Native Binary<br/>(.so / .pyd / .exe)"]
    C["Proprietary AI Models<br/>(ArcFace / FaceNet)"] -->|AES-256-GCM<br/>Cipher Encryption| D["Encrypted Model Blobs<br/>(models.enc)"]
    E["Client Hardware<br/>(CPU, MAC, Motherboard)"] -->|Cryptographic Hash| F["Hardware Node Lock<br/>(aurapass.lic)"]
    
    B --> G["Protected Runtime Enclave"]
    D --> G
    F --> G
    G -->|Execution Permitted Only If<br/>Hardware Match + Valid License| H["In-Memory Model Inference<br/>(Zero Disk Plaintext)"]
```

### 4.1 Native Binary Compilation (No Readable Python Source Code)
- **The Threat**: Shipping raw Python scripts (`.py` or `.pyc`) allows any junior developer to open the code in VS Code or run `uncompyle6` to steal proprietary logic, pricing checks, and algorithms.
- **The AuraPass Solution**:
  - We compile proprietary core modules using **Nuitka / Cython** directly into native C/C++ machine code (`.pyd` on Windows, `.so` on Linux).
  - Native machine code has stripped symbol tables, obfuscated function names, and optimized assembly instructions.
  - Attempting to reverse-engineer a C++ binary requires disassembly in IDA Pro or Ghidra and is thousands of times more difficult than reading Python.

### 4.2 Encrypted Model Weights at Rest (In-Memory Decryption)
- **The Threat**: Competitors extracting trained model weights (`.onnx` or `.pth` files) to use in their own products for free.
- **The AuraPass Solution**:
  - All deep-learning model weights are stored on disk in an encrypted format using **AES-256-GCM**.
  - The decryption key is **never stored on disk**. It is derived at runtime by combining a secret embedded in the compiled C binary with the client's cryptographically signed license token.
  - The native C++ wrapper loads the decrypted weights **directly into an ephemeral RAM buffer** passed to the ONNX Runtime C API.
  - Even if a customer inspects their hard drive, they only see random ciphertext bytes.

### 4.3 Node-Locked Hardware Cryptographic Licensing
- **The Threat**: A client purchasing 1 license for 50 employees, then copying the entire folder or Virtual Machine onto 20 other servers to run across all their factory sites without paying.
- **The AuraPass Solution**:
  - During installation, AuraPass extracts a immutable hardware fingerprint composed of:
    $$\text{HardwareFingerprint} = \text{SHA256}(\text{Motherboard UUID} + \text{CPU Serial} + \text{Primary NIC MAC Address} + \text{OS UUID})$$
  - AuraPass issues a digitally signed `aurapass.lic` file containing this hash, along with the authorized limits (Max Employees, Max Cameras, Expiry Date).
  - If the files are copied to a different PC or VM clone, the hardware hash check fails instantly, and the biometric inference engine halts with `LICENSE_HARDWARE_MISMATCH`.

### 4.4 Cloud Heartbeat & Anti-Tampering Grace Period
- For subscription-based plans (Starter ₹1,999/mo, Business Pro ₹5,999/mo):
  - The local service performs an automated license verification with the AuraPass cloud authority every 24 hours.
  - **Offline Grace Period**: If the client's internet connection drops, the system continues running offline without interruption for up to **7 consecutive days** so that factory gate attendance is never disrupted by an ISP outage.
  - If a client cancels their subscription or fails to pay, their license token is revoked at the end of their billing cycle, causing the engine to revert to read-only access.

---

## 5. Why Competitors Cannot Easily Replicate or Undercut AuraPass

Building a commercial-grade biometric attendance and access control system is an operational challenge far beyond running an open-source face recognition model.

| Feature Area | Naive Open-Source Script / Cheap Clone | AuraPass Enterprise Production Moat |
| :--- | :--- | :--- |
| **RTSP Video Pipeline** | Stutters, drops connection, crashes when camera reboots. | Industrial multi-threaded frame buffer with auto-reconnect, packet drop recovery, and NVDEC hardware acceleration. |
| **Anti-Spoofing** | Can be fooled by displaying a photo on an iPad or iPhone. | ISO/IEC 30107-3 liveness checks combining texture, frequency Fourier spectrum, and blink/motion micro-dynamics. |
| **Crowd & Queue Filtering** | Marks the same person 50 times as they stand talking near the gate. | Spatial tracking with configurable cooldown windows (e.g., 5-minute directional debounce) and velocity vectors. |
| **Multi-Camera Consensus** | Only connects to 1 USB camera at a time. | Dynamic ensemble routing across multiple entrance lanes with lane-specific threshold overrides. |
| **Data Sovereignty Compliance** | Sends photos to AWS/GCP cloud (risking legal liability under DPDP 2023). | 100% on-premise biometric vectors; zero external egress; audit logs with tamper-evident checksums. |
| **Hardware Efficiency** | Requires an expensive \$2,500 dedicated GPU server. | GhostFaceNet and quantized ONNX engines run smoothly on inexpensive Core i5 Mini-PCs or Raspberry Pi 5. |

---

## 6. End-to-End Operational Lifecycle

### Phase 1: Onboarding & Hardware Enrollment
1. Admin opens the local console (`http://localhost:5000` or `http://192.168.1.X:5000`).
2. Admin inputs the RTSP URL of the factory/office IP cameras (e.g. `rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/101`).
3. Employees are enrolled via webcam snapshot, employee photo upload, or smartphone selfie link.
4. The engine converts each photo into a 512-dimensional mathematical vector (embedding) and discards the raw photo if maximum privacy mode is enabled.

### Phase 2: Daily Gate Operation (Sub-300ms Verification)
1. An employee walks toward the entrance turnstile at 1.2 m/s.
2. The RTSP camera feeds live video frames to the local AuraPass engine.
3. The detector detects the face box in ~15ms; the anti-spoofing module verifies physical liveness in ~8ms.
4. The embedding model extracts features in ~20ms and performs an L2 cosine distance lookup against local enrolled vectors in ~1.5ms.
5. Upon positive match ($\ge 70\%$ confidence), AuraPass:
   - Emits a GPIO / dry-contact electrical signal to open the turnstile.
   - Records an immutable attendance timestamp in the local database.
   - Shows an instant welcome greeting on the local kiosk display.

### Phase 3: Background Operations & Licensing
1. At 02:00 AM IST daily, the background sentinel initiates an outbound HTTPS ping to AuraPass Cloud.
2. It sends: License Token + Hardware Fingerprint + Aggregated anonymized metrics (e.g., total scans today, average latency).
3. Cloud responds with: `License Valid (Active until end of billing cycle)` + `Update Available: v2026.2.X (Optional)`.
4. The local system continues operating smoothly with 99.99% uptime.

---

## 7. Summary of Protections & Business Viability

By combining:
1. **C++ Native Binary Compilation** (Cython/Nuitka)
2. **AES-256 Encrypted Model Weights** with RAM-only ephemeral decryption
3. **Hardware-bound Node-Lock Licensing**
4. **Outbound-only Signed OTA Updates**
5. **Legally binding EULA / Master Services Agreement**

AuraPass secures its source code, deep learning models, and commercial pricing model, while providing customers with absolute data privacy and guaranteed compliance with Indian (DPDP Act) and international data protection standards.

