import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import MarkdownRenderer from '../components/ui/marketing/MarkdownRenderer';
import TableOfContents from '../components/ui/marketing/TableOfContents';
import Badge from '../components/ui/marketing/Badge';
import Button from '../components/ui/marketing/Button';
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
  FileSpreadsheet,
  HardDrive,
  Cpu,
  Lock,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  FileText
} from 'lucide-react';

/**
 * Authoritative Documentation Information Architecture
 * Organized around user needs: Organization Administrators, IT Administrators, Employees, and Developers.
 */
const DOCS_TREE = [
  {
    groupId: 'getting-started',
    groupTitle: '1. Getting Started',
    icon: Server,
    pages: [
      {
        id: 'architecture',
        title: 'Architecture & System Tenets',
        readTime: '3 min read',
        audience: 'All Audiences',
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
        title: 'Hardware & System Requirements',
        readTime: '4 min read',
        audience: 'IT Administrators',
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
        audience: 'IT Administrators',
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
      }
    ]
  },
  {
    groupId: 'org-admin',
    groupTitle: '2. Organization Administrators',
    icon: Users,
    pages: [
      {
        id: 'org-setup',
        title: 'Organization & Tenant Setup',
        readTime: '3 min read',
        audience: 'Organization Administrators',
        summary: 'Configure organizational profile, timezone, and security administrators.',
        content: `
# Organization & Tenant Setup

AuraPass enables strict cryptographic isolation per organization.

## Initial Configuration Steps

1. Navigate to **Platform Settings** via the left navigation console.
2. Set your **Organization Name** and **Primary Facility Timezone** (e.g. \`Asia/Kolkata\` or \`UTC\`).
3. Define the administrator credentials and assign role-based permissions (Org Admin, HR Manager, Security Guard).
4. Review the auto-generated cryptographic salt key used for tenant embedding vector hashing.

> [!IMPORTANT]
> Keep your offline master backup key stored in a secure physical safe. It cannot be recovered remotely by AuraPass support due to air-gapped zero-egress architecture.
`
      },
      {
        id: 'three-shot-protocol',
        title: '3-Shot Employee Enrollment',
        readTime: '4 min read',
        audience: 'Organization Administrators & HR',
        summary: 'Standard operating procedure for registering new staff profiles.',
        content: `
# 3-Shot Enrollment Protocol

AuraPass employs an ergonomic 3-shot enrollment standard to capture biometric vector variance while maintaining zero raw photo persistence.

## Protocol Procedure

1. **Shot 01 — Frontal (0°):** Subject looks directly at the camera lens at neutral eye level.
2. **Shot 02 — Left Profile (15°):** Subject tilts their head slightly towards their left shoulder.
3. **Shot 03 — Right Profile (15°):** Subject tilts their head slightly towards their right shoulder.

The three crops generate three 512-dimensional vector embeddings, which are averaged and normalized into a single master template. The entire registration takes under two minutes per employee.

> [!IMPORTANT]
> Raw facial crops are deleted immediately upon vector extraction. The database stores only the resulting 512 floating-point values.
`
      },
      {
        id: 'shifts-and-grace',
        title: 'Shifts & Grace Periods (Worked Example)',
        readTime: '4 min read',
        audience: 'Organization Administrators & HR',
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
Because \`09:12:04\` falls within the configured 15-minute grace window (\`09:00\` through \`09:15\`), the local engine deterministically registers the attendance as **On time**. The employee receives no deduction, and the physical turnstile unlatches immediately.
`
      },
      {
        id: 'reports-and-exports',
        title: 'Generating Payroll Reports & Exports',
        readTime: '3 min read',
        audience: 'Organization Administrators & HR',
        summary: 'Export verified attendance logs to Excel (.xlsx), CSV, and executive PDF.',
        content: `
# Generating Payroll Reports & Exports

Attendance records and audit trails export with one click for downstream accounting software like Tally, SAP, Zoho People, and ADP.

## Export Formats

1. **Excel Workbook (.xlsx):** Includes tabbed summaries for Department Breakdown, Late Arrivals, and Daily Punch Timestamps.
2. **Standard CSV (.csv):** Raw, RFC-4180 compliant CSV stream for automated script ingest.
3. **Executive Audit PDF:** High-contrast, printable report with cryptographic tamper-evident checksums.

## Exporting from the Console
- Open **Attendance Logs** from the sidebar navigation.
- Apply desired date range filter (e.g. *Today*, *Yesterday*, *Past 7 Days*, or custom calendar range).
- Click **Export CSV** or **Export PDF** in the top right control bar.
`
      }
    ]
  },
  {
    groupId: 'it-admin',
    groupTitle: '3. IT Administrators & Hardware',
    icon: Camera,
    pages: [
      {
        id: 'rtsp-onvif',
        title: 'RTSP & ONVIF Configuration',
        readTime: '4 min read',
        audience: 'IT Administrators',
        summary: 'Configure Hikvision, Dahua, Axis, and CP Plus cameras for low latency.',
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

### CP Plus
\`\`\`text
rtsp://[username]:[password]@[ip]:554/cam/realmonitor?channel=1&subtype=0
\`\`\`
`
      },
      {
        id: 'turnstile-relays',
        title: 'Turnstile & 24V GPIO Relay Wiring',
        readTime: '4 min read',
        audience: 'IT Administrators & Electricians',
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

## Safety Interlocks
Always wire a physical emergency break-glass switch in series with the magnetic lock power line so gates open automatically during building fire alarms or power outages.
`
      },
      {
        id: 'database-backup',
        title: 'Database Backup & Recovery',
        readTime: '3 min read',
        audience: 'IT Administrators',
        summary: 'Manage SQLite WAL mode and automated PostgreSQL backups.',
        content: `
# Database Backup & Recovery

AuraPass uses append-only SQLite WAL mode (single-lane) or PostgreSQL 15+ (multi-lane clusters).

## Backing Up SQLite WAL
The database resides in \`/app/data/attendance.db\`. To perform a hot backup without stopping the service:

\`\`\`bash
sqlite3 /app/data/attendance.db ".backup /backup/aurapass_$(date +%F).db"
\`\`\`

## Restoring from Backup
Stop the container and replace \`attendance.db\`:

\`\`\`bash
docker stop aurapass-node
cp /backup/aurapass_2026-11-05.db /var/lib/aurapass/data/attendance.db
docker start aurapass-node
\`\`\`
`
      },
      {
        id: 'camera-troubleshooting',
        title: 'Camera Troubleshooting & Packet Loss',
        readTime: '4 min read',
        audience: 'IT Administrators',
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
    groupId: 'employee-guide',
    groupTitle: '4. Employee & Staff Guide',
    icon: Users,
    pages: [
      {
        id: 'employee-experience',
        title: 'How Face Verification Works for You',
        readTime: '3 min read',
        audience: 'Employees & Staff',
        summary: 'What to expect when entering the office entrance gates.',
        content: `
# How Face Verification Works for You

AuraPass allows employees to check in touchlessly without pulling out plastic ID badges or touching dirty fingerprint sensors.

## What to Do at the Entrance

1. Walk naturally towards the entrance lane or kiosk tablet.
2. Look briefly towards the camera at eye level (around 1 to 2 meters away).
3. The display screen will show a green confirmation circle and announce **"Access Granted"** in under 0.2 seconds.
4. The turnstile will unlatch and you can proceed through immediately.

## Spectacles, Hats, and Masks
- **Prescription Glasses:** Supported with zero issues.
- **Medical Masks:** Supported via upper-face ocular geometry extraction.
- **Heavy Sunglasses:** Dark polarized lenses may obscure eye landmark points; remove them if a scan fails.
`
      },
      {
        id: 'employee-privacy',
        title: 'Your Biometric Privacy & Data Rights',
        readTime: '3 min read',
        audience: 'Employees & Staff',
        summary: 'How your biometric data is protected and kept strictly on-premise.',
        content: `
# Your Biometric Privacy & Data Rights

Your privacy is the core design principle of AuraPass Enterprise.

## Where is My Data Processed?
- Your facial verification happens **100% locally** on your company's internal office network.
- **Zero data** is sent to cloud companies, external AI providers, or overseas servers.

## Are Photos of My Face Saved?
- **No raw photos** are retained after initial enrollment.
- Your face is converted into a **512-number mathematical coordinate vector**. It is mathematically impossible to reconstruct a picture of your face from this sequence of numbers.

## Right to Deletion
When you leave the organization, your profile and mathematical vector are immediately purged from the local database.
`
      }
    ]
  },
  {
    groupId: 'security',
    groupTitle: '5. Security & Cryptography',
    icon: Shield,
    pages: [
      {
        id: 'sovereignty-spec',
        title: 'Zero Egress & Data Sovereignty',
        readTime: '4 min read',
        audience: 'Security & Legal Teams',
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
      },
      {
        id: 'anti-spoofing',
        title: 'Anti-Spoofing & Liveness Detection (ISO 30107)',
        readTime: '3 min read',
        audience: 'Security Engineers',
        summary: 'Multi-spectral presentation attack detection rejecting paper and screen spoofs.',
        content: `
# Anti-Spoofing & Liveness Detection

AuraPass implements Presentation Attack Detection (PAD) adhering to ISO/IEC 30107 standards.

## Multi-Cue Evaluation Pipeline
1. **Specular Reflection Analysis:** Evaluates natural skin diffuse reflection versus glass screen glare.
2. **Frequency Spectrum & Moiré:** Rejects smartphone display pixel lattices and color distortion.
3. **Micro-Motion Tracking:** Confirms natural human ocular blink rhythms and involuntary micro-head motion.

Attempts to present a printed paper photo or phone video screen terminate inference in under 35 milliseconds, logging an event snapshot to the security audit ledger.
`
      }
    ]
  },
  {
    groupId: 'api',
    groupTitle: '6. Developer & REST API',
    icon: Code,
    pages: [
      {
        id: 'rest-api',
        title: 'REST API & Webhooks',
        readTime: '3 min read',
        audience: 'Developers',
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
  }
];

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePageId = searchParams.get('page') || 'architecture';

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
    return DOCS_TREE[0].pages[0]; // Default to architecture
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

  const selectPage = (id) => {
    setSearchParams({ page: id });
    setMobileDrawerOpen(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen public-surface flex flex-col font-sans transition-colors duration-200">
      {/* Unified Public Header */}
      <PublicHeader />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Mobile Navigation Header Bar */}
        <div className="lg:hidden flex items-center justify-between p-3 rounded-xl bg-card border border-border mb-6">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-foreground"
          >
            <Menu size={16} />
            <span>Table of Contents ({activePage.title})</span>
          </button>
          <Badge variant="emerald">{activePage.readTime}</Badge>
        </div>

        {/* 3-Column Responsive Docs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Column 1: Left Sticky Navigation Rail ─── */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 pb-8">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Live Search Results Overlay */}
            {searchResults.length > 0 && (
              <div className="p-2 rounded-xl bg-card border border-border shadow-lg space-y-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-1">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.slice(0, 5).map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => selectPage(res.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-secondary text-xs text-foreground transition-colors cursor-pointer"
                  >
                    <div className="font-semibold">{res.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{res.groupTitle}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Document Navigation Tree */}
            <nav className="space-y-6 text-xs" aria-label="Documentation Sidebar">
              {DOCS_TREE.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.groupId} className="space-y-2">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider">
                      <Icon size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{group.groupTitle}</span>
                    </div>

                    <ul className="space-y-1 border-l border-border pl-3">
                      {group.pages.map((p) => {
                        const isCurrent = p.id === activePageId;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => selectPage(p.id)}
                              className={`w-full text-left py-1.5 px-2 rounded-md transition-colors text-xs cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border-l-2 border-emerald-500 -ml-[13px] pl-[11px]'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                              }`}
                            >
                              {p.title}
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

          {/* ─── Column 2: Center Main Reading Article (Solid & High Contrast) ─── */}
          <article className="lg:col-span-6 bg-card rounded-2xl border border-border p-6 sm:p-10 shadow-sm">
            {/* Breadcrumb Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-1.5">
                <Link to="/" className="hover:text-foreground">AuraPass</Link>
                <span>/</span>
                <span className="text-foreground">{activePage.groupTitle}</span>
                <span>/</span>
                <span className="font-semibold text-foreground">{activePage.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="zinc">{activePage.readTime}</Badge>
                {activePage.audience && <Badge variant="emerald">{activePage.audience}</Badge>}
              </div>
            </div>

            {/* Markdown Content Surface */}
            <MarkdownRenderer content={activePage.content} />

            {/* Article Feedback Widget */}
            <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Was this documentation article helpful?</span>
              <div className="flex items-center gap-2">
                {feedbackGiven ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Thank you for your feedback!
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('up')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground transition-colors cursor-pointer"
                    >
                      <ThumbsUp size={13} />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('down')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground transition-colors cursor-pointer"
                    >
                      <ThumbsDown size={13} />
                      <span>No</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Previous & Next Article Navigation */}
            <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPage ? (
                <button
                  type="button"
                  onClick={() => selectPage(prevPage.id)}
                  className="p-4 rounded-xl border border-border hover:border-emerald-500/50 bg-secondary/30 hover:bg-secondary/60 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                    <ArrowLeft size={10} /> Previous
                  </div>
                  <div className="text-xs font-bold text-foreground">{prevPage.title}</div>
                </button>
              ) : <div />}

              {nextPage && (
                <button
                  type="button"
                  onClick={() => selectPage(nextPage.id)}
                  className="p-4 rounded-xl border border-border hover:border-emerald-500/50 bg-secondary/30 hover:bg-secondary/60 text-right transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-end gap-1">
                    Next <ArrowRight size={10} />
                  </div>
                  <div className="text-xs font-bold text-foreground">{nextPage.title}</div>
                </button>
              )}
            </div>
          </article>

          {/* ─── Column 3: Right Rail ("On This Page" / Headings) ─── */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-6 pl-2">
            <TableOfContents headings={tocHeadings} />

            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-xs">
              <div className="font-semibold text-foreground">Need Enterprise Assistance?</div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Connect with our deployment engineering team for custom turnstile wiring and RTSP stream benchmarks.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Open Help Center <ArrowRight size={12} />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-card border-r border-border p-5 overflow-y-auto z-10 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-sm text-foreground">Documentation Tree</span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {DOCS_TREE.map((group) => (
              <div key={group.groupId} className="space-y-1">
                <div className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  {group.groupTitle}
                </div>
                <ul className="space-y-1 border-l border-border pl-3">
                  {group.pages.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectPage(p.id)}
                        className={`w-full text-left py-1.5 text-xs ${
                          p.id === activePageId
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Public Footer */}
      <PublicFooter />
    </div>
  );
}
