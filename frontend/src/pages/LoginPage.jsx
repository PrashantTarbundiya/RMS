import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Scan, Eye, EyeOff, ShieldAlert, LogIn, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import ApertureReticle from '../components/ApertureReticle';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both your email and password.');
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-[#07090E] relative overflow-hidden select-none">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-[#0D1017] border border-zinc-800 rounded-xl p-7 sm:p-8 shadow-2xl shadow-black/90 relative">
          {/* Header */}
          <div className="text-center space-y-3 mb-7">
            <div className="inline-flex items-center justify-center">
              <ApertureReticle active={true} className="w-14 h-14 flex items-center justify-center" status="loading">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-md">
                  <Scan className="w-5 h-5 text-white" />
                </div>
              </ApertureReticle>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Sign In</h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Access your organization face recognition console
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/25 p-3.5 text-xs text-red-200">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-medium text-red-300">Sign In Error</p>
                <p className="text-red-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-zinc-300">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 pl-10 pr-4 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none font-mono text-[13px]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer select-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-zinc-500 text-[11px]">Local Instance / SSO</span>
            </div>

            {/* Submit Button - Solid, crisp, professional */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-3 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-black" />
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black/80" />
                </>
              )}
            </button>
          </form>

          {/* Footer Divider & Register Link */}
          <div className="mt-7 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Need a new tenant workspace?{' '}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline inline-flex items-center gap-1"
              >
                <span>Create Organization</span>
                <span>&rarr;</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge and Legal Links */}
        <div className="mt-6 flex flex-col items-center gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>Multi-Tenant Isolated Environment</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
