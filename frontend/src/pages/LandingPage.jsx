import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Scan,
  CheckCircle2,
  Shield,
  Lock,
  Cpu,
  Server,
  WifiOff,
  Users,
  Clock,
  AlertTriangle,
  ArrowRight,
  Play,
  Eye,
  FileText,
  ChevronDown,
  Check,
  HelpCircle,
  Laptop,
  Download,
  Sliders,
  RefreshCw,
  Sparkles,
  Building,
  Layers,
  Zap,
  X,
  Menu,
  BookOpen,
  ExternalLink,
  ArrowUp
} from 'lucide-react';
import Badge from '../components/ui/marketing/Badge';
import SectionHeader from '../components/ui/marketing/SectionHeader';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll states for Navbar and sticky elements
  const [scrolledNav, setScrolledNav] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStickyMobileCta, setShowStickyMobileCta] = useState(false);

  // 3D Tilt State for Hero Terminal
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Hero Multi-Camera Stream Switcher
  const [activeHeroStream, setActiveHeroStream] = useState(0);

  // Simulator Scenario: 'standard' | 'spoofing' | 'glasses'
  const [simMode, setSimMode] = useState('standard');
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(6); // 1 to 6
  const [simTime, setSimTime] = useState(184); // ms

  // Interactive Bento Tile 1: Live Attendance Feed Department Filter
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState('all');

  // Interactive Bento Tile 2: Shift Grace Calculator Slider
  const [graceMinutes, setGraceMinutes] = useState(15);

  // Interactive Bento Tile 3: Anti-Spoofing Radar Test Mode
  const [radarTestMode, setRadarTestMode] = useState('live'); // 'live' | 'attack'

  // Interactive Bento Tile 4: 3-Shot Enrollment Active Perspective
  const [enrollmentAngle, setEnrollmentAngle] = useState(0); // 0 (0°), 1 (-15°), 2 (+15°)

  // Interactive Bento Tile 5: GPIO Relay Pulse Test State
  const [relayPulsed, setRelayPulsed] = useState(false);

  // Console Tour Active Tab
  const [activeTourTab, setActiveTourTab] = useState(0);

  // Pricing Interval: 'monthly' | 'annual'
  const [billingInterval, setBillingInterval] = useState('annual');
  const [showPricingCompare, setShowPricingCompare] = useState(false);

  // FAQ Accordion State (single open)
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolledNav(scrollY > 20);
      setShowStickyMobileCta(scrollY > 600 && scrollY < document.body.scrollHeight - 1400);

      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse Move Tilt Effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -3;
    const tiltY = ((x - centerX) / centerX) * 3;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Trigger Hardware Simulation
  const triggerSimulation = (mode = simMode) => {
    if (simRunning) return;
    setSimRunning(true);
    setSimStep(1);

    const timingMap = {
      standard: 184,
      spoofing: 112,
      glasses: 218
    };

    setSimTime(timingMap[mode]);

    let step = 1;
    const interval = setInterval(() => {
      step++;
      setSimStep(step);
      if (step >= 6) {
        clearInterval(interval);
        setSimRunning(false);
      }
    }, 280);
  };

  // Trigger Hardware Relay Pulse
  const triggerRelayPulse = () => {
    setRelayPulsed(true);
    setTimeout(() => {
      setRelayPulsed(false);
    }, 2500);
  };

  // Export Sample Attendance CSV
  const exportSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Badge ID,Employee Name,Department,Timestamp,Status,Confidence\n"
      + "EMP-0142,Rajesh Patel,Quality Assurance,2026-11-03 09:12:04,ON TIME,99.4%\n"
      + "EMP-0089,Sarah Jenkins,Engineering,2026-11-03 09:14:22,ON TIME,98.9%\n"
      + "EMP-0211,Alex Rivera,Operations,2026-11-03 09:18:45,LATE,99.1%\n"
      + "EMP-0105,Vatsal Sharma,Engineering,2026-11-03 09:05:12,ON TIME,99.7%";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "aurapass_attendance_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hero Camera Streams Data
  const HERO_STREAMS = [
    {
      name: "Front Gate Lane 01",
      protocol: "Hikvision DS-2CD • RTSP 1080p",
      location: "Main Facility Turnstiles",
      fps: "29.8 FPS",
      latency: "184 ms",
      employee: "Rajesh Patel",
      badge: "EMP-0142",
      dept: "Quality Assurance",
      time: "09:12:04 AM",
      status: "ON TIME",
      confidence: "99.4%",
      liveness: "98.7% Verified",
      image: "/aurapass_kiosk_preview.jpg"
    },
    {
      name: "Turnstile Gate B",
      protocol: "Dahua IPC-HDBW • RTSP 720p Substream",
      location: "Logistics & Warehouse Gate",
      fps: "30.0 FPS",
      latency: "162 ms",
      employee: "Sarah Jenkins",
      badge: "EMP-0089",
      dept: "Engineering",
      time: "09:14:22 AM",
      status: "ON TIME",
      confidence: "98.9%",
      liveness: "99.1% Verified",
      image: "/landing-bg.png"
    },
    {
      name: "Executive Reception",
      protocol: "Logitech BRIO 4K • Direct USB UVC",
      location: "Headquarters Reception Desk",
      fps: "30.0 FPS",
      latency: "148 ms",
      employee: "Alex Rivera",
      badge: "EMP-0211",
      dept: "Operations",
      time: "09:18:45 AM",
      status: "GRACE PASS",
      confidence: "99.2%",
      liveness: "97.9% Verified",
      image: "/auth-bg.png"
    }
  ];

  // Live Attendance Feed Rows
  const ATTENDANCE_ROWS = [
    { id: "EMP-0142", name: "Rajesh Patel", dept: "QA", time: "09:12:04 AM", status: "ON TIME", confidence: "99.4%", avatar: "RP" },
    { id: "EMP-0089", name: "Sarah Jenkins", dept: "Engineering", time: "09:14:22 AM", status: "ON TIME", confidence: "98.9%", avatar: "SJ" },
    { id: "EMP-0211", name: "Alex Rivera", dept: "Operations", time: "09:18:45 AM", status: "LATE", confidence: "99.1%", avatar: "AR" },
    { id: "EMP-0105", name: "Vatsal Sharma", dept: "Engineering", time: "09:05:12 AM", status: "ON TIME", confidence: "99.7%", avatar: "VS" },
    { id: "EMP-0334", name: "Priya Nair", dept: "QA", time: "09:11:30 AM", status: "ON TIME", confidence: "98.4%", avatar: "PN" },
    { id: "EMP-0412", name: "David Kim", dept: "Operations", time: "09:22:10 AM", status: "LATE", confidence: "99.0%", avatar: "DK" },
  ];

  const filteredAttendance = attendanceDeptFilter === 'all' 
    ? ATTENDANCE_ROWS 
    : ATTENDANCE_ROWS.filter(r => r.dept.toLowerCase() === attendanceDeptFilter.toLowerCase());

  // Defensible FAQ Data per Section 5.11
  const faqs = [
    {
      q: "Does any facial biometric data ever leave our local network?",
      a: "No. AuraPass is an entirely self-hosted biometric engine. Video decoding, face detection via MediaPipe, vector embedding generation via FaceNet512, and vector similarity lookup run 100% locally on your host hardware. Zero bytes of image or vector data are ever transmitted to an external cloud."
    },
    {
      q: "Which security cameras and webcams are compatible?",
      a: "AuraPass works with standard IP security cameras broadcasting H.264 video over RTSP or ONVIF (including Hikvision, Dahua, Axis, and Hanwha Techwin) as well as any standard USB Video Class (UVC) webcam, such as Logitech C920, C922, or BRIO."
    },
    {
      q: "How accurate is facial verification in real-world workplace environments?",
      a: "The underlying FaceNet512 model achieves 99.4% verification accuracy on the academic LFW benchmark. In operational deployments, accuracy depends on proper lighting, mounting cameras at eye level (1.5m–1.7m), and adhering to our 3-shot enrollment standard."
    },
    {
      q: "How does presentation attack detection (PAD) stop photo and phone screen spoofing?",
      a: "Our multi-cue anti-spoofing pipeline combines high-frequency micro-texture analysis, planar color distortion detection, and facial depth gradient estimation. Static 2D paper printouts, tablet screens, and phone replays fail the liveness threshold and are rejected in under 120 ms."
    },
    {
      q: "What happens to employee photographs after enrollment?",
      a: "Photographs can be permanently discarded immediately after vector generation. AuraPass stores only 512-dimensional numeric floating-point vectors from which original facial photographs cannot be reconstructed."
    },
    {
      q: "Is AuraPass compliant with GDPR Article 9, Illinois BIPA, and California CCPA/CPRA?",
      a: "AuraPass is built with the architectural controls required to support compliance with GDPR Article 9, Illinois BIPA, and CCPA/CPRA—including on-premise data residency, irreversible vector storage, and 1-click permanent record purging. Formal legal compliance depends on how your organization obtains employee consent and deploys the system."
    },
    {
      q: "What server hardware is required to run AuraPass?",
      a: "For single-lane offices (up to 500 staff), any standard quad-core Intel i5 or AMD Ryzen workstation with 8 GB RAM is sufficient. For multi-camera facilities with 5+ lanes, an 8-core CPU or an optional dedicated NVIDIA GPU ensures continuous sub-300 ms throughput."
    },
    {
      q: "Can we automatically export attendance records to our existing payroll software?",
      a: "Yes. Attendance events can be filtered by date, shift, or department and exported directly to standardized CSV, Excel, or PDF formats compatible with ADP, QuickBooks, Paychex, and custom ERP systems."
    },
    {
      q: "What support is included with the Business and Enterprise tiers?",
      a: "Business plans include priority email and phone support with a guaranteed 2-hour response SLA during facility operational hours. Enterprise contracts receive a dedicated Solutions Architect, on-site turnstile wiring assistance, and air-gapped container updates."
    }
  ];

  const currentHeroStream = HERO_STREAMS[activeHeroStream];

  return (
    <div className="min-h-screen public-surface bg-[#070A12] text-slate-200 flex flex-col font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Scroll Progress Indicator */}
      <div
        className="scroll-progress-bar"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Hero Ambient Illumination Spotlight */}
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute inset-0 hero-dot-grid" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.1 NAVIGATION (FULL-WIDTH 1720px STICKY HEADER)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolledNav
            ? 'h-16 bg-[#070A12]/90 backdrop-blur-xl border-b border-white/[0.08]'
            : 'h-20 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 h-full flex items-center justify-between">
          
          {/* Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-all shadow-sm shadow-emerald-500/20">
              <Scan className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              AuraPass<sup className="text-[10px] text-emerald-400 font-mono-tag ml-0.5">&trade;</sup>
            </span>
          </Link>

          {/* Desktop Center Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs text-slate-300 font-medium">
            <a href="#simulator" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#sovereignty" className="hover:text-white transition-colors">Sovereignty & Trust</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/docs" className="hover:text-emerald-400 text-emerald-400/90 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <span>Open console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/25 cursor-pointer items-center gap-1.5"
                >
                  <span>Start free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0F1524] border border-white/[0.08] text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Fullscreen Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bg-[#070A12]/98 backdrop-blur-2xl border-b border-white/[0.08] p-6 space-y-5 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4 text-sm font-medium text-slate-200">
              <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="py-1">Interactive Demo</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1">How it works</a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="py-1">Capabilities</a>
              <a href="#sovereignty" onClick={() => setMobileMenuOpen(false)} className="py-1">Sovereignty & Trust</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1">Pricing</a>
              <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="py-1 text-emerald-400">Documentation</Link>
              <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="py-1">Help Center & Support</Link>
            </nav>
            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs text-center shadow-lg shadow-emerald-500/20"
              >
                Start free (Up to 200 Employees)
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 font-semibold text-xs text-center"
              >
                Sign in to Console
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.2 HERO SECTION (AUTONOMOUS BIOMETRIC COMMAND ENGINE)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
          
          {/* Left Column: Technical Narrative (5 Cols) */}
          <div className="lg:col-span-5 text-left space-y-6">
            
            {/* Technical Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono-tag">⚡ Local Engine v2026.2 • Zero Cloud Egress</span>
            </div>

            {/* H1 Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Attendance that recognizes people, <br />
              <span className="specular-text-shimmer">not badges.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Transform standard RTSP security cameras or USB webcams into sub-300 ms facial verification gates. Complete on-premise execution with zero data egress.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                to="/register"
                className="px-7 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Start free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#simulator"
                className="px-6 py-3.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/[0.08] hover:border-emerald-500/30 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>See it work</span>
              </a>
            </div>

            {/* Trust Row */}
            <div className="pt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Free forever starter tier</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Setup in ~10 minutes</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Operates 100% offline</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Hikvision, Dahua, Axis, UVC</span>
            </div>
          </div>

          {/* Right Column: Interactive Multi-Camera Terminal Showcase (7 Cols) */}
          <div
            className="lg:col-span-7 w-full relative"
            style={{ perspective: 1200 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* 3D Tilt Terminal Wrapper */}
            <div
              ref={cardRef}
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full rounded-2xl public-card p-4 sm:p-5 shadow-2xl relative overflow-hidden bg-[#0A0E1A] border border-white/[0.12]"
            >
              {/* Terminal Top Chrome: Camera Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-white/[0.08] mb-3.5 gap-2 text-xs font-mono-tag">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-slate-400 ml-2 font-bold">{currentHeroStream.name}</span>
                </div>

                {/* Multi-Camera Stream Switcher Pills */}
                <div className="flex items-center gap-1 bg-[#05070D] p-1 rounded-lg border border-white/[0.06]">
                  {HERO_STREAMS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveHeroStream(idx)}
                      className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                        activeHeroStream === idx
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cam {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Stream Viewport with 68-Point Mesh Overlay */}
              <div className="relative aspect-[16/10] w-full rounded-xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
                <img
                  src={currentHeroStream.image}
                  alt={currentHeroStream.name}
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 pointer-events-none" />

                {/* Animated HUD Scanline */}
                <div className="absolute inset-x-0 h-[2px] bg-emerald-400/80 shadow-[0_0_12px_#34D399] animate-scanline pointer-events-none" />

                {/* 68-Point Landmark Mesh Vector Simulation */}
                <div className="relative z-10 w-44 h-44 rounded-full border border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_35px_rgba(52,211,153,0.3)] flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full border border-dashed border-emerald-400/30 animate-spin" style={{ animationDuration: '18s' }} />
                  
                  {/* Subtle 68-point mesh constellation markers */}
                  <div className="absolute top-8 left-12 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34D399]" />
                  <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34D399]" />
                  <div className="absolute top-16 left-20 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34D399]" />
                  <div className="absolute top-24 left-14 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34D399]" />
                  <div className="absolute top-24 right-14 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34D399]" />
                  <div className="absolute bottom-10 left-20 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34D399]" />
                  
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                </div>

                {/* HUD Overlay Tags */}
                <div className="absolute top-3 left-3 z-10 text-[11px] font-mono-tag bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Protocol: <strong className="text-white">{currentHeroStream.protocol}</strong></span>
                </div>
                <div className="absolute top-3 right-3 z-10 text-[11px] font-mono-tag bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-emerald-400 font-bold">
                  {currentHeroStream.fps} &bull; {currentHeroStream.latency}
                </div>

                {/* Active Identified Employee Card */}
                <div className="absolute bottom-3 inset-x-3 z-10 bg-[#070A12]/92 backdrop-blur-md rounded-xl p-3 border border-emerald-500/35 flex items-center justify-between text-xs font-mono-tag shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold">
                      {currentHeroStream.employee.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{currentHeroStream.employee} ({currentHeroStream.badge})</p>
                      <p className="text-[11px] text-slate-400 font-normal">{currentHeroStream.dept} &bull; {currentHeroStream.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                      {currentHeroStream.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {currentHeroStream.confidence}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terminal Footer Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs font-mono-tag">
                <div className="p-2.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold">&lt; 300 ms</span>
                  <span className="text-[10px] text-slate-500 block">End-to-End Latency</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold">512-d</span>
                  <span className="text-[10px] text-slate-500 block">Unit Embeddings</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold">0 Bytes</span>
                  <span className="text-[10px] text-slate-500 block">Cloud Data Egress</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Compatibility Strip (Text-Only per Section 5.2) */}
        <div className="mt-14 pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono-tag text-slate-400">
          <span>Works with the security cameras and terminals you already own:</span>
          <div className="flex flex-wrap items-center gap-6 text-slate-300 font-semibold">
            <span className="hover:text-emerald-400 transition-colors">Hikvision</span>
            <span className="hover:text-emerald-400 transition-colors">Dahua</span>
            <span className="hover:text-emerald-400 transition-colors">Axis Communications</span>
            <span className="hover:text-emerald-400 transition-colors">Hanwha Vision</span>
            <span className="hover:text-emerald-400 transition-colors">Logitech USB</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Any RTSP / ONVIF</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.3 "THE PROBLEM" FRAMING STRIP
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl public-card space-y-2.5 border-l-2 border-l-rose-500/60">
            <span className="text-xs font-mono-tag font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
              Badge Vulnerability
            </span>
            <p className="text-sm font-semibold text-white">Badges get lost, shared, and buddy-punched.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Plastic RFID keycards cost $5–$15 each to replace and cannot guarantee genuine human presence.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card space-y-2.5 border-l-2 border-l-amber-500/60">
            <span className="text-xs font-mono-tag font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
              Cloud Privacy Exposure
            </span>
            <p className="text-sm font-semibold text-white">Cloud face systems send employee biometrics off-site.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Transmitting facial imagery over public cloud APIs creates liability under GDPR Article 9 and BIPA.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card space-y-2.5 border-l-2 border-l-cyan-500/60">
            <span className="text-xs font-mono-tag font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 inline-block">
              Timesheet Disputes
            </span>
            <p className="text-sm font-semibold text-white">Manual timesheets cause ongoing payroll disputes.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Disputed arrival times consume hours of HR manager time every single pay period.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 font-mono-tag pt-8">
          AuraPass fixes all three on your own local hardware.
        </p>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.4 INTERACTIVE HARDWARE SIMULATOR ("SEE IT WORK")
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="simulator" className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Interactive Hardware Simulator"
          badgeIcon={Sparkles}
          title="See how face verification works in real time"
          subtitle="Test standard employee arrival, presentation attack rejection, or glasses tolerance."
        />

        {/* Scenario Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => { setSimMode('standard'); triggerSimulation('standard'); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              simMode === 'standard'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            Standard Arrival (0° Frontal)
          </button>
          <button
            type="button"
            onClick={() => { setSimMode('spoofing'); triggerSimulation('spoofing'); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              simMode === 'spoofing'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            Photo & Screen Spoof Rejection
          </button>
          <button
            type="button"
            onClick={() => { setSimMode('glasses'); triggerSimulation('glasses'); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              simMode === 'glasses'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            Daily Glasses & Headwear Tolerance
          </button>
        </div>

        {/* Simulator Shell: Left Viewport (7 Cols), Right Pipeline Timing (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Viewport */}
          <div className="lg:col-span-7 rounded-2xl public-card p-5 flex flex-col justify-between relative overflow-hidden bg-[#0A0E1A]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3 text-xs font-mono-tag">
              <span className="text-slate-400">Camera Terminal: RTSP_CAM_01</span>
              <span className="text-emerald-400 font-bold">Latency: {simTime} ms</span>
            </div>

            <div className="relative aspect-[16/10] w-full rounded-xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
              <img
                src={simMode === 'spoofing' ? '/auth-bg.png' : '/aurapass_kiosk_preview.jpg'}
                alt="Simulator Viewport"
                className={`absolute inset-0 w-full h-full object-cover object-center filter ${
                  simMode === 'spoofing' ? 'grayscale brightness-75' : 'brightness-95'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />

              {/* Status Outcome HUD Banner */}
              {simStep >= 5 && (
                <div
                  className={`absolute z-20 px-5 py-2.5 rounded-xl border backdrop-blur-md text-xs font-mono-tag font-bold flex items-center gap-2 shadow-2xl ${
                    simMode === 'spoofing'
                      ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                      : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {simMode === 'spoofing' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Rejected: Presentation Attack Detected</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Access Granted: Rajesh Patel (99.4%)</span>
                    </>
                  )}
                </div>
              )}

              {/* HUD Corner Data Chips */}
              <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono-tag bg-black/80 px-2.5 py-1 rounded border border-white/10 text-slate-300">
                Mode: <strong className="text-white">{simMode.toUpperCase()}</strong>
              </div>
              <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono-tag bg-black/80 px-2.5 py-1 rounded border border-white/10 text-slate-300">
                Zero Cloud Egress
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => triggerSimulation(simMode)}
                disabled={simRunning}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${simRunning ? 'animate-spin' : ''}`} />
                <span>{simRunning ? 'Executing pipeline...' : 'Simulate check-in again'}</span>
              </button>
              <span className="text-[11px] font-mono-tag text-slate-500">Continuous local loop</span>
            </div>
          </div>

          {/* Right Pipeline Checklist */}
          <div className="lg:col-span-5 rounded-2xl public-card p-6 flex flex-col justify-between text-left space-y-4">
            <div>
              <p className="text-xs font-mono-tag font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Real-Time Inference Pipeline
              </p>
              <h3 className="text-lg font-bold text-white">Under 300 ms End-to-End</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Watch each step execute sequentially in host CPU memory.
              </p>
            </div>

            <div className="space-y-3 font-mono-tag text-xs">
              <div className={`p-3 rounded-xl border transition-all ${
                simStep >= 1 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${simStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1. Video Frame Captured</span>
                  </span>
                  <span className="text-[11px] text-slate-400">12 ms</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                simStep >= 2 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${simStep >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>2. MediaPipe BlazeFace (68 Pts)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">28 ms</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                simStep >= 3 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${simStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>3. Anti-Spoofing & Liveness</span>
                  </span>
                  <span className={`text-[11px] ${simMode === 'spoofing' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                    {simMode === 'spoofing' ? 'FAILED' : '36 ms'}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                simStep >= 4 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${simStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>4. FaceNet512 Vector Extracted</span>
                  </span>
                  <span className="text-[11px] text-slate-400">72 ms</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                simStep >= 5 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${simStep >= 5 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>5. Vector Distance & Match</span>
                  </span>
                  <span className="text-[11px] text-slate-400">4 ms</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                simStep >= 6 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${simStep >= 6 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>6. Gate Relay & Attendance Log</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">Total: {simTime} ms</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 font-mono-tag">
              Zero frames uploaded to any third-party cloud.
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.5 HOW IT WORKS (4 CONCISE STEPS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="4-Step Deployment"
          badgeIcon={Layers}
          title="From camera stream to verified attendance"
          subtitle="Four straightforward stages to automate workplace physical verification."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl public-card relative text-left">
            <span className="text-3xl font-bold font-mono-tag text-emerald-400 mb-3 block">01</span>
            <h3 className="text-base font-bold text-white mb-2">Connect</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Connect existing IP cameras (RTSP/ONVIF) or USB webcams. Automatic stream reconnect and bandwidth tuning.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card relative text-left">
            <span className="text-3xl font-bold font-mono-tag text-emerald-400 mb-3 block">02</span>
            <h3 className="text-base font-bold text-white mb-2">Enroll</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Enroll staff in three quick shots (0°, 15° left, 15° right). Under 2 minutes per person with automatic quality gating.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card relative text-left">
            <span className="text-3xl font-bold font-mono-tag text-emerald-400 mb-3 block">03</span>
            <h3 className="text-base font-bold text-white mb-2">Verify</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Recognize staff in under 300 ms on your own computer, complete with multi-cue passive anti-spoofing liveness scoring.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card relative text-left">
            <span className="text-3xl font-bold font-mono-tag text-emerald-400 mb-3 block">04</span>
            <h3 className="text-base font-bold text-white mb-2">Act</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Log daily timestamps, evaluate department grace rules, trigger turnstile relay GPIO, and export spreadsheets to payroll.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.6 CAPABILITIES (LIVING INTERACTIVE BENTO GRID)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Interactive Capabilities"
          badgeIcon={Zap}
          title="Living tools engineered for workplace operations"
          subtitle="Test live interactive controls for attendance timelines, grace period rules, and relay triggers."
        />

        {/* Asymmetric Living Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          
          {/* Tile 1: Live Interactive Attendance Timeline & Export (Span 2) */}
          <div className="md:col-span-2 rounded-2xl public-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="text-xs font-mono-tag font-bold text-emerald-400 uppercase tracking-wider">
                  Live Operations Feed
                </span>
                <div className="flex items-center gap-2">
                  {/* Department Filters */}
                  {['all', 'engineering', 'operations', 'qa'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAttendanceDeptFilter(d)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono-tag capitalize transition-all cursor-pointer ${
                        attendanceDeptFilter === d
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'text-slate-400 hover:text-white bg-white/[0.04]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                  {/* CSV Export Action */}
                  <button
                    type="button"
                    onClick={exportSampleCSV}
                    className="ml-2 px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time Attendance Timeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Continuous log of verified employee check-ins with department filters and 1-click payroll spreadsheet export.
              </p>
            </div>

            {/* Live Filtered Table */}
            <div className="rounded-xl bg-[#070A12] border border-white/[0.06] overflow-hidden">
              <table className="w-full text-left text-xs font-mono-tag">
                <thead className="bg-[#0B0F19] text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredAttendance.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                          {row.avatar}
                        </span>
                        <span className="text-white font-medium">{row.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{row.dept}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.time}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'ON TIME'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{row.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tile 2: Interactive Shift Grace Calculator Slider */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono-tag font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Interactive Policy Tool
              </span>
              <h3 className="text-base font-bold text-white">Shift Grace Calculator</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Drag the grace slider to see arrival status change dynamically in real time.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#070A12] border border-white/[0.06] space-y-3 font-mono-tag text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department Grace Buffer:</span>
                <span className="text-emerald-400 font-bold">{graceMinutes} Minutes</span>
              </div>

              {/* Slider Control */}
              <input
                type="range"
                min="0"
                max="30"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(Number(e.target.value))}
                className="w-full range-slider-thumb accent-emerald-400 cursor-pointer"
              />

              <div className="pt-2 border-t border-white/[0.06] text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Shift Start: <strong>09:00 AM</strong></span>
                  <span>Arrival: <strong>09:14 AM</strong></span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Calculated Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    graceMinutes >= 14
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {graceMinutes >= 14 ? 'ON TIME (Grace Applied)' : 'LATE (Flagged for Review)'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono-tag">
              Configurable per department (Engineering, Sales, Plant).
            </p>
          </div>

          {/* Tile 3: Multi-Cue Presentation Attack Radar */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono-tag font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Anti-Spoofing Radar
              </span>
              <h3 className="text-base font-bold text-white">Passive Liveness Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Detects 2D photos, screen replays, and printed masks in under 120 ms.
              </p>
            </div>

            {/* Radar Simulation */}
            <div className="p-4 rounded-xl bg-[#070A12] border border-white/[0.06] flex items-center justify-between gap-4">
              <div className="relative w-20 h-20 rounded-full border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/20" />
                <div className="absolute w-full h-[1px] bg-emerald-400/80 animate-radar origin-center" />
                <Eye className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="space-y-1 text-xs font-mono-tag">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRadarTestMode('live')}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                      radarTestMode === 'live'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-slate-400 bg-white/5'
                    }`}
                  >
                    Live Human
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadarTestMode('attack')}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                      radarTestMode === 'attack'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'text-slate-400 bg-white/5'
                    }`}
                  >
                    Photo Attack
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 pt-1">
                  PAD Score: <strong className={radarTestMode === 'live' ? 'text-emerald-400' : 'text-rose-400'}>
                    {radarTestMode === 'live' ? '98.9% (Genuine)' : '11.4% (Spoof Detected)'}
                  </strong>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono-tag">
              Compliant with ISO/IEC 30107-3 PAD standards.
            </p>
          </div>

          {/* Tile 4: 3-Shot Enrollment Protocol Visualizer */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono-tag font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                Biometric Quality
              </span>
              <h3 className="text-base font-bold text-white">3-Shot Enrollment Protocol</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Multi-angle face registration captures three key perspectives under 2 minutes.
              </p>
            </div>

            {/* Angle Switcher */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono-tag text-xs">
              {[
                { angle: 0, label: "0° Frontal", stat: "100% Quality" },
                { angle: 1, label: "-15° Left", stat: "98% Quality" },
                { angle: 2, label: "+15° Right", stat: "99% Quality" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEnrollmentAngle(idx)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    enrollmentAngle === idx
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-[#070A12] border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block">{item.stat}</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 font-mono-tag">
              Requires 160×160px minimum face bounding box.
            </p>
          </div>

          {/* Tile 5: Hardware Relay Pulse & Turnstile Trigger */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono-tag font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Access Control
              </span>
              <h3 className="text-base font-bold text-white">Hardware Relay & Turnstiles</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Syncs directly with GPIO signals and digital relays to trigger magnetic door locks.
              </p>
            </div>

            {/* Relay Pulse Button */}
            <div className="p-4 rounded-xl bg-[#070A12] border border-white/[0.06] space-y-3 font-mono-tag text-xs">
              <button
                type="button"
                onClick={triggerRelayPulse}
                className={`w-full py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  relayPulsed
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                    : 'bg-[#0F1524] text-slate-200 hover:bg-[#182238] border border-white/10'
                }`}
              >
                <Zap className={`w-4 h-4 ${relayPulsed ? 'fill-slate-950 text-slate-950 animate-bounce' : 'text-emerald-400'}`} />
                <span>{relayPulsed ? 'RELAY ACTIVE: GATE UNLOCKED' : 'Test GPIO Relay Pulse'}</span>
              </button>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Signal State: <strong className={relayPulsed ? 'text-emerald-400' : 'text-slate-500'}>
                  {relayPulsed ? 'HIGH (500ms Active)' : 'LOW (Standby)'}
                </strong></span>
                <span>Port: <strong>GPIO 17</strong></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono-tag">
              Compatible with turnstiles, speed gates, and maglocks.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.7 AUTHENTIC CONSOLE TOUR TABS
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Product Tour"
          badgeIcon={Laptop}
          title="Authentic views from the administrative console"
          subtitle="Explore the live interfaces used daily by operations and HR staff."
        />

        {/* Console Tour Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-6">
          {[
            { id: 0, label: "Live Attendance Timeline", icon: Clock },
            { id: 1, label: "Department Rosters & Shifts", icon: Building },
            { id: 2, label: "Kiosk Terminal Mode", icon: Scan },
            { id: 3, label: "Model Telemetry & Drift", icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTourTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTourTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                    : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="rounded-2xl public-card p-6 bg-[#080B14] border border-white/[0.1] text-left">
          {activeTourTab === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono-tag text-emerald-400 font-bold">● LIVE VERIFICATION LOG &bull; v2026.2</span>
                <span className="text-xs font-mono-tag text-slate-400">Today: 142 Verified &bull; 3 Late &bull; 0 Spoofs</span>
              </div>
              <div className="space-y-2 text-xs font-mono-tag">
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-white font-semibold">Rajesh Patel &bull; EMP-0142 (QA)</span>
                  <span className="text-slate-400">09:12:04 AM</span>
                  <span className="text-emerald-400 font-bold">ON TIME</span>
                  <span className="text-slate-400">99.4% Match</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-white font-semibold">Sarah Jenkins &bull; EMP-0089 (Engineering)</span>
                  <span className="text-slate-400">09:14:22 AM</span>
                  <span className="text-emerald-400 font-bold">ON TIME</span>
                  <span className="text-slate-400">98.9% Match</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-white font-semibold">Alex Rivera &bull; EMP-0211 (Operations)</span>
                  <span className="text-slate-400">09:18:45 AM</span>
                  <span className="text-amber-400 font-bold">LATE (+3m)</span>
                  <span className="text-slate-400">99.1% Match</span>
                </div>
              </div>
            </div>
          )}

          {activeTourTab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono-tag text-emerald-400 font-bold">● DEPARTMENT POLICIES &bull; 6 ACTIVE SHIFTS</span>
                <span className="text-xs font-mono-tag text-slate-400">Auto-calculated grace buffers</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono-tag">
                <div className="p-3.5 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <p className="font-bold text-white mb-1">Engineering Shift</p>
                  <p className="text-slate-400 text-[11px]">09:00 AM – 06:00 PM</p>
                  <p className="text-emerald-400 font-bold mt-2">15 Min Grace Window</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <p className="font-bold text-white mb-1">Plant Operations</p>
                  <p className="text-slate-400 text-[11px]">08:00 AM – 04:30 PM</p>
                  <p className="text-emerald-400 font-bold mt-2">10 Min Grace Window</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <p className="font-bold text-white mb-1">Quality Assurance</p>
                  <p className="text-slate-400 text-[11px]">09:00 AM – 06:00 PM</p>
                  <p className="text-emerald-400 font-bold mt-2">15 Min Grace Window</p>
                </div>
              </div>
            </div>
          )}

          {activeTourTab === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono-tag text-emerald-400 font-bold">● DEDICATED KIOSK TERMINAL MODE</span>
                <span className="text-xs font-mono-tag text-slate-400">Full-screen unattended check-in</span>
              </div>
              <p className="text-xs text-slate-300 font-normal">
                Deploy AuraPass on wall-mounted touchscreen tablets or dedicated turnstile terminals. Zero URL chrome, locked navigation, high-contrast visual feedback, and real-time audio confirmation chimes.
              </p>
            </div>
          )}

          {activeTourTab === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono-tag text-emerald-400 font-bold">● MODEL TELEMETRY & DRIFT MONITORING</span>
                <span className="text-xs font-mono-tag text-slate-400">FaceNet512 Vector Distribution</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono-tag text-center">
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-base block">0.384</span>
                  <span className="text-[10px] text-slate-500">Mean Cosine Distance</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-base block">0.400</span>
                  <span className="text-[10px] text-slate-500">Calibrated Threshold</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-base block">14.2 ms</span>
                  <span className="text-[10px] text-slate-500">Average Inference</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-base block">100%</span>
                  <span className="text-[10px] text-slate-500">Local Vector Cache</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.8 BIOMETRIC SOVEREIGNTY & AIR-GAP ARCHITECTURE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="sovereignty" className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Biometric Sovereignty"
          badgeIcon={Shield}
          title="Total on-premise execution. Zero cloud egress."
          subtitle="Built to support GDPR Article 9, Illinois BIPA, and California CCPA requirements."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Principles */}
          <div className="space-y-4 text-left">
            <div className="p-5 rounded-2xl public-card space-y-1.5">
              <h3 className="text-sm font-bold text-white">One-Way Numeric Vectors</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Faces are transformed into irreversible 512-dimensional numeric unit vectors. Raw images do not need to be stored after enrollment processing.
              </p>
            </div>

            <div className="p-5 rounded-2xl public-card space-y-1.5">
              <h3 className="text-sm font-bold text-white">Runs Fully Offline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                No outbound connection required. Operates behind your physical firewall on an isolated VLAN with total feature parity.
              </p>
            </div>

            <div className="p-5 rounded-2xl public-card space-y-1.5">
              <h3 className="text-sm font-bold text-white">1-Click Permanent Deletion</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                When an employee leaves, administrators can delete their profile and permanently purge their vectors from the active database index.
              </p>
            </div>
          </div>

          {/* Data Flow Diagram (SVG with animated energy pulses) */}
          <div className="p-6 rounded-2xl public-card flex flex-col items-center justify-center text-center font-mono-tag text-xs space-y-4 bg-[#070A12]">
            <p className="font-bold text-white uppercase text-[11px] pb-1 border-b border-white/[0.08] w-full">
              Local Data Flow Boundary
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>1. Camera Feed (RTSP)</span>
                <span className="text-slate-400">Local Wire</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>2. Local Host Inference</span>
                <span className="text-emerald-400 font-bold">512-d Vector</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>3. Local SQLite / PostgreSQL</span>
                <span className="text-emerald-400 font-bold">Encrypted DB</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>4. Digital GPIO Relay Pulse</span>
                <span className="text-emerald-400 font-bold">Turnstile Trigger</span>
              </div>
            </div>

            {/* Hard Air-Gap Boundary */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 w-full justify-center">
              <WifiOff className="w-4 h-4 text-rose-400" />
              <span>Hard Boundary: 0 Bytes Cloud Egress</span>
            </div>
          </div>
        </div>

        {/* What We Store vs What We Never Store */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-6xl mx-auto text-left text-xs font-mono-tag">
          <div className="p-5 rounded-2xl public-card space-y-2 border-t-2 border-t-emerald-500/50">
            <span className="font-bold text-emerald-400 text-xs uppercase block">What We Store (Encrypted Locally)</span>
            <ul className="space-y-1.5 text-slate-300 font-normal">
              <li>&bull; 512-dimensional normalized floating-point vectors</li>
              <li>&bull; Timestamps, department shift rules, and badge IDs</li>
              <li>&bull; Tamper-evident SHA-256 access logs for audit</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl public-card space-y-2 border-t-2 border-t-rose-500/50">
            <span className="font-bold text-rose-400 text-xs uppercase block">What We Never Store or Transmit</span>
            <ul className="space-y-1.5 text-slate-300 font-normal">
              <li>&bull; Never store raw face photos (discarded after extraction)</li>
              <li>&bull; Never transmit data to third-party cloud servers</li>
              <li>&bull; Zero advertising tracking or behavioral telemetry</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.10 TRANSPARENT PRICING WITH WORKING ANNUAL TOGGLE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1720px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Transparent Pricing"
          badgeIcon={Zap}
          title="Start free. Upgrade as your facilities expand."
          subtitle="No per-scan fees. No cloud surcharges. 100% on-premise."
        />

        {/* Working Annual Billing Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex items-center p-1 rounded-xl bg-[#0F1524] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                billingInterval === 'monthly'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('annual')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                billingInterval === 'annual'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-bold">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch text-left">
          
          {/* Card 1: Starter */}
          <div className="rounded-3xl public-card p-8 flex flex-col justify-between border-white/[0.08] relative">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono-tag bg-white/[0.06] text-slate-300 border border-white/[0.08] inline-block font-semibold">
                Single Site / Pilot
              </span>
              <h3 className="text-2xl font-bold text-white">Starter</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                For small offices, shops, and single-door testing.
              </p>

              <div className="pt-2">
                <span className="text-4xl font-bold text-white font-mono-tag">$0</span>
                <span className="text-xs text-slate-400 ml-2">free forever</span>
              </div>

              <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 200 enrolled employees</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 5 camera streams (RTSP / USB)</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 100% on-premise SQLite database</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Full sub-300 ms verification speed</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Daily attendance logs & CSV export</div>
              </div>
            </div>

            <div className="pt-8 mt-auto">
              <Link
                to="/register"
                className="w-full py-3 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-white font-bold text-xs flex items-center justify-center transition-colors"
              >
                Start free today
              </Link>
            </div>
          </div>

          {/* Card 2: Business (Most Popular) */}
          <div className="rounded-3xl public-card p-8 flex flex-col justify-between border-emerald-500/50 shadow-xl shadow-emerald-950/30 relative bg-[#0B101D]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-bold font-mono-tag uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono-tag bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-block font-semibold">
                Workplaces & Factories
              </span>
              <h3 className="text-2xl font-bold text-white">Business</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                For multi-gate factories, warehouses, and busy campuses.
              </p>

              <div className="pt-2 flex items-baseline gap-2 font-mono-tag">
                <span className="text-4xl font-bold text-white">
                  {billingInterval === 'annual' ? '$319' : '$399'}
                </span>
                {billingInterval === 'annual' && (
                  <span className="text-sm text-slate-500 line-through font-mono-tag">$399</span>
                )}
                <span className="text-xs text-slate-400">/ facility / month</span>
              </div>

              <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 5,000 enrolled staff</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited RTSP & ONVIF lanes</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> PostgreSQL support with auto backups</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Tamper-evident audit logs & hash chains</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Department grace policies & shifts</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Priority 2-hour support SLA (phone & email)</div>
              </div>
            </div>

            <div className="pt-8 mt-auto">
              <Link
                to="/register"
                className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center transition-all shadow-lg shadow-emerald-500/25 active:scale-98"
              >
                <span>Get Business Tier &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Custom Enterprise */}
          <div className="rounded-3xl public-card p-8 flex flex-col justify-between border-white/[0.08] relative">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono-tag bg-white/[0.06] text-slate-300 border border-white/[0.08] inline-block font-semibold">
                Multi-Campus & High Security
              </span>
              <h3 className="text-2xl font-bold text-white">Custom Enterprise</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                For large defense, manufacturing, and critical infrastructure.
              </p>

              <div className="pt-2">
                <span className="text-4xl font-bold text-white font-mono-tag">Custom</span>
                <span className="text-xs text-slate-400 ml-2">dedicated deployment</span>
              </div>

              <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 50,000+ vector capacity per node</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Pre-configured 1U rackmount appliances</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Custom turnstile & magnetic lock GPIO</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 100% offline air-gapped updates</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated Solutions Architect</div>
              </div>
            </div>

            <div className="pt-8 mt-auto">
              <Link
                to="/support"
                className="w-full py-3 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-white font-bold text-xs flex items-center justify-center transition-colors"
              >
                Contact Engineering
              </Link>
            </div>
          </div>
        </div>

        {/* Collapsible Feature Comparison Table Toggle */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowPricingCompare(!showPricingCompare)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <span>{showPricingCompare ? "Hide feature comparison" : "Compare all plan features"}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPricingCompare ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showPricingCompare && (
          <div className="mt-8 rounded-2xl public-card p-6 overflow-x-auto text-left text-xs font-mono-tag bg-[#070A12] border border-white/[0.08]">
            <table className="w-full text-slate-300">
              <thead className="border-b border-white/[0.08] text-white">
                <tr>
                  <th className="py-3 px-4 text-left font-bold">Feature Matrix</th>
                  <th className="py-3 px-4 text-center font-bold">Starter</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">Business</th>
                  <th className="py-3 px-4 text-center font-bold">Custom Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Enrolled Employees</td>
                  <td className="py-3 px-4 text-center">Up to 200</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">Up to 5,000</td>
                  <td className="py-3 px-4 text-center">50,000+</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Concurrent Camera Streams</td>
                  <td className="py-3 px-4 text-center">5 Streams</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">Unlimited RTSP</td>
                  <td className="py-3 px-4 text-center">Unlimited + Multi-Node</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Database Engine</td>
                  <td className="py-3 px-4 text-center">SQLite 3</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">PostgreSQL + Backups</td>
                  <td className="py-3 px-4 text-center">High-Availability Clustered</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Verification Latency</td>
                  <td className="py-3 px-4 text-center">&lt; 300 ms</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">&lt; 300 ms</td>
                  <td className="py-3 px-4 text-center">&lt; 150 ms (Hardware-tuned)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Anti-Spoofing & Liveness</td>
                  <td className="py-3 px-4 text-center">Standard 2D</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">Multi-Cue PAD Level 1</td>
                  <td className="py-3 px-4 text-center">ISO 30107-3 PAD Level 2</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Turnstile / Relay GPIO</td>
                  <td className="py-3 px-4 text-center">Software Trigger</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">Digital Relay Sync</td>
                  <td className="py-3 px-4 text-center">Custom Opto-Isolated Wiring</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Support SLA</td>
                  <td className="py-3 px-4 text-center">Community & Docs</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">2-Hour Response SLA</td>
                  <td className="py-3 px-4 text-center">Dedicated Architect</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.11 FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-10 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="FAQ"
          badgeIcon={HelpCircle}
          title="Frequently asked questions"
          subtitle="Honest, clear answers about hardware, privacy, and enrollment."
        />

        <div className="space-y-3 text-left">
          {faqs.map((faq, i) => {
            const isExpanded = expandedFaq === i;
            return (
              <div key={i} className="rounded-xl public-card overflow-hidden transition-all bg-[#090D17]">
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
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.12 FINAL CTA BAND
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-10 xl:px-14 max-w-[1500px] mx-auto w-full z-10">
        <div className="rounded-3xl border border-emerald-500/35 bg-gradient-to-b from-[#0E1729] to-[#070B14] p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl shadow-emerald-950/40">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono-tag font-bold tracking-wider uppercase">
              Immediate Local Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Start verifying faces in about 10 minutes.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Connect your existing webcam or IP camera and begin attendance logging immediately.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Create free account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Read the docs</span>
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 font-mono-tag pt-2">No credit card required.</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.13 FOOTER (4+ COLUMNS PER SECTION 5.13)
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#05070D] py-14 px-4 sm:px-6 lg:px-10 xl:px-14 z-10">
        <div className="max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          <div className="md:col-span-2 space-y-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                <Scan className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white">AuraPass</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-normal">
              High-throughput on-premise facial recognition attendance and access verification engine.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono-tag text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All systems operational &bull; v2026.2</span>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <p className="text-xs font-bold text-white uppercase font-mono-tag tracking-wider">Product</p>
            <ul className="space-y-2 text-xs text-slate-400 font-normal">
              <li><a href="#simulator" className="hover:text-emerald-400 transition-colors">Simulator</a></li>
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it works</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Capabilities</a></li>
              <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <p className="text-xs font-bold text-white uppercase font-mono-tag tracking-wider">Documentation</p>
            <ul className="space-y-2 text-xs text-slate-400 font-normal">
              <li><Link to="/docs?page=quickstart" className="hover:text-emerald-400 transition-colors">Quickstart</Link></li>
              <li><Link to="/docs?page=rtsp-streams" className="hover:text-emerald-400 transition-colors">Cameras & RTSP</Link></li>
              <li><Link to="/docs?page=3-shot-protocol" className="hover:text-emerald-400 transition-colors">3-Shot Enrollment</Link></li>
              <li><Link to="/docs?page=api-overview" className="hover:text-emerald-400 transition-colors">REST API</Link></li>
              <li><Link to="/support" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <p className="text-xs font-bold text-white uppercase font-mono-tag tracking-wider">Legal</p>
            <ul className="space-y-2 text-xs text-slate-400 font-normal">
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><a href="#sovereignty" className="hover:text-emerald-400 transition-colors">Biometric Sovereignty</a></li>
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer pt-2"
                >
                  <span>Back to top</span>
                  <ArrowUp className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1720px] mx-auto pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono-tag">
          <p>&copy; {new Date().getFullYear()} AuraPass. All rights reserved.</p>
          <p>On-premise engine v2026.2</p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.14 STICKY MOBILE CTA BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      {showStickyMobileCta && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-3 bg-[#070A12]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
          <div className="text-left font-mono-tag text-xs">
            <span className="text-white font-bold block">AuraPass Enterprise</span>
            <span className="text-emerald-400 text-[11px]">Free Starter Tier &bull; Sub-300ms</span>
          </div>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98"
          >
            Start free
          </Link>
        </div>
      )}

    </div>
  );
}
