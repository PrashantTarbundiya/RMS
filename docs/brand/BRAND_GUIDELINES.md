# AuraPass™ Enterprise — Brand Identity & Design System Guidelines

> **Authority**: Executive Brand Architecture & Design Engineering  
> **Version**: 2026.2 (Enterprise Identity Release)  
> **Classification**: Master Corporate Identity Specification  
> **Target Audience**: Product Designers, Brand Engineers, Marketing Strategists & Hardware Integrators  

---

## 1. Executive Brand Overview & Positioning

AuraPass™ is an enterprise-grade on-premise physical identity and biometric access control platform. It converts standard CCTV/RTSP security cameras, USB webcams, and tablet devices into intelligent, sub-300ms touchless access gates and automated workforce attendance infrastructure.

### The Core Differentiation
Unlike consumer-grade attendance apps or third-party cloud face-scanning APIs, AuraPass is built on strict **Local Data Sovereignty**:
1. **Zero Cloud Egress**: Biometric embeddings and face vectors never leave the customer's on-premise network.
2. **Sub-300ms Latency**: Real-time facial recognition matching against local vector enclaves.
3. **Hardware Infrastructure Compatibility**: Connects to existing IP surveillance cameras and controls flap turnstiles, optical speed gates, and magnetic doors via standard dry-contact relays.
4. **Presentation Attack Detection (PAD)**: Multi-cue liveness detection adhering to ISO/IEC 30107-3 standards.

### Target B2B Sectors
- **Manufacturing & Industrial Plants**: High-throughput shift changes (500+ workers in 15-minute windows) eliminating buddy punching.
- **Educational Campuses & Universities**: Multi-gate automated student and faculty attendance.
- **Corporate Headquarters & IT Parks**: Frictionless touchless access control for secure turnstiles.
- **Hospitals & Cleanrooms**: Strict touchless hygiene environments where fingerprint scanners are prohibited.

---

## 2. Name Semantics & Brand Meaning

The name **AuraPass** is formed from two foundational pillars:

```
          ┌────────────────────────────────────────────────────────┐
          │                   A U R A P A S S                      │
          └────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
       ┌────────────────────────┐           ┌────────────────────────┐
       │         A U R A        │           │         P A S S        │
       │  Ambient Human Presence│           │  Physical Gateway      │
       │  Biometric Field       │           │  Speed-Gate Transit    │
       │  Sub-second Recognition│           │  Dry-Contact Clearance │
       └────────────────────────┘           └────────────────────────┘
```

- **AURA**: The radiant biometric presence of the human individual. Optical computer vision reads facial topology and depth without requiring the user to stop, tap a card, or touch a surface.
- **PASS**: The clearance through a physical security checkpoint. Authorized movement through speed gates, flap turnstiles, and electronic doors.

---

## 3. Creative Direction & Strategic Selection

During the brand strategy phase, three distinct creative avenues were evaluated:

### Direction 1: The Sovereign Gateway & Biometric Aperture (Selected)
- **Concept**: An architectural transit portal combined with a precision optical sensor core.
- **Symbol Construction**: Two upward-converging sovereign wings meeting at an apex to form an authoritative geometric **"A"**. Within the portal sits a concentric biometric scanning arc and an optical verification node.
- **Negative Space**: A forward-pointing clearance chevron (the "Pass") formed between the pillars.
- **Strategic Justification**: Represents both physical security infrastructure and advanced optical AI with maximum enterprise credibility. Scales flawlessly from a 16px browser favicon to physical building turnstile signage.

### Direction 2: The Quantum Biometric Prism (Evaluated)
- **Concept**: Vector space mathematics, 512-dimensional embedding hyperspheres, and facial point clouds.
- **Weakness**: Visual complexity degraded significantly at 16px–24px, and solid monochrome silhouettes lost clarity.

### Direction 3: The Continuous Transit Loop (Evaluated)
- **Concept**: Frictionless walking transit depicted via an unbroken mobius loop.
- **Weakness**: Read primarily like a consumer fintech payment app (resembling Mastercard or Visa) rather than high-security institutional access control.

---

## 4. Logo Anatomy & Geometric Construction

The AuraPass mark is constructed on an exact 48×48 geometric grid with mathematically balanced vectors.

