import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Scan,
  Eye,
  EyeOff,
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Server,
  Zap,
  Shield,
  ShieldCheck,
} from 'lucide-react';

const SECURITY_TESTIMONIALS = [
  {
    quote: "AuraPass solved morning attendance queues across our entire facility. Employees don't even slow down; they look at the camera and continue walking through.",
    author: "Elena Rostova",
    role: "Plant Operations",
    org: "Sovereign Industrial",
    initials: "ER",
    badgeColor: "bg-blue-600",
  },
  {
    quote: "Because it runs completely inside our private local network, we never have to worry about employee photo leaks or external cloud vendor downtimes.",
    author: "Dr. Marcus Vance",
    role: "IT Security Lead",
    org: "Apex Manufacturing",
    initials: "MV",
    badgeColor: "bg-emerald-600",
  },
  {
    quote: "The automated reports save our payroll and HR department hours every single pay period. Clean, reliable, and very easy to manage.",
    author: "Priya Sharma",
    role: "HR Director",
    org: "BioTech Labs",
    initials: "PS",
    badgeColor: "bg-purple-600",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Testimonial Carousel State
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev === 0 ? SECURITY_TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev === SECURITY_TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your work email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Authentication failed. Please verify your email and password.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentTestimonial = SECURITY_TESTIMONIALS[activeTestimonial];

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-neutral-100 flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* LEFT COLUMN: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 border-b lg:border-b-0 lg:border-r border-[#262626]">
        <div className="w-full max-w-md mx-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Scan className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">AuraPass</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                    Attendance
                  </span>
                </div>
                <span className="text-[9px] tracking-wider text-neutral-500 font-mono uppercase">
                  FACE RECOGNITION ATTENDANCE
                </span>
              </div>
            </Link>

            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#111111] border border-[#262626] text-neutral-300">
              Secure Sign In
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1.5">
              Enter your work email and password to open the attendance console.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 text-xs text-red-200">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-medium text-red-300">Sign In Error</p>
                <p className="text-red-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Google Workspace SSO Button */}
          <button
            type="button"
            onClick={() => {
              setError('Google Workspace sign-in requires SAML configuration inside organization settings.');
            }}
            className="w-full h-11 flex items-center justify-center gap-3 bg-[#171717] hover:bg-[#262626] border border-[#262626] hover:border-[#404040] rounded-xl text-xs sm:text-sm font-medium text-neutral-200 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#262626]"></div>
            <span className="px-3 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
              OR WITH EMAIL
            </span>
            <div className="flex-1 border-t border-[#262626]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 pl-10 pr-4 bg-[#171717] border border-[#262626] hover:border-[#404040] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 transition-colors outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-neutral-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-[#171717] border border-[#262626] hover:border-[#404040] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 transition-colors outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
                />
                <span>Remember this computer</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-black shadow-lg shadow-emerald-500/20 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom link to Register */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Create one free
            </Link>
          </div>

          {/* Legal policy note */}
          <div className="mt-6 pt-5 border-t border-[#262626] text-center">
            <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AuraPass runs on your private local server</span>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: FLOATING TESTIMONIAL CARD */}
      <div className="w-full lg:w-1/2 bg-[#000000] flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        {/* Soft ambient backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Testimonial Card */}
        <div className="relative z-10 w-full max-w-md bg-[#111111] backdrop-blur-xl border border-[#262626] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/80">
          {/* Header of card: Stars + Verified User */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-neutral-300">5.0 Verified User</span>
            </div>
            <span className="text-2xl font-serif text-neutral-600 select-none">”</span>
          </div>

          {/* Testimonial Quote */}
          <blockquote className="text-xs sm:text-sm text-neutral-200 leading-relaxed min-h-[72px] mb-6">
            "{currentTestimonial.quote}"
          </blockquote>

          {/* Author Details + Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${currentTestimonial.badgeColor} flex items-center justify-center text-xs font-bold text-white shadow-md`}
              >
                {currentTestimonial.initials}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{currentTestimonial.author}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {currentTestimonial.role} &bull; {currentTestimonial.org}
                </p>
              </div>
            </div>

            {/* Pagination dots & Arrows */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                {SECURITY_TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTestimonial(idx)}
                    className={`h-1.5 transition-all rounded-full cursor-pointer ${
                      activeTestimonial === idx ? 'w-5 bg-emerald-400' : 'w-1.5 bg-neutral-700 hover:bg-neutral-600'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handlePrevTestimonial}
                className="w-7 h-7 rounded-full bg-[#171717] hover:bg-[#262626] flex items-center justify-center text-neutral-300 transition-colors cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextTestimonial}
                className="w-7 h-7 rounded-full bg-[#171717] hover:bg-[#262626] flex items-center justify-center text-neutral-300 transition-colors cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Simple Trust Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-md relative z-10">
          <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] text-center">
            <Server className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-white">Runs Locally</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">No cloud needed</p>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] text-center">
            <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-white">&lt; 1 Second</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Quick check-in</p>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] text-center">
            <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-white">Privacy First</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Data in your office</p>
          </div>
        </div>
      </div>
    </div>
  );
}
