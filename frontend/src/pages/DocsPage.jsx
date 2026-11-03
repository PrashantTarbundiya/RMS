import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Server,
  Camera,
  Users,
  Building,
  MonitorCheck,
  ShieldCheck,
  Code,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  Clock,
  Layers,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import MarkdownRenderer from '../components/ui/marketing/MarkdownRenderer';
import FeedbackWidget from '../components/ui/marketing/FeedbackWidget';
import TableOfContents from '../components/ui/marketing/TableOfContents';

const DOCS_TREE = [
  {
    groupId: 'getting-started',
    groupTitle: 'Getting Started',
    icon: Server,
    pages: [
      {
        id: 'overview',
        title: 'Overview & Architecture',
        readTime: '3 min read',
        summary: 'Understand the AuraPass on-premise facial recognition architecture and data flow.',
        toc: [
          { id: 'system-overview', title: 'System Overview' },
          { id: 'core-architectural-tenets', title: 'Core Architectural Tenets' },
          { id: 'data-flow-summary', title: 'Data Flow Summary' }
        ],
        content: `
## System Overview

AuraPass Enterprise is an on-premise facial recognition attendance and physical access verification system. Unlike cloud-dependent biometric platforms that stream sensitive facial imagery over the public internet, AuraPass processes video capture, face detection, presentation attack detection, and vector similarity matching **100% locally** within your workplace network.

## Core Architectural Tenets

1. **Local Video Capture:** RTSP / ONVIF streams from enterprise IP cameras or UVC webcams are decoded directly in host memory.
2. **Sub-300 ms Inference:** Standard modern multi-core x86/ARM processors execute facial landmark alignment and feature extraction in under 300 ms.
3. **Irreversible Numeric Embeddings:** Raw facial images can be immediately discarded after enrollment. AuraPass stores only 512-dimensional floating-point vectors from which original photographs cannot be reconstructed.
4. **Hardware Relay Control:** Digital GPIO signals and relay pulses trigger turnstiles and magnetic door locks synchronously upon successful match confirmation.

## Data Flow Summary

\`\`\`text
[ IP Security Camera / USB Webcam ]
                │
         (RTSP / UVC Frame)
                ▼
[ MediaPipe BlazeFace Detector ] ───> 68 Facial Landmarks
                │
                ▼
[ Liveness & Anti-Spoofing (PAD) ] ───> Rejects Printed Photos / Screen Replay
                │
                ▼
[ FaceNet512 Vector Extractor ] ───> Irreversible 512-d Unit Vector
                │
                ▼
[ Local Vector Distance Lookup ] ───> Cosine Similarity vs. Local SQLite / PostgreSQL
                │
        (Match Verified)
                ▼
[ Attendance Event Recorded ] ───> Optional Turnstile Relay Triggered
\`\`\`
`
      },
      {
        id: 'requirements',
        title: 'Hardware & OS Requirements',
        readTime: '4 min read',
        summary: 'Recommended server, camera, and network specifications for deployment.',
        toc: [
          { id: 'system-specifications', title: 'System Specifications' },
          { id: 'supported-operating-systems', title: 'Supported Operating Systems' }
        ],
        content: `
## System Specifications

AuraPass is optimized for CPU execution using SIMD vector instructions (AVX2 / NEON). A dedicated GPU is optional for single-camera deployments, but recommended for large facilities running more than 5 high-framerate camera lanes simultaneously.

| Scale | Host Processor | System Memory | Storage | Recommended Workload |
| :--- | :--- | :--- | :--- | :--- |
| **Small Office (1-2 Gates)** | 4 Cores (Intel i5 / Ryzen 5) | 8 GB DDR4 | 20 GB SSD | Up to 500 staff, 1-2 RTSP streams |
| **Factory / Campus (3-5 Gates)** | 8 Cores (Intel i7 / Ryzen 7) | 16 GB DDR4 | 50 GB NVMe | Up to 2,500 staff, 3-5 RTSP streams |
| **Industrial Complex (10+ Gates)** | 16 Cores + NVIDIA RTX GPU | 32 GB DDR4 | 100 GB NVMe | 10,000+ staff, unlimited camera streams |

## Supported Operating Systems

- **Windows:** Windows 10 (64-bit), Windows 11, Windows Server 2019 / 2022.
- **Linux:** Ubuntu 22.04 LTS, Debian 12, RHEL 8 / 9.
- **Docker:** Official multi-architecture container stack available via Docker Compose.
`
      },
      {
        id: 'quickstart',
        title: '5-Minute Quickstart',
        readTime: '3 min read',
        summary: 'Step-by-step instructions to initialize your local AuraPass instance.',
        toc: [
          { id: 'docker-deployment', title: 'Docker Deployment' },
          { id: 'first-time-organization-setup', title: 'First-Time Setup' }
        ],
        content: `
## Docker Deployment

The fastest way to deploy AuraPass on your local server is using Docker Compose:

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/PrashantTarbundiya/RMS.git aurapass
cd aurapass

# 2. Launch the container cluster
docker-compose up -d
\`\`\`

The web console will bind to port \`5173\` (Frontend UI) and port \`5000\` (Flask Backend API).

## First-Time Setup

1. Open your browser and navigate to \`http://localhost:5173/register\`.
2. Create your primary organization administrator account.
3. In the console, navigate to the **Cameras** page and configure your local RTSP camera stream or USB webcam.
4. Add 3 enrollment photos per employee under the **Upload** page.
`
      },
      {
        id: 'core-concepts',
        title: 'Core Concepts & Terminology',
        readTime: '4 min read',
        summary: 'Key terminology: vectors, cosine distance, liveness detection, and grace policies.',
        toc: [
          { id: 'vectors-and-embeddings', title: 'Vectors & Embeddings' },
          { id: 'similarity-threshold', title: 'Similarity Threshold' },
          { id: 'grace-periods', title: 'Grace Periods' }
        ],
        content: `
## Vectors & Embeddings

A facial embedding is a list of 512 numbers that mathematically describe the geometric contours, spacing, and topology of a human face. Embeddings are normalized to unit length so that comparing two faces is as simple as calculating their cosine similarity.

## Similarity Threshold

The calibrated cosine distance threshold in AuraPass is \`0.40\`. If the calculated distance between a detected face and an enrolled employee template is less than or equal to \`0.40\`, a match is declared. Distance scores above \`0.40\` are treated as unrecognized visitors.

## Grace Periods

Grace periods represent the allowable arrival buffer in minutes after the scheduled shift start time. For example, if shift start is 09:00 AM and grace is 15 minutes, arrivals up to 09:15 AM are marked **ON TIME**. Arrivals at 09:16 AM are flagged as **LATE**.
`
      }
    ]
  },
  {
    groupId: 'cameras',
    groupTitle: 'Camera & Hardware',
    icon: Camera,
    pages: [
      {
        id: 'rtsp-streams',
        title: 'Supported Cameras & RTSP Streams',
        readTime: '4 min read',
        summary: 'RTSP URL formats and configuration for Hikvision, Dahua, Axis, and Hanwha.',
        toc: [
          { id: 'stream-parameters', title: 'Stream Parameters' },
          { id: 'manufacturer-url-patterns', title: 'Manufacturer URL Patterns' }
        ],
        content: `
## Stream Parameters

For optimal recognition speed and low CPU utilization, configure your IP cameras with these settings:
- **Resolution:** 1080p (1920x1080) or 720p (1280x720) substream.
- **Framerate:** 15 to 30 frames per second (FPS).
- **Video Codec:** H.264 Baseline / Main Profile.
- **Bitrate:** 2,048 kbps to 4,096 kbps constant bitrate (CBR).

## Manufacturer URL Patterns

\`\`\`text
# Hikvision Cameras
rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101

# Dahua Technology
rtsp://admin:password@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0

# Axis Communications
rtsp://root:password@192.168.1.102/axis-media/media.amp

# Hanwha Techwin (Wisenet)
rtsp://admin:password@192.168.1.103/profile2/media.smp
\`\`\`
`
      },
      {
        id: 'usb-webcams',
        title: 'USB Webcams & Desktop Stations',
        readTime: '3 min read',
        summary: 'Configuring standard USB webcams for reception terminals and check-in kiosks.',
        toc: [
          { id: 'supported-usb-devices', title: 'Supported Devices' },
          { id: 'device-index-setup', title: 'Device Index Setup' }
        ],
        content: `
## Supported Devices

AuraPass supports any standard USB Video Class (UVC) capture device:
- Logitech C920, C922, BRIO 4K, C270
- AnkerWork PowerConf C200 / C300
- Built-in laptop integrated cameras (Index 0)

## Device Index Setup

In the AuraPass **Cameras** page:
1. Select **Device Index** mode.
2. Enter \`0\` for the primary built-in webcam, or \`1\` for an external USB webcam.
3. Click **Test Stream** to confirm live feed before saving.
`
      }
    ]
  },
  {
    groupId: 'enrollment',
    groupTitle: 'Biometric Enrollment',
    icon: Users,
    pages: [
      {
        id: '3-shot-protocol',
        title: '3-Shot Enrollment Protocol',
        readTime: '3 min read',
        summary: 'Standard multi-angle sequence for high recognition accuracy.',
        toc: [
          { id: 'the-three-shot-sequence', title: 'The 3-Shot Sequence' },
          { id: 'lighting-and-framing', title: 'Lighting & Framing' }
        ],
        content: `
## The 3-Shot Sequence

AuraPass achieves high recognition accuracy by capturing three facial perspectives during initial employee enrollment:

1. **Shot 01: Frontal Neutral (0°)** &ndash; Face directly aligned with the lens, natural expression.
2. **Shot 02: Slight Left (15°)** &ndash; Captures cheek contour and facial depth.
3. **Shot 03: Slight Right (15°)** &ndash; Completes the canonical 3D feature representation.

## Lighting & Framing

- **Minimum Resolution:** Face bounding box must be at least 160x160 pixels.
- **Illumination:** Diffuse indoor lighting between 300 and 500 lux. Avoid placing cameras facing direct outdoor sunlight or reflective glass.
- **Eyewear:** Prescription glasses are supported. Ensure dark sunglasses are removed during enrollment.
`
      }
    ]
  },
  {
    groupId: 'departments',
    groupTitle: 'Departments & Rostering',
    icon: Building,
    pages: [
      {
        id: 'shifts-and-grace',
        title: 'Shift Schedules & Grace Policies',
        readTime: '4 min read',
        summary: 'Worked example: shift schedules, arrival buffers, and overtime flags.',
        toc: [
          { id: 'grace-policy-worked-example', title: 'Worked Example' },
          { id: 'payroll-reports-and-exports', title: 'Payroll Reports & Exports' }
        ],
        content: `
## Worked Example

Department rostering allows configuring specific working hours per team:

- **Department:** Engineering
- **Shift Hours:** 09:00 AM &ndash; 06:00 PM
- **Grace Period:** 15 minutes

#### Evaluation Logic:
- **Employee A** checks in at **09:12 AM**: Marked **ON TIME** (arrival is within the 15-minute grace window).
- **Employee B** checks in at **09:18 AM**: Flagged as **LATE** (arrival exceeded the 15-minute grace threshold).
- **Employee C** checks out at **04:45 PM**: Flagged as **EARLY EXIT** (departure preceded scheduled shift end).

## Payroll Reports & Exports

From the **Attendance** view, administrators can export complete historical attendance logs in CSV, Microsoft Excel (.xlsx), or printable PDF formats with one click.
`
      }
    ]
  },
  {
    groupId: 'kiosk',
    groupTitle: 'Kiosk & Physical Gates',
    icon: MonitorCheck,
    pages: [
      {
        id: 'kiosk-deployment',
        title: 'Kiosk Terminal Deployment',
        readTime: '3 min read',
        summary: 'Fullscreen kiosk setup on wall-mounted tablets and turnstiles.',
        toc: [
          { id: 'fullscreen-terminal-mode', title: 'Fullscreen Terminal Mode' },
          { id: 'relay-and-turnstile-wiring', title: 'Relay & Turnstile Wiring' }
        ],
        content: `
## Fullscreen Terminal Mode

The AuraPass Kiosk view (\`/kiosk\`) provides a distraction-free, high-contrast interface designed for reception tablets, turnstiles, and entry gates:
- Displays live camera reticle with high-visibility approval rings.
- Emits audible audio approval chimes.
- Requires administrator PIN credentials to exit fullscreen mode.

## Relay & Turnstile Wiring

AuraPass backend services can issue digital GPIO pulses (via Raspberry Pi GPIO, USB relay modules, or networked IP relays) to unlock turnstiles and magnetic door locks synchronously upon successful face verification.
`
      }
    ]
  },
  {
    groupId: 'security',
    groupTitle: 'Security & Sovereignty',
    icon: ShieldCheck,
    pages: [
      {
        id: 'biometric-sovereignty',
        title: 'Biometric Sovereignty & Compliance',
        readTime: '4 min read',
        summary: 'Technical guarantees of on-premise air-gap execution and GDPR/BIPA alignment.',
        toc: [
          { id: 'one-way-numeric-vectors', title: 'One-Way Numeric Vectors' },
          { id: 'compliance-posture', title: 'Compliance Posture' }
        ],
        content: `
## One-Way Numeric Vectors

AuraPass transforms facial landmark geometry into irreversible 512-dimensional numeric unit vectors. Embeddings are designed as one-way mathematical abstractions; AuraPass does not require storing raw face images after enrollment processing, and zero biometric data leaves your local network.

## Compliance Posture

AuraPass is architected to support enterprise compliance with:
- **GDPR Article 9 (EU):** Special-category biometric processing executed solely on local data controller infrastructure.
- **Illinois BIPA (USA):** Provides tools for written consent recording and permanent 1-click vector purging upon employee departure.
- **California CCPA / CPRA:** Ensures workers can inspect and request deletion of stored attendance logs.

> *Note: Compliance depends on how your organization deploys, manages, and operates the system. Consult your legal counsel to confirm regional workplace consent requirements.*
`
      }
    ]
  },
  {
    groupId: 'api',
    groupTitle: 'REST API Reference',
    icon: Code,
    pages: [
      {
        id: 'api-overview',
        title: 'REST API Overview & Authentication',
        readTime: '4 min read',
        summary: 'Programmatic interfaces for payroll automation, query logs, and health checks.',
        toc: [
          { id: 'authentication', title: 'Authentication' },
          { id: 'query-attendance-logs', title: 'Query Attendance Logs' },
          { id: 'system-health-endpoint', title: 'System Health Endpoint' }
        ],
        content: `
## Authentication

All REST API requests require a valid Bearer JWT token obtained via the authentication endpoint:

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@organization.com", "password": "YourPassword"}'
\`\`\`

## Query Attendance Logs

\`\`\`bash
curl -X GET "http://localhost:5000/api/attendance?date=2026-11-03&limit=50" \\
  -H "Authorization: Bearer <TOKEN>"
\`\`\`

## System Health Endpoint

\`\`\`bash
curl -X GET http://localhost:5000/api/health
\`\`\`

#### Response:
\`\`\`json
{
  "status": "ok",
  "app_version": "2026.2",
  "database": "sqlite_local",
  "active_streams": 2,
  "inference_latency_ms": 242
}
\`\`\`
`
      }
    ]
  }
];

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page') || 'overview';

  const [activePageId, setActivePageId] = useState(pageParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeTocId, setActiveTocId] = useState('');
  const searchInputRef = useRef(null);

  // Keyboard shortcut Ctrl/Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync state with URL search param
  useEffect(() => {
    if (pageParam && pageParam !== activePageId) {
      setActivePageId(pageParam);
    }
  }, [pageParam]);

  const selectPage = (id) => {
    setActivePageId(id);
    setSearchParams({ page: id });
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find currently active page & its group
  const { currentPage, currentGroup, prevPage, nextPage } = useMemo(() => {
    let foundPage = null;
    let foundGroup = null;
    let allPages = [];

    for (const grp of DOCS_TREE) {
      for (const p of grp.pages) {
        allPages.push({ ...p, groupTitle: grp.groupTitle });
        if (p.id === activePageId) {
          foundPage = p;
          foundGroup = grp;
        }
      }
    }

    if (!foundPage) {
      foundPage = DOCS_TREE[0].pages[0];
      foundGroup = DOCS_TREE[0];
    }

    const currentIndex = allPages.findIndex((p) => p.id === foundPage.id);
    const prev = currentIndex > 0 ? allPages[currentIndex - 1] : null;
    const next = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

    return {
      currentPage: foundPage,
      currentGroup: foundGroup,
      prevPage: prev,
      nextPage: next
    };
  }, [activePageId]);

  // Filtered docs tree for search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_TREE;
    const q = searchQuery.toLowerCase();

    return DOCS_TREE.map((grp) => {
      const matchingPages = grp.pages.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
      return {
        ...grp,
        pages: matchingPages
      };
    }).filter((grp) => grp.pages.length > 0);
  }, [searchQuery]);

  const handleTocClick = (id) => {
    setActiveTocId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen public-surface bg-[#070A12] flex flex-col font-sans relative">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          DOCS HEADER
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070A12]/90 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                AuraPass <span className="text-emerald-400 font-normal">Docs</span>
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono-tag bg-white/[0.06] text-slate-400 border border-white/[0.08]">
              v2026.2
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation (RTSP, API, vectors, shifts)..."
              className="w-full pl-10 pr-20 py-2 rounded-xl bg-[#0D1220] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-normal"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono-tag text-slate-400">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono-tag text-slate-400">K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline"
            >
              Help Center
            </Link>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              Open Console
            </Link>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0E1422] border border-white/[0.08] text-slate-300 hover:text-white"
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>


      {/* ─────────────────────────────────────────────────────────────────────────────
          3-COLUMN DOCUMENTATION LAYOUT
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar (280px) */}
        <aside className="w-full lg:w-[280px] shrink-0 hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 public-scroll space-y-6">
            {filteredTree.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.groupId} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase font-mono-tag tracking-wider">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{group.groupTitle}</span>
                  </div>

                  <div className="space-y-0.5">
                    {group.pages.map((p) => {
                      const isSelected = activePageId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPage(p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400 font-semibold'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          {isSelected && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileDrawerOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-[#0D1220] border border-white/[0.08] space-y-4 mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-xs font-bold text-white uppercase font-mono-tag">Documentation Menu</span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {filteredTree.map((group) => (
              <div key={group.groupId} className="space-y-1">
                <p className="text-xs font-bold text-emerald-400 font-mono-tag">{group.groupTitle}</p>
                <div className="space-y-1 pl-2">
                  {group.pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPage(p.id)}
                      className={`w-full text-left py-1 text-xs block ${
                        activePageId === p.id ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      &bull; {p.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Center Content Column (max 760px) */}
        <main className="flex-1 min-w-0 max-w-[760px] space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-mono-tag">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Docs</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span>{currentGroup.groupTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-emerald-300 font-semibold">{currentPage.title}</span>
          </nav>

          {/* Article Header Card */}
          <div className="pb-6 border-b border-white/[0.08] space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {currentPage.title}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              {currentPage.summary}
            </p>
            <div className="flex items-center gap-3 pt-2 text-[11px] font-mono-tag text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {currentPage.readTime}
              </span>
              <span>&bull;</span>
              <span>Updated November 2026 &bull; v2026.2</span>
            </div>
          </div>

          {/* Markdown Body */}
          <div className="py-2">
            <MarkdownRenderer content={currentPage.content} />
          </div>

          {/* Pagination: Prev / Next Cards */}
          <div className="pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPage ? (
              <button
                type="button"
                onClick={() => selectPage(prevPage.id)}
                className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0F19] hover:bg-[#141B2E] transition-all text-left flex items-center gap-3 group cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-mono-tag text-slate-500">Previous</p>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">{prevPage.title}</p>
                </div>
              </button>
            ) : <div />}

            {nextPage ? (
              <button
                type="button"
                onClick={() => selectPage(nextPage.id)}
                className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0F19] hover:bg-[#141B2E] transition-all text-right flex items-center justify-end gap-3 group cursor-pointer ml-auto w-full"
              >
                <div>
                  <p className="text-[10px] uppercase font-mono-tag text-slate-500">Next</p>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">{nextPage.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
              </button>
            ) : <div />}
          </div>

          {/* Feedback Widget */}
          <div className="pt-4">
            <FeedbackWidget pageId={currentPage.id} />
          </div>
        </main>

        {/* Right Rail (220px) — On this page TOC */}
        <aside className="w-[220px] shrink-0 hidden xl:block">
          <div className="sticky top-24 space-y-6">
            <TableOfContents
              items={currentPage.toc || []}
              activeId={activeTocId}
              onItemClick={handleTocClick}
            />

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/[0.08] space-y-2 text-xs">
              <p className="font-bold text-white text-[11px] uppercase font-mono-tag">Need Assistance?</p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Connect directly with our engineering support team for camera integration guides.
              </p>
              <Link
                to="/support"
                className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 text-[11px] pt-1"
              >
                <span>Help Center</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070D] py-8 px-4 text-center text-xs text-slate-500 font-mono-tag">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Local Documentation Engine v2026.2.</p>
      </footer>
    </div>
  );
}
