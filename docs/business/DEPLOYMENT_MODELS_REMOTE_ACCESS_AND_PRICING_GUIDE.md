# AuraPass™ Enterprise — Deployment Models, Remote Access Architecture & Commercial Pricing Guide

> **Classification**: Commercial Strategy & Technical Architecture  
> **Status**: Final Specification  
> **Target Audience**: Executive Leadership, Sales Engineers, and Technical Operations  

---

## 1. Remote Access Architecture: How Executives View Live Video & Attendance from Home / Mobile

When an enterprise runs AuraPass on an on-premise local computer (e.g. inside a factory or office), company leadership (CEOs, MDs, HR Directors, and Facility Managers) often need to:
1. **Check Live Attendance & Analytics** (Who is in the office, who is late, total headcounts).
2. **View Live CCTV / Kiosk Camera Feeds** (Check gate queues, verify an incident in real-time).
3. **Receive Instant Alerts** (VIP arrival, unknown face alert, door forced open).

To achieve this **without violating data privacy laws (DPDP Act 2023)** and **without opening vulnerable inbound router ports**, AuraPass implements a **Dual-Channel Remote Relay**:

```mermaid
flowchart TD
    subgraph ClientSite["Client Factory / Office (Local Network)"]
        direction TB
        CCTV["CCTV IP Cameras<br/>(RTSP Stream)"] --> LocalGateway["AuraPass Edge Gateway<br/>(On-Premise Mini-PC)"]
        LocalGateway --> LocalDB[("Local SQLite / Postgres<br/>• Raw Video & Face Embeddings<br/>• NEVER LEAVES LAN")]
        
        SyncWorker["Outbound Sync Worker (sync.py)<br/>• Pushes text logs only<br/>• Zero biometric templates"]
        WebRTCServer["Local WebRTC Micro-Server<br/>(On-Demand Live Stream Relay)"]
        LocalGateway <--> SyncWorker
        LocalGateway <--> WebRTCServer
    end

    subgraph AuraPassCloud["AuraPass Cloud Platform (AWS Mumbai / Stockholm)"]
        direction TB
        CloudDB[("Cloud Database<br/>• Text logs only<br/>• Name, Timestamp, Gate ID")]
        WebPortal["Cloud Management Web Portal & API<br/>(app.aurapass.in)"]
        SignalingServer["Secure WebRTC Signaling & STUN/TURN Hub"]
        
        SyncWorker -->|1. Encrypted TLS 1.3 Outbound Push| WebPortal
        WebPortal <--> CloudDB
        WebRTCServer <-->|2. Ephemeral P2P Session Negotiation| SignalingServer
    end

    subgraph ExecutiveDevice["CEO / Executive Remote Device (Home / Mobile)"]
        direction TB
        MobileApp["AuraPass Executive Mobile App / PWA<br/>(iPhone, Android, or Laptop Browser)"]
        
        MobileApp <-->|A. Reads Real-Time Attendance Dashboards| WebPortal
        MobileApp <-->|B. On-Demand P2P Live Camera Video Stream (DTLS-SRTP)| WebRTCServer
    end
```

