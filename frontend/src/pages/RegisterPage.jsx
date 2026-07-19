import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, Scan, UserPlus, ShieldAlert } from 'lucide-react';
import ApertureReticle from '../components/ApertureReticle';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(orgName, email, password, name);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      if (errorMsg.includes('multi-tenant')) {
        setError('System is in single-tenant mode. No registration required. Please go to the dashboard.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#010102]">
      <div className="w-full max-w-md card-linear shadow-2xl">
        <div className="space-y-4 text-center mb-6">
          <ApertureReticle active={true} className="mx-auto w-14 h-14 flex items-center justify-center" status="loading">
            <Scan className="w-6 h-6 text-[#5E6AD2]" />
          </ApertureReticle>
          <div>
            <h2 className="text-card-title text-ink font-medium tracking-tight">Create Organization</h2>
            <p className="text-caption text-ink-subtle mt-1">Set up your workforce recognition platform</p>
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
              <label htmlFor="reg-org" className="text-caption text-ink-muted font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-ink-subtle" /> Organization Name
              </label>
              <input
                id="reg-org"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corporation"
                className="input-linear"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="text-caption text-ink-muted font-medium">Your Name</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-linear"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="text-caption text-ink-muted font-medium">Admin Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@acme.com"
                className="input-linear"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="text-caption text-ink-muted font-medium">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-linear w-full pr-10"
                  required
                  minLength={8}
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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-confirm" className="text-caption text-ink-muted font-medium">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-linear"
                required
                minLength={8}
              />
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
                  <UserPlus className="h-4 w-4" />
                  <span className="text-button text-white">Create Organization</span>
                </>
              )}
            </button>
          </form>
        </div>
        <div className="mt-6 flex justify-center text-caption text-ink-subtle border-t border-hairline pt-4">
          <p>Already have an account? <Link to="/login" className="text-ink hover:underline font-medium">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
