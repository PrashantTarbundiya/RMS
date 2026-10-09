import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Scan, Eye, EyeOff, ShieldAlert, LogIn, Zap, Sparkles, KeyRound } from 'lucide-react';
import ApertureReticle from '../components/ApertureReticle';

export default function LoginPage() {
  const { login, loginLocalDev } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDevLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginLocalDev();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to enter dev mode. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@rms.local');
    setPassword('admin12345');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#010102] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(94,106,210,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(94,106,210,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="w-full max-w-sm card-linear shadow-2xl relative z-10">
        <div className="space-y-4 text-center mb-6">
          <ApertureReticle active={true} className="mx-auto w-14 h-14 flex items-center justify-center" status="loading">
            <Scan className="w-6 h-6 text-[#5E6AD2]" />
          </ApertureReticle>
          <div>
            <h2 className="text-card-title text-ink font-medium tracking-tight">Welcome Back</h2>
            <p className="text-caption text-ink-subtle mt-1">Sign in to RMS Face AI</p>
          </div>
        </div>

        {/* ─── 1-CLICK LOCAL DEV MODE ACCESS ─── */}
        <div className="mb-5 p-3.5 rounded-xl border border-[#5E6AD2]/30 bg-gradient-to-b from-[#5E6AD2]/10 to-[#5E6AD2]/5 relative overflow-hidden">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#5E6AD2]/20 border border-[#5E6AD2]/40 flex items-center justify-center shrink-0 text-[#828FFF]">
              <Zap className="w-3.5 h-3.5 fill-[#5E6AD2]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Local System / Dev Mode</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ONLINE</span>
              </div>
              <p className="text-[11px] text-ink-subtle mt-0.5 leading-tight">
                Zero configuration — access full system without typing password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLocalDevLogin}
            disabled={loading}
            className="w-full mt-3 h-9 button-primary text-xs flex items-center justify-center gap-2 font-medium bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white shadow-lg shadow-[#5E6AD2]/25 transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-medium">Continue in Dev Mode (No Login)</span>
          </button>
        </div>

        {/* Divider with 'OR' */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#23252A]" />
          </div>
          <span className="relative bg-[#0F1011] px-2.5 text-[10px] uppercase tracking-wider text-ink-tertiary font-mono">
            Or Sign In With Password
          </span>
        </div>
        
        <div>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-[#F87171] border border-red-500/20">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <p className="text-caption">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-caption text-ink-muted font-medium">Admin Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rms.local"
                className="input-linear"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-caption text-ink-muted font-medium">Password</label>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-[10px] font-mono text-[#828FFF] hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-2.5 h-2.5" />
                  <span>Auto-fill Admin</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-linear w-full pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-subtle transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full button-secondary mt-2 flex items-center justify-center gap-2 h-9" 
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="text-button text-ink">Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
        <div className="mt-5 flex justify-center text-caption text-ink-subtle border-t border-hairline pt-3">
          <p>Don't have an account? <Link to="/register" className="text-ink hover:underline font-medium">Create Organization</Link></p>
        </div>
      </div>

      {/* Branding Footer */}
      <p className="absolute bottom-6 text-[10px] text-ink-tertiary tracking-wider uppercase z-10">
        Powered by RMS Face AI
      </p>
    </div>
  );
}
