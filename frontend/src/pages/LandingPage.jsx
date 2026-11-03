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

  // Pricing State: Currency & Billing Interval
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
  const [billingInterval, setBillingInterval] = useState('annual'); // 'monthly' | 'annual'
  const [pricingStaffCount, setPricingStaffCount] = useState(50); // 25 to 500
  const [showPricingCompare, setShowPricingCompare] = useState(false);

  // FAQ Accordion State (single open)
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolledNav(scrollY > 20);
      setShowStickyMobileCta(scrollY > 500 && scrollY < document.body.scrollHeight - 1200);

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
    const tiltX = ((y - centerY) / centerY) * -2.5;
    const tiltY = ((x - centerX) / centerX) * 2.5;
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
    }, 250);
  };

  // Trigger Hardware Relay Pulse
  const triggerRelayPulse = () => {
    setRelayPulsed(true);
    setTimeout(() => {
      setRelayPulsed(false);
    }, 2200);
  };

  // Export Sample Attendance CSV
  const exportSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Badge ID,Employee Name,Department,Timestamp,Status,Confidence\n"
      + "EMP-0142,Priya Sharma,Quality Assurance,2026-11-03 09:12:04,ON TIME,99.4%\n"
      + "EMP-0089,Rajesh Patel,Operations,2026-11-03 09:14:22,ON TIME,98.9%\n"
      + "EMP-0211,Alex Rivera,Engineering,2026-11-03 09:18:45,LATE,99.1%\n"
      + "EMP-0105,Vatsal Vadgama,Engineering,2026-11-03 09:05:12,ON TIME,99.7%\n"
      + "EMP-0334,Neha Gupta,Quality Assurance,2026-11-03 09:11:30,ON TIME,98.4%";
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

  // Hero Camera Streams Data (Priya Sharma accurately reflects the female photo in aurapass_kiosk_preview.jpg)
  const HERO_STREAMS = [
    {
      name: "Front Gate Lane 01",
      protocol: "Hikvision DS-2CD • RTSP 1080p",
      location: "Main Facility Turnstiles",
      fps: "29.8 FPS",
      latency: "184 ms",
      employee: "Priya Sharma",
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
      location: "Plant Logistics Gate",
      fps: "30.0 FPS",
      latency: "162 ms",
      employee: "Rajesh Patel",
      badge: "EMP-0089",
      dept: "Operations",
      time: "09:14:22 AM",
      status: "ON TIME",
      confidence: "98.9%",
      liveness: "99.1% Verified",
      image: "/landing-bg.png"
    },
    {
      name: "Executive Reception",
      protocol: "Logitech BRIO 4K • Direct USB UVC",
      location: "Corporate Reception Desk",
      fps: "30.0 FPS",
      latency: "148 ms",
      employee: "Vatsal Vadgama",
      badge: "EMP-0105",
      dept: "Engineering",
      time: "09:05:12 AM",
      status: "ON TIME",
      confidence: "99.7%",
      liveness: "99.4% Verified",
      image: "/auth-bg.png"
    }
  ];

  // Live Attendance Feed Rows with accurate gender representation
  const ATTENDANCE_ROWS = [
    { id: "EMP-0142", name: "Priya Sharma", dept: "QA", time: "09:12:04 AM", status: "ON TIME", confidence: "99.4%", avatar: "PS" },
    { id: "EMP-0089", name: "Rajesh Patel", dept: "Operations", time: "09:14:22 AM", status: "ON TIME", confidence: "98.9%", avatar: "RP" },
    { id: "EMP-0211", name: "Alex Rivera", dept: "Engineering", time: "09:18:45 AM", status: "LATE", confidence: "99.1%", avatar: "AR" },
    { id: "EMP-0105", name: "Vatsal Vadgama", dept: "Engineering", time: "09:05:12 AM", status: "ON TIME", confidence: "99.7%", avatar: "VV" },
    { id: "EMP-0334", name: "Neha Gupta", dept: "QA", time: "09:11:30 AM", status: "ON TIME", confidence: "98.4%", avatar: "NG" },
    { id: "EMP-0412", name: "Shivam Petkar", dept: "Operations", time: "09:22:10 AM", status: "LATE", confidence: "99.0%", avatar: "SP" },
  ];

  const filteredAttendance = attendanceDeptFilter === 'all' 
    ? ATTENDANCE_ROWS 
    : ATTENDANCE_ROWS.filter(r => r.dept.toLowerCase() === attendanceDeptFilter.toLowerCase());

  // Defensible FAQ Data
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
      q: "How does the per-person pricing work for Indian businesses?",
      a: "You only pay for the active employees enrolled in the system at just ₹23 to ₹29 per employee per month. There are no per-scan fees, no cloud storage surcharges, and no hidden penalties. A 7-day free trial is included with full access."
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
      q: "Is AuraPass compliant with GDPR Article 9, Illinois BIPA, and Indian privacy norms?",
      a: "AuraPass provides on-premise data residency, irreversible vector storage, and 1-click permanent record purging. Data never leaves your premises. Formal legal compliance depends on organizational consent policies."
    },
    {
      q: "What server hardware is required to run AuraPass?",
      a: "For single-lane offices (up to 500 staff), any standard quad-core Intel i5 or AMD Ryzen workstation with 8 GB RAM is sufficient. For multi-camera facilities with 5+ lanes, an 8-core CPU or an optional dedicated NVIDIA GPU ensures continuous sub-300 ms throughput."
    },
    {
      q: "Can we automatically export attendance records to payroll software?",
      a: "Yes. Attendance events can be filtered by date, shift, or department and exported directly to standardized CSV, Excel, or PDF formats compatible with Tally, QuickBooks, Excel, and custom HRMS."
    }
  ];

  const currentHeroStream = HERO_STREAMS[activeHeroStream];

  // Pricing Calculation Helpers
  const unitRate = currency === 'INR' 
    ? (billingInterval === 'annual' ? 23 : 29) 
    : (billingInterval === 'annual' ? 0.28 : 0.35);
  
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const calculatedProTotal = Math.round(pricingStaffCount * unitRate);

  return (
    <div className="min-h-screen public-surface bg-[#070A12] text-slate-200 flex flex-col font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Scroll Progress Indicator */}
      <div
        className="scroll-progress-bar"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Hero Ambient Illumination Spotlight */}
      <div className="absolute inset-x-0 top-0 h-[600px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent rounded-full blur-[120px]" />
        <div className="absolute inset-0 hero-dot-grid opacity-60" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.1 NAVIGATION (COMPACT, WELL-FRAMED 1320px HEADER)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolledNav
            ? 'h-14 bg-[#070A12]/92 backdrop-blur-xl border-b border-white/[0.08]'
            : 'h-16 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 h-full flex items-center justify-between">
          
          {/* Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-all shadow-sm shadow-emerald-500/20">
              <Scan className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              AuraPass<sup className="text-[9px] text-emerald-400 font-mono-tag ml-0.5">&trade;</sup>
            </span>
          </Link>

          {/* Desktop Center Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs text-slate-300 font-medium">
            <a href="#simulator" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#sovereignty" className="hover:text-white transition-colors">Sovereignty & Trust</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fair Pricing</a>
            <Link to="/docs" className="hover:text-emerald-400 text-emerald-400/90 transition-colors flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Docs</span>
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <span>Open console</span>
                <ArrowRight className="w-3 h-3" />
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
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer items-center gap-1.5"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-[#0F1524] border border-white/[0.08] text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Fullscreen Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-14 bg-[#070A12]/98 backdrop-blur-2xl border-b border-white/[0.08] p-5 space-y-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-3 text-xs font-medium text-slate-200">
              <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="py-1">Interactive Demo</a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="py-1">Capabilities</a>
              <a href="#sovereignty" onClick={() => setMobileMenuOpen(false)} className="py-1">Sovereignty & Trust</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1">Fair Pricing</a>
              <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="py-1 text-emerald-400">Documentation</Link>
              <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="py-1">Help Center & Support</Link>
            </nav>
            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-emerald-400 text-slate-950 font-bold text-xs text-center shadow-lg shadow-emerald-500/20"
              >
                Start 7-Day Free Trial
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 rounded-lg bg-[#0F1524] border border-white/[0.08] text-slate-200 font-semibold text-xs text-center"
              >
                Sign in to Console
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.2 HERO SECTION (SHORTENED, BALANCED & WELL-FRAMED)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-4 sm:pt-6 pb-8 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Compact Technical Narrative (5 Cols) */}
          <div className="lg:col-span-5 text-left space-y-4">
            
            {/* Technical Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono-tag">⚡ Local Engine v2026.2 • Zero Cloud Egress</span>
            </div>

            {/* H1 Headline (Tightened font size to fit screens cleanly) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Attendance that recognizes people, <br />
              <span className="specular-text-shimmer">not badges.</span>
            </h1>

            {/* Subhead */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-lg">
              Transform standard RTSP security cameras or USB webcams into sub-300 ms facial verification gates. Complete on-premise execution with zero data egress.
            </p>

            {/* CTAs */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href="#simulator"
                className="px-4 py-2.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/[0.08] hover:border-emerald-500/30 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>See it work</span>
              </a>
            </div>

            {/* Trust Row */}
            <div className="pt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" /> Free 7-day trial</span>
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" /> Setup in ~10 minutes</span>
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" /> Operates 100% offline</span>
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" /> Hikvision, Dahua, Axis, UVC</span>
            </div>
          </div>

          {/* Right Column: Compact Multi-Camera Terminal Showcase (7 Cols) */}
          <div
            className="lg:col-span-7 w-full relative"
            style={{ perspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* 3D Tilt Terminal Wrapper with constrained height */}
            <div
              ref={cardRef}
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full rounded-2xl public-card p-3 sm:p-4 shadow-xl relative overflow-hidden bg-[#0A0E1A] border border-white/[0.1]"
            >
              {/* Terminal Top Chrome: Camera Switcher Tabs */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] mb-2.5 gap-2 text-xs font-mono-tag">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-slate-400 ml-1.5 font-bold text-[11px]">{currentHeroStream.name}</span>
                </div>

                {/* Multi-Camera Stream Switcher Pills */}
                <div className="flex items-center gap-1 bg-[#05070D] p-0.5 rounded-lg border border-white/[0.06]">
                  {HERO_STREAMS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveHeroStream(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
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

              {/* Live Stream Viewport with 68-Point Mesh Overlay (Capped at 300px max-height) */}
              <div className="relative aspect-[16/9] max-h-[300px] w-full rounded-xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
                <img
                  src={currentHeroStream.image}
                  alt={currentHeroStream.name}
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/35 pointer-events-none" />

                {/* Animated HUD Scanline */}
                <div className="absolute inset-x-0 h-[2px] bg-emerald-400/80 shadow-[0_0_12px_#34D399] animate-scanline pointer-events-none" />

                {/* 68-Point Landmark Mesh Vector Simulation */}
                <div className="relative z-10 w-32 h-32 rounded-full border border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_25px_rgba(52,211,153,0.3)] flex items-center justify-center">
                  <div className="absolute inset-1.5 rounded-full border border-dashed border-emerald-400/30 animate-spin" style={{ animationDuration: '18s' }} />
                  
                  {/* Subtle 68-point mesh constellation markers */}
                  <div className="absolute top-6 left-9 w-1 h-1 bg-emerald-300 rounded-full shadow-[0_0_6px_#34D399]" />
                  <div className="absolute top-6 right-9 w-1 h-1 bg-emerald-300 rounded-full shadow-[0_0_6px_#34D399]" />
                  <div className="absolute top-12 left-14 w-1 h-1 bg-emerald-300 rounded-full shadow-[0_0_6px_#34D399]" />
                  <div className="absolute top-18 left-10 w-1 h-1 bg-emerald-300 rounded-full shadow-[0_0_6px_#34D399]" />
                  <div className="absolute top-18 right-10 w-1 h-1 bg-emerald-300 rounded-full shadow-[0_0_6px_#34D399]" />
                  <div className="absolute bottom-8 left-14 w-1 h-1 bg-emerald-300 rounded-full shadow-[0_0_6px_#34D399]" />
                  
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                </div>

                {/* HUD Overlay Tags */}
                <div className="absolute top-2.5 left-2.5 z-10 text-[10px] font-mono-tag bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Protocol: <strong className="text-white">{currentHeroStream.protocol}</strong></span>
                </div>
                <div className="absolute top-2.5 right-2.5 z-10 text-[10px] font-mono-tag bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-emerald-400 font-bold">
                  {currentHeroStream.fps} &bull; {currentHeroStream.latency}
                </div>

                {/* Active Identified Employee Card (Priya Sharma matching the photo) */}
                <div className="absolute bottom-2.5 inset-x-2.5 z-10 bg-[#070A12]/92 backdrop-blur-md rounded-lg p-2 border border-emerald-500/35 flex items-center justify-between text-xs font-mono-tag shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-[10px]">
                      {currentHeroStream.employee.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px] leading-tight">{currentHeroStream.employee} ({currentHeroStream.badge})</p>
                      <p className="text-[10px] text-slate-400 font-normal">{currentHeroStream.dept} &bull; {currentHeroStream.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                      {currentHeroStream.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {currentHeroStream.confidence}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terminal Footer Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs font-mono-tag">
                <div className="p-1.5 rounded-lg bg-[#070A12] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-xs">&lt; 300 ms</span>
                  <span className="text-[9px] text-slate-500 block">Latency</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#070A12] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-xs">512-d</span>
                  <span className="text-[9px] text-slate-500 block">Vectors</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#070A12] border border-white/[0.06]">
                  <span className="text-emerald-400 font-bold text-xs">0 Bytes</span>
                  <span className="text-[9px] text-slate-500 block">Cloud Egress</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Compatibility Strip */}
        <div className="mt-8 pt-4 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono-tag text-slate-400">
          <span>Works with the security cameras and terminals you already own:</span>
          <div className="flex flex-wrap items-center gap-5 text-slate-300 font-semibold text-[11px]">
            <span className="hover:text-emerald-400 transition-colors">Hikvision</span>
            <span className="hover:text-emerald-400 transition-colors">Dahua</span>
            <span className="hover:text-emerald-400 transition-colors">Axis Communications</span>
            <span className="hover:text-emerald-400 transition-colors">Hanwha Vision</span>
            <span className="hover:text-emerald-400 transition-colors">Logitech USB</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">RTSP / ONVIF</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.3 "THE PROBLEM" FRAMING STRIP
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-10 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full section-hairline z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <div className="p-5 rounded-2xl public-card space-y-2 border-l-2 border-l-rose-500/60">
            <span className="text-[11px] font-mono-tag font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
              Badge Vulnerability
            </span>
            <p className="text-sm font-semibold text-white">Badges get lost, shared, and buddy-punched.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Plastic RFID keycards cost ₹200–₹500 to replace and cannot guarantee genuine human presence.
            </p>
          </div>

          <div className="p-5 rounded-2xl public-card space-y-2 border-l-2 border-l-amber-500/60">
            <span className="text-[11px] font-mono-tag font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
              Cloud Privacy Exposure
            </span>
            <p className="text-sm font-semibold text-white">Cloud face systems send employee biometrics off-site.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Transmitting facial imagery over public cloud APIs creates high security exposure and internet dependency.
            </p>
          </div>

          <div className="p-5 rounded-2xl public-card space-y-2 border-l-2 border-l-cyan-500/60">
            <span className="text-[11px] font-mono-tag font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 inline-block">
              Timesheet Disputes
            </span>
            <p className="text-sm font-semibold text-white">Manual registers cause ongoing payroll disputes.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Disputed arrival times and proxy attendance consume hours of management time every month.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 font-mono-tag pt-6">
          AuraPass fixes all three on your own local computer or server.
        </p>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.4 INTERACTIVE HARDWARE SIMULATOR ("SEE IT WORK")
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="simulator" className="py-12 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Interactive Hardware Simulator"
          badgeIcon={Sparkles}
          title="See how face verification works in real time"
          subtitle="Test standard employee arrival, presentation attack rejection, or glasses tolerance."
        />

        {/* Scenario Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setSimMode('standard'); triggerSimulation('standard'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              simMode === 'glasses'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            Daily Glasses & Headwear Tolerance
          </button>
        </div>

        {/* Simulator Shell: Left Viewport (7 Cols), Right Pipeline Timing (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Viewport */}
          <div className="lg:col-span-7 rounded-2xl public-card p-4 flex flex-col justify-between relative overflow-hidden bg-[#0A0E1A]">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2 text-xs font-mono-tag">
              <span className="text-slate-400">Camera Terminal: RTSP_CAM_01</span>
              <span className="text-emerald-400 font-bold">Latency: {simTime} ms</span>
            </div>

            <div className="relative aspect-[16/9] max-h-[300px] w-full rounded-xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
              <img
                src={simMode === 'spoofing' ? '/auth-bg.png' : '/aurapass_kiosk_preview.jpg'}
                alt="Simulator Viewport"
                className={`absolute inset-0 w-full h-full object-cover object-center filter ${
                  simMode === 'spoofing' ? 'grayscale brightness-75' : 'brightness-95'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />

              {/* Status Outcome HUD Banner (Accurately displays Priya Sharma for the female photo) */}
              {simStep >= 5 && (
                <div
                  className={`absolute z-20 px-4 py-2 rounded-xl border backdrop-blur-md text-xs font-mono-tag font-bold flex items-center gap-2 shadow-2xl ${
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
                      <span>Access Granted: Priya Sharma (99.4%)</span>
                    </>
                  )}
                </div>
              )}

              {/* HUD Corner Data Chips */}
              <div className="absolute bottom-2.5 left-2.5 z-10 text-[10px] font-mono-tag bg-black/80 px-2 py-0.5 rounded border border-white/10 text-slate-300">
                Mode: <strong className="text-white">{simMode.toUpperCase()}</strong>
              </div>
              <div className="absolute bottom-2.5 right-2.5 z-10 text-[10px] font-mono-tag bg-black/80 px-2 py-0.5 rounded border border-white/10 text-slate-300">
                Zero Cloud Egress
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => triggerSimulation(simMode)}
                disabled={simRunning}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <RefreshCw className={`w-3 h-3 ${simRunning ? 'animate-spin' : ''}`} />
                <span>{simRunning ? 'Executing...' : 'Simulate check-in again'}</span>
              </button>
              <span className="text-[10px] font-mono-tag text-slate-500">Continuous local loop</span>
            </div>
          </div>

          {/* Right Pipeline Checklist */}
          <div className="lg:col-span-5 rounded-2xl public-card p-5 flex flex-col justify-between text-left space-y-3">
            <div>
              <p className="text-[11px] font-mono-tag font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                Real-Time Inference Pipeline
              </p>
              <h3 className="text-base font-bold text-white">Under 300 ms End-to-End</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Watch each step execute sequentially in host CPU memory.
              </p>
            </div>

            <div className="space-y-2 font-mono-tag text-xs">
              <div className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 1 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${simStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1. Video Frame Captured</span>
                  </span>
                  <span className="text-[10px] text-slate-400">12 ms</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 2 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${simStep >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>2. MediaPipe BlazeFace (68 Pts)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">28 ms</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 3 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${simStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>3. Anti-Spoofing & Liveness</span>
                  </span>
                  <span className={`text-[10px] ${simMode === 'spoofing' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                    {simMode === 'spoofing' ? 'FAILED' : '36 ms'}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 4 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${simStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>4. FaceNet512 Vector Extracted</span>
                  </span>
                  <span className="text-[10px] text-slate-400">72 ms</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 5 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${simStep >= 5 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>5. Vector Distance & Match</span>
                  </span>
                  <span className="text-[10px] text-slate-400">4 ms</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 6 ? 'bg-[#0E1526] border-emerald-500/35 text-white' : 'bg-[#080B14] border-white/[0.06] text-slate-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${simStep >= 6 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>6. Gate Relay & Attendance Log</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">Total: {simTime} ms</span>
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-white/[0.08] text-[10px] text-slate-400 font-mono-tag">
              Zero frames uploaded to any third-party cloud.
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.6 CAPABILITIES (LIVING INTERACTIVE BENTO GRID)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-12 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Interactive Capabilities"
          badgeIcon={Zap}
          title="Living tools engineered for workplace operations"
          subtitle="Test live interactive controls for attendance timelines, grace period rules, and relay triggers."
        />

        {/* Asymmetric Living Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
          
          {/* Tile 1: Live Interactive Attendance Timeline & Export (Span 2) */}
          <div className="md:col-span-2 rounded-2xl public-card p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-mono-tag font-bold text-emerald-400 uppercase tracking-wider">
                  Live Operations Feed
                </span>
                <div className="flex items-center gap-1.5">
                  {['all', 'engineering', 'operations', 'qa'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAttendanceDeptFilter(d)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-tag capitalize transition-all cursor-pointer ${
                        attendanceDeptFilter === d
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'text-slate-400 hover:text-white bg-white/[0.04]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={exportSampleCSV}
                    className="ml-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold text-white">Real-Time Attendance Timeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Continuous log of verified employee check-ins with department filters and 1-click payroll spreadsheet export.
              </p>
            </div>

            {/* Live Filtered Table */}
            <div className="rounded-xl bg-[#070A12] border border-white/[0.06] overflow-hidden">
              <table className="w-full text-left text-xs font-mono-tag">
                <thead className="bg-[#0B0F19] text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-2 px-3">Employee</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredAttendance.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[9px]">
                          {row.avatar}
                        </span>
                        <span className="text-white font-medium text-[11px]">{row.name}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 text-[11px]">{row.dept}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{row.time}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          row.status === 'ON TIME'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300 text-[11px]">{row.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tile 2: Interactive Shift Grace Calculator Slider */}
          <div className="rounded-2xl public-card p-5 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono-tag font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                Interactive Policy Tool
              </span>
              <h3 className="text-base font-bold text-white">Shift Grace Calculator</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Drag the grace slider to see arrival status change dynamically in real time.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06] space-y-2.5 font-mono-tag text-xs">
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

              <div className="pt-2 border-t border-white/[0.06] text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Shift Start: <strong>09:00 AM</strong></span>
                  <span>Arrival: <strong>09:14 AM</strong></span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span>Calculated Status:</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    graceMinutes >= 14
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {graceMinutes >= 14 ? 'ON TIME (Grace Applied)' : 'LATE (Flagged for Review)'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono-tag">
              Configurable per department (Engineering, Sales, Plant).
            </p>
          </div>

          {/* Tile 3: Multi-Cue Presentation Attack Radar */}
          <div className="rounded-2xl public-card p-5 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono-tag font-bold text-rose-400 uppercase tracking-wider block mb-0.5">
                Anti-Spoofing Radar
              </span>
              <h3 className="text-base font-bold text-white">Passive Liveness Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Detects 2D photos, screen replays, and printed masks in under 120 ms.
              </p>
            </div>

            {/* Radar Simulation */}
            <div className="p-3 rounded-xl bg-[#070A12] border border-white/[0.06] flex items-center justify-between gap-3">
              <div className="relative w-16 h-16 rounded-full border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/20" />
                <div className="absolute w-full h-[1px] bg-emerald-400/80 animate-radar origin-center" />
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="space-y-1 text-xs font-mono-tag">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRadarTestMode('live')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
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
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                      radarTestMode === 'attack'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'text-slate-400 bg-white/5'
                    }`}
                  >
                    Photo Attack
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 pt-0.5">
                  PAD Score: <strong className={radarTestMode === 'live' ? 'text-emerald-400' : 'text-rose-400'}>
                    {radarTestMode === 'live' ? '98.9% (Genuine)' : '11.4% (Spoof Detected)'}
                  </strong>
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono-tag">
              Compliant with ISO/IEC 30107-3 PAD standards.
            </p>
          </div>

          {/* Tile 4: 3-Shot Enrollment Protocol Visualizer */}
          <div className="rounded-2xl public-card p-5 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono-tag font-bold text-cyan-400 uppercase tracking-wider block mb-0.5">
                Biometric Quality
              </span>
              <h3 className="text-base font-bold text-white">3-Shot Enrollment Protocol</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Multi-angle face registration captures three key perspectives under 2 minutes.
              </p>
            </div>

            {/* Angle Switcher */}
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono-tag text-xs">
              {[
                { angle: 0, label: "0° Frontal", stat: "100%" },
                { angle: 1, label: "-15° Left", stat: "98%" },
                { angle: 2, label: "+15° Right", stat: "99%" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEnrollmentAngle(idx)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    enrollmentAngle === idx
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-[#070A12] border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px]">{item.label}</span>
                  <span className="text-[9px] text-slate-500 block">{item.stat} Quality</span>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 font-mono-tag">
              Requires 160×160px minimum face bounding box.
            </p>
          </div>

          {/* Tile 5: Hardware Relay Pulse & Turnstile Trigger */}
          <div className="rounded-2xl public-card p-5 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono-tag font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                Access Control
              </span>
              <h3 className="text-base font-bold text-white">Hardware Relay & Turnstiles</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Syncs directly with GPIO signals and digital relays to trigger magnetic door locks.
              </p>
            </div>

            {/* Relay Pulse Button */}
            <div className="p-3 rounded-xl bg-[#070A12] border border-white/[0.06] space-y-2 font-mono-tag text-xs">
              <button
                type="button"
                onClick={triggerRelayPulse}
                className={`w-full py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                  relayPulsed
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-[#0F1524] text-slate-200 hover:bg-[#182238] border border-white/10'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${relayPulsed ? 'fill-slate-950 text-slate-950 animate-bounce' : 'text-emerald-400'}`} />
                <span>{relayPulsed ? 'RELAY ACTIVE: GATE OPEN' : 'Test GPIO Relay Pulse'}</span>
              </button>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Signal: <strong className={relayPulsed ? 'text-emerald-400' : 'text-slate-500'}>
                  {relayPulsed ? 'HIGH (Active)' : 'LOW (Standby)'}
                </strong></span>
                <span>Port: <strong>GPIO 17</strong></span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono-tag">
              Compatible with turnstiles, speed gates, and maglocks.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.8 BIOMETRIC SOVEREIGNTY & AIR-GAP ARCHITECTURE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="sovereignty" className="py-12 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Biometric Sovereignty"
          badgeIcon={Shield}
          title="Total on-premise execution. Zero cloud egress."
          subtitle="Built for strict privacy and data protection norms. No external cloud dependencies."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center max-w-5xl mx-auto">
          {/* Principles */}
          <div className="space-y-3 text-left">
            <div className="p-4 rounded-xl public-card space-y-1">
              <h3 className="text-sm font-bold text-white">One-Way Numeric Vectors</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Faces are transformed into irreversible 512-dimensional numeric unit vectors. Raw images do not need to be stored after enrollment processing.
              </p>
            </div>

            <div className="p-4 rounded-xl public-card space-y-1">
              <h3 className="text-sm font-bold text-white">Runs Fully Offline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                No outbound connection required. Operates behind your physical firewall on an isolated VLAN with total feature parity.
              </p>
            </div>

            <div className="p-4 rounded-xl public-card space-y-1">
              <h3 className="text-sm font-bold text-white">1-Click Permanent Deletion</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                When an employee leaves, administrators can delete their profile and permanently purge their vectors from the active database index.
              </p>
            </div>
          </div>

          {/* Data Flow Diagram */}
          <div className="p-5 rounded-xl public-card flex flex-col items-center justify-center text-center font-mono-tag text-xs space-y-3 bg-[#070A12]">
            <p className="font-bold text-white uppercase text-[10px] pb-1 border-b border-white/[0.08] w-full">
              Local Data Flow Boundary
            </p>

            <div className="w-full space-y-1.5 text-left text-[11px]">
              <div className="p-2 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>1. Camera Feed (RTSP)</span>
                <span className="text-slate-400">Local Wire</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>2. Local Host Inference</span>
                <span className="text-emerald-400 font-bold">512-d Vector</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>3. Local SQLite / PostgreSQL</span>
                <span className="text-emerald-400 font-bold">Encrypted DB</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between">
                <span>4. Digital GPIO Relay Pulse</span>
                <span className="text-emerald-400 font-bold">Turnstile Trigger</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 w-full justify-center">
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Hard Boundary: 0 Bytes Cloud Egress</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.10 FAIR PER-PERSON PRICING (TAILORED FOR INDIAN & INTERNATIONAL MARKETS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-12 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full section-hairline z-10">
        
        {/* Free 7-Day Trial Callout Banner */}
        <div className="mb-8 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-emerald-500/15 border border-emerald-500/40 text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-mono-tag text-emerald-300 shadow-lg shadow-emerald-950/30">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>Free 7-Day Full Trial on All Plans:</strong> Test on your own cameras with zero payment and no credit card required.</span>
        </div>

        <SectionHeader
          badge="Fair Per-Person Pricing"
          badgeIcon={Zap}
          title="Transparent pricing based on enrolled staff"
          subtitle="Pay only for the people who use the system. No scan limits, no hardware lock-in."
        />

        {/* Currency & Annual Billing Toggles */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          
          {/* Currency Switcher (INR default for Indian clients) */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#0F1524] border border-white/[0.08] text-xs font-mono-tag">
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                currency === 'INR'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇳 INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 USD ($)
            </button>
          </div>

          {/* Annual Billing Switcher with 20% discount badge */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#0F1524] border border-white/[0.08] text-xs font-mono-tag">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                billingInterval === 'monthly'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('annual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                billingInterval === 'annual'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500 text-slate-950 font-bold">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Per-Person Price Calculator Tool */}
        <div className="mb-10 p-5 rounded-2xl public-card bg-[#090D17] border border-emerald-500/30 max-w-2xl mx-auto text-left font-mono-tag text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-bold text-xs">Calculate For Your Staff Size:</span>
            <span className="text-emerald-400 font-bold text-sm">{pricingStaffCount} Employees</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="25"
            max="500"
            step="25"
            value={pricingStaffCount}
            onChange={(e) => setPricingStaffCount(Number(e.target.value))}
            className="w-full range-slider-thumb accent-emerald-400 cursor-pointer mb-3"
          />

          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/[0.08] text-[11px]">
            <span className="text-slate-400">
              Rate: <strong className="text-white">{currencySymbol}{unitRate}</strong> / employee / month
            </span>
            <span className="text-emerald-300 font-bold">
              Total: {currencySymbol}{calculatedProTotal.toLocaleString()} / month
              {billingInterval === 'annual' && <span className="text-[10px] text-slate-400 ml-1">(billed annually)</span>}
            </span>
          </div>
        </div>

        {/* 3 Fair Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch text-left">
          
          {/* Card 1: Free Starter */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between border-white/[0.08] relative">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tag bg-white/[0.06] text-slate-300 border border-white/[0.08] inline-block font-semibold">
                Pilot & Small Setups
              </span>
              <h3 className="text-xl font-bold text-white">Starter</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                For small retail shops, test gates, and single-room setups.
              </p>

              <div className="pt-1">
                <span className="text-3xl font-bold text-white font-mono-tag">{currencySymbol}0</span>
                <span className="text-xs text-slate-400 ml-2">free forever</span>
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs text-slate-300 font-normal">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 25 enrolled employees</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1 camera stream (RTSP or USB)</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100% on-premise local SQLite</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full sub-300 ms verification speed</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Daily logs & CSV attendance export</div>
              </div>
            </div>

            <div className="pt-6 mt-auto">
              <Link
                to="/register"
                className="w-full py-2.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-white font-bold text-xs flex items-center justify-center transition-colors"
              >
                Start free (No Card Needed)
              </Link>
            </div>
          </div>

          {/* Card 2: Professional (Per-Person Model) */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between border-emerald-500/50 shadow-lg shadow-emerald-950/30 relative bg-[#0B101D]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono-tag uppercase tracking-wider shadow-md">
              Most Popular • 7-Day Free Trial
            </div>

            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tag bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-block font-semibold">
                Offices, Factories & Schools
              </span>
              <h3 className="text-xl font-bold text-white">Professional</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Fair, transparent per-employee billing for growing facilities.
              </p>

              <div className="pt-1 flex items-baseline gap-1.5 font-mono-tag">
                <span className="text-3xl font-bold text-white">
                  {currencySymbol}{unitRate}
                </span>
                <span className="text-xs text-slate-400">/ employee / month</span>
                {billingInterval === 'annual' && (
                  <span className="text-[10px] text-emerald-400 font-bold ml-1">SAVE 20%</span>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs text-slate-300 font-normal">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Pay only for enrolled staff (from 25 users)</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited RTSP & ONVIF camera lanes</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Multi-camera mosaic & live site feeds</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Department grace policies & shifts</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Hardware GPIO turnstile & relay triggers</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Priority WhatsApp & phone assistance</div>
              </div>
            </div>

            <div className="pt-6 mt-auto">
              <Link
                to="/register"
                className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 active:scale-98"
              >
                <span>Start 7-Day Free Trial &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Custom Enterprise */}
          <div className="rounded-2xl public-card p-6 flex flex-col justify-between border-white/[0.08] relative">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tag bg-white/[0.06] text-slate-300 border border-white/[0.08] inline-block font-semibold">
                Campuses & High Volume (500+)
              </span>
              <h3 className="text-xl font-bold text-white">Custom Enterprise</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                For manufacturing plants, institutions, and multi-branch campuses.
              </p>

              <div className="pt-1">
                <span className="text-3xl font-bold text-white font-mono-tag">Custom</span>
                <span className="text-xs text-slate-400 ml-2">volume discount</span>
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs text-slate-300 font-normal">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Heavy volume discounts (from {currencySymbol}{currency === 'INR' ? '15' : '0.18'} / user)</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Turnkey pre-configured on-prem appliances</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> On-site turnstile & magnetic lock GPIO wiring</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100% offline air-gapped updates</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Dedicated Solutions Architect</div>
              </div>
            </div>

            <div className="pt-6 mt-auto">
              <Link
                to="/support"
                className="w-full py-2.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-white font-bold text-xs flex items-center justify-center transition-colors"
              >
                Contact for Custom Quote
              </Link>
            </div>
          </div>
        </div>

        {/* Collapsible Feature Comparison Table Toggle */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowPricingCompare(!showPricingCompare)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <span>{showPricingCompare ? "Hide feature comparison" : "Compare all plan features"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPricingCompare ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showPricingCompare && (
          <div className="mt-6 rounded-xl public-card p-5 overflow-x-auto text-left text-xs font-mono-tag bg-[#070A12] border border-white/[0.08]">
            <table className="w-full text-slate-300">
              <thead className="border-b border-white/[0.08] text-white">
                <tr>
                  <th className="py-2.5 px-3 text-left font-bold">Feature</th>
                  <th className="py-2.5 px-3 text-center font-bold">Starter</th>
                  <th className="py-2.5 px-3 text-center font-bold text-emerald-400">Professional</th>
                  <th className="py-2.5 px-3 text-center font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Trial Period</td>
                  <td className="py-2.5 px-3 text-center">Free Forever</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">7 Days Free Trial</td>
                  <td className="py-2.5 px-3 text-center">Custom Pilot POC</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Enrolled Users</td>
                  <td className="py-2.5 px-3 text-center">Up to 25</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Pay-Per-Person (Flexible)</td>
                  <td className="py-2.5 px-3 text-center">500+ Volume Discount</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Concurrent Camera Streams</td>
                  <td className="py-2.5 px-3 text-center">1 Stream</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Unlimited RTSP / UVC</td>
                  <td className="py-2.5 px-3 text-center">Unlimited + Multi-Node</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Verification Speed</td>
                  <td className="py-2.5 px-3 text-center">&lt; 300 ms</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">&lt; 300 ms</td>
                  <td className="py-2.5 px-3 text-center">&lt; 150 ms (Hardware-tuned)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Turnstile / Relay GPIO</td>
                  <td className="py-2.5 px-3 text-center">No</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Digital Relay Sync</td>
                  <td className="py-2.5 px-3 text-center">Custom Opto-Isolated Wiring</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Database Engine</td>
                  <td className="py-2.5 px-3 text-center">Local SQLite</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">PostgreSQL + Auto-Backups</td>
                  <td className="py-2.5 px-3 text-center">Clustered High Availability</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.11 FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-12 px-5 sm:px-8 lg:px-10 max-w-[1100px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="FAQ"
          badgeIcon={HelpCircle}
          title="Frequently asked questions"
          subtitle="Honest, clear answers about hardware, privacy, and per-person pricing."
        />

        <div className="space-y-2.5 text-left">
          {faqs.map((faq, i) => {
            const isExpanded = expandedFaq === i;
            return (
              <div key={i} className="rounded-xl public-card overflow-hidden transition-all bg-[#090D17]">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : i)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isExpanded}
                >
                  <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0.5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] font-normal">
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
      <section className="py-12 px-5 sm:px-8 lg:px-10 max-w-[1320px] mx-auto w-full z-10">
        <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-b from-[#0E1729] to-[#070B14] p-6 sm:p-10 text-center relative overflow-hidden shadow-xl shadow-emerald-950/40">
          <div className="relative z-10 max-w-lg mx-auto space-y-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono-tag font-bold tracking-wider uppercase">
              Free 7-Day Trial
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Start verifying faces in about 10 minutes.
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Connect your existing webcam or IP camera and begin attendance logging immediately.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F1524] hover:bg-[#162035] border border-white/10 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Read the docs</span>
              </Link>
            </div>

            <p className="text-[10px] text-slate-500 font-mono-tag pt-1">No credit card or commitment required.</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.13 FOOTER (COMPACT & BALANCED)
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#05070D] py-10 px-5 sm:px-8 lg:px-10 z-10">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-6 mb-8 text-left">
          
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                <Scan className="w-3 h-3" />
              </div>
              <span className="font-bold text-sm text-white">AuraPass</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-normal">
              High-throughput on-premise facial recognition attendance and access verification engine.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs font-mono-tag text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>All systems operational &bull; v2026.2</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase font-mono-tag tracking-wider">Product</p>
            <ul className="space-y-1.5 text-xs text-slate-400 font-normal">
              <li><a href="#simulator" className="hover:text-emerald-400 transition-colors">Simulator</a></li>
              <li><a href="#capabilities" className="hover:text-emerald-400 transition-colors">Capabilities</a></li>
              <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing & Plans</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase font-mono-tag tracking-wider">Documentation</p>
            <ul className="space-y-1.5 text-xs text-slate-400 font-normal">
              <li><Link to="/docs?page=quickstart" className="hover:text-emerald-400 transition-colors">Quickstart</Link></li>
              <li><Link to="/docs?page=rtsp-streams" className="hover:text-emerald-400 transition-colors">Cameras & RTSP</Link></li>
              <li><Link to="/docs?page=3-shot-protocol" className="hover:text-emerald-400 transition-colors">3-Shot Enrollment</Link></li>
              <li><Link to="/support" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase font-mono-tag tracking-wider">Legal</p>
            <ul className="space-y-1.5 text-xs text-slate-400 font-normal">
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><a href="#sovereignty" className="hover:text-emerald-400 transition-colors">Biometric Sovereignty</a></li>
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>Back to top</span>
                  <ArrowUp className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-mono-tag">
          <p>&copy; {new Date().getFullYear()} AuraPass. All rights reserved.</p>
          <p>On-premise engine v2026.2</p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.14 STICKY MOBILE CTA BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      {showStickyMobileCta && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-2.5 bg-[#070A12]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
          <div className="text-left font-mono-tag text-xs">
            <span className="text-white font-bold block text-xs">AuraPass Enterprise</span>
            <span className="text-emerald-400 text-[10px]">7-Day Free Trial &bull; Sub-300ms</span>
          </div>
          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98"
          >
            Start Free Trial
          </Link>
        </div>
      )}

    </div>
  );
}
