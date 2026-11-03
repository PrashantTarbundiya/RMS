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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 3D Tilt State for the interactive card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Kiosk Simulation State
  const [simState, setSimState] = useState('idle'); // idle | scanning | verified
  const [simTime, setSimTime] = useState(264);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg tilt
    const rotateY = ((x - centerX) / centerX) * 6;
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
      const elapsed = Math.round(performance.now() - start + 240);
      setSimTime(elapsed);
      setSimState('verified');
    }, 550);
  };

  const resetSimulation = () => {
    setSimState('idle');
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#1A2234] bg-[#080B11]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scan className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">AuraPass</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                Attendance
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#simulator" className="hover:text-white transition-colors">3D Simulator</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/support" className="hover:text-white transition-colors">Help</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Go to Dashboard &rarr;
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
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Get Started Free &rarr;
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-14 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1422] border border-[#20293D] text-slate-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Runs on your local computer &bull; No internet needed &bull; Complete privacy</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Mark attendance with just a face. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            No cards. No queues. No cloud.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Employees simply walk past a camera in the morning and their attendance is marked in under half a second.
          All photos and employee records stay safely inside your office network.
        </p>

        {/* Action Buttons */}
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
        </div>

        {/* 4 Key Numbers Bar */}
        <div className="mt-14 pt-8 border-t border-[#1A2234] grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-3.5 rounded-xl bg-[#0C101A] border border-[#1B2336]">
            <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">99.4%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Recognition Accuracy</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0C101A] border border-[#1B2336]">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">&lt; 300ms</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Check-In Speed</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0C101A] border border-[#1B2336]">
            <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">0 Bytes</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sent to Third Parties</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0C101A] border border-[#1B2336]">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">100%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Works Without Internet</p>
          </div>
        </div>
      </section>

      {/* 3D Interactive Kiosk Hardware Simulator */}
      <section id="simulator" className="py-14 px-4 sm:px-6 max-w-5xl mx-auto w-full z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            3D Interactive Experience
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            See how fast face attendance works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
            Move your mouse over the card to explore the 3D perspective. Click the test button to simulate a check-in.
          </p>
        </div>

        {/* 3D Tilt Card */}
        <div
          className="max-w-2xl mx-auto"
          style={{ perspective: 1000 }}
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
                <span className="text-slate-400 ml-2">gate_camera_01.local</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Active &bull; 30 FPS</span>
              </div>
            </div>

            {/* Camera Viewport with Real AI Interface Preview */}
            <div className="relative aspect-[16/9] w-full rounded-xl bg-black border border-[#1A2234] flex items-center justify-center overflow-hidden group">
              <img 
                src="/aurapass_kiosk_preview.jpg" 
                alt="AuraPass Enterprise Biometric Interface Preview" 
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

              {/* Center Face Reticle Overlay */}
              <div
                className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  simState === 'verified'
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_35px_rgba(52,211,153,0.35)]'
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

              {/* Status Overlay HUD */}
              <div className="absolute top-3 left-3 z-10 font-mono text-[11px] space-y-0.5 text-slate-300 bg-black/75 backdrop-blur-md p-2 rounded-lg border border-emerald-500/20">
                <p>Status: <span className="text-white uppercase font-bold">{simState}</span></p>
                <p>Liveness: <span className={simState === 'verified' ? 'text-emerald-400' : 'text-slate-300'}>Real Person Pass</span></p>
              </div>

              <div className="absolute top-3 right-3 z-10 font-mono text-[11px] text-right space-y-0.5 text-slate-300 bg-black/75 backdrop-blur-md p-2 rounded-lg border border-emerald-500/20">
                <p>Speed: <span className="text-emerald-400 font-bold">{simState === 'verified' ? `${simTime} ms` : '—'}</span></p>
                <p>Location: <span className="text-slate-300">Front Gate Lane 01</span></p>
              </div>

              {/* Access Banner on Verification */}
              {simState === 'verified' && (
                <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-emerald-950/85 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-2 shadow-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Attendance Marked &bull; Rajesh Patel (EMP-0142) &bull; 09:02 AM</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400">Match Confirmed 99.4%</span>
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
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Test Face Check-In</span>
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
                <span>Zero data sent outside your building</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How it works in 4 simple steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            From the camera lens to your attendance records in under half a second. All on your own computer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Camera detects face
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your standard security camera or USB webcam sees an employee walking up to the gate or door.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Checks real person
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects and blocks printed photos, phone screen tricks, and masks automatically in real time.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-purple-400" />
              Matches face code
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Turns the face into an irreversible code and finds the matching enrolled employee in your database.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 font-mono font-bold text-xs">
              04
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Marks attendance
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Logs the check-in timestamp into your dashboard and unlocks the door or turnstile relay instantly.
            </p>
          </div>
        </div>

        {/* Comparison: AuraPass vs Public Cloud */}
        <div className="mt-12 rounded-2xl border border-[#1E2638] bg-[#0A0D15] overflow-hidden max-w-3xl mx-auto">
          <div className="p-4 bg-[#0F1422] border-b border-[#1E2638] flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wide uppercase">Comparison</span>
            <span className="text-[11px] font-mono text-emerald-400">Why On-Premise Wins</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2638] text-slate-400">
                <th className="p-3.5">Feature</th>
                <th className="p-3.5 text-emerald-400 font-bold bg-emerald-500/5">AuraPass (On-Premise)</th>
                <th className="p-3.5 text-slate-400">Cloud Face Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182030] text-slate-300">
              <tr>
                <td className="p-3.5 font-medium">Where photos are kept</td>
                <td className="p-3.5 font-semibold text-emerald-400 bg-emerald-500/5">100% on your own local computer</td>
                <td className="p-3.5 text-slate-400">Sent to third-party public cloud</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium">Works during internet outages</td>
                <td className="p-3.5 font-semibold text-emerald-400 bg-emerald-500/5">Works perfectly without internet</td>
                <td className="p-3.5 text-rose-400">Fails (stops working when offline)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium">Monthly cloud storage fees</td>
                <td className="p-3.5 font-semibold text-emerald-400 bg-emerald-500/5">Free starter tier included</td>
                <td className="p-3.5 text-slate-400">Expensive per-employee monthly charges</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium">Check-in speed</td>
                <td className="p-3.5 font-semibold text-emerald-400 bg-emerald-500/5">Under 300 milliseconds</td>
                <td className="p-3.5 text-slate-400">1 to 3 seconds waiting for cloud roundtrip</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Teams Love AuraPass */}
      <section id="features" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built for factories, offices, and schools
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Practical features designed for real workers and busy managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Zero Morning Queues</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Handles more than 100 check-ins per minute. Workers do not need to slow down, swipe badges, or touch fingerprint scanners.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Works Without Internet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Everything runs on your local network. When the internet goes down, your workplace attendance keeps running smoothly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Works With Existing Cameras</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connects directly to standard IP security cameras (Hikvision, Dahua, Axis, Hanwha) or common USB webcams.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Simple Excel & PDF Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export daily, weekly, or monthly attendance reports in one click. Easy to hand directly to your payroll or HR team.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Employee Privacy Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Face templates cannot be turned back into photographs. Employee data is strictly protected and stays in your building.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Fast Employee Enrollment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload 3 photos per worker or take snapshots right at the camera. New employees are recognized in less than 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl mx-auto">
            Start completely free. Upgrade only when your facility grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Starter */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#161E2E] text-slate-300">
                Small Team / Pilot
              </span>
              <h3 className="text-lg font-bold text-white mt-3">Starter</h3>
              <p className="text-xs text-slate-400 mt-1">For single-site testing and small teams.</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold text-white font-mono">$0</span>
                <span className="text-xs text-slate-400"> / free forever</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 border-t border-[#1C2538] pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 200 enrolled employees</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 5 camera streams</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% on-premise SQLite database</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full face check-in speed</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="mt-8 w-full py-2.5 rounded-xl bg-[#161D2B] hover:bg-[#20293C] text-white font-semibold text-xs text-center transition-colors block"
            >
              Start Free Today
            </Link>
          </div>

          {/* Business Pro */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F1422] to-[#0A0D15] border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-md">
              Most Popular
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400">
                Workplaces & Factories
              </span>
              <h3 className="text-lg font-bold text-white mt-3">Business</h3>
              <p className="text-xs text-slate-400 mt-1">For multi-gate factories and busy offices.</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold text-white font-mono">$499</span>
                <span className="text-xs text-slate-400"> / facility / month</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2.5 border-t border-[#1C2538] pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 5,000 employees</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited camera lanes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgreSQL support with auto backups</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Detailed attendance audit logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Priority 2-hour support SLA</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="mt-8 w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs text-center transition-all shadow-md shadow-emerald-500/25 block"
            >
              Get Business Tier &rarr;
            </Link>
          </div>

          {/* Custom */}
          <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] flex flex-col justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-400">
                Enterprise & Defense
              </span>
              <h3 className="text-lg font-bold text-white mt-3">Custom Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">For multi-campus and high-security sites.</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold text-white font-mono">Custom</span>
                <span className="text-xs text-slate-400"> / dedicated appliances</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 border-t border-[#1C2538] pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> 50,000+ employees capacity</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Pre-configured hardware appliances</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Custom turnstile & gate wiring</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Completely offline update support</li>
              </ul>
            </div>
            <Link
              to="/support"
              className="mt-8 w-full py-2.5 rounded-xl bg-[#161D2B] hover:bg-[#20293C] text-white font-semibold text-xs text-center transition-colors block"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full border-t border-[#1A2234] z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Clear, straightforward answers about how AuraPass works.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Does any employee photo or biometric data leave our network?",
              a: "Never. AuraPass runs 100% on your own local computers. Face detection, recognition, and attendance records stay inside your local building. No photos or face records are ever sent to external cloud servers.",
            },
            {
              q: "How does it stop someone from holding up a photo or phone screen?",
              a: "AuraPass checks for signs of spoofing attacks in real time. It looks at surface glare, texture, and light reflection to ensure a living, real person is in front of the camera.",
            },
            {
              q: "What camera models can we use?",
              a: "Any standard IP security camera supporting RTSP or ONVIF (1080p, 15 to 30 frames per second) works out of the box, including Hikvision, Dahua, Axis, Hanwha, and Bosch. Standard USB webcams also work for desktop check-in stations.",
            },
            {
              q: "How long does it take to enroll an employee?",
              a: "Less than two minutes. You upload 3 clear photos of the employee (front, slight left, slight right), enter their name and employee ID, and click save. The system is ready immediately.",
            },
            {
              q: "Can we export attendance records to Excel or payroll?",
              a: "Yes. You can download complete CSV, Excel, and PDF attendance logs at any time from your administrator dashboard.",
            },
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-[#1E2638] bg-[#0D121D] overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full p-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[#121929] transition-colors"
              >
                <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === i && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-[#1C2538]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1A2234] bg-[#06080E] py-12 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Scan className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white">AuraPass</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Fast, private face recognition attendance. Runs completely on your own computer so your data stays safe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/support" className="hover:text-emerald-400 transition-colors">
              Documentation & Help
            </Link>
            <Link to="/login" className="hover:text-emerald-400 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-emerald-400 transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#121826] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
          <p>&copy; {new Date().getFullYear()} AuraPass. All rights reserved.</p>
          <p className="font-mono">Local On-Premise Build &bull; Version 2026.2</p>
        </div>
      </footer>
    </div>
  );
}
