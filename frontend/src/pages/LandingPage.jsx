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
  Pause,
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
  ArrowUp,
  Activity,
  Terminal,
  Camera,
  Database,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import Badge from '../components/ui/marketing/Badge';
import SectionHeader from '../components/ui/marketing/SectionHeader';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Scroll states for Navbar and sticky elements
  const [scrolledNav, setScrolledNav] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Live IST Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Hero Multi-Camera Stream Switcher
  const [activeHeroStream, setActiveHeroStream] = useState(0);

  // Hardware Relay Pulse Simulator State
  const [relayPulsed, setRelayPulsed] = useState(false);

  // The 300ms Verification Engine — Sequential Storytelling State
  const [activeStoryChapter, setActiveStoryChapter] = useState(0);
  const [isStoryPlaying, setIsStoryPlaying] = useState(true);
  const [storyElapsedMs, setStoryElapsedMs] = useState(42);

  // Interactive Capabilities: Anti-Spoofing Radar Test Mode ('live' | 'attack')
  const [radarTestMode, setRadarTestMode] = useState('live');

  // Interactive Capabilities: Shift Grace Calculator Slider
  const [graceMinutes, setGraceMinutes] = useState(15);

  // Interactive Capabilities: Department Filter
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState('all');

  // Fair Indian Enterprise Pricing State
  const [pricingStaffCount, setPricingStaffCount] = useState(120); // 10 to 500
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'annual'
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'

  // FAQ Accordion State (single open index)
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Dynamic Clock Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8);
      setCurrentTimeStr(`${dateStr} ${timeStr} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolledNav(scrollY > 20);

      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 300ms Verification Engine Sequential Auto-advancer
  useEffect(() => {
    if (!isStoryPlaying) return;

    const timings = [42, 178, 218, 284];
    setStoryElapsedMs(timings[activeStoryChapter]);

    const timer = setTimeout(() => {
      setActiveStoryChapter((prev) => (prev + 1) % 4);
    }, 3800);

    return () => clearTimeout(timer);
  }, [activeStoryChapter, isStoryPlaying]);

  // Story Chapters Data
  const STORY_CHAPTERS = [
    {
      id: "CH_01",
      range: "0 – 45 ms",
      title: "The Silent Beam",
      subtitle: "Optical Ingestion & Landmark Mesh Lock",
      icon: Camera,
      tag: "BUFFER: OPENCV C++",
      status: "GPU ZERO-COPY",
      summary: "H.264/H.265 RTSP hardware-decoded frame buffer ingestion. An ultra-light optical cone isolates head crops and aligns a MediaPipe 68-point spatial landmark mesh regardless of spectacles, medical masks, or 5-lux night shadows.",
      metricValue: "42 ms",
      metricLabel: "INGESTION & 68-PT MESH",
      details: [
        "Hardware-accelerated RTSP stream ingestion over local subnet",
        "Sub-15ms face detection cone filtering out background artifacts",
        "68-point planar coordinate alignment for roll/pitch/yaw invariance",
        "Adaptive CLAHE contrast equalization for challenging ambient backlight"
      ]
    },
    {
      id: "CH_02",
      range: "45 – 180 ms",
      title: "The Neural Core",
      subtitle: "GhostFaceNet Embedding & Anti-Spoof Radar",
      icon: Cpu,
      tag: "VECTOR: 512-D INT8",
      status: "ACCURACY: 99.6%",
      summary: "GhostFaceNet produces a 512-dimensional floating vector representation. Cosine similarity performs sub-millisecond nearest neighbor search over in-memory indexes while ISO 30107-3 anti-spoof nets reject screen reflections.",
      metricValue: "136 ms",
      metricLabel: "EMBEDDING & DISTANCE LOOKUP",
      details: [
        "GhostFaceNet ultra-low latency tensor generation on host CPU/GPU",
        "L2-normalized 512-d unit vector space comparison in <2ms",
        "Dual-frequency Fourier analysis blocks paper & phone screen replay",
        "Calibrated cosine distance threshold (0.42) for 99.6% precision"
      ]
    },
    {
      id: "CH_03",
      range: "180 – 220 ms",
      title: "Physical Gate Unlock",
      subtitle: "Hardware GPIO Dry-Contact Relay Pulse",
      icon: Zap,
      tag: "RELAY: OPTO-ISOLATED",
      status: "PULSE: 450ms",
      summary: "Hardware GPIO dry-contact relay pulse fired via edge micro-nodes (Jetson Orin, Raspberry Pi 5, or industrial Advantech). Dispatches a calibrated 24V dry trigger to optical turnstile flaps or magnetic swing latches in <40ms.",
      metricValue: "38 ms",
      metricLabel: "RELAY SWITCH LATENCY",
      details: [
        "Opto-isolated GPIO relay pin triggering 24V turnstile release",
        "Micro-pulse width calibrated to 450ms for seamless person pass-through",
        "Compatible with magnetic locks, tripod turnstiles, and speed gates",
        "Local fallback loop ensures gate actuation even during LAN interruption"
      ]
    },
    {
      id: "CH_04",
      range: "220 – 300 ms",
      title: "The Sovereign Ledger",
      subtitle: "Append-Only Local Audit & Instant HRMS Sync",
      icon: Database,
      tag: "LOCAL DB: WAL MODE",
      status: "ZERO CLOUD EXPOSURE",
      summary: "Append-only SQLite & local PostgreSQL audit event recorded. Calculates shift grace windows and generates 1-click DPDP Act compliant records for SAP, Zoho People, and Keka APIs without a single byte departing the intranet.",
      metricValue: "64 ms",
      metricLabel: "AUDIT LOG & SYNC CYCLE",
      details: [
        "Atomic ACID transaction committed to on-prem SQLite/Postgres DB",
        "Real-time grace period evaluation (09:00 AM + 15 min buffer)",
        "Zero-knowledge audit trail with irreversible non-invertible hashes",
        "DPDP Act 2023 compliant local export to Tally, Keka, and Zoho People"
      ]
    }
  ];

  // Trigger Hardware Relay Pulse
  const triggerRelayPulse = () => {
    setRelayPulsed(true);
    setTimeout(() => {
      setRelayPulsed(false);
    }, 2400);
  };

  // Export Sample Attendance CSV
  const exportSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Badge ID,Employee Name,Department,Timestamp,Status,Confidence,Gate Lane\n"
      + "EMP-0142,Rajesh Patel,Operations,2026-11-05 09:12:04,ON TIME,99.6%,Front Gate Lane 01\n"
      + "EMP-0089,Priya Sharma,Quality Assurance,2026-11-05 09:14:22,ON TIME,99.4%,Turnstile Gate B\n"
      + "EMP-0105,Vatsal Vadgama,Engineering,2026-11-05 09:05:12,ON TIME,99.8%,Executive Reception\n"
      + "EMP-0211,Alex Rivera,Engineering,2026-11-05 09:18:45,LATE,99.1%,Front Gate Lane 01\n"
      + "EMP-0334,Neha Gupta,Quality Assurance,2026-11-05 09:11:30,ON TIME,98.7%,Turnstile Gate B";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "aurapass_enterprise_attendance_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hero Camera Streams Data with accurate male Rajesh Patel & female Priya Sharma
  const HERO_STREAMS = [
    {
      name: "Front Gate Lane 01",
      protocol: "Hikvision DS-2CD • RTSP 1080p",
      location: "Main Lobby Turnstile",
      fps: "29.8 FPS",
      latency: "184 ms",
      employee: "Rajesh Patel",
      badge: "EMP-0142",
      role: "HEAD OF OPERATIONS",
      dept: "Operations",
      time: "09:12:04 AM",
      status: "ON TIME",
      confidence: "99.6%",
      liveness: "99.1% Liveness Confirmed",
      image: "/people/man.jpg"
    },
    {
      name: "Turnstile Gate B",
      protocol: "Dahua IPC-HDBW • RTSP 720p Substream",
      location: "Plant Logistics Gate",
      fps: "30.0 FPS",
      latency: "162 ms",
      employee: "Priya Sharma",
      badge: "EMP-0089",
      role: "QUALITY ASSURANCE LEAD",
      dept: "Quality Assurance",
      time: "09:14:22 AM",
      status: "ON TIME",
      confidence: "99.4%",
      liveness: "98.9% Liveness Confirmed",
      image: "/people/women.jpg"
    },
    {
      name: "Executive Reception",
      protocol: "Logitech BRIO 4K • Direct USB UVC",
      location: "Corporate Reception Desk",
      fps: "30.0 FPS",
      latency: "148 ms",
      employee: "Vatsal Vadgama",
      badge: "EMP-0105",
      role: "PRINCIPAL ENGINEER",
      dept: "Engineering",
      time: "09:05:12 AM",
      status: "ON TIME",
      confidence: "99.8%",
      liveness: "99.5% Liveness Confirmed",
      image: "/people/man2.jpg"
    }
  ];

  const currentHeroStream = HERO_STREAMS[activeHeroStream];

  // Dynamic Pricing Calculation for Indian Enterprises
  // Dynamic scale: ₹19/staff/mo for small teams down to ₹15/staff/mo for growing enterprises
  const calculatePrice = (count) => {
    const rate = 19 - ((count - 10) / 490) * 4;
    const monthlyTotal = Math.round(count * rate);
    const annualTotal = Math.round(monthlyTotal * 12 * 0.85); // 15% discount for annual
    return {
      monthlyTotal,
      annualTotal,
      rate: rate.toFixed(2),
      discountedMonthly: Math.round(annualTotal / 12)
    };
  };

  const pricingData = calculatePrice(pricingStaffCount);
  const displayTotal = billingInterval === 'monthly' ? pricingData.monthlyTotal : pricingData.discountedMonthly;

  // Live Attendance Feed Rows
  const ATTENDANCE_ROWS = [
    { id: "EMP-0142", name: "Rajesh Patel", dept: "Operations", time: "09:12:04 AM", status: "ON TIME", confidence: "99.6%", avatar: "RP" },
    { id: "EMP-0089", name: "Priya Sharma", dept: "QA", time: "09:14:22 AM", status: "ON TIME", confidence: "99.4%", avatar: "PS" },
    { id: "EMP-0105", name: "Vatsal Vadgama", dept: "Engineering", time: "09:05:12 AM", status: "ON TIME", confidence: "99.8%", avatar: "VV" },
    { id: "EMP-0211", name: "Alex Rivera", dept: "Engineering", time: "09:18:45 AM", status: "LATE", confidence: "99.1%", avatar: "AR" },
    { id: "EMP-0334", name: "Neha Gupta", dept: "QA", time: "09:11:30 AM", status: "ON TIME", confidence: "98.7%", avatar: "NG" },
    { id: "EMP-0412", name: "Shivam Petkar", dept: "Operations", time: "09:24:10 AM", status: "LATE", confidence: "99.0%", avatar: "SP" }
  ];

  const filteredAttendance = attendanceDeptFilter === 'all' 
    ? ATTENDANCE_ROWS 
    : ATTENDANCE_ROWS.filter(r => r.dept.toLowerCase() === attendanceDeptFilter.toLowerCase());

  // Defensible Indian Enterprise FAQs
  const faqs = [
    {
      q: "Does any facial biometric data ever leave our local network or facility?",
      a: "No. AuraPass is an entirely sovereign on-premise biometric engine. Video decoding, face detection via MediaPipe, vector embedding generation via GhostFaceNet, and vector distance lookups execute 100% locally on your host server. Zero bytes of image or biometric data are ever transmitted to an external cloud or third-party CDN, fully satisfying statutory Indian DPDP Act 2023 mandates."
    },
    {
      q: "Which security cameras and webcams are compatible?",
      a: "AuraPass is completely hardware-agnostic. It works with any IP camera broadcasting H.264/H.265 video over RTSP or ONVIF (including Hikvision, CP PLUS, Dahua, Uniview, and Axis) as well as standard USB Video Class (UVC) webcams (Logitech C920, C922, BRIO). You do not need to replace existing CCTV infrastructure."
    },
    {
      q: "How does the per-person pricing work for Indian enterprises?",
      a: "You only pay for active enrolled employees — starting at ₹19 per staff per month and tapering down to ₹15 per staff per month for 500+ employees. There are zero per-camera license fees, zero per-scan surcharges, and zero proprietary terminal hardware taxes. A full 7-day unrestricted free trial is provided on all plans."
    },
    {
      q: "How does presentation attack detection (PAD) stop photo and phone screen spoofing?",
      a: "Our multi-cue anti-spoofing pipeline combines high-frequency micro-texture analysis, specular reflection detection, and facial depth gradient estimation adhering to ISO/IEC 30107-3. 2D paper printouts, tablet screens, and phone photo replays fail the liveness threshold and are rejected in under 120 ms."
    },
    {
      q: "How does the system connect to physical turnstiles, tripod gates, and magnetic doors?",
      a: "AuraPass dispatches an opto-isolated 24V dry-contact relay trigger via standard GPIO interfaces (compatible with Raspberry Pi, NVIDIA Jetson, or USB relay boards). When facial verification completes in under 300 ms, a 450 ms momentary pulse releases the gate flap seamlessly as the employee walks through."
    },
    {
      q: "What server hardware is required to run AuraPass locally?",
      a: "For single-lane facilities (up to 500 staff), a standard quad-core Intel i5/i7 or AMD Ryzen workstation with 8 GB RAM and Docker is sufficient. For multi-camera facilities with 5+ lanes, an 8-core CPU or an optional dedicated NVIDIA GPU ensures continuous sub-200 ms latency across concurrent streams."
    },
    {
      q: "Can we automatically export attendance records to payroll and HRMS software?",
      a: "Yes. Attendance events can be filtered by shift, date, or department and exported directly to standardized CSV, Excel, or printable executive PDF registers compatible with Tally, Zoho People, Keka, SAP SuccessFactors, and custom payroll software."
    },
    {
      q: "What happens to employee photographs after biometric enrollment?",
      a: "Photographs can be permanently discarded immediately after vector generation. AuraPass stores only 512-dimensional numeric floating-point vectors from which original facial photographs cannot be mathematically reconstructed, guaranteeing privacy by design."
    }
  ];

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-200 flex flex-col font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      
      {/* Top Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-0.5 bg-emerald-400 z-50 origin-left shadow-[0_0_8px_rgba(52,211,153,0.6)]"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Background Precision Grid & Radial Glow */}
      <div className="fixed inset-0 pointer-events-none grid-bg-pattern z-0" />

      {/* 1. FLOATING PILL HEADER */}
      <header className={`fixed top-4 sm:top-6 inset-x-0 mx-auto max-w-5xl w-[92%] sm:w-full rounded-full border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl shadow-[0_0_24px_-4px_rgba(16,185,129,0.15)] z-40 px-5 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 ${scrolledNav ? 'border-emerald-500/30 shadow-[0_0_32px_-4px_rgba(16,185,129,0.25)]' : ''}`}>
        <div className="flex justify-between items-center w-full">
          
          {/* Brand Mark */}
          <Link to="/" className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2.5 group">
            <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#070A12] border border-emerald-500/40 text-emerald-400 group-hover:border-emerald-400 transition-colors">
              <Scan className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </span>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              AuraPass<span className="text-emerald-400 font-mono text-xs ml-1">ENT</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium">
            <a href="#storytelling" className="text-slate-300 hover:text-emerald-400 transition-colors">
              The 300ms Story
            </a>
            <a href="#comparison" className="text-slate-300 hover:text-emerald-400 transition-colors">
              Comparison
            </a>
            <a href="#capabilities" className="text-slate-300 hover:text-emerald-400 transition-colors">
              Capabilities
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-emerald-400 transition-colors">
              Indian Pricing
            </a>
            <a href="#faq" className="text-slate-300 hover:text-emerald-400 transition-colors">
              FAQ
            </a>
            <Link to="/docs" className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Docs
            </Link>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 text-slate-400 font-mono text-[11px] px-2.5 py-1 rounded-md border border-white/10 bg-[#070A12]/60">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>v2.8-rtsp</span>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs sm:text-sm font-semibold text-[#070A12] bg-emerald-400 px-4 py-1.5 rounded-full shadow-[0_0_16px_rgba(52,211,153,0.35)] hover:bg-emerald-300 transition-all flex items-center gap-1.5"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href="#pricing"
                className="text-xs sm:text-sm font-semibold text-[#070A12] bg-emerald-400 px-4 py-1.5 rounded-full shadow-[0_0_16px_rgba(52,211,153,0.35)] hover:bg-emerald-300 transition-all flex items-center gap-1.5"
              >
                <span>Start Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg border border-white/10"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-2.5 text-sm pb-2">
            <a 
              href="#storytelling" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 py-1"
            >
              The 300ms Story
            </a>
            <a 
              href="#comparison" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 py-1"
            >
              Comparison
            </a>
            <a 
              href="#capabilities" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 py-1"
            >
              Capabilities
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 py-1"
            >
              Indian Enterprise Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 py-1"
            >
              FAQ
            </a>
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <Link to="/login" className="text-slate-400 text-xs">Sign In</Link>
              <Link to="/register" className="text-emerald-400 font-semibold text-xs">Create Account</Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION — SCREEN FITTED & PROPORTIONATE */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Status Telemetry Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0B0F19] border border-emerald-500/30 text-emerald-400 mb-6 glow-emerald-box">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
            ON-PREM EDGE VERIFICATION // SUB-300MS LATENCY
          </span>
        </div>

        {/* Main Pitch Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white max-w-4xl tracking-tight leading-[1.15] mb-5">
          Attendance that recognizes{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
            people
          </span>
          , not badges.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed font-normal">
          Turn existing standard RTSP CCTV cameras or webcams into instant walk-through turnstiles with zero cloud exposure, 99.6% accuracy, and sovereign on-premise execution.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-10 w-full sm:w-auto">
          <a
            href="#pricing"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-400 text-[#070A12] font-semibold text-sm hover:bg-emerald-300 transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Start 7-Day Free Trial</span>
          </a>
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0F1524]/80 hover:bg-[#141B2E] text-slate-200 border border-white/10 hover:border-emerald-500/40 text-sm font-medium transition-all backdrop-blur-md flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            <span>Watch CCTV Ingestion Demo</span>
          </button>
        </div>

        {/* Quick Enterprise Guarantee Chips */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 mb-12 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 7-Day Free Trial On All Plans
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Compatible with Any RTSP CCTV
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Air-Gapped (DPDP Act 2023)
          </span>
        </div>

        {/* LIVE CCTV GATE STREAM PREVIEW WIDGET */}
        <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl p-3 sm:p-5 shadow-2xl relative overflow-hidden text-left">
          
          {/* Multi-Camera Channel Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-[#070A12] p-1 rounded-lg border border-white/5">
              {HERO_STREAMS.map((stream, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveHeroStream(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${activeHeroStream === idx ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeHeroStream === idx ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  Cam {idx + 1}
                </button>
              ))}
            </div>

            {/* Feed Status & Clock */}
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {currentHeroStream.fps} • {currentHeroStream.latency}
              </span>
              <span className="hidden sm:inline text-slate-500">
                {currentTimeStr || '2026-11-05 09:14:22 IST'}
              </span>
            </div>
          </div>

          {/* Video Stream Container Simulation */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-[#05080E]">
            
            {/* Subject Image (Rajesh Patel / Priya Sharma / Vatsal Vadgama) */}
            <img
              src={currentHeroStream.image}
              alt={currentHeroStream.employee}
              className="w-full h-full object-cover opacity-60 filter contrast-110 saturate-75"
            />

            {/* Sweeping Scanning Laser */}
            <div className="scanner-line" />

            {/* Camera Reticle & Overlays */}
            <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
              
              {/* Top Sensor Specs */}
              <div className="flex justify-between items-start text-[11px] font-mono">
                <div className="text-emerald-300 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-emerald-500/20">
                  {currentHeroStream.protocol}
                </div>
                <div className="text-slate-300 bg-black/60 px-2.5 py-1 rounded backdrop-blur border border-white/10">
                  BUFFER: 3.8ms // LOSS: 0.00%
                </div>
              </div>

              {/* Bounding Detection Box Over Subject Face */}
              <div className="absolute top-[20%] sm:top-[22%] left-[34%] sm:left-[38%] w-[32%] sm:w-[24%] h-[52%] sm:h-[50%] border-2 border-emerald-400 rounded-sm shadow-[0_0_20px_rgba(52,211,153,0.45)] flex flex-col justify-between p-2">
                
                {/* Corner Brackets */}
                <div className="flex justify-between">
                  <span className="w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400 -mt-2 -ml-2" />
                  <span className="w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400 -mt-2 -mr-2" />
                </div>

                {/* Center 68-Point Mesh Lock Crosshair */}
                <div className="self-center flex flex-col items-center">
                  <Scan className="w-7 h-7 text-emerald-400/80 animate-pulse" />
                  <span className="font-mono text-[9px] text-emerald-400 bg-black/80 px-1 py-0.5 rounded border border-emerald-500/40 mt-1 uppercase">
                    68-Pt Mesh Lock
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400 -mb-2 -ml-2" />
                  <span className="w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400 -mb-2 -mr-2" />
                </div>

                {/* Identity Tag Badge Floating Below Bounding Box */}
                <div className="absolute -bottom-14 sm:-bottom-16 left-0 right-0 bg-[#0B0F19]/95 border border-emerald-500/50 backdrop-blur-md p-2 rounded-lg text-left shadow-xl pointer-events-auto">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className="text-emerald-400 font-bold">AUTHORIZED — {currentHeroStream.latency}</span>
                    <span className="text-slate-300">{currentHeroStream.confidence}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {currentHeroStream.employee}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span>{currentHeroStream.role}</span>
                    <span className="text-emerald-400 font-bold">{currentHeroStream.badge}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry Relay Status Strip */}
              <div className="flex flex-wrap items-center justify-between bg-black/75 backdrop-blur border border-white/10 p-2 sm:p-2.5 rounded-lg text-[10px] sm:text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 font-semibold ${relayPulsed ? 'text-emerald-300 animate-pulse' : 'text-slate-300'}`}>
                    <Lock className={`w-3.5 h-3.5 ${relayPulsed ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {relayPulsed ? 'RELAY 01: UNLATCHED (24V PULSE 450ms)' : 'RELAY 01: READY / STANDBY'}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400">GPIO_PIN_18</span>
                </div>
                <div className="text-slate-400 flex items-center gap-2">
                  <span>TOTAL CYCLE: {currentHeroStream.latency}</span>
                  <button
                    onClick={triggerRelayPulse}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] cursor-pointer transition-colors"
                  >
                    Test Gate Pulse
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE PROBLEM VS THE WALK-THROUGH STANDARD */}
      <section id="comparison" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-2 font-medium">
            INFRASTRUCTURE COMPARISON
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Friction of the Past vs The Walk-Through Standard
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal">
            Replacing brittle plastic credentials with non-cooperative, zero-latency optical authorization.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Legacy Card */}
          <div className="rounded-2xl border border-rose-500/25 bg-[#0D111A]/80 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-5 border-b border-white/10 mb-5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Legacy RFID & Thumb Scanners</h3>
                  <p className="font-mono text-xs text-rose-400 uppercase tracking-wider">The Bottleneck Paradigm</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>15+ minute peak shift queues:</strong> Workers bottleneck at physical turnstiles touching oily optical readers that fail with dirty, wet, or sweating hands.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Buddy punching & badge loss:</strong> Plastic RFID smart cards get loaned, lost, or damaged, costing ₹120–₹250 per card replacement recurring fee.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Cloud biometric privacy violations:</strong> Vendors streaming raw camera JPEGs to public multi-tenant clouds violate statutory DPDP Act 2023 compliance.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Proprietary hardware lock-in:</strong> Requires expensive standalone biometric wall terminals (₹35,000+ each) that fail after warranty periods.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-rose-400">
              <span>THROUGHPUT: 4-6 PERSONS / MIN</span>
              <span>AVERAGE DELAY: 2,400ms</span>
            </div>
          </div>

          {/* AuraPass On-Premise Flow Card */}
          <div className="rounded-2xl border border-emerald-500/40 bg-[#0B131F]/90 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_32px_-8px_rgba(16,185,129,0.2)] relative">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-400 text-[#070A12] font-mono text-[10px] font-bold uppercase tracking-wider">
              The Sovereign Edge
            </div>

            <div>
              <div className="flex items-center gap-3 pb-5 border-b border-white/10 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">AuraPass Walk-Through Flow</h3>
                  <p className="font-mono text-xs text-emerald-400 uppercase tracking-wider">Sub-300ms Optical Standard</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero-stopping continuous transit:</strong> Walk naturally through turnstiles. The camera detects and matches faces 2 meters before arrival in under 300ms.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Works on existing CCTV:</strong> Seamlessly ingest RTSP/ONVIF streams from Hikvision, CP PLUS, Dahua, or USB cameras. Zero new terminal purchases.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>100% Air-Gapped DPDP 2023 compliance:</strong> Sovereign local inference. Biometric vectors never depart the facility local network. Zero external cloud dependencies.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Anti-spoof liveness rejection:</strong> ISO 30107-3 compliant texture and depth gradient analysis blocks mobile phone screens, videos, and printed photos.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-emerald-400 font-semibold">
              <span>THROUGHPUT: 35+ PERSONS / MIN</span>
              <span>AVERAGE DELAY: 184ms MATCH LOCK</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 300MS STORYTELLING LIFECYCLE (Sequential Chapters) */}
      <section id="storytelling" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-2 font-medium">
            ANATOMY OF A SUB-300MS PASS
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Four Chapters of Instant Optical Verification
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal">
            From raw RTSP sensor photons to physical turnstile motor release — executed locally in less than the blink of an eye.
          </p>
        </div>

        {/* Story Stepper Controller Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F19] border border-white/10 rounded-2xl p-3 sm:p-4 mb-8">
          
          {/* Chapter Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {STORY_CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveStoryChapter(idx);
                  setIsStoryPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all flex items-center gap-2 ${activeStoryChapter === idx ? 'bg-emerald-400 text-[#070A12] shadow-[0_0_16px_rgba(52,211,153,0.35)]' : 'text-slate-400 hover:text-slate-200 bg-[#070A12]/50'}`}
              >
                <span>{ch.id}</span>
                <span className="hidden sm:inline font-sans text-xs">({ch.range})</span>
              </button>
            ))}
          </div>

          {/* Stepper Play/Pause & Live Millisecond Counter */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4 font-mono text-xs">
            <button
              onClick={() => setIsStoryPlaying(!isStoryPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#070A12] text-slate-300 hover:text-emerald-400 transition-colors"
            >
              {isStoryPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isStoryPlaying ? 'Auto Stepping' : 'Paused (Click Chapter)'}</span>
            </button>

            <div className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              TIMELINE: {storyElapsedMs} ms / 300 ms
            </div>
          </div>
        </div>

        {/* Active Chapter Deep-Dive Display Card */}
        {(() => {
          const ch = STORY_CHAPTERS[activeStoryChapter];
          const IconComponent = ch.icon;

          return (
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0A0E18]/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl mb-10 transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Narrative Content */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      CHAPTER {activeStoryChapter + 1} OF 4
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      WINDOW: {ch.range}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span>{ch.title}</span>
                  </h3>

                  <p className="text-sm font-mono text-emerald-300/90 font-medium">
                    {ch.subtitle}
                  </p>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    {ch.summary}
                  </p>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                    {ch.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Telemetry Spec Box */}
                <div className="lg:col-span-5 bg-[#070A12] border border-white/10 rounded-xl p-6 space-y-4 text-left font-mono">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-400">
                    <span>HARDWARE ACCELERATION</span>
                    <span className="text-emerald-400 font-bold">{ch.status}</span>
                  </div>

                  <div className="text-center py-4 bg-[#0B0F19] rounded-lg border border-white/5">
                    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                      {ch.metricValue}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 uppercase">
                      {ch.metricLabel}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subnet Protocol:</span>
                      <span className="text-white">Gigabit Local LAN</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cloud Egress:</span>
                      <span className="text-emerald-400 font-bold">0.00 Bytes (Air-Gapped)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Architecture Mode:</span>
                      <span className="text-white">{ch.tag}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4-Chapter Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STORY_CHAPTERS.map((ch, idx) => {
            const IconComp = ch.icon;
            const isActive = activeStoryChapter === idx;

            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveStoryChapter(idx);
                  setIsStoryPlaying(false);
                }}
                className={`rounded-xl border p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 text-left ${isActive ? 'bg-[#0E1524] border-emerald-400/60 shadow-[0_0_24px_rgba(52,211,153,0.2)]' : 'bg-[#0B0F19]/60 border-white/10 hover:border-emerald-500/30'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {ch.range}
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-bold">
                      {ch.id}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-[#070A12] border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>

                  <h4 className="text-base font-bold text-white mb-1.5">
                    {ch.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal line-clamp-3">
                    {ch.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 font-mono text-[10px] text-slate-500 flex items-center justify-between">
                  <span>{ch.tag}</span>
                  <span className="text-emerald-400">{ch.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. INTERACTIVE CAPABILITIES & LIVE ATTENDANCE LOG */}
      <section id="capabilities" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-2 font-medium">
            FIELD-TESTED CAPABILITIES
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for High-Throughput Industrial & Corporate Sites
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal">
            Zero cloud lag, sub-millisecond local attendance logging, and dynamic grace-period recalculation.
          </p>
        </div>

        {/* 2-Column Interactive Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left Column: Live Attendance Ledger Filter */}
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-5 sm:p-6 flex flex-col justify-between text-left">
            <div>
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-2 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Live Local Gate Ledger
                  </h3>
                  <p className="text-xs text-slate-400">Append-only local SQLite WAL database records</p>
                </div>

                {/* Department Filters */}
                <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded-lg border border-white/5 font-mono text-xs">
                  {['all', 'Operations', 'Engineering', 'QA'].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setAttendanceDeptFilter(dept)}
                      className={`px-2.5 py-1 rounded transition-colors ${attendanceDeptFilter.toLowerCase() === dept.toLowerCase() ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-2">Badge</th>
                      <th className="py-2.5 px-2">Staff Name</th>
                      <th className="py-2.5 px-2">Dept</th>
                      <th className="py-2.5 px-2">Punch Time</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 text-right">Conf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAttendance.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-2 text-emerald-400 font-bold">{row.id}</td>
                        <td className="py-2.5 px-2 text-white font-sans font-medium">{row.name}</td>
                        <td className="py-2.5 px-2 text-slate-400">{row.dept}</td>
                        <td className="py-2.5 px-2 text-slate-300">{row.time}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'ON TIME' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-emerald-300">{row.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">Total Filtered: {filteredAttendance.length} records</span>
              <button
                onClick={exportSampleCSV}
                className="px-3 py-1.5 rounded-lg bg-[#070A12] border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Sample CSV
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Anti-Spoof Radar & Grace Slider */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Anti-Spoof Radar Simulation */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Anti-Spoofing Radar
                  </h3>
                  <p className="text-xs text-slate-400">ISO 30107-3 Liveness Verification</p>
                </div>

                {/* Live vs Attack Toggle */}
                <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded-lg border border-white/5 font-mono text-xs">
                  <button
                    onClick={() => setRadarTestMode('live')}
                    className={`px-2 py-1 rounded transition-colors ${radarTestMode === 'live' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'}`}
                  >
                    Live Face
                  </button>
                  <button
                    onClick={() => setRadarTestMode('attack')}
                    className={`px-2 py-1 rounded transition-colors ${radarTestMode === 'attack' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'}`}
                  >
                    Phone Replay
                  </button>
                </div>
              </div>

              {radarTestMode === 'live' ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 3D Liveness Verified
                    </span>
                    <span>CONF: 99.4%</span>
                  </div>
                  <p className="text-slate-300 font-sans">
                    Specular skin reflection and micro-blinking match biological thresholds. Turnstile unlatched in 184ms.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-rose-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Presentation Attack Detected
                    </span>
                    <span>SPOOF: 98.7%</span>
                  </div>
                  <p className="text-slate-300 font-sans">
                    Planar glass glare & screen Moire patterns detected. Access denied, alarm flag written to audit log.
                  </p>
                </div>
              )}
            </div>

            {/* Shift Grace Policy Buffer Calculator */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Shift Grace Period Buffer
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {graceMinutes} min
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Arrivals within {graceMinutes} minutes of scheduled shift start are marked ON TIME automatically.
              </p>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#070A12] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-2">
                <span>5 MIN (STRICT)</span>
                <span>15 MIN (STANDARD)</span>
                <span>30 MIN (FLEXIBLE)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING FOR INDIAN ENTERPRISES (Interactive Slider) */}
      <section id="pricing" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-2 font-medium">
            SOVEREIGN INDIAN PRICING CALCULATOR
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Fair Per-Person Pricing for Indian Enterprises
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal">
            Scale affordably without hardware lock-in or recurring per-camera licensing fees. Pay only for active staff profiles.
          </p>
        </div>

        {/* Pricing Interactive Glass Card */}
        <div className="rounded-3xl border border-emerald-500/30 bg-[#0B0F19]/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative text-left">
          
          {/* Interval Switcher (Monthly vs Annual) */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 bg-[#070A12] p-1 rounded-xl border border-white/10 font-mono text-xs">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${billingInterval === 'monthly' ? 'bg-emerald-400 text-[#070A12] shadow-[0_0_12px_rgba(52,211,153,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${billingInterval === 'annual' ? 'bg-emerald-400 text-[#070A12] shadow-[0_0_12px_rgba(52,211,153,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  SAVE 15%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left: Workforce Slider Controls */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  Active Enrolled Workforce
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                    {pricingStaffCount}
                  </span>
                  <span className="text-xs text-slate-400">staff members</span>
                </div>
              </div>

              {/* Slider Input */}
              <div className="relative py-2">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={pricingStaffCount}
                  onChange={(e) => setPricingStaffCount(parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-[#070A12] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-2">
                  <span>10 STAFF</span>
                  <span>150</span>
                  <span>300</span>
                  <span>500+ STAFF</span>
                </div>
              </div>

              {/* Inclusions Checklist */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>On-premise Docker license</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited RTSP camera feeds</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero hardware lock-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full 7-day unrestricted trial</span>
                </div>
              </div>
            </div>

            {/* Right: Calculated Price Summary Box */}
            <div className="lg:col-span-5 bg-[#070A12]/90 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center relative glow-emerald-box">
              
              <div className="mb-6">
                <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider font-semibold">
                  ESTIMATED COMMITMENT
                </span>
                
                <div className="flex items-center justify-center gap-1.5 mt-3 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-sans">₹</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
                    {displayTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ mo</span>
                </div>

                <p className="font-mono text-xs text-emerald-400">
                  ₹{pricingData.rate} per staff / month
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  + applicable GST (18%) • Invoiced locally
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/register"
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-400 text-[#070A12] font-bold text-sm hover:bg-emerald-300 transition-all shadow-[0_0_20px_rgba(52,211,153,0.35)] flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Start 7-Day Free Trial</span>
                </Link>
                <p className="font-mono text-[10px] text-slate-500 text-center">
                  No credit card or proprietary gate hardware required.
                </p>
              </div>
            </div>
          </div>

          {/* 500+ Multi-Site Facility Callout */}
          <div className="mt-8 p-4 sm:p-5 rounded-xl border border-white/10 bg-[#070A12]/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Managing 500+ workers across multiple plant facilities?</p>
                <p className="text-xs text-slate-400">We provide custom cluster sync, high-availability edge failover, and on-site deployment engineers.</p>
              </div>
            </div>
            <Link
              to="/support"
              className="whitespace-nowrap px-4 py-2 rounded-lg border border-white/20 hover:border-emerald-400 text-xs font-semibold text-white hover:text-emerald-300 transition-colors"
            >
              Enterprise Deployment
            </Link>
          </div>
        </div>
      </section>

      {/* 7. BIOMETRIC SOVEREIGNTY & REGULATORY ASSURANCE */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10 text-center">
        <div className="max-w-2xl mx-auto mb-10">
          <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest font-medium">
            SOVEREIGNTY & REGULATORY ASSURANCE
          </p>
          <h3 className="text-xl sm:text-3xl font-extrabold text-white mt-1">
            Zero-Trust Physical Security By Design
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="p-4 rounded-xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur text-center flex flex-col items-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-white">DPDP Act 2023</span>
            <span className="font-mono text-[10px] text-slate-500 mt-0.5">100% Compliant</span>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur text-center flex flex-col items-center">
            <WifiOff className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-white">Air-Gapped Setup</span>
            <span className="font-mono text-[10px] text-slate-500 mt-0.5">Zero Cloud Egress</span>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur text-center flex flex-col items-center">
            <Shield className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-white">ISO 27001</span>
            <span className="font-mono text-[10px] text-slate-500 mt-0.5">Audit-Ready Logs</span>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur text-center flex flex-col items-center">
            <KeyRound className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-white">Transient Vectors</span>
            <span className="font-mono text-[10px] text-slate-500 mt-0.5">No Raw Photos Kept</span>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur text-center flex flex-col items-center col-span-2 md:col-span-1">
            <Cpu className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-white">On-Device Neural</span>
            <span className="font-mono text-[10px] text-slate-500 mt-0.5">Host CPU/GPU Enclave</span>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/10">
        
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-2 font-medium">
            TRANSPARENT ANSWERS
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-normal">
            Everything IT directors, plant heads, and facility managers ask about on-premise biometric gates.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;

            return (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-[#0B0F19]/80 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. ENTERPRISE COMMAND-CENTER FOOTER */}
      <footer className="border-t border-white/10 bg-[#05080E] relative z-10 text-left mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 flex flex-col gap-10 w-full">
          
          {/* Top Row: Brand & Telemetry Status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/10">
            <div>
              <Link to="/" className="text-lg font-bold text-white flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-400" />
                <span>AuraPass Enterprise</span>
              </Link>
              <p className="text-xs text-slate-400 mt-1 font-normal">
                Sovereign local zero-knowledge biometric verification & gate telemetry for Indian industry.
              </p>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 font-mono text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>EDGE DAEMON: OPERATIONAL (LATENCY 184ms)</span>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs font-normal">
            
            <div className="flex flex-col gap-2.5">
              <p className="font-mono text-xs text-white font-bold uppercase tracking-wider mb-1">
                CORE ARCHITECTURE
              </p>
              <a href="#storytelling" className="text-slate-400 hover:text-emerald-400 transition-colors">GhostFaceNet 512-D</a>
              <a href="#storytelling" className="text-slate-400 hover:text-emerald-400 transition-colors">RTSP / ONVIF Ingestion</a>
              <a href="#storytelling" className="text-slate-400 hover:text-emerald-400 transition-colors">Dry-Contact GPIO Relays</a>
              <a href="#storytelling" className="text-slate-400 hover:text-emerald-400 transition-colors">ISO 30107-3 Liveness</a>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="font-mono text-xs text-white font-bold uppercase tracking-wider mb-1">
                COMPLIANCE & LEGAL
              </p>
              <Link to="/privacy-policy" className="text-slate-400 hover:text-emerald-400 transition-colors">DPDP Act 2023 Blueprint</Link>
              <Link to="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors">Terms of Service</Link>
              <Link to="/docs" className="text-slate-400 hover:text-emerald-400 transition-colors">Air-Gap Deployment Guide</Link>
              <Link to="/support" className="text-slate-400 hover:text-emerald-400 transition-colors">Security Disclosures</Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="font-mono text-xs text-white font-bold uppercase tracking-wider mb-1">
                INTEGRATIONS
              </p>
              <span className="text-slate-400">SAP SuccessFactors</span>
              <span className="text-slate-400">Zoho People Sync</span>
              <span className="text-slate-400">Keka HRMS Webhook</span>
              <span className="text-slate-400">Tally Payroll CSV Export</span>
            </div>

            <div className="flex flex-col gap-2.5 font-mono text-[11px]">
              <p className="font-mono text-xs text-white font-bold uppercase tracking-wider mb-1 font-sans">
                SYSTEM TELEMETRY
              </p>
              <span className="text-slate-400">KERNEL: Linux 6.1 RT</span>
              <span className="text-slate-400">CONTAINER: distroless</span>
              <span className="text-slate-400">CRYPTO: Ed25519 Local Audit</span>
              <span className="text-emerald-400 font-bold">STATUS: ALL GATES CLEAR</span>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs text-slate-500 gap-4">
            <p>© 2026 AuraPass Cryptographic Systems Inc. Sovereign Local Zero-Knowledge Verification. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
              <button onClick={scrollToTop} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <ArrowUp className="w-3.5 h-3.5" /> Back to top
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* VIDEO DEMONSTRATION MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0B0F19] border border-white/20 rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl text-left">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AuraPass Optical Walk-Through Demo</h3>
                  <p className="text-xs text-slate-400 font-mono">Simulated Sub-300ms RTSP Verification Cycle</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Screen Representation */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#05080E] mb-4">
              <img
                src="/people/man.jpg"
                alt="Rajesh Patel CCTV Walkthrough"
                className="w-full h-full object-cover opacity-60 filter contrast-125"
              />
              <div className="scanner-line" />
              
              <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                <div className="flex justify-between font-mono text-[10px] text-emerald-300 bg-black/60 px-2.5 py-1 rounded w-fit">
                  HIKVISION 4K DS-2CD // REALTIME CAPTURE
                </div>
                <div className="bg-black/80 border border-emerald-500/40 p-3 rounded-lg flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-emerald-400 font-bold">MATCH: Rajesh Patel (Operations)</span>
                    <p className="text-slate-400 text-[10px]">Turnstile 24V Relay Fired • Delay: 184ms</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    UNLOCKED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">
                AuraPass processes streams directly over LAN via ONVIF/RTSP.
              </p>
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 rounded-lg bg-emerald-400 text-[#070A12] text-xs font-bold hover:bg-emerald-300 transition-colors"
              >
                Close Demo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
