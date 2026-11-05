import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Scan,
  Shield,
  Lock,
  Cpu,
  Server,
  WifiOff,
  Check,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Download,
  BookOpen,
  LifeBuoy,
  X,
  Menu,
  Terminal,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import Button from '../components/ui/marketing/Button';
import Eyebrow from '../components/ui/marketing/Eyebrow';
import Container from '../components/ui/marketing/Container';
import Section from '../components/ui/marketing/Section';
import Accordion from '../components/ui/marketing/Accordion';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Navigation scroll state
  const [scrolledNav, setScrolledNav] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStickyMobileCta, setShowStickyMobileCta] = useState(false);

  // Active Story Chapter (0 to 5 for the transit stage)
  const [activeChapter, setActiveChapter] = useState(0);

  // Stage Interactive Mode (Normal / Photo Attack / Glasses)
  const [simMode, setSimMode] = useState('normal'); // 'normal' | 'attack' | 'glasses'

  // Pricing State: Monthly vs Annual
  const [billingInterval, setBillingInterval] = useState('annual'); // 'monthly' | 'annual'

  // Scroll listener for sticky navigation and mobile CTA bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolledNav(scrollY > 24);
      setShowStickyMobileCta(scrollY > 500 && scrollY < document.body.scrollHeight - 1000);

      // Scroll spy for chapters
      const chapterElements = [
        document.getElementById('chapter-01'),
        document.getElementById('chapter-02'),
        document.getElementById('chapter-03'),
        document.getElementById('chapter-04'),
        document.getElementById('chapter-05'),
        document.getElementById('chapter-06'),
      ];

      const scrollMiddle = scrollY + window.innerHeight * 0.4;
      for (let i = chapterElements.length - 1; i >= 0; i--) {
        const el = chapterElements[i];
        if (el && el.offsetTop <= scrollMiddle) {
          setActiveChapter(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Export Sample CSV Trigger
  const handleExportSample = (format = 'CSV') => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Timestamp,Badge ID,Employee Name,Department,Arrival Time,Shift Start,Grace Buffer,Status,Latency\n"
      + "2026-11-05 08:59:42,EMP-0142,Rajesh Patel,Operations,08:59:42,09:00:00,15 min,ON TIME (EARLY),184 ms\n"
      + "2026-11-05 09:12:04,EMP-0089,Priya Sharma,Quality Assurance,09:12:04,09:00:00,15 min,ON TIME (GRACE),162 ms\n"
      + "2026-11-05 09:05:12,EMP-0105,Vatsal Vadgama,Engineering,09:05:12,09:00:00,15 min,ON TIME (GRACE),148 ms\n"
      + "2026-11-05 09:18:45,EMP-0211,Alex Rivera,Engineering,09:18:45,09:00:00,15 min,LATE (+3m),192 ms";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aurapass_verified_attendance.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chapter Navigation metadata
  const CHAPTERS = [
    { num: '01', title: 'Arrival', anchor: 'chapter-01' },
    { num: '02', title: 'The Problem', anchor: 'chapter-02' },
    { num: '03', title: 'Seen', anchor: 'chapter-03' },
    { num: '04', title: 'Understood', anchor: 'chapter-04' },
    { num: '05', title: 'Decided', anchor: 'chapter-05' },
    { num: '06', title: 'Recorded', anchor: 'chapter-06' },
  ];

  // Defensible FAQs
  const faqs = [
    {
      q: "Does any facial biometric data ever leave our local network?",
      a: "No. AuraPass executes entirely on-premise. Face detection, 68-point spatial mesh alignment, FaceNet512 vector generation, and cosine distance lookups run in host memory. Zero camera frames or vector tensors ever depart your facility intranet."
    },
    {
      q: "Which security cameras and webcams are compatible?",
      a: "AuraPass works with standard IP security cameras broadcasting H.264/H.265 video over RTSP or ONVIF (including Hikvision, Dahua, Axis, and Hanwha) as well as standard USB Video Class (UVC) webcams like Logitech C920, C922, and BRIO."
    },
    {
      q: "How does the system prevent photo and video spoofing?",
      a: "Our multi-cue presentation attack detection combines high-frequency micro-texture analysis, specular reflection gradients, and 3D contour depth estimation adhering to ISO/IEC 30107-3. 2D paper printouts and mobile phone screens fail biological thresholds and are rejected in under 120 ms."
    },
    {
      q: "Are employee photographs stored on the server?",
      a: "No. Photographs are designed as one-way numeric representations; raw images are not stored after enrollment processing. AuraPass stores only 512-dimensional numeric floating-point vectors from which original facial photographs cannot be reconstructed."
    },
    {
      q: "What is the 3-shot enrollment protocol?",
      a: "Enrollment takes under two minutes per employee. The camera captures three controlled angles: frontal (0°), left profile (15°), and right profile (15°), requiring a minimum face bounding box of 160×160 pixels to calibrate invariant vector representations."
    },
    {
      q: "How do grace periods and shift schedules work?",
      a: "Each department can configure custom shifts and grace buffers. For example, with a 09:00 shift and a 15-minute grace window, an arrival at 09:12 is deterministically classified as 'On time' with a grace buffer tag, while an arrival at 09:18 is logged as tardy."
    },
    {
      q: "How does the system connect to physical turnstiles and gates?",
      a: "AuraPass triggers an opto-isolated 24V dry-contact relay via standard GPIO interfaces (compatible with Raspberry Pi, NVIDIA Jetson, or USB relay boards). When facial verification succeeds in under 300 ms, a 450 ms momentary pulse unlatches the gate flap."
    },
    {
      q: "What server hardware is required to run AuraPass?",
      a: "For single-lane facilities with up to 500 staff, a standard quad-core Intel i5/i7 or AMD Ryzen processor with 8 GB RAM and Docker is sufficient. Multi-camera facilities with 5+ lanes benefit from an 8-core CPU or optional NVIDIA GPU."
    }
  ];

  return (
    <div className="min-h-screen bg-[#06090B] text-[#9AA7A3] font-sans relative selection:bg-[#3DDC97]/20 selection:text-[#3DDC97] overflow-x-hidden">
      
      {/* 1. TOP STICKY NAVIGATION */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolledNav
            ? 'bg-[#06090B]/90 backdrop-blur-md border-b border-white/[0.08] py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <Container className="flex items-center justify-between">
          
          {/* Logo Mark */}
          <Link to="/" className="flex items-center gap-2.5 text-[#F3F6F5] font-semibold text-base tracking-tight select-none group">
            <span className="w-7 h-7 rounded-lg bg-[#0B1013] border border-white/10 flex items-center justify-center text-[#3DDC97] group-hover:border-[#3DDC97]/40 transition-colors">
              <Scan className="w-4 h-4 stroke-[1.5]" />
            </span>
            <span className="font-semibold text-sm sm:text-base text-white">
              AuraPass<span className="text-[#3DDC97] font-mono text-xs ml-1 font-normal">ENT</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#story" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Product Story
            </a>
            <a href="#boundary" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Security Boundary
            </a>
            <a href="#pricing" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Pricing
            </a>
            <Link to="/docs" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Docs
            </Link>
            <Link to="/support" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Support
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button to="/dashboard" variant="primary" size="sm">
                Open Console
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign in
                </Button>
                <Button to="/register" variant="primary" size="sm">
                  Start free
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-white/10 text-[#9AA7A3] hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
            </button>
          </div>
        </Container>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.08] bg-[#06090B] px-4 py-4 space-y-3 text-sm">
            <a
              href="#story"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#9AA7A3] hover:text-[#F3F6F5] py-1"
            >
              Product Story
            </a>
            <a
              href="#boundary"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#9AA7A3] hover:text-[#F3F6F5] py-1"
            >
              Security Boundary
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#9AA7A3] hover:text-[#F3F6F5] py-1"
            >
              Pricing
            </a>
            <Link
              to="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#9AA7A3] hover:text-[#F3F6F5] py-1"
            >
              Documentation
            </Link>
            <Link
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#9AA7A3] hover:text-[#F3F6F5] py-1"
            >
              Support Center
            </Link>
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <Link to="/login" className="text-xs text-[#9AA7A3]">Sign in</Link>
              <Link to="/register" className="text-xs text-[#3DDC97] font-semibold">Start free →</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Sticky Mobile CTA Strip */}
      {showStickyMobileCta && (
        <div className="md:hidden fixed bottom-4 inset-x-4 z-40 p-3 rounded-2xl bg-[#0B1013]/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-between">
          <div className="text-xs">
            <p className="font-semibold text-[#F3F6F5]">AuraPass Enterprise</p>
            <p className="text-[11px] text-[#9AA7A3] font-mono">Sub-300ms on-premise verification</p>
          </div>
          <Button to="/register" variant="primary" size="sm">
            Start free
          </Button>
        </div>
      )}

      {/* 2. THE STORYBOARD SECTION: SCROLLING CHAPTERS + PERSISTENT STICKY STAGE */}
      <div id="story" className="relative pt-28 sm:pt-36">
        <Container>
          
          {/* Subtle Ambient Radial Backlight behind the hero scene */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-[#3DDC97]/[0.06] rounded-full blur-[140px] pointer-events-none" />

          {/* Grid Layout: Left Narrative Chapters vs Right Sticky Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
            
            {/* LEFT COLUMN: Narrative Chapters */}
            <div className="lg:col-span-6 space-y-28 lg:space-y-48 py-8 lg:py-16">
              
              {/* CHAPTER 01: ARRIVAL (Hero) */}
              <div id="chapter-01" className="space-y-6 pt-4">
                <Eyebrow variant="emerald">
                  01 • Proximity Arrival
                </Eyebrow>
                <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-semibold text-[#F3F6F5] tracking-tight leading-[1.05] text-balance">
                  Attendance that recognizes people, not badges.
                </h1>
                <p className="text-base sm:text-lg text-[#9AA7A3] leading-relaxed text-pretty max-w-[54ch]">
                  Turn existing RTSP security cameras and webcams into sub-300 ms facial verification gates with sovereign on-premise execution.
                </p>
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Button to="/register" variant="primary" size="lg">
                    Start free
                  </Button>
                  <Button href="#chapter-02" variant="secondary" size="lg">
                    See how it works
                  </Button>
                </div>
                <div className="pt-2 flex items-center gap-2 font-mono text-xs text-[#66726E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
                  <span>On-premise. Works offline. No cloud egress.</span>
                </div>
              </div>

              {/* CHAPTER 02: THE PROBLEM */}
              <div id="chapter-02" className="space-y-6">
                <Eyebrow variant="neutral">
                  02 • The Legacy Problem
                </Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
                  Physical credentials fail in quiet, expensive ways.
                </h2>
                <p className="text-base text-[#9AA7A3] leading-relaxed max-w-[54ch]">
                  Traditional badges, plastic RFID smart cards, and cloud-connected tablets introduce operational drag and regulatory risk:
                </p>
                <div className="space-y-4 border-l border-white/[0.08] pl-5 text-sm">
                  <div>
                    <p className="font-semibold text-[#F3F6F5]">Lost or shared badges (buddy punching)</p>
                    <p className="text-[#9AA7A3] text-xs mt-0.5">Cards are loaned, lost, or forgotten, demanding constant re-issuance expenses.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#F3F6F5]">Employee biometrics sent to third-party clouds</p>
                    <p className="text-[#9AA7A3] text-xs mt-0.5">SaaS biometric portals transmitting raw face imagery expose organizations to privacy liability.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#F3F6F5]">Manual timesheet reconciliation</p>
                    <p className="text-[#9AA7A3] text-xs mt-0.5">HR operations waste dozens of hours each payroll cycle correcting missed scans.</p>
                  </div>
                </div>
              </div>

              {/* CHAPTER 03: SEEN */}
              <div id="chapter-03" className="space-y-6">
                <Eyebrow variant="emerald">
                  03 • Seen (14 ms)
                </Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
                  Seen in milliseconds. Measured, not memorized.
                </h2>
                <p className="text-base text-[#9AA7A3] leading-relaxed max-w-[54ch]">
                  As an employee walks through the entrance lane, the local edge daemon locks onto the RTSP frame buffer. A MediaPipe single-frame detector extracts 68 spatial landmark coordinates in just 14 milliseconds.
                </p>
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B1013] font-mono text-xs space-y-1.5">
                  <div className="flex justify-between text-[#9AA7A3]">
                    <span>Detection Latency:</span>
                    <span className="text-[#3DDC97] font-semibold">14 ms</span>
                  </div>
                  <div className="flex justify-between text-[#9AA7A3]">
                    <span>Landmark Points:</span>
                    <span className="text-[#F3F6F5]">68-point spatial mesh</span>
                  </div>
                  <div className="flex justify-between text-[#9AA7A3]">
                    <span>Optical Tolerance:</span>
                    <span className="text-[#F3F6F5]">Spectacles, medical masks, low light</span>
                  </div>
                </div>
              </div>

              {/* CHAPTER 04: UNDERSTOOD */}
              <div id="chapter-04" className="space-y-6">
                <Eyebrow variant="emerald">
                  04 • Understood
                </Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
                  Understood as numbers. The photo is destroyed immediately.
                </h2>
                <p className="text-base text-[#9AA7A3] leading-relaxed max-w-[54ch]">
                  The optical frame never touches disk. The facial structure collapses into an L2-normalized 512-dimensional numeric floating-point vector. Original facial photographs cannot be mathematically reconstructed from these numbers.
                </p>
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0B1013] space-y-2">
                  <p className="text-xs font-mono text-[#3DDC97] uppercase">Memory Volatilization Guarantee</p>
                  <p className="text-xs text-[#9AA7A3] leading-relaxed">
                    Raw image bytes exist only in volatile RAM for sub-300 ms inference, then are immediately flushed. Only irreversible 512-d embeddings are retained.
                  </p>
                </div>
              </div>

              {/* CHAPTER 05: DECIDED */}
              <div id="chapter-05" className="space-y-6">
                <Eyebrow variant="emerald">
                  05 • Decided (Sub-300 ms)
                </Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
                  Verified before their hand reaches the handle.
                </h2>
                <p className="text-base text-[#9AA7A3] leading-relaxed max-w-[54ch]">
                  From camera sensor ingestion to physical gate unlock: under 300 ms total budget. Zero stopping. Zero awkward staring at a tablet screen.
                </p>
                <p className="text-xs text-[#66726E] font-mono">
                  Test scenarios below using the interactive switcher on the stage.
                </p>
              </div>

              {/* CHAPTER 06: RECORDED */}
              <div id="chapter-06" className="space-y-6 pb-8">
                <Eyebrow variant="emerald">
                  06 • Recorded
                </Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
                  Recorded to payroll without human intervention.
                </h2>
                <p className="text-base text-[#9AA7A3] leading-relaxed max-w-[54ch]">
                  The verified event writes an append-only audit entry to the local database, evaluates configured shift grace windows, and exports directly to CSV, Excel, or PDF.
                </p>
                <div className="flex items-center gap-3">
                  <Button onClick={() => handleExportSample('CSV')} variant="secondary" size="sm" icon={Download}>
                    Export Sample CSV
                  </Button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Persistent Sticky Stage (SVG Vector Visualizer) */}
            <div className="lg:col-span-6 lg:sticky lg:top-28 w-full py-4 lg:py-16">
              
              <div className="rounded-2xl border border-white/10 bg-[#0B1013] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                
                {/* Stage Header Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
                    <span className="text-[#F3F6F5] font-semibold">STAGE: {CHAPTERS[activeChapter]?.title.toUpperCase()}</span>
                  </div>
                  <span className="text-[#66726E]">0{activeChapter + 1} / 06</span>
                </div>

                {/* SVG Visual Stage Canvas */}
                <div className="relative w-full aspect-[4/3] bg-[#06090B] rounded-xl my-4 border border-white/[0.06] flex items-center justify-center overflow-hidden p-6">
                  
                  {/* SCENE 01: ARRIVAL (Silhouette approaching doorframe) */}
                  {activeChapter === 0 && (
                    <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                      {/* Doorframe */}
                      <rect x="250" y="50" width="100" height="200" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                      {/* Turnstile Lane Guide */}
                      <line x1="50" y1="250" x2="350" y2="250" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      {/* Optical Detection Cone */}
                      <path d="M 250 60 L 110 140 L 110 240 Z" fill="rgba(61,220,151,0.06)" stroke="rgba(61,220,151,0.2)" strokeWidth="1" />
                      {/* Approaching Person Silhouette */}
                      <g transform="translate(110, 100)">
                        <circle cx="20" cy="20" r="14" fill="#3DDC97" fillOpacity="0.8" />
                        <path d="M 20 40 L 20 90 M 20 55 L 0 75 M 20 55 L 40 70 M 20 90 L 5 130 M 20 90 L 35 130" stroke="#F3F6F5" strokeWidth="4" strokeLinecap="round" />
                      </g>
                      {/* Telemetry Tag */}
                      <text x="30" y="40" fill="#9AA7A3" fontFamily="monospace" fontSize="11">RTSP 1080p @ 30 FPS • HIKVISION</text>
                      <text x="30" y="60" fill="#3DDC97" fontFamily="monospace" fontSize="11">PROXIMITY: 1.8m [APPROACH]</text>
                    </svg>
                  )}

                  {/* SCENE 02: THE PROBLEM (Cracked badge) */}
                  {activeChapter === 1 && (
                    <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                      {/* Plastic Badge Outline */}
                      <rect x="130" y="60" width="140" height="180" rx="12" fill="#0B1013" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                      <circle cx="200" cy="85" r="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                      {/* Silhouette on Badge */}
                      <circle cx="200" cy="130" r="18" fill="rgba(255,255,255,0.2)" />
                      <path d="M 175 180 C 175 160 225 160 225 180" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                      {/* Fracture Crack in the Badge */}
                      <path d="M 130 110 L 190 140 L 175 170 L 270 190" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" />
                      <text x="145" y="215" fill="#FF6B6B" fontFamily="monospace" fontSize="10">RFID SIGNAL LOST</text>
                    </svg>
                  )}

                  {/* SCENE 03: SEEN (68-point landmark mesh) */}
                  {activeChapter === 2 && (
                    <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                      {/* Detection Bracket */}
                      <path d="M 120 70 L 100 70 L 100 90" stroke="#3DDC97" strokeWidth="2.5" />
                      <path d="M 280 70 L 300 70 L 300 90" stroke="#3DDC97" strokeWidth="2.5" />
                      <path d="M 100 210 L 100 230 L 120 230" stroke="#3DDC97" strokeWidth="2.5" />
                      <path d="M 300 210 L 300 230 L 280 230" stroke="#3DDC97" strokeWidth="2.5" />
                      {/* 68-Point Mesh Coordinates Simulation */}
                      <g fill="#3DDC97" stroke="rgba(61,220,151,0.3)" strokeWidth="1">
                        {/* Jawline contour */}
                        <circle cx="140" cy="120" r="2.5" />
                        <circle cx="150" cy="160" r="2.5" />
                        <circle cx="170" cy="195" r="2.5" />
                        <circle cx="200" cy="210" r="2.5" />
                        <circle cx="230" cy="195" r="2.5" />
                        <circle cx="250" cy="160" r="2.5" />
                        <circle cx="260" cy="120" r="2.5" />
                        {/* Eyes & Eyebrows */}
                        <circle cx="170" cy="125" r="2.5" /><circle cx="185" cy="125" r="2.5" />
                        <circle cx="215" cy="125" r="2.5" /><circle cx="230" cy="125" r="2.5" />
                        {/* Nose */}
                        <circle cx="200" cy="140" r="2.5" /><circle cx="195" cy="160" r="2.5" /><circle cx="205" cy="160" r="2.5" />
                        {/* Mouth */}
                        <circle cx="180" cy="180" r="2.5" /><circle cx="200" cy="178" r="2.5" /><circle cx="220" cy="180" r="2.5" />
                        <circle cx="200" cy="185" r="2.5" />
                        {/* Connecting Mesh lines */}
                        <line x1="170" y1="125" x2="200" y2="140" />
                        <line x1="230" y1="125" x2="200" y2="140" />
                        <line x1="200" y1="140" x2="200" y2="178" />
                        <line x1="180" y1="180" x2="200" y2="185" />
                        <line x1="220" y1="180" x2="200" y2="185" />
                      </g>
                      <text x="135" y="50" fill="#3DDC97" fontFamily="monospace" fontSize="11" fontWeight="bold">FACE DETECTED: 14 ms</text>
                    </svg>
                  )}

                  {/* SCENE 04: UNDERSTOOD (512 numeric vector bars) */}
                  {activeChapter === 3 && (
                    <div className="w-full h-full flex flex-col justify-between p-4">
                      <div className="flex justify-between items-center text-xs font-mono text-[#9AA7A3]">
                        <span>GhostFaceNet 512-D</span>
                        <span className="text-[#3DDC97]">L2_NORM = 1.0000</span>
                      </div>
                      {/* Vertical bars representing tensor values */}
                      <div className="flex items-end justify-between h-28 gap-1 px-2 border-b border-white/10">
                        {[45, 80, 20, 95, 60, 30, 85, 40, 70, 90, 15, 65, 80, 35, 92, 50, 75, 25, 88, 60, 42, 78, 90, 30].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-[#3DDC97] rounded-t-sm transition-all duration-300"
                            style={{ height: `${h}%`, opacity: 0.3 + (h / 100) * 0.7 }}
                          />
                        ))}
                      </div>
                      <div className="font-mono text-[11px] text-[#66726E] text-center pt-2">
                        Only numbers kept. Raw facial pixels deleted from volatile RAM.
                      </div>
                    </div>
                  )}

                  {/* SCENE 05: DECIDED (Pipeline line & gate relay) */}
                  {activeChapter === 4 && (
                    <div className="w-full h-full flex flex-col justify-between p-4">
                      {simMode === 'attack' ? (
                        <div className="text-center py-6 space-y-3">
                          <div className="inline-flex p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B]">
                            <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
                          </div>
                          <p className="font-mono text-sm font-semibold text-[#FF6B6B]">
                            SPOOF REJECTED (98.7% PLANAR REFLECTION)
                          </p>
                          <p className="text-xs text-[#9AA7A3] max-w-xs mx-auto">
                            Screen glare and 2D moire distortion detected. Physical relay remains locked.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-[#3DDC97] font-semibold">VERIFIED: 184 ms</span>
                            <span className="text-[#F3F6F5]">RELAY 01: UNLATCHED</span>
                          </div>
                          {/* Pipeline bar */}
                          <div className="space-y-1.5 font-mono text-[10px]">
                            <div className="flex justify-between text-[#9AA7A3]">
                              <span>Capture & Mesh</span>
                              <span>42 ms</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="w-full h-full bg-[#3DDC97]" />
                            </div>
                            <div className="flex justify-between text-[#9AA7A3] pt-1">
                              <span>Embedding & Liveness</span>
                              <span>136 ms</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="w-full h-full bg-[#3DDC97]" />
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#3DDC97]/10 border border-[#3DDC97]/20 flex items-center justify-between text-xs font-mono text-[#3DDC97]">
                            <span>GPIO_PIN_18 (24V DRY CONTACT)</span>
                            <span className="font-semibold">RELEASE PULSE 450ms</span>
                          </div>
                        </div>
                      )}

                      {/* Interactive Switcher */}
                      <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[#9AA7A3]">Scenario:</span>
                        <div className="inline-flex gap-1 bg-[#06090B] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => setSimMode('normal')}
                            className={`px-2 py-1 rounded transition-colors ${simMode === 'normal' ? 'bg-[#3DDC97] text-[#06090B] font-semibold' : 'text-[#9AA7A3]'}`}
                          >
                            Normal
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimMode('attack')}
                            className={`px-2 py-1 rounded transition-colors ${simMode === 'attack' ? 'bg-[#FF6B6B] text-[#06090B] font-semibold' : 'text-[#9AA7A3]'}`}
                          >
                            Photo attack
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimMode('glasses')}
                            className={`px-2 py-1 rounded transition-colors ${simMode === 'glasses' ? 'bg-[#3DDC97] text-[#06090B] font-semibold' : 'text-[#9AA7A3]'}`}
                          >
                            Glasses
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCENE 06: RECORDED (Attendance table row) */}
                  {activeChapter === 5 && (
                    <div className="w-full h-full flex flex-col justify-between p-4 font-mono text-xs">
                      <div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/[0.08] text-[11px] text-[#66726E]">
                          <span>LOCAL AUDIT DISPATCH</span>
                          <span>SQLITE WAL</span>
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-[#0B1013] border border-white/[0.08] space-y-1">
                          <div className="flex justify-between text-[#F3F6F5] font-semibold">
                            <span>Rajesh Patel</span>
                            <span className="text-[#3DDC97]">ON TIME</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-[#9AA7A3]">
                            <span>EMP-0142 • Operations</span>
                            <span>08:59:42 IST</span>
                          </div>
                          <div className="text-[10px] text-[#66726E] pt-1 border-t border-white/[0.04]">
                            Grace: 15m window • Match Latency: 184ms
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => handleExportSample('CSV')}
                          className="flex-1 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F6F5] text-[11px] border border-white/10"
                        >
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportSample('XLSX')}
                          className="flex-1 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F6F5] text-[11px] border border-white/10"
                        >
                          Excel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportSample('PDF')}
                          className="flex-1 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F6F5] text-[11px] border border-white/10"
                        >
                          Audit PDF
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Stage Chapter Scrubber Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs font-mono">
                  <span className="text-[#66726E]">Transit Timeline</span>
                  <div className="flex items-center gap-1.5">
                    {CHAPTERS.map((ch, idx) => (
                      <button
                        key={ch.num}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(ch.anchor);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors ${
                          activeChapter === idx
                            ? 'bg-[#3DDC97] text-[#06090B] font-bold'
                            : 'bg-white/[0.04] text-[#9AA7A3] hover:text-white'
                        }`}
                      >
                        {ch.num}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </Container>
      </div>

      {/* 3. CHAPTER 07: THE SOVEREIGNTY BOUNDARY (Full Width) */}
      <Section id="boundary" className="border-t border-white/[0.08]">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Eyebrow variant="emerald">
              07 • The Sovereignty Boundary
            </Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
              Your camera streams never cross your perimeter.
            </h2>
            <p className="text-base text-[#9AA7A3] leading-relaxed">
              AuraPass deploys as a self-contained container inside your local subnet. The public internet is physically excluded from the inference loop.
            </p>
          </div>

          {/* Architecture Diagram: Firewall Box vs Outside Cloud */}
          <div className="p-6 sm:p-10 rounded-2xl border border-white/10 bg-[#0B1013] mb-12 relative overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Inside Local Firewall */}
              <div className="lg:col-span-8 p-6 rounded-xl border border-dashed border-[#3DDC97]/40 bg-[#06090B]/60 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#3DDC97] font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 stroke-[1.5]" />
                    INSIDE YOUR FACILITY FIREWALL (ON-PREM LAN)
                  </span>
                  <span className="text-[#66726E]">0.00 Bytes Egress</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-lg border border-white/10 bg-[#0B1013] space-y-1">
                    <p className="text-[#F3F6F5] font-semibold">RTSP CCTV</p>
                    <p className="text-[11px] text-[#9AA7A3]">1080p H.264 stream via local PoE switch</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#3DDC97]/30 bg-[#3DDC97]/[0.06] space-y-1">
                    <p className="text-[#3DDC97] font-semibold">AuraPass Node</p>
                    <p className="text-[11px] text-[#9AA7A3]">MediaPipe + FaceNet512 local tensor math</p>
                  </div>
                  <div className="p-3 rounded-lg border border-white/10 bg-[#0B1013] space-y-1">
                    <p className="text-[#F3F6F5] font-semibold">Local Database</p>
                    <p className="text-[11px] text-[#9AA7A3]">SQLite / Postgres ledger inside your host</p>
                  </div>
                </div>
              </div>

              {/* Outside Cloud (Crossed Out) */}
              <div className="lg:col-span-4 p-6 rounded-xl border border-dashed border-white/10 bg-[#06090B]/30 text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-white/[0.04] text-[#66726E]">
                  <WifiOff className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="font-mono text-xs font-semibold text-[#9AA7A3]">PUBLIC CLOUD APIS</p>
                <p className="text-xs text-[#66726E] leading-relaxed">
                  Firewall drops all outbound traffic. No external network socket is ever opened.
                </p>
              </div>

            </div>

          </div>

          {/* Two-Column Comparison: What we store vs What we never store */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0B1013] space-y-4">
              <p className="font-mono text-xs font-semibold text-[#3DDC97] uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[2]" />
                What We Store On-Premise
              </p>
              <ul className="space-y-2.5 text-sm text-[#9AA7A3]">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] mt-2 shrink-0" />
                  <span>512-dimensional numeric floating-point vectors (irreversible arrays).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] mt-2 shrink-0" />
                  <span>Cryptographically signed timestamped punch events (Badge ID, Shift, Time).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] mt-2 shrink-0" />
                  <span>Organization department schedules and grace period rules.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-[#0B1013] space-y-4">
              <p className="font-mono text-xs font-semibold text-[#FF6B6B] uppercase tracking-wider flex items-center gap-2">
                <X className="w-4 h-4 stroke-[2]" />
                What We Never Store Or Transmit
              </p>
              <ul className="space-y-2.5 text-sm text-[#9AA7A3]">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] mt-2 shrink-0" />
                  <span>Raw optical face photos or video footage post-enrollment.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] mt-2 shrink-0" />
                  <span>Outbound telemetry, product analytics, or tracking pixels.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] mt-2 shrink-0" />
                  <span>Third-party cloud synchronization or remote server access.</span>
                </li>
              </ul>
            </div>

          </div>

        </Container>
      </Section>

      {/* 4. CHAPTER 08: SCALE, PRICING, FAQ & FINAL CALL TO ACTION */}
      <Section id="pricing" className="border-t border-white/[0.08]">
        <Container>
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Eyebrow variant="emerald">
              08 • Scale & Start
            </Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
              Predictable on-premise infrastructure.
            </h2>
            <p className="text-base text-[#9AA7A3] leading-relaxed">
              Deploy on standard commodity Linux hardware or certified industrial edge appliances. No hidden per-scan taxes.
            </p>

            {/* Monthly vs Annual Toggle */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0B1013] border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${billingInterval === 'monthly' ? 'bg-white/10 text-[#F3F6F5] font-semibold' : 'text-[#9AA7A3]'}`}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('annual')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${billingInterval === 'annual' ? 'bg-[#3DDC97] text-[#06090B] font-semibold' : 'text-[#9AA7A3]'}`}
                >
                  <span>Annual billing</span>
                  <span className="text-[10px] px-1 py-0.2 bg-[#06090B] text-[#3DDC97] rounded">Save 20%</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Column Minimal Pricing Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
            
            {/* Tier 1: Starter */}
            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0B1013] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="font-mono text-xs text-[#9AA7A3] uppercase tracking-wider">Starter</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-[#F3F6F5] font-mono">$0</span>
                  <span className="text-xs text-[#66726E]">/ facility / forever</span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  For single-site offices and small facilities validating on-premise facial verification.
                </p>
                <ul className="space-y-2 text-xs text-[#9AA7A3] pt-4 border-t border-white/[0.08]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Up to 200 enrolled employees
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> 5 concurrent RTSP camera feeds
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Local SQLite WAL engine
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> CSV & PDF export
                  </li>
                </ul>
              </div>
              <Button to="/register" variant="secondary" size="md" className="w-full">
                Download Docker image
              </Button>
            </div>

            {/* Tier 2: Business (Featured) */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[#3DDC97]/40 bg-[#10171B] flex flex-col justify-between space-y-6 relative shadow-2xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-mono text-xs text-[#3DDC97] uppercase tracking-wider font-semibold">Business</p>
                  <span className="font-mono text-[10px] text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                    PRODUCTION
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-[#F3F6F5] font-mono">
                    ${billingInterval === 'annual' ? '319' : '399'}
                  </span>
                  <span className="text-xs text-[#66726E]">/ facility / month</span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  For industrial plants, factories, and corporate headquarters with multi-lane turnstiles.
                </p>
                <ul className="space-y-2 text-xs text-[#F3F6F5] pt-4 border-t border-white/[0.08]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Up to 5,000 enrolled employees
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Unlimited RTSP camera feeds
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> High-throughput PostgreSQL engine
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Hardware relay GPIO turnstile driver
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> 2-hour SLA priority support
                  </li>
                </ul>
              </div>
              <Button to="/register" variant="primary" size="md" className="w-full">
                Deploy free 30-day trial
              </Button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0B1013] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="font-mono text-xs text-[#9AA7A3] uppercase tracking-wider">Custom Enterprise</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-[#F3F6F5] font-mono">Custom</span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  For multi-campus enterprises, air-gapped defense, and high-concurrency environments.
                </p>
                <ul className="space-y-2 text-xs text-[#9AA7A3] pt-4 border-t border-white/[0.08]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> 50,000+ enrolled personnel
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Turnkey rackmount appliances
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Air-gapped cryptographic updates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3DDC97]" /> Dedicated solutions architect
                  </li>
                </ul>
              </div>
              <Button to="/support" variant="secondary" size="md" className="w-full">
                Contact systems architect
              </Button>
            </div>

          </div>

          {/* Frequently Asked Questions Accordion */}
          <div className="max-w-3xl mx-auto mb-24">
            <div className="text-center mb-10 space-y-2">
              <Eyebrow variant="neutral">FAQ</Eyebrow>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#F3F6F5] tracking-tight">
                Frequently Asked Questions
              </h3>
            </div>
            <Accordion items={faqs} />
          </div>

          {/* Final Call to Action */}
          <div className="p-8 sm:p-14 rounded-2xl border border-white/10 bg-[#0B1013] text-center max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[180px] bg-[#3DDC97]/[0.08] rounded-full blur-[90px] pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <Eyebrow variant="emerald">DEPLOYMENT TIME: ~10 MINUTES</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight text-balance">
                Start verifying faces in about 10 minutes.
              </h2>
              <p className="text-sm text-[#9AA7A3] max-w-lg mx-auto leading-relaxed">
                Run the local Docker container on your network, connect any RTSP camera URL, and register your first 3-shot employee profile.
              </p>
              <div className="pt-2 flex justify-center">
                <Button to="/register" variant="primary" size="lg">
                  Create free account
                </Button>
              </div>
            </div>
          </div>

        </Container>
      </Section>

      {/* 5. MINIMAL SOVEREIGN FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#06090B] py-14 text-xs font-normal">
        <Container className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <Scan className="w-4 h-4 text-[#3DDC97] stroke-[1.5]" />
                <span>AuraPass Enterprise</span>
              </div>
              <p className="text-[#66726E] text-xs mt-1">
                Sovereign on-premise facial verification and attendance infrastructure.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#66726E] bg-[#0B1013] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
              <span>On-premise engine v2026.2</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="space-y-2.5">
              <p className="font-mono text-[11px] font-semibold text-[#F3F6F5] uppercase">Product</p>
              <ul className="space-y-2 text-[#9AA7A3]">
                <li><a href="#story" className="hover:text-white transition-colors">Transit Story</a></li>
                <li><a href="#boundary" className="hover:text-white transition-colors">Security Boundary</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
                <li><Link to="/kiosk" className="hover:text-white transition-colors">Kiosk Mode</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-mono text-[11px] font-semibold text-[#F3F6F5] uppercase">Documentation</p>
              <ul className="space-y-2 text-[#9AA7A3]">
                <li><Link to="/docs" className="hover:text-white transition-colors">Quickstart Guide</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">RTSP Camera Setup</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Turnstile Relay Wiring</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Grace Period Rules</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-mono text-[11px] font-semibold text-[#F3F6F5] uppercase">Support & Health</p>
              <ul className="space-y-2 text-[#9AA7A3]">
                <li><Link to="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">File Engineering Ticket</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">SLA Tiers</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-mono text-[11px] font-semibold text-[#F3F6F5] uppercase">Legal & Sovereignty</p>
              <ul className="space-y-2 text-[#9AA7A3]">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy-policy#biometric-data" className="hover:text-white transition-colors">Biometric Data Policy</Link></li>
                <li><Link to="/privacy-policy#compliance" className="hover:text-white transition-colors">GDPR & BIPA Notice</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-4 text-[#66726E] text-[11px]">
            <p>© 2026 AuraPass Cryptographic Systems. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Zero cloud egress guarantee</span>
              <span>•</span>
              <span>Local edge encryption</span>
            </div>
          </div>
        </Container>
      </footer>

    </div>
  );
}
