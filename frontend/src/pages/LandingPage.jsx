import React, { useState, useRef, useEffect } from 'react';
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
  Laptop
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

  // Kiosk Simulation State
  const [simState, setSimState] = useState('idle'); // idle | scanning | verified
  const [simTime, setSimTime] = useState(264);

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
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const triggerSimulation = () => {
    if (simState === 'scanning') return;
    setSimState('scanning');
    const start = performance.now();

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - start + 210);
      setSimTime(elapsed);
      setSimState('verified');
    }, 550);
  };

  const resetSimulation = () => {
    setSimState('idle');
  };

  const faqs = [
    {
      q: "Does any employee photo or biometric data leave our network?",
      a: "Never. AuraPass is engineered as an on-premise biometric engine. All facial landmark detection, 512-dimensional vector extraction, and database matching execute locally on your workplace machine. No photographs, face crops, or embeddings are ever transmitted to any external cloud API."
    },
    {
      q: "How does the system prevent spoofing with printed photos or phone screens?",
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
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER / MARKETING NAVIGATION
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#1A2234] bg-[#080B11]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/60 transition-colors shadow-sm shadow-emerald-500/10">
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
            <a href="#simulator" className="hover:text-white transition-colors">Simulator</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#sovereignty" className="hover:text-white transition-colors">Security & Privacy</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <Link to="/docs" className="hover:text-emerald-400 text-emerald-400/90 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </nav>

          {/* Action CTAs & Mobile Hamburger */}
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
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer items-center gap-1.5"
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
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                How It Works
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
                href="#sovereignty"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Biometric Sovereignty
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Architecture Comparison
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#131A29] hover:text-white transition-colors"
              >
                Frequently Asked Questions
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
          2. HERO SECTION
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full text-center z-10">
        
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1422] border border-[#20293D] text-slate-300 text-xs font-medium mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local On-Premise Engine &bull; Zero Cloud Dependency &bull; Cryptographic Biometric Privacy</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Attendance that recognizes people, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            not cards or passwords.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Employees walk past your cameras and check in within 300 milliseconds.
          Irreversible 512-dimensional biometric embeddings remain strictly inside your facility.
          Zero cloud latency, zero external data risks.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Start Free for Your Workplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#simulator"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0E1320] hover:bg-[#151D2E] border border-[#20283C] hover:border-[#2C3854] text-slate-200 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Try 3D Simulator</span>
          </a>

          <Link
            to="/docs"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0E1320]/60 hover:bg-[#151D2E] border border-[#1A2234] text-slate-400 hover:text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Architecture Docs</span>
          </Link>
        </div>

        {/* 4 Core Quantitative Metrics */}
        <div className="mt-14 pt-8 border-t border-[#1A2234] grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-[#0C101A] border border-[#1B2336] shadow-sm">
            <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">99.4%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">LFW Verified Accuracy</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0C101A] border border-[#1B2336] shadow-sm">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">&lt; 300ms</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sub-Second Check-In</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0C101A] border border-[#1B2336] shadow-sm">
            <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">0 Bytes</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cloud Biometric Egress</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0C101A] border border-[#1B2336] shadow-sm">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">100%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Airgap Network Resilience</p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          3. INTERACTIVE 3D KIOSK SIMULATOR
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="simulator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Hardware Simulation
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Experience sub-second recognition in real time
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-lg mx-auto">
            Hover over the terminal to test the 3D perspective. Click the test button to trigger a live face verification cycle.
          </p>
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
            className="w-full bg-[#0D121D] border border-[#20293D] rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black relative overflow-hidden"
          >
            {/* Terminal bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1C2538] mb-5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-400 ml-2">kiosk_terminal_01.local</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>RTSP Feed Active &bull; 30 FPS</span>
              </div>
            </div>

            {/* Camera Viewport with Real AI Interface Preview */}
            <div className="relative aspect-[16/9] w-full rounded-xl bg-black border border-[#1A2234] flex items-center justify-center overflow-hidden group">
              <img
                src="/aurapass_kiosk_preview.jpg"
                alt="AuraPass Enterprise Biometric Interface Preview"
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45 pointer-events-none" />

              {/* Center Face Reticle Overlay */}
              <div
                className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  simState === 'verified'
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_35px_rgba(52,211,153,0.4)]'
                    : simState === 'scanning'
                    ? 'border-emerald-400 animate-spin bg-emerald-500/10'
                    : 'border-emerald-500/30 bg-black/40 backdrop-blur-xs'
                }`}
              >
                {/* 4 Alignment Dots */}
                <div className="absolute top-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <div className="absolute bottom-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <div className="absolute left-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <div className="absolute right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />

                {simState === 'verified' ? (
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-50 duration-300" />
                ) : simState === 'scanning' ? (
                  <Scan className="w-12 h-12 text-emerald-400" />
                ) : (
                  <Fingerprint className="w-12 h-12 text-emerald-400/70" />
                )}
              </div>

              {/* Top HUD Badges */}
              <div className="absolute top-3 left-3 z-10 font-mono text-[11px] space-y-0.5 text-slate-300 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-emerald-500/20">
                <p>Status: <span className="text-white uppercase font-bold">{simState}</span></p>
                <p>Liveness: <span className={simState === 'verified' ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>Real Person Pass</span></p>
              </div>

              <div className="absolute top-3 right-3 z-10 font-mono text-[11px] text-right space-y-0.5 text-slate-300 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-emerald-500/20">
                <p>Latency: <span className="text-emerald-400 font-bold">{simState === 'verified' ? `${simTime} ms` : '—'}</span></p>
                <p>Location: <span className="text-slate-300">HQ Gate Lane 01</span></p>
              </div>

              {/* Access Banner on Verification */}
              {simState === 'verified' && (
                <div className="absolute bottom-3 left-3 right-3 z-10 p-3 sm:p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-2 shadow-xl gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Attendance Marked &bull; Rajesh Patel (EMP-0142) &bull; 09:02 AM</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                    Match 99.4% (Facenet512)
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Simulation Controls */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={triggerSimulation}
                  disabled={simState === 'scanning'}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Simulate Employee Entry</span>
                </button>

                {simState === 'verified' && (
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
                <span>Zero biometric egress &bull; Inferred strictly locally</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          4. HOW IT WORKS (VISUAL 4-STEP PIPELINE)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Layers className="w-3.5 h-3.5" />
            Architectural Pipeline
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            From camera frame to verified record in 4 stages
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            AuraPass handles the complete computer vision pipeline entirely in memory on your host machine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638] relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3.5 font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Multi-Scale Detection
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard RTSP or USB frames are inspected using MediaPipe BlazeFace / RetinaFace to locate facial bounding boxes and landmarks up to 5 meters away.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638] relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3.5 font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Liveness & Anti-Spoofing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time passive presentation attack detection analyzes surface texture, screen moiré patterns, and specular reflection to reject photos or video replays.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638] relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3.5 font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              512-d Vectorization
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The aligned crop is transformed into an irreversible 512-dimensional unit vector using Facenet512. The vector represents geometry, not image pixels.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638] relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3.5 font-mono font-bold text-xs">
              04
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Match & Access Relay
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates cosine distance against enrolled tenant vectors in sub-50ms. Logs the attendance entry and optionally triggers turnstile or door relay GPIO.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5. ENTERPRISE CAPABILITIES
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Zap className="w-3.5 h-3.5" />
            Core Enterprise Features
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for high-volume corporate and industrial facilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Robust tools for operations directors, security managers, and human resources teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live Attendance & Reporting</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Track workforce entries and exits in real time. Filter by date, department, or status, and export full reports to CSV, Excel, or printable PDF in seconds.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> One-click payroll spreadsheet export</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Real-time status badges (On Time, Late, Exit)</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">3-Shot Biometric Enrollment</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Enrolls new staff members in under two minutes with automated pose validation (frontal, left 15°, right 15°) and automated blur/sharpness gating.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Multi-photo embedding fusion</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Works with glasses, light facial hair, and masks</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Department Rostering & Shifts</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Configure department work shifts, custom grace period policies (e.g. 15-min tolerance), and assign staff members to specific departmental schedules.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Automated grace period calculations</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Multi-shift scheduling (Day, Evening, Night)</li>
            </ul>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Multi-Camera RTSP Streams</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Connect multiple IP security cameras across turnstiles, loading docks, and front lobby doors with automatic reconnection and heartbeat monitoring.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Hikvision, Dahua, Axis, Hanwha compatible</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Multi-lane camera mosaic view included</li>
            </ul>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <MonitorCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Dedicated Kiosk Terminal Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Full-screen dedicated tablet and touch terminal UI with voice chime prompts, large visual pass/fail rings, and zero distracting navigation elements.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Touchscreen optimized for iPad or Android tablets</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Pin-protected admin console exit</li>
            </ul>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Cryptographic Audit Logging</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Tamper-evident logs of all administrative actions, model retrain events, staff photo deletions, and camera configuration adjustments for compliance.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> ISO/IEC 27001 & SOC 2 compliance readiness</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Role-based access control (Admin, Manager, Staff)</li>
            </ul>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          6. VERIFIED PRODUCT SHOWCASE (INTERACTIVE TABS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="showcase" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Laptop className="w-3.5 h-3.5" />
            Product Interface
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built with modern enterprise design standards
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Explore authentic views from our live SaaS console and on-premise hardware kiosk.
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
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'bg-[#0E1320] border border-[#1E2638] text-slate-400 hover:text-white hover:bg-[#141C2C]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Display Panel */}
        <div className="rounded-2xl border border-[#1E2638] bg-[#0A0D15] overflow-hidden shadow-2xl">
          
          {/* Top chrome bar */}
          <div className="px-5 py-3.5 bg-[#0D121D] border-b border-[#1E2638] flex items-center justify-between text-xs font-mono">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2538] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Daily Attendance Records</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time attendance events processed via on-premise cameras.</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    3 Active Staff Verified
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[#141C2B] text-slate-300 border border-[#1E283C]">
                    Today: 100% Present
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Employee Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Match Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161D2B] text-slate-300">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2538] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Department Schedules & Grace Policies</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Automated late thresholds and working hours per organizational unit.</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                  6 Configured Departments
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
                  <p className="text-xs font-bold text-white">Engineering</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">09:00 AM &ndash; 06:00 PM</p>
                  <div className="mt-3 pt-3 border-t border-[#1C2538] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Grace Policy:</span>
                    <span className="font-mono text-emerald-400 font-bold">15 min standard</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
                  <p className="text-xs font-bold text-white">Operations</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">08:00 AM &ndash; 05:00 PM</p>
                  <div className="mt-3 pt-3 border-t border-[#1C2538] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Grace Policy:</span>
                    <span className="font-mono text-emerald-400 font-bold">10 min strict</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
                  <p className="text-xs font-bold text-white">Quality Assurance</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">09:30 AM &ndash; 06:30 PM</p>
                  <div className="mt-3 pt-3 border-t border-[#1C2538] flex items-center justify-between text-[11px]">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2538] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Standalone Kiosk Terminal Interface</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Touchscreen and tablet view optimized for reception and turnstile kiosks.</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                  v2.0 Kiosk Engine
                </span>
              </div>

              <div className="p-6 rounded-xl bg-black border border-[#1C2538] flex flex-col items-center justify-center text-center relative overflow-hidden">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2538] pb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Biometric Model Diagnostics & Vectors</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Deep neural network telemetry, embedding dimensions, and distance metrics.</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                  Active Model: Facenet512
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
                  <p className="text-slate-400">Embedding Dimension</p>
                  <p className="text-xl font-bold text-white mt-1">512-d Float32</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Unit Normalized</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
                  <p className="text-slate-400">Distance Metric</p>
                  <p className="text-xl font-bold text-white mt-1">Cosine Similarity</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Calibrated Threshold: 0.40</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
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
          7. BIOMETRIC SOVEREIGNTY & PRIVACY
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="sovereignty" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Lock className="w-3.5 h-3.5" />
            Biometric Data Sovereignty
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built for enterprise privacy and zero cloud vulnerability
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Your employees' biological data should never sit on public cloud infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <Server className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">100% On-Premise Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every inference step runs entirely on your local office workstation or dedicated server. The software operates behind your corporate firewall without requiring outside internet traffic.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <Fingerprint className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Irreversible Mathematical Vectors</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Faces are mapped into irreversible 512-dimensional numerical vectors. It is mathematically impossible to reconstruct the original human photograph from these coordinate embeddings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Regulatory Compliance Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Architected to satisfy strict global privacy mandates including GDPR Article 9 (Special Category Biometrics), Illinois BIPA, and California CCPA/CPRA employee rights standards.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          8. COMPARISON MATRIX: ON-PREMISE VS CLOUD VS RFID
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="comparison" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Objective Architectural Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Why on-premise facial AI replaces legacy badges
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Compare biometric architectures across security, throughput, and privacy dimensions.
          </p>
        </div>

        <div className="rounded-2xl border border-[#1E2638] bg-[#0A0D15] overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1E2638] text-slate-400 bg-[#0E1320]">
                <th className="p-4 font-semibold">Evaluation Criteria</th>
                <th className="p-4 text-emerald-400 font-bold bg-emerald-500/5">AuraPass (On-Premise)</th>
                <th className="p-4 text-slate-300 font-medium">Public Cloud Face AI</th>
                <th className="p-4 text-slate-300 font-medium">RFID Plastic Cards</th>
                <th className="p-4 text-slate-300 font-medium">Manual Paper / Punch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182030] text-slate-300">
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
          9. REAL-WORLD USE CASES
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="use-cases" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Building className="w-3.5 h-3.5" />
            Deployment Scenarios
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Proven across real-world workplace environments
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            From sterile cleanrooms to high-throughput factory gates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <Building className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1.5">Corporate & Tech Offices</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Eliminate lost keycards and long morning lobby lines with walk-past turnstile face verification.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <Zap className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1.5">Factories & Warehouses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify 100+ shift workers per minute even when hands are dirty, dusty, or wearing heavy gloves.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <BookOpen className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1.5">Educational Campuses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Touchless attendance for classrooms, laboratories, and examination halls without manual roll-calls.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <ShieldCheck className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1.5">Healthcare & Cleanrooms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              100% contactless hygienic entry into sterile labs and surgical wards without physical contact surfaces.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          10. FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Common Inquiries
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
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
                className="rounded-xl border border-[#1E2638] bg-[#0D121D] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : i)}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[#121929] transition-colors"
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
                  <div className="px-4 sm:px-4.5 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-[#1C2538] animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          11. FINAL HIGH-IMPACT CTA
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full z-10">
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0F1626] to-[#080D18] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl shadow-emerald-950/30">
          
          {/* Background subtle radial glow */}
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
              Deploy in Under 10 Minutes
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to modernize workplace attendance with total data privacy?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
              Start with our free starter tier on your local machine. No credit card required. Connect your standard USB webcam or IP camera immediately.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Create Free Organization Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#141C2B] hover:bg-[#1C263A] border border-[#222E46] text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Read Full Documentation</span>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          12. LIQUID GLASS FOOTER
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#1A2234] bg-[#06080E] py-14 px-4 sm:px-6 lg:px-8 z-10">
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
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Attendance History</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Department Rostering</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Kiosk Mode Terminal</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Camera Mosaic View</a></li>
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
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#121826] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
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