### Channel 1: Real-Time Attendance & Reports Sync (Metadata Only)
- The local background daemon ([`backend/sync.py`](file:///e:/RMS/backend/sync.py)) pushes **lightweight text records** over an outbound encrypted TLS 1.3 connection:
  ```json
  {
    "employee_name": "Vatsal Vadgama",
    "department": "Engineering",
    "checkin_time": "2026-11-15T09:14:22Z",
    "gate_name": "Main Turnstile North",
    "status": "Present",
    "confidence": 94.2
  }
  ```
- **Privacy Compliance**: Zero face photos, zero biometric vectors, and zero raw video streams are transmitted. The CEO can open `https://app.aurapass.in` or the mobile app from anywhere in the world and view live clock-ins, late arrivals, and export CSV/PDF reports instantly.

### Channel 2: Live CCTV Camera Video Streaming (On-Demand WebRTC P2P)
- **How it works**:
  - The local on-premise gateway runs a lightweight WebRTC streaming module.
  - When the CEO opens the mobile app and taps **"View Gate 1 Live"**, an encrypted **WebRTC Peer-to-Peer (P2P)** connection is established between the office Mini-PC and the CEO's smartphone.
  - The video stream is transmitted with end-to-end encryption (**DTLS-SRTP**).
  - **Bandwidth & Storage Optimization**: Video is streamed **only while the CEO is actively watching the screen**. No video is ever stored or recorded in the cloud, saving massive cloud storage fees and preventing privacy leaks.

---

## 2. In-Depth Comparison: The Three Deployment Models

| Parameter | Model 1: Pure Cloud SaaS | Model 2: Pure On-Premise (Air-Gapped) | Model 3: Hybrid Cloud-Edge (Recommended) |
| :--- | :--- | :--- | :--- |
| **How It Operates** | Tablets / webcams capture frames and send them over internet to AWS. AI runs on AWS EC2. | Entire AI engine, cameras, and database run on a local PC in office. 0% internet used. | AI & cameras run on local Mini-PC. Lightweight text logs & on-demand WebRTC sync to cloud. |
| **Client Hardware Needed** | Budget Android Tablet or iPad (₹8,000–₹14,000) or Laptop Webcam. | Mini-PC or Desktop (Core i5 / Ryzen 5, ₹20,000–₹28,000) + CCTV IP Cameras. | Mini-PC (Core i5, ₹20,000) + CCTV Cameras or Tablets. |
| **Offline Operation** | ❌ Fails if internet goes down (Requires active Wi-Fi/4G). | ✅ 100% Offline (Works indefinitely with zero internet). | ✅ 100% Offline for gate access. Syncs logs when internet returns. |
| **Remote Access for CEO** | ✅ Native from anywhere via web/mobile app. | ❌ Only inside office Wi-Fi (Unless client configures corporate VPN). | ✅ Full remote dashboard & on-demand live camera streaming. |
| **DPDP 2023 Biometric Compliance** | Requires explicit employee cloud consent agreement. | ✅ Absolute sovereign compliance (Biometrics never touch WAN). | ✅ Absolute sovereign compliance (Biometrics never touch WAN). |
| **Inference Latency** | ~250ms – 450ms (Subject to internet upload speed). | **~18ms – 35ms** (Ultra-fast, instant turnstile opening). | **~18ms – 35ms** (Ultra-fast, instant turnstile opening). |
| **Best Suited For** | Startups, Coworking, Salons, Boutique Clinics (10–80 staff). | Banks, Defense, Data Centers, High-Security Prisons. | Factories, Warehouses, Schools, Corporate Offices, IT Parks. |

---

## 3. Financial Model & Cost Breakdown (COGS vs. Pricing vs. Profit)

### Model 1: Pure Cloud SaaS (Starter Tier)
- **Target Customer**: Small businesses (10 to 100 staff) wanting zero hardware setup.
- **Our Infrastructure Cost (COGS per client/month)**:
  - Cloud vCPU Inference (Shared AWS EC2 instance handling 20 clients): **₹180 / month**
  - Image Upload Bandwidth (~10,000 frames/month): **₹40 / month**
  - PostgreSQL RDS / S3 Cloud Database Storage: **₹30 / month**
  - **Total Cost to Us**: **~₹250 / month**
- **Customer Pricing**:
  - **Monthly Subscription**: **₹1,999 / month** (or **₹19,990 / year** billed annually)
  - Covers up to 100 employees and 2 tablet kiosk devices.
  - Per-Employee equivalent cost for client: ~₹20 / employee / month.
- **Our Financial Return**:
  - Revenue: ₹1,999 / mo
  - COGS: ₹250 / mo
  - **Gross Profit**: **₹1,749 / month (~87.5% Gross Margin)**

---

### Model 2: Pure On-Premise / Air-Gapped (Defense & Banking Tier)
- **Target Customer**: Government institutions, defense contractors, currency vaults, and banks that legally cannot transmit data to any cloud.
- **Our Infrastructure Cost (COGS per client/month)**:
  - Cloud Compute: **₹0** (Runs entirely on client-purchased hardware).
  - Software Updates: Offline patch bundle distribution via portal: **~₹50 / month**.
  - Enterprise Dedicated Support Allocation: **~₹450 / month**.
  - **Total Cost to Us**: **~₹500 / month**
- **Customer Pricing**:
  - **One-Time Onboarding & Deployment Fee**: **₹25,000**
  - **Annual Software License & Maintenance (AMC)**: **₹1,19,999 / year** (~₹9,999 / month)
  - Covers up to 1,000 employees and up to 10 CCTV camera channels.
- **Our Financial Return**:
  - Revenue: ~₹10,000 / mo
  - COGS: ₹500 / mo
  - **Gross Profit**: **₹9,500 / month (~95% Gross Margin)**

---

### Model 3: Hybrid Cloud-Edge (Enterprise Standard — Our Primary Flagship)
- **Target Customer**: Manufacturing plants, IT parks, schools, multi-location retail chains, and hospitals (100 to 3,000+ staff).
- **Our Infrastructure Cost (COGS per client/month)**:
  - Edge Inference: **₹0** (Runs on client Mini-PC).
  - Cloud Attendance Dashboard & Log Ingestion (PostgreSQL): **₹60 / month**
  - WebRTC Live Video Relay (STUN/TURN signaling, on-demand streaming only): **₹40 / month**
  - Automated Cloud Backups & Centralized License Server: **₹30 / month**
  - **Total Cost to Us**: **~₹130 / month**
- **Customer Pricing**:
  - **Business Pro Hybrid Plan**: **₹5,999 / month** (or **₹59,990 / year**)
    - Supports up to 500 staff, 5 CCTV cameras, remote mobile app, live video stream.
  - **Enterprise Multi-Site Hybrid Plan**: **₹14,999 / month** (or **₹1,49,990 / year**)
    - Supports up to 2,000 staff, 15 CCTV cameras, multi-branch centralized dashboard.
- **Our Financial Return (Business Pro)**:
  - Revenue: ₹5,999 / mo
  - COGS: ₹130 / mo
  - **Gross Profit**: **₹5,869 / month (~97.8% Gross Margin)**

---

## 4. Hardware Sourcing & Procurement Recommendations

To offer a smooth customer experience, AuraPass can provide clients with recommended pre-configured hardware:

1. **The Edge Mini-PC (For Hybrid & On-Premise)**:
   - **Recommended Device**: Refurbished or New Intel Core i5 (8th–12th Gen) Mini-PC (e.g., Lenovo ThinkCentre Tiny, HP EliteDesk Mini, or ASUS NUC).
   - **Price**: ₹18,000 to ₹26,000 one-time cost.
   - **Advantage**: Ultra-compact (fits behind a reception monitor or inside a server rack), low power consumption (<35W), silent fanless operation, runs 24/7.
2. **CCTV Cameras**:
   - Any standard ONVIF / RTSP IP camera (Hikvision, Dahua, CP Plus, Uniview) with 2MP to 4MP resolution (₹2,200 to ₹4,500 per camera).
3. **Kiosk Tablets (For Cloud SaaS & Front Desks)**:
   - Samsung Galaxy Tab A9 (8.7", ₹9,999) or Lenovo Tab M10 (₹11,499) with wall mount bracket.
