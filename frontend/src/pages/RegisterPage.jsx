import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, Scan, UserPlus, ShieldAlert, ShieldCheck, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null); // { message, email }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConflict(null);

    const cleanOrg = orgName.trim();
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanOrg || !cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      await register(cleanOrg, cleanEmail, password, cleanName || cleanOrg + ' Admin');
      navigate('/dashboard');
    } catch (err) {
      const isConflictStatus = err.response?.status === 409;
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Registration failed. Please check your details and try again.';

      if (isConflictStatus || errorMsg.toLowerCase().includes('already exists')) {
        setConflict({
          message: errorMsg,
          email: cleanEmail,
        });
      } else if (errorMsg.includes('multi-tenant')) {
        setError('System is in single-tenant mode. No registration required. Please proceed to the dashboard.');
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
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-[#040507] relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[360px] bg-[#5E6AD2]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="w-full max-w-lg relative z-10 py-6">
        {/* Card Container */}
        <div className="bg-[#0C0D11]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl shadow-black/80 relative">
          {/* Subtle Top Border Glow */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/60 to-transparent" />

          {/* Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center">
              <ApertureReticle active={true} className="w-14 h-14 flex items-center justify-center" status="loading">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5E6AD2] to-[#3B448C] flex items-center justify-center shadow-lg shadow-[#5E6AD2]/30">
                  <Scan className="w-5 h-5 text-white" />
                </div>
              </ApertureReticle>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Create Organization</h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Set up a secure, multi-tenant workforce facial recognition workspace
              </p>
            </div>
          </div>

          {/* Conflict Alert (Account / Org Already Exists) */}
          {conflict && (
            <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs leading-relaxed">
                  <p className="font-semibold text-amber-300">Account Already Exists</p>
                  <p className="text-amber-200/90 mt-1">{conflict.message}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { email: conflict.email } })}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow transition-all cursor-pointer"
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
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 text-xs text-red-200 animate-in fade-in duration-200">
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
                Organization Name <span className="text-[#5E6AD2]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  id="reg-org"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corporation or Institute of Technology"
                  className="w-full h-11 pl-10 pr-4 bg-[#14151B] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/20 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Administrator Name & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="block text-xs font-medium text-zinc-300">
                  Admin Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full h-11 pl-10 pr-4 bg-[#14151B] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/20 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-xs font-medium text-zinc-300">
                  Admin Work Email <span className="text-[#5E6AD2]">*</span>
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
                    className="w-full h-11 pl-10 pr-4 bg-[#14151B] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/20 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="block text-xs font-medium text-zinc-300">
                  Password <span className="text-[#5E6AD2]">*</span>
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
                    placeholder="Min. 8 characters"
                    className="w-full h-11 pl-10 pr-11 bg-[#14151B] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/20 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none font-mono text-[13px]"
                    required
                    minLength={8}
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
                      <EyeOff className="w-4 h-4 transition-transform active:scale-90" />
                    ) : (
                      <Eye className="w-4 h-4 transition-transform active:scale-90" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="block text-xs font-medium text-zinc-300">
                  Confirm Password <span className="text-[#5E6AD2]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full h-11 pl-10 pr-11 bg-[#14151B] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/20 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none font-mono text-[13px]"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer select-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 transition-transform active:scale-90" />
                    ) : (
                      <Eye className="w-4 h-4 transition-transform active:scale-90" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Hints */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-4 bg-gradient-to-r from-[#5E6AD2] to-[#4F59BE] hover:from-[#6A76E0] hover:to-[#5863CC] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#5E6AD2]/25 hover:shadow-[#5E6AD2]/40 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning workspace...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>Create Organization Account</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                </>
              )}
            </button>
          </form>

          {/* Footer Divider & Sign In Link */}
          <div className="mt-7 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-zinc-400">
              Already have an organization?{' '}
              <Link
                to="/login"
                className="text-[#828FFF] hover:text-[#9BA5FF] font-medium transition-colors hover:underline inline-flex items-center gap-1"
              >
                <span>Sign In</span>
                <span>&rarr;</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Isolation Badge */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
          <span>Automated Benchmark AI Weight Seeding Included</span>
        </div>
      </div>
    </div>
  );
}
