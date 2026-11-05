import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Server,
  Camera,
  Users,
  Clock,
  Zap,
  Shield,
  Code,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Scan
} from 'lucide-react';
import MarkdownRenderer from '../components/ui/marketing/MarkdownRenderer';
import TableOfContents from '../components/ui/marketing/TableOfContents';
import Container from '../components/ui/marketing/Container';

// Full, authoritative documentation dataset covering all 8 required categories
const DOCS_TREE = [
  {
    groupId: 'getting-started',
    groupTitle: 'Getting Started',
    icon: Server,
    pages: [
      {
        id: 'architecture',
        title: 'Architecture & System Tenets',
        readTime: '3 min read',
        summary: 'Understand the sovereign on-premise inference loop and data flow.',
        content: `
# Architecture & System Tenets

AuraPass Enterprise is an on-premise facial verification engine built for physical turnstiles, gates, and workplace attendance. It processes camera frames, extracts spatial landmarks, and calculates vector matches entirely inside your host environment.

## The Local Verification Loop

1. **RTSP Frame Buffer Ingestion:** An H.264 or H.265 video stream is received over the local subnet from standard IP cameras (such as Hikvision, Dahua, Axis, or Hanwha) or USB webcams.
2. **Single-Frame Detection:** MediaPipe BlazeFace isolates head crops in under 15 ms, tracking 68 facial coordinates across pitch, roll, and yaw angles.
3. **512-D Tensor Embedding:** FaceNet512 generates an L2-normalized 512-dimensional numeric representation. Raw optical frames exist only in volatile RAM during inference and are deleted immediately post-vectorization.
4. **Sub-Millisecond Cosine Match:** The numeric vector is compared against local in-memory embeddings with a calibrated decision threshold of 0.42.
5. **Physical Turnstile Trigger:** An opto-isolated 24V dry-contact GPIO relay fires a 450 ms momentary pulse to unlatch the turnstile flap in under 300 ms total latency.

> [!NOTE]
> The engine requires no outbound internet connection. Biometric data and employee identifiers remain strictly inside your facility perimeter.
`
      },
      {
        id: 'requirements',
        title: 'Hardware Requirements',
        readTime: '4 min read',
        summary: 'Server, CPU, GPU, and local network specifications.',
        content: `
# Hardware Requirements

AuraPass runs on standard commodity Linux hardware or certified industrial edge micro-nodes.

## Minimum Single-Lane Node (Up to 500 personnel)

- **Processor:** Quad-core Intel Core i5 / i7 (8th Gen or later) or AMD Ryzen 5
- **System Memory:** 8 GB DDR4 RAM
- **Storage:** 64 GB SSD (for Linux OS, Docker image, and append-only SQLite WAL database)
- **Networking:** 1 Gbps Ethernet connection on the same subnet as IP cameras
- **Operating System:** Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9

## Multi-Lane Production Cluster (5+ RTSP Cameras)

- **Processor:** 8-core Intel Xeon or AMD EPYC processor
- **Memory:** 16 GB to 32 GB RAM
- **Dedicated Accelerator (Optional):** NVIDIA T4, RTX A2000, or Jetson AGX Orin for parallelized multi-stream batching
- **Database Engine:** PostgreSQL 15+ for high-concurrency ledger operations
`
      },
      {
        id: 'quickstart',
        title: '5-Minute Quickstart',
        readTime: '3 min read',
        summary: 'Deploy the official Docker image and verify your first stream.',
        content: `
# 5-Minute Quickstart

You can start the AuraPass engine container on any local Docker host.

## Step 1: Pull and Run the Docker Image

\`\`\`bash
docker run -d \\
  --name aurapass-node \\
  --restart always \\
  -p 8000:8000 \\
  -v /var/lib/aurapass/data:/app/data \\
  aurapass/engine:v2026.2
\`\`\`

## Step 2: Open Local Management Console

Access the local web interface in any modern browser:

\`\`\`text
http://localhost:8000
\`\`\`

## Step 3: Register Your First Camera Feed

Connect a test camera via RTSP:

\`\`\`bash
curl -X POST http://localhost:8000/api/cameras \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Main Entrance Gate",
    "rtsp_url": "rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101",
    "relay_gpio_pin": 18
  }'
\`\`\`
`
      },
      {
        id: 'concepts',
        title: 'Core Concepts',
        readTime: '3 min read',
        summary: 'Understand vectors, thresholds, liveness cues, and grace buffers.',
        content: `
# Core Concepts

- **512-Dimensional Vector:** An array of 512 floating-point numbers representing normalized spatial facial geometry. It is designed as a one-way numeric representation; raw images are not stored after enrollment.
- **Cosine Distance Threshold:** Measures angular distance between two vectors on a unit hypersphere. AuraPass calibrates matches at a threshold of 0.42 (smaller distance indicates higher similarity).
- **Presentation Attack Detection (PAD):** Algorithms evaluating skin micro-texture, specular reflection, and 3D contour depth to reject mobile screens and paper printouts.
- **Grace Buffer:** Configurable leeway window (in minutes) applied to shift start times before an employee arrival is recorded as late.
`
      }
    ]
  },
  {
    groupId: 'cameras',
    groupTitle: 'Cameras & Video Feeds',
    icon: Camera,
    pages: [
      {
        id: 'rtsp-onvif',
        title: 'RTSP & ONVIF Configuration',
        readTime: '4 min read',
        summary: 'Configure Hikvision, Dahua, Axis, and Hanwha cameras for low latency.',
        content: `
# RTSP & ONVIF Configuration

AuraPass ingests live video streams over RTSP (Real-Time Streaming Protocol). For optical accuracy and sub-300 ms throughput, configure your cameras according to these parameters.

## Recommended Camera Stream Parameters

- **Resolution:** 1080p (1920×1080) or 720p (1280×720)
- **Codec:** H.264 (Baseline or Main profile)
- **Framerate:** 25 to 30 FPS
- **Bitrate Type:** Constant Bitrate (CBR), 2048 to 4096 kbps
- **I-Frame Interval (GOP):** Equal to framerate (1 second) to minimize frame decoding latency

## Common Manufacturer RTSP URL Formats

### Hikvision
\`\`\`text
rtsp://[username]:[password]@[ip]:554/Streaming/Channels/101
\`\`\`

### Dahua
\`\`\`text
rtsp://[username]:[password]@[ip]:554/cam/realmonitor?channel=1&subtype=0
\`\`\`

### Axis
\`\`\`text
rtsp://[username]:[password]@[ip]:554/axis-media/media.amp?videocodec=h264
\`\`\`
`
      },
      {
        id: 'usb-webcams',
        title: 'USB Webcams & Kiosks',
        readTime: '3 min read',
        summary: 'Connect UVC webcams for reception tablets and desktop kiosks.',
        content: `
# USB Webcams & Kiosks

For front-desk reception, security guard booths, and tablet kiosks, AuraPass supports any standard USB Video Class (UVC) camera.

## Tested Hardware Models

- **Logitech C920 / C922:** Plug-and-play USB 2.0 at 1080p 30 FPS.
- **Logitech BRIO 4K:** High-dynamic-range sensor ideal for lobby entrances with strong natural backlight.
- **Insta360 Link:** 1/2-inch optical sensor with rapid auto-exposure tracking.

In Linux environments, specify device indices such as \`/dev/video0\` or \`/dev/video2\` directly in your camera settings.
`
      },
      {
        id: 'camera-troubleshooting',
        title: 'Camera Troubleshooting',
        readTime: '4 min read',
        summary: 'Diagnose packet drops, frame delays, and poor lighting angles.',
        content: `
# Camera Troubleshooting

## Issue: High Stream Latency (>500 ms)
- **Check GOP / Keyframe Interval:** Ensure the camera's I-frame interval is set to 25 or 30 (1× framerate). A GOP of 50+ forces frame buffers to wait for keyframes.
- **Switch from TCP to UDP/RTP:** On isolated local LAN subnets, UDP transport eliminates TCP retransmit queuing delays.

## Issue: Missed Detections at Distance
- **Minimum Pixel Size:** The face bounding box must be at least 160×160 pixels in the frame. If the subject is more than 3 meters away, select a camera lens with a narrower field of view (e.g. 6mm or 8mm rather than wide 2.8mm).
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
        id: 'three-shot-protocol',
        title: '3-Shot Enrollment Protocol',
        readTime: '3 min read',
        summary: 'Standard operating procedure for registering new staff profiles.',
        content: `
# 3-Shot Enrollment Protocol

AuraPass employs a 3-shot enrollment standard to capture biometric vector variance while maintaining zero raw photo persistence.

## Protocol Procedure

1. **Shot 01 — Frontal (0°):** Subject looks directly at the camera lens at neutral eye level.
2. **Shot 02 — Left Profile (15°):** Subject tilts their head slightly to their left shoulder.
3. **Shot 03 — Right Profile (15°):** Subject tilts their head slightly to their right shoulder.

The three crops generate three 512-dimensional vector embeddings, which are averaged and normalized into a single master template. The entire registration takes under two minutes.

> [!IMPORTANT]
> Raw facial crops are deleted immediately upon vector extraction. The database stores only the resulting 512 floating-point values.
`
      },
      {
        id: 'image-quality',
        title: 'Image Quality Standards',
        readTime: '3 min read',
        summary: 'Lux illumination, blur thresholds, and occlusion standards.',
        content: `
# Image Quality Standards

For high accuracy (benchmarked at 99.4% on the academic LFW dataset; real-world accuracy depends on installation lighting), adhere to these baseline parameters during enrollment:

- **Ambient Illumination:** 300 to 700 Lux across the face. Avoid placement directly opposite floor-to-ceiling glass windows without diffusers.
- **Face Resolution:** Minimum 160×160 pixels inside the detection bounding box.
- **Occlusion Tolerance:** Prescription spectacles with clear lenses and standard medical masks are supported. Heavy dark tinted sunglasses should be removed during initial registration.
`
      }
    ]
  },
  {
    groupId: 'rostering',
    groupTitle: 'Rostering & Grace Policies',
    icon: Clock,
    pages: [
      {
        id: 'shifts-and-grace',
        title: 'Shifts & Grace Periods (Worked Example)',
        readTime: '4 min read',
        summary: 'Worked example: shift 09:00, grace 15 min, arrival 09:12 = on time.',
        content: `
# Shifts & Grace Periods

AuraPass resolves punch timestamps on-premise against configurable department schedules and grace period allowances.

## Worked Example: 15-Minute Grace Policy

Consider an operational shift configured as follows:
- **Scheduled Shift Start:** \`09:00:00\`
- **Department Grace Buffer:** \`15 minutes\`
- **Effective On-Time Cutoff:** \`09:15:00\`

### Punch Event Resolution Matrix

| Employee Name | Shift Start | Grace Buffer | Punch Timestamp | Status Recorded | Payroll Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rajesh Patel** | 09:00:00 | 15 min | 08:54:12 | **ON TIME** (Early) | Standard shift rate |
| **Priya Sharma** | 09:00:00 | 15 min | 09:12:04 | **ON TIME** (Grace) | Standard shift rate |
| **Vatsal Vadgama** | 09:00:00 | 15 min | 09:05:12 | **ON TIME** (Grace) | Standard shift rate |
| **Alex Rivera** | 09:00:00 | 15 min | 09:18:45 | **LATE** (+3m) | Tardy flag in payroll export |

### Explanation of Arrival at 09:12:04
Because \`09:12:04\` falls within the configured 15-minute grace window (\`09:00\` through \`09:15\`), the local engine deterministically registers the attendance as **On time**. The employee receives no penalty, and the physical turnstile unlatches immediately.
`
      }
    ]
  },
  {
    groupId: 'hardware',
    groupTitle: 'Kiosks & Gate Relays',
    icon: Zap,
    pages: [
      {
        id: 'turnstile-relays',
        title: 'Turnstile & GPIO Relay Wiring',
        readTime: '4 min read',
        summary: 'Wire 24V dry contacts to Alvarado, Boon Edam, and tripod gates.',
        content: `
# Turnstile & GPIO Relay Wiring

AuraPass interfaces with speed gates, flap turnstiles, and electromagnetic magnetic door strikes via opto-isolated relay modules.

## Standard Wiring Diagram

1. **GPIO Controller:** Connect Raspberry Pi, NVIDIA Jetson, or USB relay boards (e.g. Numato 1-Channel USB Relay).
2. **Relay Terminal:** Wire the gate controller's dry-contact **Normally Open (NO)** and **Common (COM)** terminals.
3. **Pulse Duration:** When a biometric match is confirmed (<300 ms), AuraPass signals GPIO Pin 18 high for 450 ms, releasing the turnstile flap.

\`\`\`text
[AuraPass Engine] ---> (GPIO Pin 18) ---> [Opto-Isolated Relay] ---> (NO / COM) ---> [Turnstile Controller]
\`\`\`
`
      }
    ]
  },
  {
    groupId: 'security',
    groupTitle: 'Security & Sovereignty',
    icon: Shield,
    pages: [
      {
        id: 'sovereignty-spec',
        title: 'Zero Egress & Data Sovereignty',
        readTime: '4 min read',
        summary: 'Contractual local processing guarantees and firewall verification.',
        content: `
# Zero Egress & Data Sovereignty

AuraPass is built as a self-contained local appliance.

## Technical Safeguards

- **No Outbound Sockets:** The software makes zero outbound HTTP, WebSocket, or analytics requests.
- **Air-Gapped Operation:** The engine functions identically on local networks with no internet connection or upstream gateway.
- **One-Way Biometric Representation:** Faces are designed as one-way numeric representations; raw images are not stored after enrollment processing.
- **Regulatory Frameworks:** Built to support GDPR Article 9, Illinois BIPA (740 ILCS 14/), and India DPDP Act 2023 requirements by maintaining absolute local data residency.
`
      }
    ]
  },
  {
    groupId: 'api',
    groupTitle: 'API Reference',
    icon: Code,
    pages: [
      {
        id: 'rest-api',
        title: 'REST API & Webhooks',
        readTime: '3 min read',
        summary: 'Local HTTP endpoints for attendance logs and employee rostering.',
        content: `
# REST API & Webhooks

AuraPass exposes a local RESTful HTTP API on port 8000.

## Query Recent Verified Access Logs

\`\`\`bash
curl -X GET "http://localhost:8000/api/attendance/logs?limit=10" \\
  -H "Authorization: Bearer $LOCAL_TOKEN"
\`\`\`

### Example JSON Response

\`\`\`json
{
  "status": "success",
  "records": [
    {
      "badge_id": "EMP-0142",
      "name": "Rajesh Patel",
      "department": "Operations",
      "timestamp": "2026-11-05T08:59:42Z",
      "status": "ON_TIME",
      "match_confidence": 0.996,
      "latency_ms": 184
    }
  ]
}
\`\`\`
`
      }
    ]
  },
  {
    groupId: 'faq',
    groupTitle: 'Technical FAQ',
    icon: HelpCircle,
    pages: [
      {
        id: 'general-faq',
        title: 'Frequently Answered Runbooks',
        readTime: '3 min read',
        summary: 'Common administrator and systems engineer questions.',
        content: `
# Frequently Answered Runbooks

### Can we export logs directly to payroll software?
Yes. Attendance records can be filtered by date, shift, or department and exported to standard CSV, Excel (.xlsx), or formatted PDF registers compatible with Tally, SAP, and Zoho People.

### Does AuraPass work if power or LAN is interrupted?
The system operates on an append-only SQLite WAL database locally. If the network switch reboots, scans are cached and flushed atomically upon interface restoration.
`
      }
    ]
  }
];

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePageId = searchParams.get('page') || 'shifts-and-grace';

  // Navigation search & command palette state
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);

  // Find active page in tree
  const activePage = useMemo(() => {
    for (const group of DOCS_TREE) {
      for (const p of group.pages) {
        if (p.id === activePageId) {
          return { ...p, groupTitle: group.groupTitle };
        }
      }
    }
    return DOCS_TREE[3].pages[0]; // Default to shifts-and-grace
  }, [activePageId]);

  // Extract table of contents from markdown headings
  const tocHeadings = useMemo(() => {
    if (!activePage?.content) return [];
    const lines = activePage.content.split('\n');
    const headings = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/\*\*/g, '');
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        headings.push({ id, text, level });
      }
    });

    return headings;
  }, [activePage]);

  // Find previous and next pages for bottom pagination
  const { prevPage, nextPage } = useMemo(() => {
    const flatPages = [];
    DOCS_TREE.forEach((g) => {
      g.pages.forEach((p) => {
        flatPages.push(p);
      });
    });

    const currentIndex = flatPages.findIndex((p) => p.id === activePageId);
    return {
      prevPage: currentIndex > 0 ? flatPages[currentIndex - 1] : null,
      nextPage: currentIndex < flatPages.length - 1 ? flatPages[currentIndex + 1] : null,
    };
  }, [activePageId]);

  // Filtered pages for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    DOCS_TREE.forEach((group) => {
      group.pages.forEach((page) => {
        if (
          page.title.toLowerCase().includes(query) ||
          page.summary.toLowerCase().includes(query) ||
          page.content.toLowerCase().includes(query)
        ) {
          results.push({ ...page, groupTitle: group.groupTitle });
        }
      });
    });

    return results;
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#06090B] text-[#9AA7A3] font-sans selection:bg-[#3DDC97]/20 selection:text-[#3DDC97]">
      
      {/* 1. TOP DOCS HEADER */}
      <header className="sticky top-0 z-40 bg-[#06090B]/95 border-b border-white/[0.08] backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-white/10 text-[#9AA7A3] hover:text-white"
              aria-label="Open documentation navigation"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>

            <Link to="/" className="flex items-center gap-2 text-[#F3F6F5] font-semibold text-sm">
              <span className="w-6 h-6 rounded-md bg-[#0B1013] border border-white/10 flex items-center justify-center text-[#3DDC97]">
                <Scan className="w-3.5 h-3.5 stroke-[1.5]" />
              </span>
              <span>AuraPass</span>
              <span className="text-xs font-mono text-[#3DDC97] px-1.5 py-0.2 rounded bg-[#3DDC97]/10 border border-[#3DDC97]/20">
                DOCS
              </span>
            </Link>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#66726E] font-mono ml-3 pl-3 border-l border-white/[0.08]">
              <span>Docs</span>
              <span>/</span>
              <span>{activePage.groupTitle}</span>
              <span>/</span>
              <span className="text-[#F3F6F5] truncate max-w-[200px]">{activePage.title}</span>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#66726E]" />
            <input
              type="text"
              placeholder="Search documentation... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#0B1013] border border-white/10 rounded-lg text-xs text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66726E] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="text-xs font-medium text-[#9AA7A3] hover:text-white transition-colors hidden md:inline-block"
            >
              Support Center
            </Link>
            <Link
              to="/"
              className="text-xs font-medium text-[#3DDC97] hover:text-[#5FE8AD] transition-colors"
            >
              ← Back to Overview
            </Link>
          </div>

        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative">
            <div className="absolute right-4 top-1 w-full max-w-md bg-[#0B1013] border border-white/10 rounded-xl shadow-2xl p-3 space-y-2 z-50">
              <div className="flex justify-between items-center text-[11px] font-mono text-[#66726E] pb-2 border-b border-white/[0.06]">
                <span>SEARCH RESULTS ({searchResults.length})</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-white">CLOSE</button>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-xs text-[#9AA7A3] py-4 text-center">No matching documentation pages found.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        setSearchParams({ page: result.id });
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-white/[0.04] transition-colors group block"
                    >
                      <div className="text-xs font-semibold text-[#F3F6F5] group-hover:text-[#3DDC97]">
                        {result.title}
                      </div>
                      <div className="text-[11px] text-[#66726E] truncate">
                        {result.groupTitle} • {result.summary}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. THREE-COLUMN DOCS BODY */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-start gap-8 py-8 relative">
        
        {/* COLUMN A: Left Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#06090B] border-r border-white/[0.08] p-6 overflow-y-auto transition-transform duration-300 lg:static lg:block lg:w-64 lg:shrink-0 lg:p-0 lg:border-none lg:bg-transparent ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
            <span className="font-semibold text-white text-sm">Documentation Tree</span>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1 rounded text-[#9AA7A3] hover:text-white"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          <nav className="space-y-6 text-xs" aria-label="Documentation Categories">
            {DOCS_TREE.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.groupId} className="space-y-2">
                  <p className="font-mono text-[11px] font-semibold text-[#F3F6F5] uppercase tracking-wider flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[#3DDC97] stroke-[1.5]" />
                    <span>{group.groupTitle}</span>
                  </p>
                  <ul className="space-y-1 border-l border-white/[0.06] ml-1 pl-3">
                    {group.pages.map((page) => {
                      const isActive = page.id === activePageId;
                      return (
                        <li key={page.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchParams({ page: page.id });
                              setMobileDrawerOpen(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-full text-left py-1 text-xs transition-colors rounded ${
                              isActive
                                ? 'text-[#3DDC97] font-semibold -ml-[13px] border-l-2 border-[#3DDC97] pl-[11px]'
                                : 'text-[#9AA7A3] hover:text-[#F3F6F5]'
                            }`}
                          >
                            {page.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Backdrop for mobile drawer */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* COLUMN B: Center Technical Article (740px constraint) */}
        <main className="flex-1 max-w-[740px] mx-auto w-full min-w-0 pb-20">
          
          {/* Article Header Metadata */}
          <div className="pb-6 mb-8 border-b border-white/[0.08] space-y-2">
            <div className="flex items-center gap-3 font-mono text-xs text-[#66726E]">
              <span>{activePage.groupTitle.toUpperCase()}</span>
              <span>•</span>
              <span>{activePage.readTime}</span>
              <span>•</span>
              <span className="text-[#3DDC97]">ENGINE v2026.2</span>
            </div>
            <p className="text-sm text-[#9AA7A3] font-normal leading-relaxed">
              {activePage.summary}
            </p>
          </div>

          {/* Render Parsed Technical Content */}
          <MarkdownRenderer content={activePage.content} />

          {/* Was This Helpful? Feedback Component */}
          <div className="mt-14 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <span className="text-[#9AA7A3]">Was this page helpful?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedbackGiven('yes')}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                  feedbackGiven === 'yes'
                    ? 'border-[#3DDC97] text-[#3DDC97] bg-[#3DDC97]/10'
                    : 'border-white/10 text-[#9AA7A3] hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Yes, helpful</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackGiven('no')}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                  feedbackGiven === 'no'
                    ? 'border-white/30 text-white bg-white/[0.05]'
                    : 'border-white/10 text-[#9AA7A3] hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Needs clarification</span>
              </button>
            </div>
          </div>

          {/* Bottom Pagination Previous / Next */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPage ? (
              <button
                type="button"
                onClick={() => {
                  setSearchParams({ page: prevPage.id });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 rounded-xl border border-white/[0.08] bg-[#0B1013] hover:border-white/20 text-left transition-colors group"
              >
                <span className="text-[11px] font-mono text-[#66726E] flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Previous
                </span>
                <span className="text-sm font-semibold text-[#F3F6F5] group-hover:text-[#3DDC97] transition-colors block mt-1">
                  {prevPage.title}
                </span>
              </button>
            ) : <div />}

            {nextPage ? (
              <button
                type="button"
                onClick={() => {
                  setSearchParams({ page: nextPage.id });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 rounded-xl border border-white/[0.08] bg-[#0B1013] hover:border-white/20 text-right transition-colors group"
              >
                <span className="text-[11px] font-mono text-[#66726E] flex items-center justify-end gap-1">
                  Next <ArrowRight className="w-3 h-3" />
                </span>
                <span className="text-sm font-semibold text-[#F3F6F5] group-hover:text-[#3DDC97] transition-colors block mt-1">
                  {nextPage.title}
                </span>
              </button>
            ) : <div />}
          </div>

        </main>

        {/* COLUMN C: Right Table of Contents Rail */}
        <aside className="hidden xl:block w-56 shrink-0 sticky top-20">
          <TableOfContents headings={tocHeadings} />
        </aside>

      </div>

    </div>
  );
}
