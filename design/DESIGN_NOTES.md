# AuraPass Enterprise — Precision Security Design Specification & Storyboard

> **Design Authority**: Generated via Stitch MCP project `AuraPass Public Site` (`projects/14929965117641638912`).
> **Aesthetic Philosophy**: Minimal, calm, precise, trustworthy. "Security infrastructure company", not "AI startup". Spacious, intentional, neutral near-black base with a faint cool-green tint. Accent appears only where something is verified, alive, or actionable.

---

## 1. Design System Tokens

### A. Color Palette
- **Background Ground (`--bg`)**: `#06090B` (Near-black with a faint cool-green tint)
- **Surface (`--surface`)**: `#0B1013` (Base containers, cards, tables, sidebars)
- **Raised (`--raised`)**: `#10171B` (Elevated states, active tabs, floating panels)
- **Hairline (`--line`)**: `rgba(255, 255, 255, 0.08)` (Subtle dividers, 1px card borders)
- **Line Strong (`--line-strong`)**: `rgba(255, 255, 255, 0.16)` (Hover states, active focus)
- **Text Primary (`--text`)**: `#F3F6F5` (High-contrast headings and primary labels)
- **Text Muted (`--text-muted`)**: `#9AA7A3` (Body copy, technical descriptions)
- **Text Faint (`--text-faint`)**: `#66726E` (Footnotes, timestamps, inactive icons)
- **Accent Emerald (`--accent`)**: `#3DDC97` (Primary CTA, verified reticles, relay trigger)
- **Accent Hover (`--accent-hover`)**: `#5FE8AD`
- **Accent Tint (`--accent-tint`)**: `rgba(61, 220, 151, 0.12)` (Soft background pills and badges)
- **Danger (`--danger`)**: `#FF6B6B` (**Exclusively reserved** for the spoof-rejected security event)

### B. Typography & Font Hierarchy
- **Sans Family**: `Geist`, `Inter`, system-ui (Weights: `400`, `500`, `600` only. Never bold 700/800/900).
- **Mono Family**: `Geist Mono`, `JetBrains Mono`, monospace (Restricted to numeric values, timings, code, IDs, tiny badges; never for body text).
- **Headings**: `text-wrap: balance`.
- **Paragraphs**: `text-wrap: pretty`, `max-width: 62ch`. No orphan words.
- **Scale**:
  - `H1`: `clamp(40px, 6vw, 76px)`, weight 600, letter-spacing `-0.03em`, line-height `1.05`.
  - `H2`: `clamp(30px, 4vw, 52px)`, weight 600, letter-spacing `-0.025em`, line-height `1.1`.
  - `H3`: `22px`, weight 600, line-height `1.25`.
  - `Body Landing`: `17px / 1.65`.
  - `Body Article (Docs / Legal)`: `16px / 1.7`.
  - `Small`: `14px / 1.5`.
  - `Mono / Label`: `12px / 1.4`, letter-spacing `0.04em`.

### C. Spacing & Containers
- **Base Grid**: 8px.
- **Section Padding**: `128px` (desktop) / `80px` (mobile).
- **Max Container**: `1160px`.
- **Max Article Width (Docs / Legal)**: `740px`.
- **Corner Radii**: `12px` and `20px` only (and `9999px` for pills).
- **Shadows**: Single soft dark shadow (`0 20px 48px -12px rgba(0, 0, 0, 0.75)`).

---

