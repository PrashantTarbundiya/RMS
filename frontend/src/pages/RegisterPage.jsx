import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scan,
  Eye,
  EyeOff,
  ShieldAlert,
  UserPlus,
  Mail,
  Lock,
  Building,
  User,
  ShieldCheck,
  ArrowRight,
  Check,
} from 'lucide-react';
import ApertureReticle from '../components/ApertureReticle';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConflict(null);

    const cleanOrg = orgName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = adminName.trim();

    if (!cleanOrg || !cleanEmail || !password) {
      setError('Please provide organization name, email, and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await register({
        org_name: cleanOrg,
        admin_name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password,
      });
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const errorMsg =
        data?.error ||
        data?.message ||
        (typeof data === 'string' ? data : null) ||
        'Registration failed. Please check your connection.';

      if (status === 409) {
        setConflict({
          message: errorMsg,
          email: cleanEmail,
        });
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isPasswordLongEnough = password.length >= 8;
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;

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

      <div className="w-full max-w-lg relative z-10 py-6">
        {/* Card Container */}
        <div className="bg-[#0D1017] border border-zinc-800 rounded-xl p-7 sm:p-8 shadow-2xl shadow-black/90 relative">
          {/* Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center">
              <ApertureReticle active={true} className="w-14 h-14 flex items-center justify-center" status="loading">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-md">
                  <Scan className="w-5 h-5 text-white" />
                </div>
              </ApertureReticle>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Create Organization</h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Set up an on-premise facial recognition and attendance workspace
              </p>
            </div>
          </div>

          {/* Conflict Alert (Account / Org Already Exists) */}
          {conflict && (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs leading-relaxed">
                  <p className="font-semibold text-amber-300">Account Already Exists</p>
                  <p className="text-amber-200/90 mt-1">{conflict.message}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { email: conflict.email } })}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-400 text-black shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Sign In With Existing Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/25 p-3.5 text-xs text-red-200">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-medium text-red-300">Registration Error</p>
                <p className="text-red-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-org" className="block text-xs font-medium text-zinc-300">
                Organization Name <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  id="reg-org"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Security Corp"
                  className="w-full h-11 pl-10 pr-4 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Admin Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-admin-name" className="block text-xs font-medium text-zinc-300">
                Administrator Name <span className="text-zinc-500 text-[11px]">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-admin-name"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full h-11 pl-10 pr-4 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-xs font-medium text-zinc-300">
                Admin Work Email <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full h-11 pl-10 pr-4 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-xs font-medium text-zinc-300">
                Password <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full h-11 pl-10 pr-11 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none font-mono text-[13px]"
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-zinc-300">
                Confirm Password <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 pl-10 pr-11 bg-[#11141C] border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-zinc-500 transition-colors outline-none font-mono text-[13px]"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer select-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Validation Hints */}
            {password && (
              <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-0.5">
                <span className={`flex items-center gap-1.5 ${isPasswordLongEnough ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                  <span>8+ characters</span>
                </span>
                {confirmPassword && (
                  <span className={`flex items-center gap-1.5 ${doPasswordsMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                    <span>{doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                  </span>
                )}
              </div>
            )}

            {/* Submit Button - Solid crisp white button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-4 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Provisioning workspace...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-black" />
                  <span>Create Organization Account</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black/80" />
                </>
              )}
            </button>
          </form>

          {/* Footer Divider & Sign In Link */}
          <div className="mt-7 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Already have an organization?{' '}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline inline-flex items-center gap-1"
              >
                <span>Sign In</span>
                <span>&rarr;</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge and Legal Links */}
        <div className="mt-6 flex flex-col items-center gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>Secure Multi-Tenant Context</span>
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
