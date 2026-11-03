import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scan,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Camera,
  Play,
  RotateCcw,
  Users,
  Clock,
  Lock,
  Server,
  Fingerprint,
  Eye,
  FileCheck,
  WifiOff,
  ArrowRight,
  Sparkles,
  Zap,
  Menu,
  X,
  BookOpen,
  Activity,
  Layers,
  HelpCircle,
  BarChart3,
  Calendar,
  Building,
  Check,
  ChevronRight,
  ExternalLink,
  Cpu,
  MonitorCheck,
  Laptop,
  AlertTriangle,
  Smartphone,
  Glasses
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 3D Tilt State for interactive simulator
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Simulator Mode: 'standard' | 'spoofing' | 'glasses'
  const [simMode, setSimMode] = useState('standard');
  const [simState, setSimState] = useState('idle'); // 'idle' | 'scanning' | 'verified' | 'rejected'
  const [simTime, setSimTime] = useState(242);

  // Pricing Interval: 'monthly' | 'annual'
  const [billingInterval, setBillingInterval] = useState('annual');

  // How It Works Active Step (0: Detection, 1: Liveness, 2: Vectorization, 3: Matching)
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  // Product Showcase Active Tab (0: Live Site, 1: Departments, 2: Kiosk Terminal, 3: Models)
  const [activeShowcaseTab, setActiveShowcaseTab] = useState(0);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const triggerSimulation = (mode = simMode) => {
    if (simState === 'scanning') return;
    setSimMode(mode);
    setSimState('scanning');
    const start = performance.now();

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - start + 210);
      setSimTime(elapsed);
      if (mode === 'spoofing') {
        setSimState('rejected');
      } else {
        setSimState('verified');
      }
    }, 600);
  };

  const resetSimulation = () => {
    setSimState('idle');
  };

  const pipelineSteps = [
    {
      step: '01',
      title: 'Multi-Scale Face Detection',
      icon: Camera,
      tag: 'MediaPipe BlazeFace + RetinaFace',
      desc: 'Ingests RTSP video streams at 30 FPS. Detects 68 facial landmarks and canonical 3D pose up to 5 meters away with sub-pixel alignment.',
      metric: '< 45ms per frame'
    },
    {
      step: '02',
      title: 'Passive Liveness & PAD',
      icon: ShieldCheck,
      tag: 'ISO/IEC 30107-3 Level 1/2',
      desc: 'Multi-cue presentation attack detection inspects surface micro-textures, specular glare, and screen moiré frequencies to block photos and videos.',
      metric: '0.01% Spoof Acceptance'
    },
    {
      step: '03',
      title: '512-d Hypersphere Vector',
      icon: Cpu,
      tag: 'Facenet512 Neural Backbone',
      desc: 'Transforms the cropped, normalized face into an irreversible 512-dimensional float32 coordinate vector on a unit hypersphere.',
      metric: 'Irreversible Embedding'
    },
    {
      step: '04',
      title: 'Local Cosine Match & Relay',
      icon: CheckCircle2,
      tag: 'SQLite / PostgreSQL Roster',
      desc: 'Executes sub-50ms vector distance lookup against enrolled employees. Logs entry timestamp and triggers physical turnstile GPIO relay.',
      metric: '< 250ms total latency'
    }
  ];

  const faqs = [
    {
      q: "Does any employee photo or biometric data leave our workplace network?",
      a: "Never. AuraPass is engineered strictly as an on-premise biometric engine. All facial landmark detection, 512-dimensional vector extraction, and database matching execute locally on your workplace machine. No photographs, face crops, or embeddings are ever transmitted to any external cloud API."
    },
    {
      q: "How does the system prevent spoofing with printed photos or smartphone screens?",
      a: "AuraPass integrates multi-cue presentation attack detection (PAD). It inspects surface specular reflection, frequency spectrum artifacts, micro-texture gradients, and face depth cues to ensure a live, biological human is present before calculating matching embeddings."
    },
    {
      q: "What camera hardware and computer specifications are required?",
      a: "AuraPass runs on any modern 4-core desktop or laptop (Intel Core i5, AMD Ryzen 5, or Apple Silicon) with 8 GB RAM. For video capture, it directly ingests standard RTSP and ONVIF streams from enterprise IP cameras (Hikvision, Dahua, Axis, Hanwha) or common USB webcams."
    },
    {
      q: "How long does employee biometric enrollment take?",
      a: "Under 2 minutes per person. The administrator uploads 3 clear photographs (frontal, slight left 15°, slight right 15°) or captures snapshots directly through the web camera preview. AuraPass extracts the mathematical vector and the employee is recognized immediately."
    },
    {
      q: "Can attendance records be exported to payroll and HR systems?",
      a: "Yes. AuraPass provides one-click export to CSV, Microsoft Excel, and printable PDF formats. Additionally, an on-premise REST API provides JSON endpoints for automated payroll integrations (e.g. SAP, Workday, QuickBooks, or custom ERPs)."
    },
    {
      q: "What happens if our building's internet connection goes down?",
      a: "Attendance continues without interruption. Because all recognition, database lookups (SQLite/PostgreSQL), and camera ingest loops run on your local network, zero internet connection is required for day-to-day operation."
    },
    {
      q: "How does AuraPass comply with workplace privacy laws (GDPR & BIPA)?",
      a: "AuraPass converts faces into irreversible 512-dimensional mathematical vectors from which the original photo cannot be reconstructed. Raw enrollment images can be immediately deleted, and administrators have single-click tools to purge an employee's vectors permanently upon departure."
    },
    {
      q: "Can we configure different shifts and grace periods per department?",
      a: "Yes. The Departments management suite allows custom work schedules (e.g. 09:00 - 18:00), configurable grace thresholds (e.g. 15 minutes), and automatic detection of on-time, late entry, or early exit events."
    }
  ];

  return (
    <div className="min-h-screen marketing-bg text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Background Dot Grid Overlay */}
      <div className="absolute inset-0 marketing-grid-pattern pointer-events-none z-0" />

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER / LIQUID GLASS NAVIGATION
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070A12]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-all shadow-sm shadow-emerald-500/20">
              <Scan className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                AuraPass<sup className="text-[9px] text-emerald-400 font-mono ml-0.5">&trade;</sup>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                Enterprise
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs text-slate-300 font-medium">
            <a href="#simulator" className="hover:text-white transition-colors">3D Simulator</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#sovereignty" className="hover:text-white transition-colors">Biometric Sovereignty</a>
            <Link to="/docs" className="hover:text-emerald-400 text-emerald-400/90 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/25 cursor-pointer items-center gap-1.5"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}

            {/* Mobile Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0E1422] border border-[#20293D] text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#1E2638] bg-[#0A0E18]/95 backdrop-blur-2xl px-4 py-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                3D Simulator
              </a>
              <a
                href="#pipeline"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                How It Works Pipeline
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Capabilities & Rostering
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Product Showcase
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Pricing Plans
              </a>
              <a
                href="#sovereignty"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Biometric Sovereignty
              </a>
              <Link
                to="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors flex items-center justify-between"
              >
                <span>Documentation & Guides</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Help Center & Support
              </Link>
            </nav>

            <div className="pt-4 border-t border-[#1C2538] flex flex-col gap-2.5">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-center text-xs shadow-md shadow-emerald-500/20"
              >
                Start Free for Your Workplace
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#121826] hover:bg-[#1A2338] text-slate-300 font-semibold text-center text-xs border border-[#1E273D]"
              >
                Sign In to Console
              </Link>
            </div>
          </div>
        )}
      </header>


      {/* ─────────────────────────────────────────────────────────────────────────────
          2. HERO SECTION — IMMERSIVE SAAS FIRST FOLD
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full text-center z-10">
        
        {/* Ambient Top Glow Orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Floating Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md mb-6 shadow-sm shadow-emerald-500/10 animate-ambient-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AuraPass Enterprise 2026 &bull; Autonomous Workplace Biometrics</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
          Attendance that recognizes people, <br className="hidden sm:inline" />
          <span className="specular-text-shimmer">not badges or plastic cards.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Transform any standard IP camera or USB webcam into a sub-300ms facial verification gate.
          Irreversible mathematical embeddings remain 100% on-premise behind your firewall.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-bold shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Start Free for Your Workplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#simulator"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0F1424] hover:bg-[#172036] border border-white/10 hover:border-emerald-500/40 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Launch 3D Simulator</span>
          </a>

          <Link
            to="/docs"
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#0F1424]/60 hover:bg-[#172036] border border-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Documentation</span>
          </Link>
        </div>

        {/* Value Trust Points */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Free starter tier forever</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 10-minute setup on any PC</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100% offline air-gap certified</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Hikvision &bull; Dahua &bull; Axis &bull; Webcams</span>
        </div>

        {/* Hero Interactive Terminal & Quantitative Metrics */}
        <div className="mt-12 liquid-glass-panel rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto text-left shadow-2xl relative overflow-hidden">
          
          {/* Top Hardware bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-slate-400 ml-2">gate_camera_01.local</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MediaPipe BlazeFace + Facenet512 Active</span>
            </div>
          </div>

          {/* Verification Event Card */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                RP
              </div>
              <div>
                <p className="font-bold text-white flex items-center gap-2">
                  <span>Rajesh Patel</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    EMP-0142
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">Engineering &bull; Checked In at 09:02 AM &bull; Front Gate Lane 01</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                99.4% Match
              </span>
              <span className="px-2 py-0.5 rounded bg-[#162032] text-slate-300">
                242 ms Latency
              </span>
            </div>
          </div>

          {/* 4 Quantitative Proof Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-2">
            <div className="p-3.5 rounded-xl bg-[#090D17] border border-white/[0.06]">
              <p className="text-2xl font-extrabold text-white font-mono">99.4%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">LFW Verified Accuracy</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090D17] border border-white/[0.06]">
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">&lt; 300ms</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sub-Second Check-In</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090D17] border border-white/[0.06]">
              <p className="text-2xl font-extrabold text-white font-mono">0 Bytes</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cloud Biometric Egress</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090D17] border border-white/[0.06]">
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">100%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Airgap Network Resilience</p>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          3. MULTI-MODE 3D HARDWARE SIMULATOR
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="simulator" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Hardware Simulation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See how the system responds in real time
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-lg mx-auto">
            Test standard employee verification, spoofing attack rejection, or glasses tolerance.
          </p>

          {/* Test Mode Switcher */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => { setSimMode('standard'); triggerSimulation('standard'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                simMode === 'standard'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-[#0E1422] text-slate-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Standard Check-In</span>
            </button>

            <button
              type="button"
              onClick={() => { setSimMode('spoofing'); triggerSimulation('spoofing'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                simMode === 'spoofing'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-[#0E1422] text-slate-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Photo / Screen Spoofing</span>
            </button>

            <button
              type="button"
              onClick={() => { setSimMode('glasses'); triggerSimulation('glasses'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                simMode === 'glasses'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#0E1422] text-slate-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              <Glasses className="w-3.5 h-3.5 text-cyan-400" />
              <span>Glasses / Mask Tolerance</span>
            </button>
          </div>
        </div>

        {/* 3D Tilt Card */}
        <div
          className="max-w-3xl mx-auto"
          style={{ perspective: 1200 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={cardRef}
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full liquid-glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            {/* Terminal bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-400 ml-2">kiosk_terminal_01.local</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>RTSP Stream &bull; 30 FPS Active</span>
              </div>
            </div>

            {/* Viewport with Image & Overlays */}
            <div className="relative aspect-[16/9] w-full rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden group">
              <img
                src="/aurapass_kiosk_preview.jpg"
                alt="AuraPass Enterprise Biometric Interface Preview"
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/50 pointer-events-none" />

              {/* Scanning HUD Overlay Line */}
              {simState === 'scanning' && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanline pointer-events-none z-20" />
              )}

              {/* Center Reticle */}
              <div
                className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  simState === 'verified'
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.4)]'
                    : simState === 'rejected'
                    ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.4)]'
                    : simState === 'scanning'
                    ? 'border-emerald-400 animate-spin bg-emerald-500/10'
                    : 'border-emerald-500/35 bg-black/40 backdrop-blur-xs'
                }`}
              >
                <div className="absolute top-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <div className="absolute bottom-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <div className="absolute left-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <div className="absolute right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />

                {simState === 'verified' ? (
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-50 duration-300" />
                ) : simState === 'rejected' ? (
                  <AlertTriangle className="w-14 h-14 text-rose-400 animate-in zoom-in-50 duration-300" />
                ) : simState === 'scanning' ? (
                  <Scan className="w-12 h-12 text-emerald-400" />
                ) : (
                  <Fingerprint className="w-12 h-12 text-emerald-400/70" />
                )}
              </div>

              {/* Top HUD Badges */}
              <div className="absolute top-3 left-3 z-10 font-mono text-[11px] space-y-0.5 text-slate-300 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <p>Status: <span className="text-white uppercase font-bold">{simState}</span></p>
                <p>Mode: <span className="text-emerald-400 font-semibold">{simMode}</span></p>
              </div>

              <div className="absolute top-3 right-3 z-10 font-mono text-[11px] text-right space-y-0.5 text-slate-300 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <p>Latency: <span className="text-emerald-400 font-bold">{simState === 'idle' ? '—' : `${simTime} ms`}</span></p>
                <p>Anti-Spoofing: <span className="text-slate-300">Active</span></p>
              </div>

              {/* Verified Result Banner */}
              {simState === 'verified' && (
                <div className="absolute bottom-3 left-3 right-3 z-10 p-3 sm:p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-2 shadow-xl gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Attendance Marked &bull; Rajesh Patel (EMP-0142) &bull; 09:02 AM</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                    Confidence: 99.4% &bull; Turnstile Unlocked
                  </span>
                </div>
              )}

              {/* Spoofing Rejected Banner */}
              {simState === 'rejected' && (
                <div className="absolute bottom-3 left-3 right-3 z-10 p-3 sm:p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-2 shadow-xl gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Spoofing Detected &bull; Photo / Screen Presentation Blocked</span>
                  </div>
                  <span className="font-mono text-[11px] text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50">
                    Liveness Failed &bull; Access Denied
                  </span>
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => triggerSimulation(simMode)}
                  disabled={simState === 'scanning'}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Simulate Check-In Event</span>
                </button>

                {(simState === 'verified' || simState === 'rejected') && (
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="px-3.5 py-2.5 rounded-xl bg-[#161D2B] hover:bg-[#20293C] border border-[#232B3E] text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero data egress &bull; Inferred strictly on your host</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          4. HOW IT WORKS ARCHITECTURAL PIPELINE (INTERACTIVE)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pipeline" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Layers className="w-3.5 h-3.5" />
            Computer Vision Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How face recognition executes in under 300ms
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Click any step to inspect the exact computer vision algorithms operating in memory.
          </p>
        </div>

        {/* 4 Interactive Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activePipelineStep === idx;
            return (
              <div
                key={step.step}
                onClick={() => setActivePipelineStep(idx)}
                className={`p-5 rounded-2xl liquid-glass-card cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-400/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 -translate-y-1'
                    : 'hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                    {step.step}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{step.metric}</span>
                </div>

                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4" />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                <p className="text-[11px] font-mono text-emerald-400 mb-2">{step.tag}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5. ASYMMETRIC BENTO GRID: ENTERPRISE CAPABILITIES
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Zap className="w-3.5 h-3.5" />
            Enterprise Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for high-throughput workplace operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Practical, enterprise-tested tools for operations directors, HR managers, and security teams.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Bento 1: Large Span 2 */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl liquid-glass-panel relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Live Audit & Reporting
              </span>
              <span className="text-xs font-mono text-slate-400">CSV &bull; Excel &bull; PDF</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Attendance Timeline & Payroll Exports</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mb-6">
              Track workforce arrival timestamps in real time. Automatically calculate on-time, late entry, and early departure statuses with customizable grace rules. Export one-click spreadsheets directly to payroll.
            </p>

            {/* Micro Interface Preview */}
            <div className="p-4 rounded-xl bg-[#090D18] border border-white/[0.06] font-mono text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-[11px] text-slate-400 uppercase font-semibold">
                <span>Staff Member</span>
                <span>Timestamp</span>
                <span>Grace Evaluation</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Rajesh Patel (ENG-01)</span>
                <span className="text-slate-400">09:02 AM</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">ON TIME</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Shivam Petkar (OPS-07)</span>
                <span className="text-slate-400">09:12 AM</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">ON TIME (Within 15m Grace)</span>
              </div>
            </div>
          </div>

          {/* Bento 2: Department Shifts */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass-panel flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-block mb-4">
                Department Rostering
              </span>
              <h3 className="text-lg font-bold text-white mb-2">Custom Shift Policies & Grace Thresholds</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Configure distinct operating hours and grace buffers (e.g. 15 minutes) per department. Reassign staff members across teams with automated policy adherence.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs text-purple-300 font-mono">
              6 Configured Department Shifts
            </div>
          </div>

          {/* Bento 3: 3-Shot Enrollment */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass-panel flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-block mb-4">
                Enrollment Protocol
              </span>
              <h3 className="text-lg font-bold text-white mb-2">3-Shot Rapid Biometric Enrollment</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Capture frontal (0°), left (15°), and right (15°) angles in under 2 minutes. Automated pose validation and sharpness filters prevent blurry captures.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs text-cyan-300 font-mono">
              &lt; 2 Minutes Per Employee
            </div>
          </div>

          {/* Bento 4: RTSP Cameras Span 2 */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl liquid-glass-panel relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Hardware Compatibility
              </span>
              <span className="text-xs font-mono text-slate-400">RTSP &bull; ONVIF &bull; UVC USB</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Direct IP Camera Stream Orchestration</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mb-4">
              Connect existing surveillance cameras across entrance lanes, turnstiles, and lobby doors. Automatic stream reconnects, substream bandwidth tuning, and multi-camera mosaic monitoring.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300">
              <span className="px-2.5 py-1 rounded bg-[#0A0E18] border border-white/10">Hikvision</span>
              <span className="px-2.5 py-1 rounded bg-[#0A0E18] border border-white/10">Dahua</span>
              <span className="px-2.5 py-1 rounded bg-[#0A0E18] border border-white/10">Axis</span>
              <span className="px-2.5 py-1 rounded bg-[#0A0E18] border border-white/10">Hanwha</span>
              <span className="px-2.5 py-1 rounded bg-[#0A0E18] border border-white/10">Logitech USB</span>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          6. VERIFIED PRODUCT SHOWCASE (AUTHENTIC SAAS PREVIEW)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="showcase" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Laptop className="w-3.5 h-3.5" />
            Software Interface
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for professional enterprise administrators
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Switch between authentic modules from our production SaaS console.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-6">
          {[
            { id: 0, label: "Live Attendance Console", icon: Activity },
            { id: 1, label: "Department Rostering", icon: Building },
            { id: 2, label: "Hardware Kiosk Mode", icon: MonitorCheck },
            { id: 3, label: "Biometric Model Telemetry", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeShowcaseTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveShowcaseTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-[#0E1320] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-[#141C2C]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Display Panel */}
        <div className="liquid-glass-panel rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Top chrome bar */}
          <div className="px-5 py-3.5 bg-[#0D121D] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-slate-400 ml-2">
                {activeShowcaseTab === 0 && "https://app.aurapass.local/attendance"}
                {activeShowcaseTab === 1 && "https://app.aurapass.local/departments"}
                {activeShowcaseTab === 2 && "https://kiosk.aurapass.local/kiosk"}
                {activeShowcaseTab === 3 && "https://app.aurapass.local/models"}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Production Ready
            </span>
          </div>

          {/* TAB 0: LIVE ATTENDANCE CONSOLE */}
          {activeShowcaseTab === 0 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Daily Attendance Records</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time attendance events processed via on-premise cameras.</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    3 Active Staff Verified
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[#141C2B] text-slate-300 border border-white/[0.08]">
                    Today: 100% Present
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Employee Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Match Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-300">
                    <tr>
                      <td className="py-3.5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">RP</div>
                        <div>
                          <p>Rajesh Patel</p>
                          <p className="text-[10px] text-slate-400 font-mono">EMP-0142</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">Engineering</td>
                      <td className="py-3.5 font-mono text-slate-400">09:02:14 AM</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ON TIME
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-emerald-400 font-bold">99.4%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">SP</div>
                        <div>
                          <p>Shivam Petkar</p>
                          <p className="text-[10px] text-slate-400 font-mono">EMP-007</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">Operations</td>
                      <td className="py-3.5 font-mono text-slate-400">09:11:42 AM</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ON TIME
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-emerald-400 font-bold">98.9%</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">VV</div>
                        <div>
                          <p>Vatsal Vadgama</p>
                          <p className="text-[10px] text-slate-400 font-mono">EMP-001</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">Quality Assurance</td>
                      <td className="py-3.5 font-mono text-slate-400">09:14:05 AM</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ON TIME
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-emerald-400 font-bold">99.2%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 1: DEPARTMENT ROSTERING */}
          {activeShowcaseTab === 1 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Department Schedules & Grace Policies</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Automated late thresholds and working hours per organizational unit.</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                  6 Configured Departments
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0A0D15] border border-white/[0.06]">
                  <p className="text-xs font-bold text-white">Engineering</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">09:00 AM &ndash; 06:00 PM</p>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Grace Policy:</span>
                    <span className="font-mono text-emerald-400 font-bold">15 min standard</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#0A0D15] border border-white/[0.06]">
                  <p className="text-xs font-bold text-white">Operations</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">08:00 AM &ndash; 05:00 PM</p>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Grace Policy:</span>
                    <span className="font-mono text-emerald-400 font-bold">10 min strict</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#0A0D15] border border-white/[0.06]">
                  <p className="text-xs font-bold text-white">Quality Assurance</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">09:30 AM &ndash; 06:30 PM</p>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Grace Policy:</span>
                    <span className="font-mono text-emerald-400 font-bold">15 min standard</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE KIOSK MODE */}
          {activeShowcaseTab === 2 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Standalone Kiosk Terminal Interface</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Touchscreen and tablet view optimized for reception and turnstile kiosks.</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                  v2.0 Kiosk Engine
                </span>
              </div>

              <div className="p-8 rounded-2xl bg-black border border-white/[0.08] flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-400 bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h5 className="text-base font-bold text-white">Welcome, Rajesh Patel</h5>
                <p className="text-xs text-slate-400 mt-0.5">Engineering Department &bull; Entry Recorded</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-mono">
                  <span>Confidence: 99.4%</span>
                  <span>&bull;</span>
                  <span>Latency: 242ms</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODEL TELEMETRY */}
          {activeShowcaseTab === 3 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Biometric Model Diagnostics & Vectors</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Deep neural network telemetry, embedding dimensions, and distance metrics.</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                  Active Model: Facenet512
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#0A0D15] border border-white/[0.06]">
                  <p className="text-slate-400">Embedding Dimension</p>
                  <p className="text-xl font-bold text-white mt-1">512-d Float32</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Unit Normalized</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0A0D15] border border-white/[0.06]">
                  <p className="text-slate-400">Distance Metric</p>
                  <p className="text-xl font-bold text-white mt-1">Cosine Similarity</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Calibrated Threshold: 0.40</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0A0D15] border border-white/[0.06]">
                  <p className="text-slate-400">Inference Hardware</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">CPU / CUDA ONNX</p>
                  <p className="text-[10px] text-slate-400 mt-1">Zero Cloud Latency</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          7. PRICING SECTION — CLEAR, POLISHED, CONVINCING SAAS TIERS
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Zap className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Start completely free. Scale with your facilities.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Zero per-scan transaction fees. No hidden cloud surge pricing.
          </p>

          {/* Billing Interval Switcher */}
          <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-[#0D121D] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingInterval === 'monthly'
                  ? 'bg-[#182236] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                billingInterval === 'annual'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-400 text-slate-950">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Starter Tier */}
          <div className="p-7 rounded-3xl liquid-glass-panel flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#161E2E] text-slate-300">
                Small Team / Single Gate
              </span>
              <h3 className="text-xl font-bold text-white mt-3">Starter</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">For pilot testing, single-site offices, and startups.</p>
              
              <div className="mt-5 mb-6">
                <span className="text-4xl font-extrabold text-white font-mono">$0</span>
                <span className="text-xs text-slate-400"> / free forever</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-3 border-t border-white/[0.08] pt-5">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 200 enrolled employees</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 5 camera streams</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 100% on-premise SQLite database</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Full sub-300ms verification speed</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Daily attendance logs & CSV export</li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3 rounded-xl bg-[#141C2C] hover:bg-[#1E2940] border border-white/[0.08] text-white font-bold text-xs text-center transition-all block cursor-pointer"
            >
              Start Free Today
            </Link>
          </div>

          {/* Business Pro Tier */}
          <div className="p-7 sm:p-8 rounded-3xl liquid-glass-panel glow-border-emerald flex flex-col justify-between relative shadow-2xl shadow-emerald-950/40 transform md:-translate-y-2">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-md">
              Most Popular
            </div>
            
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400">
                Workplaces & Factories
              </span>
              <h3 className="text-2xl font-bold text-white mt-3">Business</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">For multi-gate factories, corporate HQs, and busy campuses.</p>
              
              <div className="mt-5 mb-6">
                <span className="text-4xl font-extrabold text-white font-mono">
                  {billingInterval === 'annual' ? '$399' : '$499'}
                </span>
                <span className="text-xs text-slate-400"> / facility / month</span>
              </div>

              <ul className="text-xs text-slate-200 space-y-3 border-t border-white/[0.08] pt-5">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 5,000 employees</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited RTSP camera lanes</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> PostgreSQL support with auto-backup</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Detailed tamper-evident audit logs</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Department grace periods & roster rules</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Priority 2-hour SLA email & phone support</li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs text-center transition-all shadow-lg shadow-emerald-500/25 block cursor-pointer active:scale-98"
            >
              Get Business Tier &rarr;
            </Link>
          </div>

          {/* Custom Enterprise */}
          <div className="p-7 rounded-3xl liquid-glass-panel flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-400">
                Defense & High Security
              </span>
              <h3 className="text-xl font-bold text-white mt-3">Custom Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">For multi-campus sites, defense facilities, and airports.</p>
              
              <div className="mt-5 mb-6">
                <span className="text-3xl font-extrabold text-white font-mono">Custom</span>
                <span className="text-xs text-slate-400"> / dedicated appliances</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-3 border-t border-white/[0.08] pt-5">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 shrink-0" /> 50,000+ employee vector capacity</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 shrink-0" /> Pre-configured 1U rackmount appliances</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 shrink-0" /> Custom physical turnstile GPIO integration</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 shrink-0" /> 100% offline air-gapped updates</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 shrink-0" /> Dedicated Enterprise Solutions Architect</li>
              </ul>
            </div>

            <Link
              to="/support"
              className="mt-8 w-full py-3 rounded-xl bg-[#141C2C] hover:bg-[#1E2940] border border-white/[0.08] text-white font-bold text-xs text-center transition-all block cursor-pointer"
            >
              Contact Engineering
            </Link>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          8. BIOMETRIC SOVEREIGNTY & PRIVACY
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="sovereignty" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Lock className="w-3.5 h-3.5" />
            Biometric Data Sovereignty
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for enterprise privacy and zero cloud vulnerability
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Your employees' biological data should never sit on public cloud infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl liquid-glass-panel">
            <Server className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">100% On-Premise Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every inference step runs entirely on your local office workstation or dedicated server. The software operates behind your corporate firewall without requiring outside internet traffic.
            </p>
          </div>

          <div className="p-6 rounded-3xl liquid-glass-panel">
            <Fingerprint className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Irreversible Mathematical Vectors</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Faces are mapped into irreversible 512-dimensional numerical vectors. It is mathematically impossible to reconstruct the original human photograph from these coordinate embeddings.
            </p>
          </div>

          <div className="p-6 rounded-3xl liquid-glass-panel">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Regulatory Compliance Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Architected to satisfy strict global privacy mandates including GDPR Article 9 (Special Category Biometrics), Illinois BIPA, and California CCPA/CPRA employee rights standards.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          9. ARCHITECTURAL COMPARISON MATRIX
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Objective Architectural Comparison
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why on-premise facial AI replaces legacy badges
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Compare biometric architectures across security, throughput, and privacy dimensions.
          </p>
        </div>

        <div className="liquid-glass-panel rounded-3xl overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 bg-[#0E1320]">
                <th className="p-4 font-semibold">Evaluation Criteria</th>
                <th className="p-4 text-emerald-400 font-bold bg-emerald-500/5">AuraPass (On-Premise)</th>
                <th className="p-4 text-slate-300 font-medium">Public Cloud Face AI</th>
                <th className="p-4 text-slate-300 font-medium">RFID Plastic Cards</th>
                <th className="p-4 text-slate-300 font-medium">Manual Paper / Punch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              <tr>
                <td className="p-4 font-semibold text-white">Biometric Privacy</td>
                <td className="p-4 font-bold text-emerald-400 bg-emerald-500/5">100% Local (0 Bytes Egress)</td>
                <td className="p-4 text-rose-400">Uploaded to third-party cloud</td>
                <td className="p-4 text-slate-400">N/A (Card Only)</td>
                <td className="p-4 text-slate-400">N/A (Publicly Visible)</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Offline Resilience</td>
                <td className="p-4 font-bold text-emerald-400 bg-emerald-500/5">Fully functional without internet</td>
                <td className="p-4 text-rose-400">Total outage during network drops</td>
                <td className="p-4 text-emerald-400 font-semibold">Functional offline</td>
                <td className="p-4 text-emerald-400 font-semibold">Functional offline</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Buddy Punching Prevention</td>
                <td className="p-4 font-bold text-emerald-400 bg-emerald-500/5">100% (Biological Face + Liveness)</td>
                <td className="p-4 text-emerald-400 font-semibold">Prevented</td>
                <td className="p-4 text-rose-400">High Risk (Cards passed between friends)</td>
                <td className="p-4 text-rose-400">Zero Protection (Fake signatures)</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Verification Speed</td>
                <td className="p-4 font-bold text-emerald-400 bg-emerald-500/5">&lt; 300 ms (Sub-second)</td>
                <td className="p-4 text-slate-400">1,200 &ndash; 3,500 ms (Network lag)</td>
                <td className="p-4 text-slate-300">1 &ndash; 2 seconds (Slow badge scan)</td>
                <td className="p-4 text-rose-400">15 &ndash; 30 seconds per worker</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Recurring Badge Costs</td>
                <td className="p-4 font-bold text-emerald-400 bg-emerald-500/5">$0 (Uses employee's face)</td>
                <td className="p-4 text-slate-400">Expensive per-user cloud fees</td>
                <td className="p-4 text-rose-400">$5 &ndash; $15 per lost/damaged badge</td>
                <td className="p-4 text-slate-400">Paper registers & binders</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          10. FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full border-t border-white/[0.08] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Common Inquiries
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Clear, honest answers about privacy, hardware compatibility, and deployment.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isExpanded = expandedFaq === i;
            return (
              <div
                key={i}
                className="rounded-2xl liquid-glass-panel overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isExpanded}
                >
                  <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          11. FINAL HIGH-IMPACT CLOSING CTA
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full z-10">
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0F1626] to-[#070B14] p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl shadow-emerald-950/40">
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4">
              Deploy in Under 10 Minutes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to modernize workplace attendance with total data privacy?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
              Start with our free starter tier on your local machine. No credit card required. Connect your standard USB webcam or IP camera immediately.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Create Free Organization Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#141C2B] hover:bg-[#1C263A] border border-white/10 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Explore Full Documentation</span>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          12. LIQUID GLASS FOOTER
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#05070D] py-14 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Scan className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white">AuraPass Enterprise</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              High-throughput biometric attendance & organization management engine. Engineered for 100% on-premise execution with cryptographic data sovereignty.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Local On-Premise Engine v2026.2</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Product</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#simulator" className="hover:text-emerald-400 transition-colors">3D Simulator</a></li>
              <li><a href="#pipeline" className="hover:text-emerald-400 transition-colors">Vision Pipeline</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Attendance History</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Department Rostering</a></li>
              <li><a href="#showcase" className="hover:text-emerald-400 transition-colors">Kiosk Mode Terminal</a></li>
            </ul>
          </div>

          {/* Column 2: Documentation */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Documentation</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">Quickstart Guide</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">Camera & RTSP Setup</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">3-Shot Enrollment</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">REST API Reference</Link></li>
              <li><Link to="/support" className="hover:text-emerald-400 transition-colors">Help Center & FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Trust */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Legal & Trust</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><a href="#sovereignty" className="hover:text-emerald-400 transition-colors">Biometric Sovereignty</a></li>
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">GDPR & BIPA Mandate</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Zero Third-Party Tracking &bull; Air-Gap Certified Architecture</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