```
       Grid: 48x48 Coordinates
       
       (24, 3) ─────────────── Apex Anchor (Top of Gateway)
         /\
        /  \
       / /\ \  ─────────────── Dynamic Forward Chevron (14,26 -> 24,16 -> 34,26)
      / /  \ \
 (6,11) │    │ (42,11) ─────── Sovereign Parallel Entrance Pillars
      │  (◎) │ ─────────────── Biometric Optical Focal Core (cx:24, cy:24, r:4)
      │  \__/ │ ─────────────── Parabolic Scanning Arc (17,31 -> 24,34.5 -> 31,31)
       \    /
        \  /
         \/
       (24, 47) ────────────── Base Sovereign Keel
```

### Key Proportions
- **Outer Arch Stroke**: `3.2px` (optically balanced for high-DPI displays and vector etching).
- **Chevron Stroke**: `2.8px` (representing high-velocity forward clearance).
- **Scanning Arc Stroke**: `2.2px` (representing precision laser liveness check).
- **Core Node**: Dual concentric radius (`r=4px` white radiant reflection, `r=2px` emerald active pupil).

---

## 5. The Master Logo Family

All logo assets are centralized in `frontend/public/brand/`:

| Asset File | Use Case | ViewBox / Size | Description |
| :--- | :--- | :--- | :--- |
| `aurapass-symbol.svg` | Standalone icon, mobile drawer, app tiles | `0 0 48 48` | Pure standalone sovereign gateway aperture mark. |
| `aurapass-primary.svg` | Marketing hero, corporate decks, documentation | `0 0 310 48` | Symbol + engineered Wordmark + "ENTERPRISE" badge. |
| `aurapass-horizontal.svg` | Website navbar, app top chrome, toolbars | `0 0 200 40` | Streamlined horizontal lockup with TM mark. |
| `aurapass-stacked.svg` | Social profile avatars, splash cards, square tiles | `0 0 160 160` | Vertical center-aligned lockup for square layouts. |
| `aurapass-monochrome.svg` | Single-color applications, brand merchandise | `0 0 200 40` | Solid Emerald-500 (`#10B981`) flat execution. |
| `aurapass-white.svg` | Dark surfaces, CCTV video overlays, kiosk screens | `0 0 200 40` | 100% Solid White (`#FFFFFF`) silhouette. |
| `aurapass-black.svg` | White paper, invoices, physical purchase orders | `0 0 200 40` | 100% Solid Obsidian Black (`#09090B`). |
| `favicon.svg` | Modern desktop & mobile browser tabs | `0 0 32 32` | High-contrast vector icon with enlarged optical features. |
| `favicon.ico` | Legacy desktop browsers & Windows taskbars | Multi (16/32/48) | Embedded multi-resolution icon binary. |
| `icon-192.png` | Android homescreen, Chrome PWA install | `192 × 192 px` | Crisp raster icon with dark obsidian background. |
| `icon-512.png` | Splash screens, Windows Start Menu tile | `512 × 512 px` | High-definition raster application icon. |
| `apple-touch-icon.png`| iOS Web Clip, iPad home screen | `180 × 180 px` | Apple HIG compliant touch icon. |

---

## 6. Color Architecture & Design Tokens

AuraPass employs an authoritative, high-contrast palette based on deep carbon obsidian tones paired with precision laser emerald and electric cyan accents.

### Primary Brand Palette
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Obsidian Carbon │  │  Laser Emerald  │  │  Electric Cyan  │
│     #09090B     │  │     #10B981     │  │     #00E5FF     │
│   Primary Base  │  │  Primary Accent │  │ Optical Reticle │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Complete Color Specification

