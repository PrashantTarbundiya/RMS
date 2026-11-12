import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import Button from '../components/ui/marketing/Button';
import GlassCard from '../components/ui/marketing/GlassCard';
import Badge from '../components/ui/marketing/Badge';
import Accordion from '../components/ui/marketing/Accordion';
import InteractiveDotGrid from '../components/landing/InteractiveDotGrid';
import ModelRoutingArchitecture from '../components/landing/ModelRoutingArchitecture';
import RoiCalculator from '../components/landing/RoiCalculator';
import CustomerReviews from '../components/landing/CustomerReviews';
import CompetitorComparison from '../components/landing/CompetitorComparison';
import CaseStudiesSection from '../components/landing/CaseStudiesSection';
import ResearchSection from '../components/landing/ResearchSection';
import {
  Shield,
  CheckCircle,
  Clock,
  ArrowRight,
  Camera,
  Play,
  FileSpreadsheet,
  Lock,
  Sparkles,
  Zap,
  Building2,
  Users,
  Eye,
  Activity,
  Cpu,
  Monitor,
  Sliders,
  RefreshCw,
  Layers,
  Check,
  X,
  AlertTriangle,
  Download,
  Server,
  WifiOff,
  FileCheck,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Radio,
  HelpCircle,
  HardDrive,
  Smartphone,
  Video,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SCENARIO DATA FOR TELEMETRY INSPECTOR
 */
const TELEMETRY_SCENARIOS = [
  {
    id: 'auth_pass',
    title: 'Staff Morning Check-In',
    badge: 'VERIFIED',
    badgeVariant: 'emerald',
    outcome: 'ATTENDANCE MARKED',
    totalTime: '84 ms',
    subject: 'Alice Smith (EMP-4092)',
    department: 'Engineering & DevOps',
    confidence: '95%',
    livenessScore: 'Real Person Confirmed',
    stages: [
      { name: '1. Camera Ingest', detail: 'Video frame received from Entrance Camera 01', latency: '12 ms', status: 'PASS' },
      { name: '2. Face Detection', detail: '3D face found and aligned, even with head turned', latency: '24 ms', status: 'PASS' },
      { name: '3. Real Human Check', detail: 'Real person confirmed (blocks screen and photo fakes)', latency: '18 ms', status: 'PASS' },
      { name: '4. Employee Match', detail: 'Face matched against registered employee directory', latency: '27 ms', status: 'PASS' },
      { name: '5. Attendance Saved', detail: 'Entry logged to database & turnstile door unlocked', latency: '3 ms', status: 'DISPATCHED' },
    ]
  },
  {
    id: 'spoof_reject',
    title: 'Phone Screen / Photo Cheat Attempt',
    badge: 'CHEAT BLOCKED',
    badgeVariant: 'red',
    outcome: 'ACCESS REJECTED',
    totalTime: '35 ms (Instant Stop)',
    subject: 'Unregistered Person',
    department: 'Gate Security Alert',
    confidence: '0% (Blocked at Liveness)',
    livenessScore: 'Digital Screen Detected',
    stages: [
      { name: '1. Camera Ingest', detail: 'Video frame received from Camera 02', latency: '12 ms', status: 'PASS' },
      { name: '2. Face Detection', detail: 'Flat image detected (no 3D face depth)', latency: '19 ms', status: 'PASS' },
      { name: '3. Real Human Check', detail: 'REJECTED: Mobile screen glare & paper texture detected', latency: '4 ms', status: 'BLOCKED' },
      { name: '4. Employee Match', detail: 'Skipped: Stopped immediately to protect security', latency: '0 ms', status: 'SKIPPED' },
      { name: '5. Security Alert', detail: 'Alert photo saved in security audit log with exact time', latency: '2 ms', status: 'FLAGGED' },
    ]
  },
  {
    id: 'profile_pose',
    title: 'Side-Walking Check-In (Walking Past)',
    badge: 'SIDE-ANGLE OK',
    badgeVariant: 'blue',
    outcome: 'ATTENDANCE MARKED',
    totalTime: '92 ms',
    subject: 'Marcus Vance (EMP-1883)',
    department: 'Logistics Operations',
    confidence: '91%',
    livenessScore: 'Real Person Confirmed',
    stages: [
      { name: '1. Camera Ingest', detail: 'Video frame received from Gate B', latency: '13 ms', status: 'PASS' },
      { name: '2. Face Detection', detail: 'Side-view face detected at 45° angle', latency: '28 ms', status: 'PASS' },
      { name: '3. Real Human Check', detail: 'Natural facial movement confirmed', latency: '21 ms', status: 'PASS' },
      { name: '4. Employee Match', detail: 'Side profile matched to employee record', latency: '27 ms', status: 'PASS' },
      { name: '5. Attendance Saved', detail: 'Check-in recorded on time under morning grace period', latency: '3 ms', status: 'DISPATCHED' },
    ]
  }
];

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ─── Hero Punch Simulator State ───
  const [testName, setTestName] = useState('Rajesh Patel');
  const [testDept, setTestDept] = useState('Quality Assurance');
  const [isSimulating, setIsSimulating] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState(null);
  const [simulatedPunches, setSimulatedPunches] = useState([
    { name: 'Rajesh Patel', dept: 'Quality Assurance', time: '09:12 AM', status: 'On Time (Grace)', conf: '99.4%', latency: '184ms' },
    { name: 'Priya Sharma', dept: 'Operations', time: '09:08 AM', status: 'On Time', conf: '98.9%', latency: '172ms' },
    { name: 'Vatsal Vadgama', dept: 'Engineering', time: '09:05 AM', status: 'On Time', conf: '99.1%', latency: '190ms' },
    { name: 'Marcus Vance', dept: 'Logistics', time: '08:58 AM', status: 'Early Check-In', conf: '99.6%', latency: '168ms' },
  ]);

  // ─── Telemetry Scenario State ───
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);

  // ─── Product Console Tab Tour State ───
  const [activeConsoleTab, setActiveConsoleTab] = useState('kiosk');

  // ─── ROI Calculator State ───
  const [employeeCount, setEmployeeCount] = useState(120);

  // Smooth scroll helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle punch simulator submission
  const handleSimulatePunch = (e) => {
    e?.preventDefault();
    const name = testName.trim() || 'Rajesh Patel';
    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);
      const newPunch = {
        name,
        dept: testDept,
        time: '09:14 AM',
        status: 'On Time (Grace)',
        conf: '99.2%',
        latency: '184ms',
      };
      setPunchFeedback(newPunch);
      setSimulatedPunches((prev) => [newPunch, ...prev.slice(0, 4)]);
    }, 450);
  };

  const calculateHoursSaved = (count) => Math.round((count * 1.5 * 22) / 60);
  const calculateHardwareSaved = (count) => (count > 100 ? '₹85,000+' : '₹45,000+');

  const faqs = [
    {
      q: 'Does AuraPass work with our existing CCTV and security cameras?',
      a: 'Yes. Any standard IP camera with RTSP or ONVIF Profile S/T support (such as Hikvision, Dahua, CP Plus, Axis Communications, or Hanwha) connects directly over your local office LAN. You can also connect regular USB webcams or mount an iPad or Android tablet at your entrance as a dedicated kiosk without buying expensive biometric clock-in hardware.'
    },
    {
      q: 'Does AuraPass require an active internet connection to work?',
      a: 'No. AuraPass is engineered for 100% on-premise execution. All facial detection, embedding extraction, and attendance logging run entirely on your local office network or edge server with zero cloud data egress. If your external internet connection drops, the gates, cameras, and attendance logging continue operating without interruption.'
    },
    {
      q: 'How does the system prevent buddy punching and phone photo spoofing?',
      a: 'Our deep learning liveness engine evaluates multi-spectral texture, screen bezel reflectance, high-frequency pixel grids, and micro-movement in real time. Presenting a printed photograph or smartphone screen is flagged and rejected in under 35 milliseconds as a presentation attack, with evidence logged to the security audit trail.'
    },
    {
      q: 'How do shift schedules and late arrival grace periods work?',
      a: 'You can configure custom shift windows and grace periods per department (e.g., 09:00 shift with 15-minute grace). An employee punching at 09:12 is automatically categorized as On Time without deduction, while punches after 09:15 are flagged as Late with exact minute offsets for payroll calculations.'
    },
    {
      q: 'Can we export reports to Excel, CSV, or payroll software?',
      a: 'Yes. Attendance records, audit logs, and shift summaries export with one click to clean Excel (.xlsx), CSV, and formatted executive PDF reports ready for HR payroll processing.'
    },
    {
      q: 'Is there a free trial to test with our team?',
      a: 'Yes. The Starter tier is completely free for up to 25 employees with no credit card required. You can test live verification right on your laptop webcam in under 5 minutes.'
    }
  ];

  return (
    <div className="min-h-screen public-surface flex flex-col font-sans transition-colors duration-200">
      {/* ─── Unified Header (Phase 1 Foundation) ─── */}
      <PublicHeader />

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 1: HERO SECTION & INTERACTIVE HUD
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
          {/* Ambient Lighting & Interactive Cursor Illumination Grid */}
          <InteractiveDotGrid dotSpacing={32} glowRadius={190} />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2 mb-6">
              <Badge variant="emerald" dot>
                Fast Face AI • 100% Private (No Cloud Needed)
              </Badge>
            </div>

            {/* Monumental Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6 max-w-4xl mx-auto text-balance">
              Attendance that recognizes{' '}
              <span className="text-emerald-600 dark:text-emerald-400">people</span>, not plastic badges.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
              Use your existing office CCTV cameras, laptops, or tablets. Employees mark attendance in under 1 second by simply looking at the camera. No cards to carry, no fake punches, no morning lines.
            </p>

            {/* Primary Action Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-10">
              <Button
                variant="primary"
                size="lg"
                to={isAuthenticated ? '/dashboard' : '/register'}
                iconRight={ArrowRight}
                className="w-full sm:w-auto shadow-md"
              >
                {isAuthenticated ? 'Open Console' : 'Get Started Free'}
              </Button>

              <Button
                variant="glass"
                size="lg"
                onClick={() => scrollToSection('interactive-demo')}
                icon={Play}
                className="w-full sm:w-auto"
              >
                Live Demo
              </Button>
            </div>

            {/* Trust Assurances */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium mb-14">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                100% Private — Runs Inside Your Office
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                Works With Your Existing CCTV Cameras & Webcams
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                Free for Up to 25 Staff
              </span>
            </div>

            {/* ─── Hero Interactive Product Preview (Hero Camera & Attendance HUD) ─── */}
            <GlassCard variant="elevated" className="max-w-5xl mx-auto text-left overflow-hidden border-border/80">
              {/* Window Chrome Header */}
              <div className="p-3.5 sm:p-4 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-foreground font-medium text-xs ml-1 truncate max-w-[200px] sm:max-w-none">
                    Lane 01 • Main Entrance Gate • RTSP 1080p
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    30 FPS Active
                  </span>
                  <span className="hidden sm:inline text-muted-foreground">• Engine: GhostFaceNet512</span>
                  <span className="px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                    Latency: 184ms
                  </span>
                </div>
              </div>

              {/* Two-Column Interactive Viewport */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Simulated Camera Viewport & Live Input */}
                <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-secondary/50 p-4 sm:p-5 border border-border relative overflow-hidden min-h-[340px]">
                  {/* Camera Reticle Header */}
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-4">
                    <span>IP_CAM_192.168.1.50</span>
                    <span className="px-2 py-0.5 rounded bg-background border border-border text-[10px] font-semibold text-foreground">
                      HIKVISION DS-2CD
                    </span>
                  </div>

                  {/* Face Box Simulation */}
                  <div className="my-auto mx-auto w-48 h-56 border-2 border-dashed border-emerald-500/60 rounded-2xl flex flex-col items-center justify-center p-3 text-center bg-emerald-500/5 relative">
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500" />

                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                      {isSimulating ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      ) : (
                        <CheckCircle className="w-7 h-7" />
                      )}
                    </div>
                    <span className="font-bold text-sm text-foreground">{testName}</span>
                    <span className="text-xs text-muted-foreground">{testDept}</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-semibold">
                      {isSimulating ? 'Analyzing landmark mesh...' : '99.2% Verified • Liveness OK'}
                    </span>
                  </div>

                  {/* Bottom Interactive Punch Input */}
                  <form onSubmit={handleSimulatePunch} className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Enter employee name..."
                      className="flex-1 px-3.5 py-2.5 sm:py-2 rounded-xl bg-card border border-border text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px] sm:min-h-0"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSimulating}
                      icon={isSimulating ? RefreshCw : ArrowRight}
                      className="shrink-0 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                    >
                      {isSimulating ? 'Verifying...' : 'Simulate Punch'}
                    </Button>
                  </form>
                </div>

                {/* Right: Live Event Stream & Shift Rules */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      <span>Live Entrance Feed</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Real-Time
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {simulatedPunches.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-card border border-border flex items-center justify-between text-xs transition-colors hover:border-border/80"
                        >
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span className="text-[10px] font-mono text-muted-foreground font-normal">
                                ({item.latency})
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.dept} • {item.time}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[10px] border border-emerald-500/20">
                              {item.status}
                            </span>
                            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                              {item.conf}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
                      15m grace window active
                    </span>
                    <Link
                      to={isAuthenticated ? '/attendance' : '/register'}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      View Full Roster <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            PROTOCOL & HARDWARE COMPATIBILITY RIBBON
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-8 border-y border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Open Architecture • Compatible With Existing Physical Infrastructure
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-2">
                <Camera size={15} className="text-emerald-600 dark:text-emerald-400" />
                Hikvision RTSP
              </span>
              <span className="flex items-center gap-2">
                <Video size={15} className="text-emerald-600 dark:text-emerald-400" />
                Dahua ONVIF
              </span>
              <span className="flex items-center gap-2">
                <Shield size={15} className="text-emerald-600 dark:text-emerald-400" />
                Axis Communications
              </span>
              <span className="flex items-center gap-2">
                <Monitor size={15} className="text-emerald-600 dark:text-emerald-400" />
                CP Plus Streams
              </span>
              <span className="flex items-center gap-2">
                <Smartphone size={15} className="text-emerald-600 dark:text-emerald-400" />
                iPad / Tablet Kiosks
              </span>
              <span className="flex items-center gap-2">
                <Cpu size={15} className="text-emerald-600 dark:text-emerald-400" />
                Dry-Contact Door Relays
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 2: THE PROBLEM (WHY TOKEN CREDENTIALS FAIL)
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="problem" className="py-20 md:py-28 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Perimeter Security Breakdown
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-4">
                Traditional attendance authenticates plastic tokens, not human identity.
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Keycards, PIN codes, and dirty fingerprint scanners cause morning bottlenecks, enable proxy check-ins, and cost companies thousands in unnecessary hardware replacements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Problem 1 */}
              <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center mb-5">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Buddy Punching & Proxy Check-Ins</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    RFID badges and keypads are routinely shared among coworkers. According to the American Payroll Association, unverified clock-ins inflate payroll expenditures by 2.2% to 5.4% annually across multi-shift facilities.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Exposure: High</span>
                  <span className="text-red-500 font-semibold">Unverified Identity</span>
                </div>
              </div>

              {/* Problem 2 */}
              <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5">
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Proprietary Hardware Lock-In</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Dedicated wall-mounted biometric fingerprint machines cost ₹45,000 to ₹85,000 per entrance gate. They fail with wet or dusty fingers, suffer sensor degradation, and lock companies into expensive proprietary maintenance contracts.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>CapEx Trap</span>
                  <span className="text-amber-500 font-semibold">Expensive Hardware</span>
                </div>
              </div>

              {/* Problem 3 */}
              <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mb-5">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Cloud Biometric Data Leakage</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Modern consumer cloud biometric apps transmit employees' raw facial photos to overseas third-party servers. This violates GDPR, CCPA, and India's DPDP Act, exposing organizations to major regulatory liabilities.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Compliance Risk</span>
                  <span className="text-blue-500 font-semibold">Cloud Biometric Egress</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 3: HOW IT WORKS (SCRAPEOPS-STYLE BIOMETRIC ROUTING LAYER)
            ═══════════════════════════════════════════════════════════════════ */}
        <div id="how-it-works">
          <ModelRoutingArchitecture />
        </div>

        {/* ─── The 5-Stage Deterministic Edge Pipeline ─── */}
        <section className="py-20 md:py-28 bg-secondary/30 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                How It Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-4">
                How AuraPass Verifies Faces in Less Than 0.3 Seconds
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                From camera frame to confirmed attendance in under 300 milliseconds — all calculated on your office PC with no internet cloud delays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs mb-4">
                    01
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5">Camera Ingest</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Receives continuous smooth video from your standard CCTV cameras or USB webcams.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  ~12ms Speed
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs mb-4">
                    02
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5">Face Alignment</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Detects the face and aligns it automatically, even if the person walks past at an angle.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  ~24ms Speed
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs mb-4">
                    03
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5">Anti-Cheating Check</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Confirms a real living person is present. Rejects printed photos and mobile phone screens.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  ~18ms Speed
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs mb-4">
                    04
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5">Face Matching</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Matches the face signature against registered staff in under 30 milliseconds.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  ~26ms Speed
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs mb-4">
                    05
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5">Attendance Saved</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Saves punch in database, calculates on-time grace period, and unlocks entrance gate.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  ~4ms Speed
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 4: INTERACTIVE TELEMETRY & DECISION INSPECTOR
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="interactive-demo" className="py-20 md:py-28 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Live Verification Check
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-3">
                How AuraPass Checks Faces in Under 0.1 Seconds
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                See what happens the moment an employee steps in front of the camera: face found, real person confirmed, attendance saved.
              </p>
            </div>

            {/* Telemetry Console */}
            <GlassCard variant="elevated" className="overflow-hidden border-border/80">
              {/* Scenario Selector Header */}
              <div className="p-3 sm:p-4 border-b border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs sm:text-sm text-foreground">Choose an example:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TELEMETRY_SCENARIOS.map((sc, idx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setActiveScenarioIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer btn-tactile min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                        activeScenarioIdx === idx
                          ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                          : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border'
                      }`}
                    >
                      {sc.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scenario Details */}
              {(() => {
                const sc = TELEMETRY_SCENARIOS[activeScenarioIdx];
                return (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Scenario Summary Bar */}
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <Badge variant={sc.badgeVariant} dot>
                            {sc.outcome}
                          </Badge>
                          <span className="font-bold text-sm text-foreground">{sc.subject}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Dept: {sc.department} • Status: {sc.livenessScore}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Speed: {sc.totalTime}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Confidence: {sc.confidence}
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stage Step Breakdown */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Behind-the-scenes steps:
                      </div>
                      {sc.stages.map((stage, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 sm:p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                stage.status === 'PASS' || stage.status === 'DISPATCHED'
                                  ? 'bg-emerald-500'
                                  : stage.status === 'BLOCKED' || stage.status === 'FLAGGED'
                                  ? 'bg-red-500'
                                  : 'bg-zinc-400'
                              }`}
                            />
                            <span className="font-semibold text-foreground">{stage.name}</span>
                            <span className="text-muted-foreground hidden sm:inline">• {stage.detail}</span>
                          </div>
                          <div className="flex items-center gap-3 sm:text-right font-mono text-[11px] shrink-0">
                            <span className="text-muted-foreground">{stage.latency}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                stage.status === 'PASS' || stage.status === 'DISPATCHED'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                  : stage.status === 'BLOCKED' || stage.status === 'FLAGGED'
                                  ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                                  : 'bg-secondary text-muted-foreground border border-border'
                              }`}
                            >
                              {stage.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </GlassCard>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 5: THE REAL PRODUCT SUITE (INTERACTIVE CONSOLE TOUR)
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-20 md:py-28 bg-secondary/30 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Production-Tested Software
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-3">
                Explore the Enterprise Console
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                No placeholder mockups or generic graphics. Inspect the real, battle-tested interfaces running in production.
              </p>
            </div>

            {/* Interactive Console Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {[
                { id: 'kiosk', label: 'Touchless Kiosk Mode', icon: Monitor, route: '/kiosk' },
                { id: 'attendance', label: 'Attendance Registry', icon: FileCheck, route: '/attendance' },
                { id: 'analytics', label: 'Analytics & Heatmaps', icon: Activity, route: '/analytics' },
                { id: 'departments', label: 'Department Shifts & Grace', icon: Sliders, route: '/departments' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeConsoleTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveConsoleTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer btn-tactile min-h-[44px] sm:min-h-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: KIOSK MODE */}
            {activeConsoleTab === 'kiosk' && (
              <GlassCard variant="elevated" className="overflow-hidden border-border/80">
                <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground font-semibold">Route: /kiosk</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      LIVE ENTRANCE SURFACE
                    </span>
                  </div>
                  <Link
                    to="/kiosk"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Live Kiosk Mode <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 rounded-2xl bg-black p-5 relative min-h-[300px] flex flex-col justify-between overflow-hidden border border-border text-white">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        KIOSK CAMERA ACTIVE
                      </span>
                      <span className="text-zinc-400">Dual Mode: Front / Back Supported</span>
                    </div>

                    <div className="my-auto mx-auto w-44 h-52 border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center p-3 text-center bg-emerald-500/10">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                        <CheckCircle size={26} />
                      </div>
                      <span className="font-bold text-sm text-white">Vatsal Vadgama</span>
                      <span className="text-xs text-emerald-400 font-mono mt-0.5">99.1% Verified</span>
                      <span className="text-[10px] text-zinc-400 mt-1">Access Granted • 184ms</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                      <span>Mirror Flip: Active</span>
                      <span>Full-Screen Entrance Gate Ready</span>
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Touchless Entrance Kiosk for Tablets & Displays</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Deploy on an iPad, Android tablet, or front-desk touch screen. Staff look at the device, hear immediate audio confirmation, and see clear visual validation in under 0.18s.
                    </p>
                    <ul className="space-y-2 text-xs text-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Instant front / back camera switching with mirror reflection toggle</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Anti-spoofing rejects photos, phone screens, and video playback</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Auto-fullscreen kiosk lock prevents tampering by staff</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Tab 2: ATTENDANCE REGISTRY */}
            {activeConsoleTab === 'attendance' && (
              <GlassCard variant="elevated" className="overflow-hidden border-border/80">
                <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground font-semibold">Route: /attendance</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      RECORDS & EXPORTS
                    </span>
                  </div>
                  <Link
                    to="/attendance"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Attendance Roster <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Complete Attendance Records & Audit Trail</h3>
                      <p className="text-xs text-muted-foreground">Search by employee name, filter by date ranges, or export verified logs.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" icon={FileSpreadsheet}>
                        Export Excel (.xlsx)
                      </Button>
                      <Button variant="outline" size="sm" icon={Download}>
                        Export PDF
                      </Button>
                    </div>
                  </div>

                  {/* Mock Table */}
                  <div className="rounded-xl border border-border overflow-x-auto bg-card">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">Person</th>
                          <th className="p-3">Verification Method</th>
                          <th className="p-3">Confidence</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          { time: 'Today, 09:12:15 AM', name: 'Rajesh Patel', method: 'Face Biometric AI', conf: '99.4%', status: 'CONFIRMED' },
                          { time: 'Today, 09:08:42 AM', name: 'Priya Sharma', method: 'Face Biometric AI', conf: '98.9%', status: 'CONFIRMED' },
                          { time: 'Today, 09:05:11 AM', name: 'Vatsal Vadgama', method: 'Face Biometric AI', conf: '99.1%', status: 'CONFIRMED' },
                          { time: 'Today, 08:58:30 AM', name: 'Marcus Vance', method: 'Face Biometric AI', conf: '99.6%', status: 'CONFIRMED' },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">{row.time}</td>
                            <td className="p-3 font-semibold text-foreground">{row.name}</td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-400 font-mono">{row.method}</td>
                            <td className="p-3 font-mono">{row.conf}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Tab 3: ANALYTICS & HEATMAPS */}
            {activeConsoleTab === 'analytics' && (
              <GlassCard variant="elevated" className="overflow-hidden border-border/80">
                <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground font-semibold">Route: /analytics</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      EXECUTIVE METRICS
                    </span>
                  </div>
                  <Link
                    to="/analytics"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Analytics Console <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Workforce Presence Analytics & Arrival Heatmaps</h3>
                    <p className="text-xs text-muted-foreground">Analyze morning check-in bottlenecks, late arrival trends, and peak arrival hours across 7 days x 24 hours.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <div className="text-2xl font-extrabold text-foreground">98.4%</div>
                      <div className="text-xs text-muted-foreground mt-1">Average On-Time Rate</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">184 ms</div>
                      <div className="text-xs text-muted-foreground mt-1">Median Verification Latency</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <div className="text-2xl font-extrabold text-foreground">0</div>
                      <div className="text-xs text-muted-foreground mt-1">Unresolved Spoof Incidents</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/30 border border-border text-center text-xs text-muted-foreground">
                    <span className="font-mono text-foreground font-semibold">Hourly Arrival Density Heatmap:</span> Peak volume observed between 08:45 AM and 09:10 AM across Gate 01 and Gate 02.
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Tab 4: DEPARTMENT SHIFTS */}
            {activeConsoleTab === 'departments' && (
              <GlassCard variant="elevated" className="overflow-hidden border-border/80">
                <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground font-semibold">Route: /departments</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      SHIFT POLICY CONTROL
                    </span>
                  </div>
                  <Link
                    to="/departments"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Department Settings <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Custom Department Work Windows & Grace Periods</h3>
                    <p className="text-xs text-muted-foreground">Establish different working schedules, 15-minute grace rules, and automated late penalty deductions.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <div className="flex items-center justify-between font-bold text-sm text-foreground">
                        <span>Engineering & DevOps</span>
                        <Badge variant="emerald">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Shift: 09:00 - 17:00 • 15m Grace Allowance
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Punches between 09:00 and 09:15 categorized as On Time without deduction.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                      <div className="flex items-center justify-between font-bold text-sm text-foreground">
                        <span>Operations & Logistics</span>
                        <Badge variant="emerald">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Shift: 08:30 - 16:30 • 15m Grace Allowance
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Automated sync with warehouse gate relays and turnstile unlatching.
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 6: BIOMETRIC SOVEREIGNTY & PRIVACY ARCHITECTURE
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="security" className="py-20 md:py-28 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Data Privacy & Security
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-4">
                100% Private — Your Data Stays in Your Office
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                AuraPass runs on your own office computer or local server. Employee photos and attendance records never touch external internet clouds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Server size={20} />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">100% Private Local Setup</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Runs on your office computer without needing internet. No photos, face records, or staff details are ever sent to external clouds.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  100% Offline Ready
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <Cpu size={20} />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">Safe Face Signatures</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Faces are converted into secure math coordinates, not stored photos. Nobody can recreate an employee's face from the database.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-blue-600 dark:text-blue-400">
                  Secure Mathematical Numbers
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">Company Data Lock</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your company records are locked with bank-grade encryption (AES-256). Only your authorized managers have access.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-purple-600 dark:text-purple-400">
                  Bank-Grade Encryption
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">Anti-Cheating Check</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Smart camera checks verify a real living human is present. Showing printed photos, ID cards, or phone screens is instantly blocked.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-amber-600 dark:text-amber-400">
                  Anti-Proxy Protection
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 7: WORKPLACE ROI ESTIMATOR
            ═══════════════════════════════════════════════════════════════════ */}
        <RoiCalculator />

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 8: ONBOARDING IN 3 STEPS
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="onboarding" className="py-20 md:py-28 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Rapid Onboarding
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 mb-3">
                Up and running in 10 minutes.
              </h2>
              <p className="text-muted-foreground text-sm">
                No technicians, proprietary wiring, or specialized servers required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  1
                </div>
                <h3 className="font-bold text-base text-foreground">Add Your Camera</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Enter your IP camera's local RTSP stream URL or plug in any standard USB webcam into your edge PC or tablet.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  2
                </div>
                <h3 className="font-bold text-base text-foreground">3-Shot Staff Enrollment</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Capture front, left, and right profile photos of each employee in 30 seconds. Embeddings train automatically on-device.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  3
                </div>
                <h3 className="font-bold text-base text-foreground">Walk In Naturally</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Staff walk in normally. Facial verification executes in 184ms, entrance relays trigger, and attendance logs to your roster.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 9: TRANSPARENT PRICING
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="pricing" className="py-20 md:py-28 bg-secondary/30 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Transparent Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-3">
                Simple plans that grow with you.
              </h2>
              <p className="text-muted-foreground text-sm">
                Deploy on your existing hardware. No hidden reader licensing surcharges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Plan 1: Starter */}
              <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Starter Tier</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1 font-mono">₹0</div>
                  <p className="text-xs text-muted-foreground mb-6">Free forever for small offices & pilot tests</p>

                  <ul className="space-y-2.5 text-xs text-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Up to 25 enrolled employees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>2 camera / webcam streams</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Sub-300ms facial verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Standard CSV attendance exports</span>
                    </li>
                  </ul>
                </div>

                <Button variant="outline" size="md" to="/register" className="w-full">
                  Start Free Forever
                </Button>
              </div>

              {/* Plan 2: Business Pro (Highlighted) */}
              <div className="p-6 sm:p-7 rounded-2xl bg-card border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>

                <div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Business Pro</div>
                  <div className="flex items-baseline gap-1 mb-1 font-mono">
                    <span className="text-3xl sm:text-4xl font-extrabold text-foreground">₹1,999</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">Ideal for growing companies & commercial branches</p>

                  <ul className="space-y-2.5 text-xs text-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Up to 250 enrolled employees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>8 IP camera RTSP streams</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Department schedules & 15m grace policy</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Excel (.xlsx), CSV & Executive PDF exports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Multi-angle 3-shot enrollment</span>
                    </li>
                  </ul>
                </div>

                <Button variant="primary" size="md" to="/register" className="w-full">
                  Start 7-Day Trial
                </Button>
              </div>

              {/* Plan 3: Enterprise */}
              <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Enterprise</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">Custom</div>
                  <p className="text-xs text-muted-foreground mb-6">For multi-gate factories & corporate campuses</p>

                  <ul className="space-y-2.5 text-xs text-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Unlimited employees & cameras</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Dry-contact turnstile relay wiring support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Air-gapped on-premise Docker deployment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Dedicated engineer onboarding & SLA</span>
                    </li>
                  </ul>
                </div>

                <Button variant="outline" size="md" to="/support" className="w-full">
                  Contact Enterprise Sales
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 10: FREQUENTLY ASKED QUESTIONS
            ═══════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════
            COMPETITOR COMPARISON (AEO & GEO BENCHMARK)
            ═══════════════════════════════════════════════════════════════════ */}
        <CompetitorComparison />

        {/* ═══════════════════════════════════════════════════════════════════
            ENTERPRISE CASE STUDIES (PROVEN ROI & CAMPUS DEPLOYMENTS)
            ═══════════════════════════════════════════════════════════════════ */}
        <CaseStudiesSection />

        {/* ═══════════════════════════════════════════════════════════════════
            BIOMETRIC AI RESEARCH & WHITEPAPER HIGHLIGHTS
            ═══════════════════════════════════════════════════════════════════ */}
        <ResearchSection />

        {/* ═══════════════════════════════════════════════════════════════════
            CUSTOMER REVIEWS (SOCIAL PROOF)
            ═══════════════════════════════════════════════════════════════════ */}
        <CustomerReviews />

        <section id="faq" className="py-20 md:py-28 border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Common Inquiries
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2">
                Frequently Asked Questions
              </h2>
            </div>

            {/* High-Performance CSS Grid Accordion */}
            <Accordion items={faqs} allowMultiple={false} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 11: FINAL CALL TO ACTION
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-secondary/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <GlassCard variant="elevated" className="p-8 sm:p-14 relative overflow-hidden">
              <div className="max-w-2xl mx-auto">
                <Badge variant="emerald" dot className="mb-4">
                  Sovereign Entrance Intelligence
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                  Modernize your entrance in under 10 minutes.
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
                  Connect any standard RTSP camera or webcam. Enroll staff in 30 seconds.
                  Eliminate morning badge queues and buddy punching today.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    to={isAuthenticated ? '/dashboard' : '/register'}
                    iconRight={ArrowRight}
                    className="w-full sm:w-auto shadow-md"
                  >
                    {isAuthenticated ? 'Open Console' : 'Create Free Account'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    to="/docs"
                    icon={FileText}
                    className="w-full sm:w-auto"
                  >
                    Read Technical Documentation
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>

      {/* ─── Unified Footer (Phase 1 Foundation) ─── */}
      <PublicFooter />
    </div>
  );
}
