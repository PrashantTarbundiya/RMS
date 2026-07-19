import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Scan, Eye, EyeOff, ShieldAlert, LogIn } from 'lucide-react';
import ApertureReticle from '../components/ApertureReticle';

export default function LoginPage() {
  const { login } = useAuth();
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#010102]">
      <div className="w-full max-w-sm card-linear shadow-2xl">
        <div className="space-y-4 text-center mb-6">
          <ApertureReticle active={true} className="mx-auto w-14 h-14 flex items-center justify-center" status="loading">
            <Scan className="w-6 h-6 text-[#5E6AD2]" />
          </ApertureReticle>
          <div>
            <h2 className="text-card-title text-ink font-medium tracking-tight">Welcome Back</h2>
            <p className="text-caption text-ink-subtle mt-1">Sign in to your organization</p>
          </div>
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
                placeholder="admin@acme.com"
                className="input-linear"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-caption text-ink-muted font-medium">Password</label>
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
              className="w-full button-primary mt-2 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="text-button text-white">Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
        <div className="mt-6 flex justify-center text-caption text-ink-subtle border-t border-hairline pt-4">
          <p>Don't have an account? <Link to="/register" className="text-ink hover:underline font-medium">Create Organization</Link></p>
        </div>
      </div>
    </div>
  );
}
