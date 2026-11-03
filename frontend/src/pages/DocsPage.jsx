import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Terminal,
  Cpu,
  Layers,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';

const DOCS_DATA = [
  {
    categoryId: 'getting-started',
    categoryTitle: 'Getting Started',
    icon: Server,
    articles: [
      {
        id: 'overview',
        title: 'System Architecture & Overview',
        summary: 'Understand the AuraPass on-premise biometric pipeline and data flow.',
        content: `
### What is AuraPass Enterprise?

AuraPass Enterprise is a high-throughput, on-premise facial recognition attendance and organization management system. Unlike cloud-dependent solutions that stream sensitive employee images across public internet connections, AuraPass processes video streams, face detection, and vector matching **100% locally** within your workplace.

#### Architectural Principles:
1. **Local Biometric Ingestion:** Video streams from IP security cameras (RTSP/ONVIF) or USB webcams are decoded directly on the local host.
2. **Sub-Second Feature Extraction:** MediaPipe FaceLandmarker and Facenet512 generate 512-dimensional unit vectors in under 300 milliseconds.
3. **Cryptographic Sovereignty:** Raw images can be permanently discarded; the resulting mathematical vectors are irreversible and cannot reconstruct the original human photograph.
4. **Relay & Turnstile Integration:** Hardware triggers and digital relays unlock access gates synchronously upon verified recognition.
        `,
        callout: {
          type: 'tip',
          title: 'Air-Gap Certification',
          text: 'AuraPass requires zero outbound internet connections. You can run the entire system on an isolated VLAN or air-gapped network with total feature parity.'
        }
      },
      {
        id: 'requirements',
        title: 'Hardware & OS Requirements',
        summary: 'Minimum and recommended server specifications for single and multi-camera setups.',
        content: `
### Minimum & Recommended Specifications

AuraPass is optimized for modern multi-core processors. A dedicated GPU is optional for single-camera deployments, but recommended for high-volume turnstile banks.

| Deployment Scale | CPU | RAM | Storage | Ingest Capacity |
| :--- | :--- | :--- | :--- | :--- |
| **Small Office / Single Gate** | 4 Cores (Intel i5 / Ryzen 5) | 8 GB DDR4 | 20 GB SSD | 1-2 Cameras, 500 Staff |
| **Medium Facility (3-5 Gates)** | 8 Cores (Intel i7 / Ryzen 7) | 16 GB DDR4 | 50 GB NVMe | 3-5 Cameras, 2,500 Staff |
| **Industrial Campus (10+ Gates)** | 16 Cores + NVIDIA RTX GPU | 32 GB DDR4 | 200 GB NVMe | 10+ Cameras, 10,000+ Staff |

#### Supported Operating Systems:
- **Windows:** Windows 10 (64-bit), Windows 11, Windows Server 2019/2022.
- **Linux:** Ubuntu 20.04/22.04 LTS, Debian 11/12, Red Hat Enterprise Linux 8/9.
- **Docker:** Official multi-architecture container images available via Docker Compose.
        `,
        callout: {
          type: 'note',
          title: 'Storage Requirements',
          text: 'Vector embeddings require approximately 2 Kilobytes per enrolled employee. A 5,000 employee organization uses less than 15 Megabytes of total database vector index storage.'
        }
      },
      {
        id: 'quickstart',
        title: '5-Minute Quickstart Installation',
        summary: 'Step-by-step instructions to initialize your local AuraPass instance.',
        content: `
### Initializing AuraPass

AuraPass can be launched via standard local Python or automated Docker Compose. Follow these steps to initialize your instance:

#### Option A: Docker Compose (Recommended)
Clone the repository and launch the container cluster:

\`\`\`bash
git clone https://github.com/PrashantTarbundiya/RMS.git aurapass
cd aurapass
docker-compose up -d
\`\`\`

The console will bind to port \`5173\` (web UI) and port \`5000\` (Flask backend).

#### Option B: Native Windows Development Run
If running directly on Windows without Docker:

\`\`\`powershell
# 1. Activate backend environment
.venv\\Scripts\\activate
pip install -r backend\\requirements.txt

# 2. Launch backend & frontend
dev.bat
\`\`\`

Navigate to \`http://localhost:5173\` in Google Chrome, Microsoft Edge, or Mozilla Firefox.
        `,
        callout: {
          type: 'important',
          title: 'First Login',
          text: 'On initial launch, create your primary administrator organization account via the Registration screen (/register). This account has full super-admin rights.'
        }
      }
    ]
  },
  {
    categoryId: 'cameras',
    categoryTitle: 'Camera & RTSP Setup',
    icon: Camera,
    articles: [
      {
        id: 'rtsp-streams',
        title: 'Supported Cameras & RTSP Streams',
        summary: 'How to connect standard IP security cameras and configure RTSP video pipelines.',
        content: `
### Camera Network Requirements

AuraPass connects to any IP surveillance camera that broadcasts an H.264 or MJPEG video feed over standard RTSP (Real-Time Streaming Protocol) or ONVIF protocols.

#### Recommended Camera Settings:
- **Resolution:** 1080p (1920x1080) is optimal. Avoid 4K as it increases CPU decode overhead without improving face recognition accuracy.
- **Frame Rate:** 15 to 30 frames per second (FPS).
- **Encoding:** H.264 Baseline / Main profile (H.265 is supported if your host system provides hardware acceleration).
- **Bitrate:** 2,048 kbps to 4,096 kbps constant bitrate (CBR).

#### Standard RTSP URL Formats by Manufacturer:

\`\`\`text
# Hikvision Cameras
rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101

# Dahua Cameras
rtsp://admin:password@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0

# Axis Communications
rtsp://root:password@192.168.1.102/axis-media/media.amp

# Hanwha Techwin (Wisenet)
rtsp://admin:password@192.168.1.103/profile2/media.smp
\`\`\`
        `,
        callout: {
          type: 'warning',
          title: 'Substream Recommendation',
          text: 'If your host machine is monitoring more than 4 cameras simultaneously, configure AuraPass to connect to the camera\'s RTSP Substream (Channel 102 or subtype=1, 720p resolution) to conserve CPU cycles.'
        }
      },
      {
        id: 'usb-webcams',
        title: 'USB Webcams & Kiosk Terminals',
        summary: 'Configuring direct USB capture devices for desktop reception kiosks.',
        content: `
### Using USB Webcams

For desktop check-in terminals or reception desks, any standard USB Video Class (UVC) webcam can be used directly without an RTSP network stream.

#### Supported Devices:
- Logitech C920, C922, BRIO 4K, C270
- AnkerWork PowerConf C200 / C300
- Built-in laptop integrated cameras (Index 0)

#### Ingest Configuration:
In the AuraPass **Cameras** configuration view:
1. Select **Device Index** mode.
2. Enter \`0\` for the primary built-in webcam or \`1\` for an external USB camera.
3. Click **Test Stream** to verify live video feed before activating live recognition.
        `,
        callout: {
          type: 'tip',
          title: 'Illumination Matters',
          text: 'Avoid placing cameras directly facing bright outdoor windows or reflective glass doors. Diffuse indoor lighting with 300 to 500 lux yields optimal sub-300ms verification.'
        }
      }
    ]
  },
  {
    categoryId: 'enrollment',
    categoryTitle: 'Biometric Enrollment',
    icon: Users,
    articles: [
      {
        id: '3-shot-protocol',
        title: '3-Shot Biometric Protocol',
        summary: 'The standard multi-angle enrollment procedure for maximum recognition accuracy.',
        content: `
### Enrolling Staff Members

AuraPass achieves its verified **99.4% LFW accuracy** by constructing a composite facial signature from three distinct angles during initial enrollment.

#### The 3-Shot Sequence:
1. **Shot 01: Frontal Neutral (0°)** &ndash; Direct camera alignment with natural expression.
2. **Shot 02: Slight Left (15°)** &ndash; Captures cheekbone contour and side facial topology.
3. **Shot 03: Slight Right (15°)** &ndash; Completes the 3D canonical feature representation.

#### Image Requirements:
- **Minimum Resolution:** Face bounding box must be at least 160x160 pixels.
- **Lighting:** Even illumination across both sides of the face (minimal heavy shadow).
- **Accessories:** Prescription glasses are supported. Ensure sunglasses or heavy dark-tinted eyewear are removed during enrollment.
        `,
        callout: {
          type: 'note',
          title: 'Enrollment Speed',
          text: 'Uploading 3 photos takes less than 15 seconds. Vectorization runs in under 1.5 seconds, after which the employee is immediately authorized at all connected camera gates.'
        }
      }
    ]
  },
  {
    categoryId: 'departments',
    categoryTitle: 'Departments & Rostering',
    icon: Building,
    articles: [
      {
        id: 'shifts-and-grace',
        title: 'Shift Schedules & Grace Policies',
        summary: 'Configuring custom work schedules, shift hours, and late grace periods.',
        content: `
### Department Rostering Configuration

AuraPass enables granular scheduling policies tailored to distinct organizational departments (e.g. Engineering, Operations, Warehouse, Executive).

#### Key Configurable Fields:
- **Shift Start Time:** The formal working day start (e.g., \`09:00 AM\`).
- **Shift End Time:** The scheduled departure time (e.g., \`06:00 PM\`).
- **Grace Period (Minutes):** The permitted arrival buffer (e.g., \`15 minutes\`). An employee checking in at 09:12 AM is marked **ON TIME**, while an employee arriving at 09:17 AM is marked **LATE**.
- **Early Exit Threshold:** Flags departures that take place before the designated end of shift.

#### Roster Assignment:
Staff members can be bulk-reassigned between departments directly from the **Departments** tab in the admin console. Attendance calculations automatically adhere to the employee's active department policy.
        `
      }
    ]
  },
  {
    categoryId: 'kiosk',
    categoryTitle: 'Kiosk Terminal Mode',
    icon: MonitorCheck,
    articles: [
      {
        id: 'kiosk-deployment',
        title: 'Kiosk Terminal Deployment',
        summary: 'Deploying AuraPass in standalone touch kiosk mode on wall-mounted tablets.',
        content: `
### Dedicated Kiosk Mode

The AuraPass Kiosk view (\`/kiosk\`) provides a distraction-free, full-screen interactive interface designed for reception tablets, turnstile screens, and gate terminals.

#### Key Kiosk Features:
- **Full-Screen Immersion:** Hides administrative sidebars, navigation headers, and console controls.
- **Audio & Visual Feedback:** Emits audible approval chimes and high-contrast green/red status rings for employee recognition.
- **Live Activity Feed:** Displays recent successful entries with real-time timestamps and department tags.
- **Security Lock:** Exiting Kiosk Mode requires administrator credentials or PIN confirmation to prevent unauthorized tampering.
        `,
        callout: {
          type: 'tip',
          title: 'Browser Kiosk Mode',
          text: 'Launch Google Chrome with the \`--kiosk --incognito\` flags to launch a tamper-proof full-screen appliance on Windows or Linux.'
        }
      }
    ]
  },
  {
    categoryId: 'security',
    categoryTitle: 'Security & Sovereignty',
    icon: ShieldCheck,
    articles: [
      {
        id: 'biometric-privacy',
        title: 'Biometric Sovereignty & Air-Gap Compliance',
        summary: 'Technical analysis of non-invertible embeddings, encryption, and data retention.',
        content: `
### Biometric Data Protection Architecture

Facial biometrics represent sensitive personal identification data. AuraPass is engineered according to strict **Privacy by Design** principles.

#### Mathematical Non-Invertibility:
AuraPass uses deep neural network projection to map faces onto a 512-dimensional hypersphere:
$$\\mathbf{v} = \\frac{f(\\mathbf{x})}{\\|f(\\mathbf{x})\\|_2}$$
Because deep convolutional and transformer layers perform irreversible non-linear downsampling, **it is mathematically impossible to reconstruct the original photograph from vector coordinates $\\mathbf{v}$**.

#### Compliance Guarantees:
- **GDPR Article 9 (EU):** Special category biometric processing is restricted strictly to local data controller hardware with automated deletion tools.
- **Illinois BIPA (USA):** Provides written consent tracking and permanent 1-click biometric template destruction upon employee resignation.
- **California CCPA / CPRA:** Ensures employees can inspect or request purging of their stored vector records at any time.
        `,
        callout: {
          type: 'important',
          title: 'Zero Third-Party Cloud Transmission',
          text: 'No vector, image crop, or log record is ever transmitted outside your local network. AuraPass has zero tracking pixels, telemetry scripts, or external API requirements.'
        }
      }
    ]
  },
  {
    categoryId: 'api',
    categoryTitle: 'REST API & Webhooks',
    icon: Code,
    articles: [
      {
        id: 'api-reference',
        title: 'REST API Reference',
        summary: 'Programmatic interfaces for payroll automation and third-party integrations.',
        content: `
### REST API Documentation

AuraPass provides an on-premise RESTful API running on port \`5000\`. All requests require a valid Bearer JWT token obtained via the authentication endpoint.

#### 1. Authentication Endpoint
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@organization.com", "password": "YourSecurePassword"}'
\`\`\`

#### 2. Query Daily Attendance Logs
\`\`\`bash
curl -X GET "http://localhost:5000/api/attendance?date=2026-11-03&limit=50" \\
  -H "Authorization: Bearer <TOKEN>"
\`\`\`

#### 3. Health & System Heartbeat
\`\`\`bash
curl -X GET http://localhost:5000/api/health
\`\`\`

Response:
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
  },
  {
    categoryId: 'troubleshooting',
    categoryTitle: 'Troubleshooting Runbook',
    icon: AlertTriangle,
    articles: [
      {
        id: 'common-fixes',
        title: 'Common Operational Diagnostics',
        summary: 'Rapid resolution steps for stream disconnects, low lighting, and recognition misses.',
        content: `
### Operational Troubleshooting Runbook

#### Issue 1: Camera Feed Displays Black Screen or Loading Spinner
- **Cause:** Network firewall blocking RTSP port \`554\` or incorrect camera authentication credentials.
- **Resolution:**
  1. Ping the camera's local IP from the host machine: \`ping 192.168.1.100\`.
  2. Verify RTSP stream in VLC Media Player using \`Media -> Open Network Stream\`.
  3. Confirm that the camera user account has RTSP stream permissions enabled in the camera's administrative interface.

#### Issue 2: Face Detected but Not Matching Enrolled Employee
- **Cause:** Enrolled photos were taken in vastly different lighting or at excessive tilt angles (>30°).
- **Resolution:**
  1. Inspect the live similarity distance score in **Live Logs**. If distance is hovering around \`0.45\` (just above the default threshold of \`0.40\`), capture two additional enrollment snapshots in the actual doorway lighting.
  2. Ensure the camera lens is clean and free of dust or grease smudges.

#### Issue 3: High CPU Usage During Multiple Camera Feeds
- **Cause:** Software video decoding on high-resolution 4K streams.
- **Resolution:**
  1. Switch to camera Substream (720p at 15 FPS).
  2. In \`backend/config.py\`, ensure frame skip interval is set to \`2\` or \`3\` frames.
        `
      }
    ]
  }
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedArticleId, setSelectedArticleId] = useState('overview');
  const [copiedCode, setCopiedCode] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filtered categories based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_DATA;
    const q = searchQuery.toLowerCase();

    return DOCS_DATA.map((cat) => {
      const matchingArticles = cat.articles.filter(
        (art) =>
          art.title.toLowerCase().includes(q) ||
          art.summary.toLowerCase().includes(q) ||
          art.content.toLowerCase().includes(q)
      );
      return {
        ...cat,
        articles: matchingArticles
      };
    }).filter((cat) => cat.articles.length > 0);
  }, [searchQuery]);

  // Find currently active article
  const currentArticle = useMemo(() => {
    for (const cat of DOCS_DATA) {
      const art = cat.articles.find((a) => a.id === selectedArticleId);
      if (art) return { ...art, category: cat.categoryTitle };
    }
    return { ...DOCS_DATA[0].articles[0], category: DOCS_DATA[0].categoryTitle };
  }, [selectedArticleId]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#1A2234] bg-[#080B11]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  AuraPass Docs
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                  v2026.2
                </span>
              </div>
            </Link>

            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation, RTSP, API, hardware..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0E1320] border border-[#1E2638] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
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
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              Open Console
            </Link>

            {/* Mobile Nav Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0E1422] border border-[#20293D] text-slate-300 hover:text-white"
              aria-label="Toggle documentation navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input bar */}
        <div className="p-3 border-t border-[#1A2234] md:hidden bg-[#0A0D15]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#0E1320] border border-[#1E2638] text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Main Documentation Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Navigation (Desktop) */}
        <aside className="w-full lg:w-72 shrink-0 hidden lg:block space-y-6">
          <div className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            {filteredData.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.categoryId} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{category.categoryTitle}</span>
                  </div>

                  <div className="space-y-0.5">
                    {category.articles.map((article) => {
                      const isSelected = selectedArticleId === article.id;
                      return (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => {
                            setSelectedArticleId(article.id);
                            setSelectedCategory(category.categoryId);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-white hover:bg-[#0E1422]'
                          }`}
                        >
                          <span className="truncate">{article.title}</span>
                          {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
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
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-[#0D121D] border border-[#1E2638] space-y-4 mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2538]">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Documentation Categories
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {filteredData.map((category) => (
              <div key={category.categoryId} className="space-y-1">
                <p className="text-xs font-bold text-emerald-400 font-mono">{category.categoryTitle}</p>
                <div className="space-y-1 pl-2">
                  {category.articles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => {
                        setSelectedArticleId(article.id);
                        setSelectedCategory(category.categoryId);
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full text-left py-1.5 text-xs block ${
                        selectedArticleId === article.id
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      &bull; {article.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Center Main Article Content */}
        <main className="flex-1 min-w-0 max-w-4xl space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Docs</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span>{currentArticle.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-emerald-400 font-semibold">{currentArticle.title}</span>
          </nav>

          {/* Article Header Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0D121D] border border-[#1E2638] space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Enterprise Documentation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentArticle.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {currentArticle.summary}
            </p>
          </div>

          {/* Callout Box if present */}
          {currentArticle.callout && (
            <div className={`p-4 sm:p-5 rounded-xl border flex items-start gap-3.5 text-xs leading-relaxed ${
              currentArticle.callout.type === 'tip'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : currentArticle.callout.type === 'warning'
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                : currentArticle.callout.type === 'important'
                ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
            }`}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-bold text-white text-xs mb-1 uppercase tracking-wider font-mono">
                  {currentArticle.callout.title}
                </p>
                <p className="text-slate-300">{currentArticle.callout.text}</p>
              </div>
            </div>
          )}

          {/* Article Body */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0A0D15] border border-[#1A2234] text-xs sm:text-sm leading-relaxed text-slate-300 space-y-6">
            
            {/* Simple Markdown Parser / Content Renderer */}
            <div className="prose prose-invert max-w-none space-y-4">
              {currentArticle.content.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                
                // Headings
                if (trimmed.startsWith('### ')) {
                  return <h3 key={index} className="text-base sm:text-lg font-bold text-white pt-2">{trimmed.replace('### ', '')}</h3>;
                }
                if (trimmed.startsWith('#### ')) {
                  return <h4 key={index} className="text-sm font-bold text-emerald-400 pt-1 uppercase tracking-wider font-mono">{trimmed.replace('#### ', '')}</h4>;
                }

                // Code Blocks
                if (trimmed.startsWith('```')) {
                  const lines = trimmed.split('\n');
                  const language = lines[0].replace('```', '') || 'text';
                  const code = lines.slice(1, -1).join('\n');
                  const codeId = `code_${index}`;
                  return (
                    <div key={index} className="rounded-xl overflow-hidden border border-[#1E2638] bg-[#07090F] font-mono text-xs my-4">
                      <div className="px-4 py-2 bg-[#0D121D] border-b border-[#1C2538] flex items-center justify-between text-[11px] text-slate-400">
                        <span>{language}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(code, codeId)}
                          className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedCode === codeId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-emerald-300 leading-relaxed">
                        <code>{code}</code>
                      </pre>
                    </div>
                  );
                }

                // Lists
                if (trimmed.startsWith('- ') || trimmed.startsWith('1. ')) {
                  const items = trimmed.split('\n');
                  return (
                    <ul key={index} className="space-y-1.5 pl-4 list-disc text-slate-300">
                      {items.map((it, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {it.replace(/^(-\s+|\d+\.\s+)/, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Standard Paragraph
                return (
                  <p key={index} className="leading-relaxed text-slate-300">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Quick Support & Troubleshooting CTA */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Need hardware-specific assistance?</p>
              <p className="text-xs text-slate-400 mt-0.5">Our enterprise support team can assist with RTSP integration or turnstile relay wiring.</p>
            </div>
            <Link
              to="/support"
              className="px-4 py-2 rounded-xl bg-[#161D2B] hover:bg-[#20293C] border border-[#232B3E] text-slate-200 text-xs font-semibold shrink-0 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1A2234] bg-[#06080E] py-8 px-4 sm:px-6 text-center text-xs text-slate-500 font-mono">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Local Documentation Engine v2026.2.</p>
      </footer>
    </div>
  );
}