| Token Name | Hex Code | RGB | Role / Semantic Application |
| :--- | :--- | :--- | :--- |
| **Obsidian Base (`--bg-0`)** | `#09090B` | `9, 9, 11` | Primary dark page background & kiosk screen fill. |
| **Surface Elevated (`--bg-2`)** | `#18181B` | `24, 24, 27` | Card surfaces, modal dialogs, and navigation drawers. |
| **Laser Emerald (`--brand-primary`)** | `#10B981` | `16, 185, 129` | Verified attendance match, active liveness pass, primary CTA. |
| **Radiant Mint (`--brand-accent`)** | `#34D399` | `52, 211, 153` | Hover states, scanning ripples, highlight badges. |
| **Electric Cyan (`--brand-laser`)** | `#00E5FF` | `0, 229, 255` | Chevron velocity vector, optical reticle ticks, sub-second speed. |
| **Pure White (`--text-1`)** | `#FAFAFA` | `250, 250, 250` | Primary display headlines & wordmark typography. |
| **Slate Gray (`--text-3`)** | `#A1A1AA` | `161, 161, 170` | Secondary metadata, hardware specifications, camera RTSP URLs. |
| **Alert Amber (`--status-warning`)** | `#F59E0B` | `245, 158, 11` | Shift grace period active, camera network re-connecting. |
| **Security Red (`--status-danger`)** | `#EF4444` | `239, 68, 68` | Spoof attempt detected, intruder access denied, camera offline. |

---

## 7. Typography System

### Brand Wordmark Construction
- **Primary Typeface**: `Plus Jakarta Sans`
- **Weight**: Extrabold (`800`)
- **Letter Spacing**: `-0.03em` (tight, authoritative corporate lockup)
- **Optical Kerning**: Balanced letterform pairings (`Au-ra-Pass`) with unified baseline alignment.
- **Trademark Marker**: `TM` superscript set at $35\%$ cap-height in Emerald-500 (`#10B981`).

### Supporting Typographic Hierarchy
- **Technical & Hardware Readouts**: `JetBrains Mono` (`tabular-nums`) for IP addresses, millisecond latencies, and neural confidence scores.
- **User Interface & Tables**: `Plus Jakarta Sans`, weights `400`, `500`, `600`, `700`.

---

## 8. Clear-Space & Minimum Size Rules

### Clear-Space
The minimum clear space surrounding the AuraPass logo equals **$0.5 \times X$**, where $X$ is the height of the symbol. No text, graphic elements, or container borders may encroach into this perimeter.

```
       ┌───────────────────────────────┐
       │   0.5X                        │
       │  ┌───┐                        │
       │  │ X │  AuraPass™             │
       │  └───┘                        │
       │   0.5X                        │
       └───────────────────────────────┘
```

### Minimum Reproduction Sizes
- **Digital Display (Symbol)**: Minimum `16 × 16 px` (enforced in favicon).
- **Digital Display (Horizontal Lockup)**: Minimum `120 × 24 px` (prevents wordmark degradation).
- **Physical Print (Symbol)**: Minimum `5 mm × 5 mm` (laser engraving on turnstile turnposts, RFID badge printing).
- **Physical Print (Full Lockup)**: Minimum `25 mm × 6 mm`.

---

## 9. Incorrect Usage Guidelines

To maintain brand integrity, never commit the following errors:

1. **Do Not Enclose in Boxes**: Never place the standalone logo inside arbitrary rounded rectangles, square cards, or artificial bounding borders.
2. **Do Not Distort Proportions**: Never stretch, squeeze, or skew the symbol or wordmark.
3. **Do Not Alter Palette**: Do not apply unapproved colors (e.g. purple, pink, or yellow) to the symbol vectors.
4. **Do Not Add Drop Shadows to Print**: Use the flat monochrome versions (`aurapass-black.svg` or `aurapass-white.svg`) for print or engraving.
5. **Do Not Replace with Stock Icons**: Never replace the sovereign gateway aperture with generic magnifying glasses, shopping carts, or generic smileys.

---

## 10. Brand Component Usage in React

To ensure 100% brand consistency and eliminate ad-hoc CSS recreations, import the official React component:

```jsx
import AuraPassBrand from '@/components/ui/AuraPassBrand';

// 1. Horizontal Navbar Lockup
<AuraPassBrand variant="horizontal" size="md" showBadge={true} badgeText="ENTERPRISE" />

// 2. Mobile / Compact Sidebar Symbol
<AuraPassBrand variant="symbol" size="sm" />

// 3. Marketing Hero / Stacked Lockup
<AuraPassBrand variant="stacked" size="xl" showBadge={true} />

// 4. Monochrome Mode for Invoices or Camera Overlays
<AuraPassBrand variant="horizontal" theme="white" size="lg" />
```