## 2. Motion Rules & Easing
- **Primary Curve**: `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Scene Transformations**: `400ms` to `900ms`.
- **Text Reveal**: Fade in + `12px` rise, staggered by `60ms`.
- **Allowed Animated Properties**: `transform`, `opacity`, and SVG `stroke-dashoffset`.
- **Accessibility**: Strict `@media (prefers-reduced-motion: reduce)` compliance showing static final states with zero movement.
- **Zero Gimmicks**: No floating blobs, cursor followers, confetti, or parallax skew.

---

## 3. The Landing Page Storyboard ("From Door to Payroll")

The landing page is an interactive narrative scrolling experience featuring a persistent, sticky visual stage on the right (desktop) or pinned on top (mobile) paired with scrolling narrative chapters on the left:

```
+-----------------------------------------------------------------------------------------+
| [AuraPass ENT]   Product   Security   Pricing   Docs   Support   [Sign in]  [Start free]   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  LEFT COLUMN: NARRATIVE CHAPTERS                RIGHT COLUMN: STICKY STAGE (SVG / CANVAS)|
|                                                                                         |
|  [01 Arrival]                                   +-------------------------------------+ |
|  Attendance that recognizes people,             | [STAGE: PROXIMITY DETECTION]        | |
|  not badges.                                    |  Walking silhouette approaching     | |
|  Turn existing RTSP cameras into sub-300ms      |  optical detection cone             | |
|  sovereign verification gates.                  |  RTSP 1080p @ 30 FPS • 14ms         | |
|  [Start free]  [See how it works]               |                                     | |
|                                                 +-------------------------------------+ |
|                                                                                         |
|  [02 The Problem]                               +-------------------------------------+ |
|  Physical plastic cards fail quietly.           | [STAGE: THE CRACKED BADGE]          | |
|  - Lost / loaned cards (buddy punching)         |  RFID card outline fractures        | |
|  - Cloud biometric vendor liabilities           |  Pains fade in sequentially         | |
|  - Manual payroll timesheet corrections         +-------------------------------------+ |
|                                                                                         |
|  [03 Seen]                                      +-------------------------------------+ |
|  Seen in milliseconds. Measured, not memorized. | [STAGE: 68-PT LANDMARK MESH]        | |
|  MediaPipe single-frame localization at 14ms.   |  Corner reticle brackets draw in    | |
|  Invariant to glasses and night shadows.        |  68 points animate across facial arc| |
|                                                 +-------------------------------------+ |
|                                                                                         |
|  [04 Understood]                                +-------------------------------------+ |
|  Understood as numbers. Photo destroyed.        | [STAGE: 512-D VECTOR BARS]          | |
|  Optical pixels volatilized from RAM.           |  Mesh collapses into 512 float bars | |
|  512-d unit vector normalized on hypersphere.   |  Raw face photo dissolves to 0%     | |
|                                                 +-------------------------------------+ |
|                                                                                         |
|  [05 Decided]                                   +-------------------------------------+ |
|  Verified before their hand reaches handle.     | [STAGE: SUB-300MS GATE RELAY]       | |
|  Interactive toggle: Normal / Attack / Glasses. |  Pipeline timing counts to 268ms    | |
|  Phone attack shows danger red rejection.       |  24V dry contact turns green (open) | |
|                                                 +-------------------------------------+ |
|                                                                                         |
|  [06 Recorded]                                  +-------------------------------------+ |
|  Recorded to payroll without human lag.         | [STAGE: AUDIT LEDGER & EXPORT]      | |
|  Shift grace evaluated on-premise.              |  Row drops into live table          | |
|  1-click CSV, Excel, PDF generation.            |  Export badges: CSV | XLSX | PDF    | |
|                                                 +-------------------------------------+ |
|                                                                                         |
|  ------------------------- FULL WIDTH SOVEREIGNTY BOUNDARY ---------------------------  |
|                                                                                         |
|  [07 The Boundary]                                                                      |
|  [Hardware Firewall Box] (RTSP Camera -> Server Node -> Local DB)                       |
|  [Cloud Outside] (Crossed-out arrow: DROP ALL 0.0.0.0/0 Egress)                         |
|  Two Columns: What we store (vectors, IDs) vs What we never store (photos, cloud sync)  |
|                                                                                         |
|  ------------------------- SCALE, PRICING, FAQ & CALL TO ACTION ----------------------- |
|                                                                                         |
|  [08 Scale & Start]                                                                     |
|  3-Column Minimal Pricing (Starter $0, Business $399/mo / $319 yr, Custom Enterprise)   |
|  8-Question FAQ Accordion                                                               |
|  Final CTA: "Start verifying faces in about 10 minutes." [Create free account]          |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| Footer: Status (On-premise engine v2026.2) | Product | Docs | Support | Legal           |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Sub-Pages Architecture (Docs, Help Center, Legal, 404)

### A. Documentation (`/docs`)
- **Left Sidebar**: Grouped, collapsible, active page marked (`Getting Started`, `Cameras`, `Enrollment`, `Rostering`, `Hardware & Relays`, `Security & Sovereignty`, `API Reference`, `FAQ`).
- **Center Article (740px)**: Real markdown parsing with zero unparsed artifacts (`**`, `&NDASH;`), code blocks with language badge and copy action, callout components (`Note`, `Important`, `Warning`), worked grace period calculation tables, and "Was this helpful?" feedback widget.
- **Right Rail**: "On this page" TOC with active heading indicator and GitHub/issue links.
- **Search**: `Cmd+K` / `Ctrl+K` global keyboard command palette.

### B. Help Center & Support (`/support`)
- **Command Search**: Filterable by topics (*RTSP stream drops*, *Turnstile relay wiring*, *3-shot enrollment*, *CSV payroll*).
- **4 System Pillars**: Camera & Hardware, Enrollment & Image Quality, Turnstiles & Relays, Local Data & Compliance.
- **Popular Technical Runbooks**: 6 engineering-grade articles with reading time and verification flags.
- **Enterprise Engineering Ticket Form**: Validated corporate domain email, deployment ID, camera model, priority classification, description, and zero-telemetry guarantee.

### C. Legal & Privacy Specification (`/privacy-policy`, `/terms`, `/legal/biometric-policy`)
- **Metadata Card**: Effective date (*October 24, 2026*), version (*LTS v2026.2*), and instant Print (`window.print()`) button.
- **Executive Plain-Language Summary Box**: Clear green-tinted statement that raw photos are never stored and zero data egresses the local premise.
- **Statutory Frameworks**: DPDP Act 2023, EU GDPR Art. 9 & 28, Illinois BIPA 740 ILCS 14/, and California CCPA/CPRA.
- **Clean Retention Matrix**: Storage duration and memory volatilization specifications.
- **Explicit Markers**: Clear `[TODO(owner)]` markers for customer-specific organizational details.
- **Print Optimization**: High-contrast, clean page layout under `@media print`.

### D. 404 Not Found (`/404` and wildcard `*`)
- **Infrastructure Theme**: `ERROR_CODE: 404 // NON_ROUTABLE_COORDINATE`.
- **Monumental 404 Display**: Delicate technical bounding box with coordinate crosshairs and `TCP_EGRESS_BLOCKED`.
- **Search & Recovery**: Global search bar and 3 recovery cards (`Product Story`, `Documentation Hub`, `Support Center`).

