import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Video,
  CheckCircle,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Camera,
  Play,
  FileSpreadsheet,
  Lock,
  ChevronDown,
  Sparkles,
  Zap,
  Building2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Interactive Quick Punch Simulator state
  const [testName, setTestName] = useState('Rajesh Patel');
  const [punchSimulated, setPunchSimulated] = useState(false);
  const [simulatedDetails, setSimulatedDetails] = useState(null);

  // ROI Calculator state
  const [employeeCount, setEmployeeCount] = useState(100);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(0);

  const handleSimulatePunch = (e) => {
    e?.preventDefault();
    const name = testName.trim() || 'Rajesh Patel';
    setPunchSimulated(true);
    setSimulatedDetails({
      name,
      empId: 'EMP-0142',
      department: 'Operations',
      time: '09:12 AM',
      status: 'On Time (Grace Period Active)',
      latency: '184 ms',
      confidence: '99.4%',
      liveness: 'Verified Human (Anti-Spoof Passed)',
      camera: 'Hikvision DS-2CD • Gate 01'
    });
  };

  const calculateHoursSaved = (count) => Math.round((count * 1.5 * 22) / 60);
  const calculateHardwareSaved = (count) => (count > 100 ? '₹85,000+' : '₹45,000+');

  const faqs = [
    {
      q: 'Does AuraPass work with our existing CCTV cameras?',
      a: 'Yes. Any standard IP camera with RTSP or ONVIF support (such as Hikvision, Dahua, CP Plus, or Axis) connects directly. You can also use regular USB webcams or tablet front cameras for dedicated kiosks without buying new biometric hardware.'
    },
    {
      q: 'Does it require an active internet connection to work?',
      a: 'No. AuraPass is engineered for 100% on-premise execution. All facial detection, embedding extraction, and attendance logging run locally on your internal office network or edge server with zero cloud data egress.'
    },
    {
      q: 'How does the system prevent buddy punching and phone photo spoofing?',
      a: 'Our deep learning liveness engine evaluates multi-spectral texture, screen bezel reflectance, and micro-movement in real time. Presenting a printed photograph or smartphone screen is flagged and rejected instantly as a spoof attack.'
    },
    {
      q: 'How do shift schedules and late grace periods work?',
      a: 'You can configure custom shift timings and grace periods per department (e.g., 09:00 shift with 15-minute grace). An employee punching at 09:12 is automatically categorized as On Time without deduction, while punches after 09:15 are logged as late.'
    },
    {
      q: 'Can we export reports to Excel, CSV, or payroll software?',
      a: 'Yes. Attendance records, audit logs, and shift summaries export with one click to clean Excel (.xlsx), CSV, and formatted executive PDF reports.'
    },
    {
      q: 'Is there a free trial to test with our team?',
      a: 'Yes. The Starter tier is completely free for up to 25 employees with no credit card required. You can test live verification right on your laptop webcam in under 5 minutes.'
    }
  ];

  return (
    <div className="min-h-screen public-surface flex flex-col font-sans transition-colors duration-200">
      {/* ─── Top Navigation Bar (Pop.site Clean Header) ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border/80 bg-background/90 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">AuraPass</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                v2026.2
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Open Console</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section (Pop.site Minimalism & Breathing Room) ─── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Subtle dot background */}
        <div className="hero-dot-grid absolute inset-0 pointer-events-none opacity-40" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Friendly pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6"
          >
            <Zap size={14} className="text-emerald-500" />
            <span>Sub-300ms Face Verification • Zero Hardware Lock-In</span>
          </motion.div>

          {/* Monumental, friendly headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6"
          >
            Attendance that recognizes <span className="text-emerald-600 dark:text-emerald-400">people</span>, not badges.
          </motion.h1>

          {/* Simple, human subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Turn existing office CCTV cameras, webcams, or tablets into instant face attendance gates. No expensive biometric machines. Zero cloud upload.
          </motion.p>

          {/* ─── Pop.site Hero Interactive Input Bar ─── */}
          <motion.form
            onSubmit={handleSimulatePunch}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto mb-4"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl sm:rounded-full bg-card border border-border shadow-lg">
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter employee name..."
                className="w-full sm:flex-1 px-4 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Test Live Punch</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-4">
              <span>✓ No credit card required</span>
              <span>✓ Free 7-day trial</span>
              <span>✓ 100% on-premise</span>
            </p>
          </motion.form>

          {/* Interactive Simulated Punch Feedback Card */}
          <AnimatePresence>
            {punchSimulated && simulatedDetails && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md mx-auto mt-6 p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-xl text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">ACCESS GRANTED</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{simulatedDetails.latency}</span>
                </div>
                <div className="space-y-1.5 text-xs text-foreground">
                  <div className="text-sm font-bold">{simulatedDetails.name}</div>
                  <div className="text-muted-foreground">
                    Dept: {simulatedDetails.department} • Time: {simulatedDetails.time}
                  </div>
                  <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span>✓ Match: {simulatedDetails.confidence}</span>
                    <span>• {simulatedDetails.status}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Clean Product Interface Mockup (Like Pop.site / Cal.com) ─── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-14">
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-2xl relative overflow-hidden">
            {/* Window chrome header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                <span className="font-mono text-[11px] ml-2 text-foreground font-medium">Front Entrance Lane 01 • RTSP 1080p</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● 30 FPS Active</span>
                <span>Latency: 184ms</span>
              </div>
            </div>

            {/* Split layout: Camera frame on left, live roster punches on right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 rounded-xl bg-secondary p-4 relative min-h-[260px] flex flex-col justify-between overflow-hidden border border-border">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>CAMERA_INPUT: IP_CAM_192.168.1.50</span>
                  <span className="px-2 py-0.5 rounded bg-background border border-border text-[10px]">HIKVISION</span>
                </div>

                {/* Face Box Simulation */}
                <div className="my-auto mx-auto w-40 h-48 border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center p-3 text-center bg-emerald-500/5">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle size={24} />
                  </div>
                  <span className="font-bold text-xs text-foreground">Rajesh Patel</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">99.4% Verified</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/50">
                  <span>Liveness: Micro-motion OK</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Zero Cloud Egress</span>
                </div>
              </div>

              {/* Live punch stream on right */}
              <div className="md:col-span-5 flex flex-col gap-2.5">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Live Punch Stream</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Syncing</span>
                </div>

                {[
                  { name: 'Rajesh Patel', dept: 'Quality Assurance', time: '09:12 AM', status: 'On Time (Grace)', conf: '99.4%' },
                  { name: 'Priya Sharma', dept: 'Operations', time: '09:08 AM', status: 'On Time', conf: '98.9%' },
                  { name: 'Vatsal Vadgama', dept: 'Engineering', time: '09:05 AM', status: 'On Time', conf: '99.1%' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">{item.dept} • {item.time}</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Shift Grace: 15 mins active</span>
                  <Link to="/attendance" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                    View Complete Roster →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3 Simple Bento Cards (Pop.site 3-Card Pattern) ─── */}
      <section id="features" className="py-20 border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-3">
              Everything needed to run automated gate attendance.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Eliminate expensive card readers, proxy check-ins, and manual morning queues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Camera size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Use Any Camera</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect your existing Hikvision, Dahua, CP Plus, or Axis RTSP camera streams. Or plug in standard USB webcams and iPads. Zero hardware lock-in.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-muted-foreground">
                RTSP • ONVIF • UVC Webcams
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Shield size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Sub-300ms On-Premise AI</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High-speed facial verification matches staff as they walk in naturally. Built-in anti-spoofing rejects phone photos and printed paper passes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-muted-foreground">
                FaceNet512 • 0.18s In-Memory Execution
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <FileSpreadsheet size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Shift Rules & Payroll</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Configurable shift windows, 15-minute grace allowances, and automated late penalties. Export tamper-evident payroll reports to Excel and PDF.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-muted-foreground">
                1-Click Excel • CSV • Audit PDF
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works (Simple 3 Steps) ─── */}
      <section id="how-it-works" className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Easy Setup
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 mb-3">
              Up and running in 10 minutes.
            </h2>
            <p className="text-muted-foreground text-sm">
              No technicians or proprietary wiring needed. Follow 3 straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Add Your Camera</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your IP camera's local RTSP stream URL or select your webcam from the camera manager.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">3-Shot Staff Enrollment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Take front, left, and right profile photos of each employee in 30 seconds. Models train automatically on-device.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Walk In Naturally</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Staff look towards the entrance. Verification happens in 0.18s, gates release, and attendance logs securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROI & Cost Calculator ─── */}
      <section className="py-20 border-t border-border bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              ROI Estimator
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2 mb-3">
              See what your business saves.
            </h2>
            <p className="text-muted-foreground text-sm">
              Calculate time and hardware savings compared to fingerprint or RFID machines.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-md">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="font-medium text-foreground">Team Size:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{employeeCount} Employees</span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                <span>20 staff</span>
                <span>500 staff</span>
                <span>1,000+ staff</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-2xl font-extrabold text-foreground">{calculateHoursSaved(employeeCount)} hrs</div>
                <div className="text-xs text-muted-foreground mt-1">Queue Time Saved / Month</div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{calculateHardwareSaved(employeeCount)}</div>
                <div className="text-xs text-muted-foreground mt-1">Biometric Hardware Saved</div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-2xl font-extrabold text-foreground">0%</div>
                <div className="text-xs text-muted-foreground mt-1">Buddy Punching Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Section (Fair for Indian & Global SaaS) ─── */}
      <section id="pricing" className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 mb-3">
              Simple plans that grow with you.
            </h2>
            <p className="text-muted-foreground text-sm">
              All plans include free 7-day trials. No hidden hardware licensing surcharges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Starter Tier</div>
                <div className="text-3xl font-extrabold text-foreground mb-1">₹0</div>
                <p className="text-xs text-muted-foreground mb-6">Free forever for small offices & pilots</p>

                <ul className="space-y-2.5 text-xs text-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Up to 25 enrolled employees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>2 camera / webcam streams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Sub-300ms facial verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Standard CSV attendance exports</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-2.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-foreground text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Plan 2: Highlighted */}
            <div className="p-6 rounded-2xl bg-card border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Business Pro</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-foreground">₹1,999</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">Ideal for growing companies & commercial branches</p>

                <ul className="space-y-2.5 text-xs text-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Up to 250 enrolled employees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>8 IP camera RTSP streams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Department schedules & 15m grace policy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Excel (.xlsx), CSV & Executive PDF exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Multi-angle 3-shot enrollment</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold text-center transition-all shadow-md"
              >
                Get Started
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Enterprise</div>
                <div className="text-3xl font-extrabold text-foreground mb-1">Custom</div>
                <p className="text-xs text-muted-foreground mb-6">For multi-gate factories & corporate headquarters</p>

                <ul className="space-y-2.5 text-xs text-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Unlimited employees & cameras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Dry-contact turnstile relay wiring support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Air-gapped on-premise Docker deployment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>Dedicated engineer onboarding & SLA</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/support"
                className="w-full py-2.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-foreground text-center transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Accordion (Clean & Direct) ─── */}
      <section className="py-20 border-t border-border bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-foreground cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield size={12} />
              </div>
              <span className="font-bold text-sm text-foreground">AuraPass™</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} AuraPass Enterprise. Sovereign On-Premise Face Verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Help Center</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <button
              onClick={toggleTheme}
              className="hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
            >
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
