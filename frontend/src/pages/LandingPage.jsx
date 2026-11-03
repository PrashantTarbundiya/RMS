import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Glasses,
  Database,
  ArrowUp,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Container from '../components/ui/marketing/Container';
import Badge from '../components/ui/marketing/Badge';
import SectionHeader from '../components/ui/marketing/SectionHeader';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll Progress & Nav Background State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolledNav, setScrolledNav] = useState(false);
  const [showStickyMobileCta, setShowStickyMobileCta] = useState(false);

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 3D Tilt State for Hero & Simulator
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Simulator Scenario: 'standard' | 'spoofing' | 'glasses'
  const [simMode, setSimMode] = useState('standard');
  const [simState, setSimState] = useState('idle'); // 'idle' | 'scanning' | 'verified' | 'rejected'
  const [simTime, setSimTime] = useState(242);
  const [simStep, setSimStep] = useState(0);

  // Pricing Interval: 'monthly' | 'annual'
  const [billingInterval, setBillingInterval] = useState('annual');
  const [showPricingCompare, setShowPricingCompare] = useState(false);

  // How It Works Active Step (0-3)
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  // Product Showcase Active Tab (0: Live Site, 1: Departments, 2: Kiosk Terminal, 3: Models)
  const [activeShowcaseTab, setActiveShowcaseTab] = useState(0);

  // FAQ Accordion State (single open)
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress(totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0);
      setScrolledNav(currentScroll > 20);
      setShowStickyMobileCta(currentScroll > 450 && currentScroll < 3800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const triggerSimulation = (mode = simMode) => {
    if (simState === 'scanning') return;
    setSimMode(mode);
    setSimState('scanning');
    setSimStep(1);

    setTimeout(() => setSimStep(2), 150);
    setTimeout(() => setSimStep(3), 300);
    setTimeout(() => setSimStep(4), 450);

    setTimeout(() => {
      setSimStep(5);
      if (mode === 'spoofing') {
        setSimState('rejected');
        setSimTime(218);
      } else if (mode === 'glasses') {
        setSimState('verified');
        setSimTime(264);
      } else {
        setSimState('verified');
        setSimTime(242);
      }
    }, 600);
  };

  const resetSimulation = () => {
    setSimState('idle');
    setSimStep(0);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs = [
    {
      q: "Does any employee photo or biometric data leave our workplace network?",
      a: "Never. AuraPass is engineered strictly as an on-premise biometric engine. All facial landmark detection, 512-dimensional vector extraction, and database matching execute locally on your workplace machine. No photographs, face crops, or embeddings are ever transmitted to any external cloud API."
    },
    {
      q: "How does the system prevent spoofing with printed photos or smartphone screens?",
      a: "AuraPass integrates multi-cue presentation attack detection (PAD). It inspects surface specular reflection, frequency spectrum artifacts, micro-texture gradients, and face depth cues to ensure a live biological person is present before calculating matching embeddings."
    },
    {
      q: "What camera hardware and computer specifications are required?",
      a: "AuraPass runs on any modern 4-core desktop or laptop (Intel Core i5, AMD Ryzen 5, or Apple Silicon) with 8 GB RAM. For video capture, it directly ingests standard RTSP and ONVIF streams from enterprise IP cameras (Hikvision, Dahua, Axis, Hanwha) or common USB webcams."
    },
    {
      q: "How accurate is the recognition, and in what conditions?",
      a: "AuraPass achieves 99.4% accuracy on the academic LFW benchmark. Real-world accuracy depends on entrance lighting, camera placement, and enrollment quality. For optimal sub-300ms verification, we recommend 300 to 500 lux diffuse lighting."
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
      a: "Attendance continues without interruption. Because all recognition, database lookups (SQLite/PostgreSQL), and camera ingest loops run on your local network, zero internet connection is required for ongoing operations."
    },
    {
      q: "How does AuraPass comply with workplace privacy laws (GDPR & BIPA)?",
      a: "AuraPass converts faces into irreversible 512-dimensional mathematical vectors from which the original photo cannot be reconstructed. Raw enrollment images can be immediately deleted, and administrators have single-click tools to purge an employee's vectors permanently upon departure."
    },
    {
      q: "What happens when our organization outgrows the free tier?",
      a: "You can seamlessly transition from the free Starter plan (up to 200 staff) to the Business plan (up to 5,000 staff) by switching database configuration from SQLite to PostgreSQL. All historical logs and enrolled vectors migrate intact."
    }
  ];

  return (
    <div className="min-h-screen public-surface marketing-bg text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          PAGE-LEVEL UX: SLIM TOP SCROLL PROGRESS BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      <div
        className="scroll-progress-bar"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Hero Dotted Grid Background Texture */}
      <div className="absolute inset-x-0 top-0 h-[800px] hero-dot-grid pointer-events-none z-0" />

      {/* ─────────────────────────────────────────────────────────────────────────────
          5.1 STICKY NAVIGATION
      ───────────────────────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolledNav
            ? 'h-16 bg-[#070A12]/90 backdrop-blur-xl border-b border-white/[0.08]'
            : 'h-20 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Logo & Wordmark (No Enterprise pill in nav per 5.1) */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-all shadow-sm shadow-emerald-500/20">
              <Scan className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              AuraPass<sup className="text-[10px] text-emerald-400 font-mono-tag ml-0.5">&trade;</sup>
            </span>
          </Link>

          {/* Desktop Center Links (Scroll-spy jump anchors) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs text-slate-300 font-medium">
            <a href="#simulator" className="hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#sovereignty" className="hover:text-white transition-colors">Security</a>
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

            {/* Mobile Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0E1422] border border-white/[0.08] text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bg-[#070A12]/95 backdrop-blur-2xl border-b border-white/[0.08] px-6 py-6 space-y-4 animate-in slide-in-from-top-2 z-50">
            <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                Product Experience
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                How it works
              </a>
              <a
                href="#sovereignty"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                Biometric sovereignty
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                Pricing
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
                className="p-2 rounded-lg hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                Help Center & Support
              </Link>
            </nav>

            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-center text-xs shadow-md shadow-emerald-500/20"
              >
                Start free for your workplace
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0F1524] text-slate-300 font-semibold text-center text-xs border border-white/[0.08]"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </header>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.2 HERO SECTION (TWO-COLUMN DESKTOP 50/50 PER SECTION 5.2)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-6 max-w-[1200px] mx-auto w-full z-10">
        
        {/* Soft Emerald Glow Behind Hero Visual */}
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Copy (~50%) */}
          <div className="text-left space-y-6">
            
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>On-premise facial attendance</span>
            </div>

            {/* H1 (max 2 lines desktop, text-wrap: balance) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
              Attendance that recognizes people, <br />
              <span className="specular-text-shimmer">not badges.</span>
            </h1>

            {/* Subhead (max 2 lines, 18-20px, --text-2) */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-[540px] font-normal">
              Turn any IP camera or USB webcam into a sub-300 ms face-verification gate. Everything runs on your own hardware, behind your own firewall.
            </p>

            {/* Dual CTAs (max 2 side-by-side) */}
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

            {/* Trust Row (4 items with check icons) */}
            <div className="pt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Free forever starter tier</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Setup in about 10 minutes</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Works fully offline</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Hikvision, Dahua, Axis, Webcams</span>
            </div>
          </div>

          {/* Right Column: Animated Product Mockup in Code (~50%) */}
          <div
            className="w-full relative"
            style={{ perspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* 3D Tilt Container */}
            <div
              ref={cardRef}
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full rounded-2xl public-card p-4 sm:p-5 shadow-2xl relative overflow-hidden"
            >
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3 text-xs font-mono-tag">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-slate-400 ml-2">gate_camera_01.local</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>30 FPS &bull; Sub-300ms</span>
                </div>
              </div>

              {/* Viewport with Face Detection Bracket & Landmarker Animation */}
              <div className="relative aspect-[16/10] w-full rounded-xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
                <img
                  src="/aurapass_kiosk_preview.jpg"
                  alt="AuraPass Live Camera Verification Preview"
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

                {/* Animated Face Detection Bracket */}
                <div className="relative z-10 w-36 h-36 rounded-full border-2 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.35)] flex items-center justify-center animate-pulse">
                  <div className="absolute top-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="absolute bottom-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="absolute left-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="absolute right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>

                {/* Status Chips */}
                <div className="absolute top-3 left-3 z-10 text-[10px] font-mono-tag bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-slate-300">
                  Detection: <span className="text-emerald-400 font-bold">MediaPipe 68-pt</span>
                </div>
                <div className="absolute top-3 right-3 z-10 text-[10px] font-mono-tag bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-slate-300">
                  Liveness: <span className="text-emerald-400 font-bold">PASSED</span>
                </div>

                {/* Live Verified Row */}
                <div className="absolute bottom-3 inset-x-3 z-10 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 flex items-center justify-between text-xs backdrop-blur-md shadow-lg font-mono-tag">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-sans font-bold text-white text-[11px]">Rajesh Patel (EMP-0142)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/60 px-2 py-0.5 rounded">
                    99.4% &bull; ON TIME
                  </span>
                </div>
              </div>

              {/* Floating Small Metric Chips */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono-tag">
                <div className="p-2 rounded-lg bg-[#070A12] border border-white/[0.06]">
                  <p className="text-white font-bold">&lt; 300 ms</p>
                  <p className="text-[10px] text-slate-500">Typical latency</p>
                </div>
                <div className="p-2 rounded-lg bg-[#070A12] border border-white/[0.06]">
                  <p className="text-emerald-400 font-bold">512-d</p>
                  <p className="text-[10px] text-slate-500">Unit embeddings</p>
                </div>
                <div className="p-2 rounded-lg bg-[#070A12] border border-white/[0.06]">
                  <p className="text-white font-bold">0 Bytes</p>
                  <p className="text-[10px] text-slate-500">Sent to cloud</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility Strip Below Hero (Text-only brand names per 5.2) */}
        <div className="mt-14 pt-8 section-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-slate-400 font-medium">Works with the cameras you already own:</span>
          <div className="flex flex-wrap items-center gap-6 font-mono-tag text-slate-300 font-semibold text-xs">
            <span>Hikvision</span>
            <span>Dahua</span>
            <span>Axis</span>
            <span>Hanwha</span>
            <span>Logitech USB</span>
            <span>Any RTSP/ONVIF</span>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.3 "THE PROBLEM" STRIP
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl public-card space-y-2">
            <span className="text-xs font-mono-tag font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
              Badge Vulnerability
            </span>
            <p className="text-sm font-semibold text-white">Badges get lost, shared, and buddy-punched.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Plastic RFID keycards cost $5&ndash;$15 each to replace and cannot guarantee physical human presence.
            </p>
          </div>

          <div className="p-5 rounded-2xl public-card space-y-2">
            <span className="text-xs font-mono-tag font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
              Cloud Privacy Exposure
            </span>
            <p className="text-sm font-semibold text-white">Cloud face systems send employee biometrics off-site.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Transmitting facial imagery over public internet creates enterprise liability under GDPR Article 9 and BIPA.
            </p>
          </div>

          <div className="p-5 rounded-2xl public-card space-y-2">
            <span className="text-xs font-mono-tag font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
              Timesheet Disputes
            </span>
            <p className="text-sm font-semibold text-white">Manual timesheets cause ongoing payroll disputes.</p>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Disputed arrival times and missing signatures consume dozens of HR manager hours every pay period.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-emerald-400">
          AuraPass fixes all three, on your own hardware.
        </p>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.4 INTERACTIVE SIMULATOR ("SEE IT WORK")
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="simulator" className="py-20 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Interactive Hardware Simulator"
          badgeIcon={Sparkles}
          title="See how face attendance works in real time"
          subtitle="Test standard employee arrival, presentation attack rejection, or glasses tolerance."
        />

        {/* Scenario Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => { setSimMode('standard'); triggerSimulation('standard'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              simMode === 'standard'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standard check-in</span>
          </button>

          <button
            type="button"
            onClick={() => { setSimMode('spoofing'); triggerSimulation('spoofing'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              simMode === 'spoofing'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span>Photo & screen spoofing</span>
          </button>

          <button
            type="button"
            onClick={() => { setSimMode('glasses'); triggerSimulation('glasses'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              simMode === 'glasses'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-[#0F1524] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Glasses className="w-3.5 h-3.5 text-cyan-400" />
            <span>Glasses & mask</span>
          </button>
        </div>

        {/* Simulator Shell: Left Viewport, Right Live Timing Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-4xl mx-auto">
          
          {/* Left: Camera Viewport (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl public-card p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3 text-xs font-mono-tag">
              <span className="text-slate-400">lane_01_entrance.rtsp</span>
              <span className="text-emerald-400 font-bold">{simState.toUpperCase()}</span>
            </div>

            <div className="relative aspect-[16/10] w-full rounded-xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
              <img
                src="/aurapass_kiosk_preview.jpg"
                alt="Live Camera Feed Simulation"
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

              {/* Scanning HUD Overlay Line */}
              {simState === 'scanning' && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanline pointer-events-none z-20" />
              )}

              {/* Status Reticle */}
              <div
                className={`relative z-10 w-32 h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  simState === 'verified'
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_35px_rgba(52,211,153,0.4)]'
                    : simState === 'rejected'
                    ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_35px_rgba(244,63,94,0.4)]'
                    : simState === 'scanning'
                    ? 'border-emerald-400 animate-spin bg-emerald-500/10'
                    : 'border-emerald-500/35 bg-black/40'
                }`}
              >
                {simState === 'verified' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                ) : simState === 'rejected' ? (
                  <AlertTriangle className="w-12 h-12 text-rose-400" />
                ) : (
                  <Scan className="w-10 h-10 text-emerald-400/80" />
                )}
              </div>

              {/* HUD Chips */}
              <div className="absolute top-3 left-3 text-[10px] font-mono-tag bg-black/80 px-2 py-0.5 rounded text-slate-300 border border-white/10">
                Mode: <span className="text-white font-bold">{simMode}</span>
              </div>
              <div className="absolute top-3 right-3 text-[10px] font-mono-tag bg-black/80 px-2 py-0.5 rounded text-slate-300 border border-white/10">
                Latency: <span className="text-emerald-400 font-bold">{simTime} ms</span>
              </div>

              {/* Result Notification */}
              {simState === 'verified' && (
                <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-mono-tag flex items-center justify-between">
                  <span>Match Confirmed: Rajesh Patel</span>
                  <span className="text-emerald-400 font-bold">Turnstile Unlocked</span>
                </div>
              )}

              {simState === 'rejected' && (
                <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs font-mono-tag flex items-center justify-between">
                  <span>Rejected: presentation attack detected</span>
                  <span className="text-rose-400 font-bold">Gate Locked</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => triggerSimulation(simMode)}
                disabled={simState === 'scanning'}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{simState === 'idle' ? 'Simulate check-in' : 'Run again'}</span>
              </button>

              <span className="text-[11px] font-mono-tag text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Zero data egress</span>
              </span>
            </div>
          </div>

          {/* Right: Step-by-Step Pipeline Checklist (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl public-card p-5 flex flex-col justify-between text-xs space-y-4 font-mono-tag">
            <div>
              <p className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-white/[0.08]">
                Inference Checklist
              </p>

              <div className="mt-4 space-y-3">
                <div className={`p-2.5 rounded-lg flex items-center justify-between ${simStep >= 1 ? 'bg-[#141B2E] text-white' : 'text-slate-500'}`}>
                  <span>1. Frame Decoded (RTSP)</span>
                  <span className="text-emerald-400 font-bold">{simStep >= 1 ? '18 ms' : '—'}</span>
                </div>

                <div className={`p-2.5 rounded-lg flex items-center justify-between ${simStep >= 2 ? 'bg-[#141B2E] text-white' : 'text-slate-500'}`}>
                  <span>2. Face Detected (68-pt)</span>
                  <span className="text-emerald-400 font-bold">{simStep >= 2 ? '42 ms' : '—'}</span>
                </div>

                <div className={`p-2.5 rounded-lg flex items-center justify-between ${simStep >= 3 ? 'bg-[#141B2E] text-white' : 'text-slate-500'}`}>
                  <span>3. Liveness Verified</span>
                  <span className={simMode === 'spoofing' && simStep >= 3 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {simStep >= 3 ? (simMode === 'spoofing' ? 'FAILED' : 'PASSED') : '—'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg flex items-center justify-between ${simStep >= 4 ? 'bg-[#141B2E] text-white' : 'text-slate-500'}`}>
                  <span>4. 512-d Vectorization</span>
                  <span className="text-emerald-400 font-bold">{simStep >= 4 ? '112 ms' : '—'}</span>
                </div>

                <div className={`p-2.5 rounded-lg flex items-center justify-between ${simStep >= 5 ? 'bg-[#141B2E] text-white' : 'text-slate-500'}`}>
                  <span>5. Database Cosine Match</span>
                  <span className="text-emerald-400 font-bold">{simStep >= 5 ? '34 ms' : '—'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Verification Time:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {simStep >= 5 ? `${simTime} ms` : '—'}
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.5 HOW IT WORKS (4 STEPS PER SECTION 5.5)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="4-Step Deployment"
          badgeIcon={Layers}
          title="From camera stream to verified attendance"
          subtitle="Four straightforward stages to automate workplace physical verification."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl public-card relative">
            <span className="text-2xl font-bold font-mono-tag text-emerald-400 mb-3 block">01</span>
            <h3 className="text-base font-bold text-white mb-2">Connect</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Connect your existing IP cameras (RTSP/ONVIF) or USB webcams. Automatic stream reconnect and bandwidth tuning.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card relative">
            <span className="text-2xl font-bold font-mono-tag text-emerald-400 mb-3 block">02</span>
            <h3 className="text-base font-bold text-white mb-2">Enroll</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Enroll staff in three quick shots (0°, 15° left, 15° right). Takes under 2 minutes per employee with automatic quality gating.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card relative">
            <span className="text-2xl font-bold font-mono-tag text-emerald-400 mb-3 block">03</span>
            <h3 className="text-base font-bold text-white mb-2">Verify</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Recognize staff in under 300 ms on your own computer, complete with multi-cue passive anti-spoofing liveness scoring.
            </p>
          </div>

          <div className="p-6 rounded-2xl public-card relative">
            <span className="text-2xl font-bold font-mono-tag text-emerald-400 mb-3 block">04</span>
            <h3 className="text-base font-bold text-white mb-2">Act</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Log daily timestamps, evaluate department grace rules, trigger turnstile relay GPIO, and export spreadsheets to payroll.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.6 CAPABILITIES (ASYMMETRIC BENTO GRID PER SECTION 5.6)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Platform Capabilities"
          badgeIcon={Zap}
          title="Engineered for real-world workplace operations"
          subtitle="Essential management tools for operations directors and human resources teams."
        />

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Tile 1: Attendance Timeline & Export (Span 2) */}
          <div className="md:col-span-2 p-6 sm:p-7 rounded-2xl public-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-mono-tag text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Attendance History
                </span>
                <span className="text-xs font-mono-tag text-slate-400">CSV &bull; Excel &bull; PDF</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Attendance Timeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal mb-5 max-w-xl">
                Track workforce arrivals with live status flags (On Time, Grace Window, Late Entry). Export clean payroll-ready spreadsheets in one click.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06] font-mono-tag text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Rajesh Patel (ENG-01)</span>
                <span className="text-slate-400">09:02 AM</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">ON TIME</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Shivam Petkar (OPS-07)</span>
                <span className="text-slate-400">09:12 AM</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">15m GRACE</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Shift Policies & Grace Periods */}
          <div className="p-6 rounded-2xl public-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono-tag text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mb-3 inline-block">
                Roster Policies
              </span>
              <h3 className="text-base font-bold text-white mb-2">Department Shift Rules</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Configure distinct operating hours and grace buffers (e.g. 15 minutes) per department. Reassign staff members across teams instantly.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono-tag text-purple-300">
              6 Configured Department Shifts
            </div>
          </div>

          {/* Tile 3: 3-Shot Enrollment */}
          <div className="p-6 rounded-2xl public-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono-tag text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 mb-3 inline-block">
                Enrollment
              </span>
              <h3 className="text-base font-bold text-white mb-2">3-Shot Rapid Enrollment</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Capture 0°, 15° left, and 15° right angles in under 2 minutes. Automatic blur and illumination filtering.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono-tag text-cyan-300">
              &lt; 2 Minutes Per Employee
            </div>
          </div>

          {/* Tile 4: Camera Orchestration (Span 2) */}
          <div className="md:col-span-2 p-6 rounded-2xl public-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-mono-tag text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Universal Compatibility
                </span>
                <span className="text-xs font-mono-tag text-slate-400">RTSP &bull; ONVIF &bull; USB UVC</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Direct IP Camera Stream Orchestration</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-xl">
                Connect existing surveillance cameras across entrance lanes, turnstiles, and lobby doors. Automatic stream reconnects and mosaic views.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-2 text-xs font-mono-tag text-slate-300">
              <span className="px-2 py-0.5 rounded bg-[#070A12] border border-white/10">Hikvision</span>
              <span className="px-2 py-0.5 rounded bg-[#070A12] border border-white/10">Dahua</span>
              <span className="px-2 py-0.5 rounded bg-[#070A12] border border-white/10">Axis</span>
              <span className="px-2 py-0.5 rounded bg-[#070A12] border border-white/10">Hanwha</span>
              <span className="px-2 py-0.5 rounded bg-[#070A12] border border-white/10">USB Webcams</span>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.7 PRODUCT TOUR (REAL CONSOLE TABS PER SECTION 5.7)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Product Tour"
          badgeIcon={Laptop}
          title="Authentic views from the administrative console"
          subtitle="Explore the live interfaces used daily by operations and HR staff."
        />

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-6">
          {[
            { id: 0, label: "Live Attendance", icon: Activity },
            { id: 1, label: "Department Rostering", icon: Building },
            { id: 2, label: "Hardware Kiosk", icon: MonitorCheck },
            { id: 3, label: "Model Telemetry", icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeShowcaseTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveShowcaseTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-[#0F1524] border border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Browser Frame */}
        <div className="rounded-2xl public-card overflow-hidden shadow-2xl">
          <div className="px-5 py-3 bg-[#0B0F19] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono-tag">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-slate-400 ml-2">app.aurapass.local</span>
            </div>
            <span className="text-emerald-400 text-[11px] font-semibold">Live preview</span>
          </div>

          {activeShowcaseTab === 0 && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
                <span className="font-bold text-white">Daily Attendance Records</span>
                <span className="text-slate-400 font-mono-tag">3 Enrolled Staff Verified</span>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="text-slate-400 font-mono-tag uppercase pb-2 border-b border-white/[0.06]">
                    <tr>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Department</th>
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-300">
                    <tr>
                      <td className="py-2.5 font-bold text-white">Rajesh Patel</td>
                      <td className="py-2.5 text-slate-400">Engineering</td>
                      <td className="py-2.5 font-mono-tag">09:02 AM</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">ON TIME</span></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">Shivam Petkar</td>
                      <td className="py-2.5 text-slate-400">Operations</td>
                      <td className="py-2.5 font-mono-tag">09:12 AM</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">15m GRACE</span></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">Vatsal Vadgama</td>
                      <td className="py-2.5 text-slate-400">Quality Assurance</td>
                      <td className="py-2.5 font-mono-tag">09:32 AM</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">LATE ENTRY</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeShowcaseTab === 1 && (
            <div className="p-6 sm:p-8 space-y-4">
              <p className="font-bold text-white text-xs">Department Working Hours & Grace Buffers</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <p className="font-bold text-white">Engineering</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">09:00 AM &ndash; 06:00 PM</p>
                  <p className="text-emerald-400 font-mono-tag text-[11px] mt-2 font-bold">15 min grace</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <p className="font-bold text-white">Operations</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">08:00 AM &ndash; 05:00 PM</p>
                  <p className="text-emerald-400 font-mono-tag text-[11px] mt-2 font-bold">10 min grace</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <p className="font-bold text-white">Quality Assurance</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">09:30 AM &ndash; 06:30 PM</p>
                  <p className="text-emerald-400 font-mono-tag text-[11px] mt-2 font-bold">15 min grace</p>
                </div>
              </div>
            </div>
          )}

          {activeShowcaseTab === 2 && (
            <div className="p-8 bg-black flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 bg-emerald-500/15 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <p className="text-base font-bold text-white">Welcome, Rajesh Patel</p>
              <p className="text-xs text-slate-400">Engineering &bull; Turnstile Access Granted</p>
            </div>
          )}

          {activeShowcaseTab === 3 && (
            <div className="p-6 sm:p-8 space-y-4 text-xs font-mono-tag">
              <p className="font-bold text-white font-sans">Active Neural Backbone: FaceNet512</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <p className="text-slate-400">Embedding Dimension</p>
                  <p className="text-lg font-bold text-white mt-1">512-d Float32</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <p className="text-slate-400">Cosine Threshold</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">0.40</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#070A12] border border-white/[0.06]">
                  <p className="text-slate-400">Inference Runtime</p>
                  <p className="text-lg font-bold text-white mt-1">AVX2 CPU</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.8 BIOMETRIC SOVEREIGNTY & DATA FLOW DIAGRAM (PER SECTION 5.8)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="sovereignty" className="py-20 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Biometric Sovereignty"
          badgeIcon={ShieldCheck}
          title="Total on-premise execution. Zero cloud egress."
          subtitle="Built to support GDPR Article 9, Illinois BIPA, and California CCPA requirements."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          
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

          {/* Data Flow Diagram (SVG) */}
          <div className="p-6 rounded-2xl public-card flex flex-col items-center justify-center text-center font-mono-tag text-xs space-y-4">
            <p className="font-bold text-white uppercase text-[11px] pb-1 border-b border-white/[0.08] w-full">
              Local Data Flow Boundary
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="p-2.5 rounded-lg bg-[#070A12] border border-white/[0.06] flex items-center justify-between">
                <span>1. Camera Feed (RTSP)</span>
                <span className="text-slate-400">Local Wire</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#070A12] border border-white/[0.06] flex items-center justify-between">
                <span>2. Local Host Inference</span>
                <span className="text-emerald-400 font-bold">512-d Vector</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#070A12] border border-white/[0.06] flex items-center justify-between">
                <span>3. Local SQLite / PostgreSQL</span>
                <span className="text-emerald-400 font-bold">Encrypted DB</span>
              </div>
            </div>

            {/* Crossed-out Cloud Indicator */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 w-full justify-center">
              <WifiOff className="w-4 h-4 text-rose-400" />
              <span>No Outbound Traffic &bull; 0 Bytes Egress</span>
            </div>
          </div>
        </div>

        {/* What We Store vs What We Never Store */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto text-left text-xs">
          <div className="p-5 rounded-2xl bg-[#09121F] border border-emerald-500/20 space-y-2">
            <p className="font-bold text-emerald-400 font-mono-tag uppercase">What Stays On Your Hardware:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300 font-normal">
              <li>512-dimensional numeric unit embeddings</li>
              <li>Attendance arrival and departure timestamps</li>
              <li>Department schedule configurations</li>
              <li>Tamper-evident administrative audit logs</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-[#140D17] border border-rose-500/20 space-y-2">
            <p className="font-bold text-rose-400 font-mono-tag uppercase">What We Never Store Or Transmit:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300 font-normal">
              <li>Raw face photos after vectorization (configurable)</li>
              <li>Biometric data sent to external public clouds</li>
              <li>Third-party analytics or commercial tracking pixels</li>
              <li>Remote backdoors into your corporate network</li>
            </ul>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.10 PRICING (WORKING ANNUAL TOGGLE WITH $319 / MO PER SECTION 5.10)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 max-w-[1200px] mx-auto w-full section-hairline z-10">
        <SectionHeader
          badge="Transparent Pricing"
          badgeIcon={Zap}
          title="Start free. Upgrade as your facilities expand."
          subtitle="No per-scan fees. No cloud surcharges."
        />

        {/* Billing Switcher with 20% discount badge */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex items-center p-1 rounded-xl bg-[#0F1524] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingInterval === 'monthly'
                  ? 'bg-[#182236] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly billing
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
              <span>Annual billing</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-400 text-slate-950 font-mono-tag">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Equal-Height Cards with Aligned CTAs (mt-auto) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Starter Plan */}
          <div className="p-7 rounded-2xl public-card flex flex-col justify-between">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tag font-semibold bg-[#141B2E] text-slate-300 border border-white/[0.08]">
                Small Team / Single Gate
              </span>
              <h3 className="text-xl font-bold text-white mt-3">Starter</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">For pilot testing, small offices, and single-door check-ins.</p>

              <div className="mt-5 mb-6">
                <span className="text-4xl font-bold text-white font-mono-tag">$0</span>
                <span className="text-xs text-slate-400"> / free forever</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-2.5 border-t border-white/[0.08] pt-5 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 200 enrolled employees</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 5 camera streams</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100% on-premise SQLite database</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sub-300ms verification speed</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Daily logs and CSV export</li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3 rounded-xl bg-[#141B2E] hover:bg-[#1C263A] border border-white/[0.08] text-white font-bold text-xs text-center transition-all block cursor-pointer"
            >
              Start free
            </Link>
          </div>

          {/* Business Plan (Highlighted with $319 annual price per Section 2 & 5.10) */}
          <div className="p-7 rounded-2xl public-card border-emerald-500/40 bg-[#0C121F] flex flex-col justify-between relative shadow-xl shadow-emerald-950/30">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider font-mono-tag">
              Most Popular
            </div>

            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tag font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Workplaces & Factories
              </span>
              <h3 className="text-xl font-bold text-white mt-3">Business</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">For multi-gate factories, corporate HQs, and busy campuses.</p>

              <div className="mt-5 mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white font-mono-tag">
                  {billingInterval === 'annual' ? '$319' : '$399'}
                </span>
                {billingInterval === 'annual' && (
                  <span className="text-xs text-slate-500 line-through font-mono-tag">$399</span>
                )}
                <span className="text-xs text-slate-400"> / facility / month</span>
              </div>

              <ul className="text-xs text-slate-200 space-y-2.5 border-t border-white/[0.08] pt-5 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 5,000 employees</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited RTSP camera lanes</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> PostgreSQL + auto-backup support</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Tamper-evident audit logs</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Department grace periods and roster rules</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Priority 2-hour SLA email & phone support</li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs text-center transition-all shadow-md shadow-emerald-500/25 block cursor-pointer active:scale-98"
            >
              Get Business
            </Link>
          </div>

          {/* Custom Enterprise */}
          <div className="p-7 rounded-2xl public-card flex flex-col justify-between">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tag font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Defense & High Security
              </span>
              <h3 className="text-xl font-bold text-white mt-3">Custom Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">For multi-campus complexes and air-gapped security sites.</p>

              <div className="mt-5 mb-6">
                <span className="text-3xl font-bold text-white font-mono-tag">Custom</span>
                <span className="text-xs text-slate-400"> / dedicated appliances</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-2.5 border-t border-white/[0.08] pt-5 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> 50,000+ vector capacity</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Pre-configured 1U rackmount appliances</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Custom turnstile GPIO integration</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> 100% offline air-gapped updates</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Dedicated Solutions Architect</li>
              </ul>
            </div>

            <Link
              to="/support"
              className="mt-8 w-full py-3 rounded-xl bg-[#141B2E] hover:bg-[#1C263A] border border-white/[0.08] text-white font-bold text-xs text-center transition-all block cursor-pointer"
            >
              Talk to engineering
            </Link>
          </div>
        </div>

        {/* Collapsible Feature Comparison Table */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowPricingCompare(!showPricingCompare)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{showPricingCompare ? 'Hide full comparison' : 'Compare all features'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPricingCompare ? 'rotate-180' : ''}`} />
          </button>

          {showPricingCompare && (
            <div className="mt-6 rounded-2xl public-card overflow-x-auto text-left text-xs max-w-4xl mx-auto p-4 animate-in fade-in-50">
              <table className="w-full border-collapse">
                <thead className="border-b border-white/[0.08] text-slate-400 font-mono-tag uppercase">
                  <tr>
                    <th className="p-3">Feature</th>
                    <th className="p-3 text-white">Starter ($0)</th>
                    <th className="p-3 text-emerald-400">Business ($319)</th>
                    <th className="p-3 text-purple-400">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  <tr>
                    <td className="p-3 font-medium text-white">Max Enrolled Staff</td>
                    <td className="p-3">200 Staff</td>
                    <td className="p-3 text-emerald-400">5,000 Staff</td>
                    <td className="p-3">50,000+ Staff</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Camera Streams</td>
                    <td className="p-3">Up to 5 Streams</td>
                    <td className="p-3 text-emerald-400">Unlimited Lanes</td>
                    <td className="p-3">Unlimited Lanes</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Database Engine</td>
                    <td className="p-3">SQLite</td>
                    <td className="p-3 text-emerald-400">PostgreSQL</td>
                    <td className="p-3">PostgreSQL Dedicated</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Support SLA</td>
                    <td className="p-3">Community / Best effort</td>
                    <td className="p-3 text-emerald-400 font-bold">2-Hour Priority SLA</td>
                    <td className="p-3">Dedicated Architect</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5.11 FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 max-w-[800px] mx-auto w-full section-hairline z-10">
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
              <div key={i} className="rounded-xl public-card overflow-hidden transition-all">
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
          5.12 FINAL CTA BAND (PER SECTION 5.12)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-[1000px] mx-auto w-full z-10">
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
      <footer className="mt-auto border-t border-white/[0.08] bg-[#05070D] py-14 px-6 z-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
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
              <li><button type="button" onClick={scrollToTop} className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer pt-2">
                <span>Back to top</span>
                <ArrowUp className="w-3 h-3" />
              </button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono-tag">
          <p>&copy; {new Date().getFullYear()} AuraPass. All rights reserved.</p>
          <p>On-premise engine v2026.2</p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────────────────
          STICKY MOBILE CTA BAR (PER SECTION 5.14)
      ───────────────────────────────────────────────────────────────────────────── */}
      {showStickyMobileCta && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-3 bg-[#070A12]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
          <div className="text-left">
            <p className="text-xs font-bold text-white">AuraPass Enterprise</p>
            <p className="text-[10px] text-emerald-400 font-mono-tag">Free starter tier</p>
          </div>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
          >
            Start free &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
