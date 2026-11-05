import React, { useState, useEffect, useRef } from 'react';

import { useNavigate, Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

import {

  User, Mail, Shield, Building, Cpu, Database, Server,

  Image as ImageIcon, RefreshCw, Download, Upload, RotateCcw,

  CheckCircle, AlertTriangle, Info, Package, Bell, Key, LogOut,

  ExternalLink, ChevronRight, Sparkles, Check, Users, ShieldCheck, ArrowRight,

  Lock, Smartphone, Laptop, Globe, Trash2, History, AlertCircle, Eye, EyeOff, Save
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';

import { formatPersonName } from '../utils/format';



const ADMIN_ROLES = ['org_admin', 'platform_owner'];



export default function ProfilePage() {

  const { user, apiClient, logout } = useAuth();

  const toast = useToast();

  const navigate = useNavigate();



  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'organization';

  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'organization') next.delete('tab'); else next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  // ── Security & Sessions State ──
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [savingEmail, setSavingEmail] = useState(false);

  const [renameForm, setRenameForm] = useState({ name: user?.name || '', orgName: user?.org_name || '' });
  const [savingRename, setSavingRename] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchSecurityData = async () => {
    setLoadingSessions(true);
    setLoadingActivity(true);
    try {
      const [sessRes, actRes] = await Promise.all([
        apiClient.get(`${API_BASE}/auth/sessions`).catch(() => ({ data: { sessions: [] } })),
        apiClient.get(`${API_BASE}/auth/activity`).catch(() => ({ data: { activity: [] } })),
      ]);
      setSessions(sessRes.data?.sessions || []);
      setActivityLogs(actRes.data?.activity || []);
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityData();
    }
  }, [activeTab]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await apiClient.post(`${API_BASE}/auth/change-password`, {
        current_password: passwordForm.current,
        new_password: passwordForm.new,
        confirm_password: passwordForm.confirm,
      });
      toast.success(res.data.message || 'Password updated successfully.');
      setPasswordForm({ current: '', new: '', confirm: '' });
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.password) {
      toast.error('Please enter new email and current password.');
      return;
    }
    setSavingEmail(true);
    try {
      const res = await apiClient.post(`${API_BASE}/auth/change-email`, {
        new_email: emailForm.newEmail,
        password: emailForm.password,
      });
      toast.success(res.data.message || 'Email updated successfully.');
      setEmailForm({ newEmail: '', password: '' });
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change email.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingRename(true);
    try {
      const res = await apiClient.post(`${API_BASE}/auth/profile`, {
        name: renameForm.name,
        org_name: renameForm.orgName,
      });
      toast.success(res.data.message || 'Profile updated successfully.');
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingRename(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await apiClient.post(`${API_BASE}/auth/sessions/revoke`, { session_id: sessionId });
      toast.success('Device session signed out.');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sign out device.');
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      await apiClient.post(`${API_BASE}/auth/sessions/revoke-all`);
      toast.success('Signed out from all other devices.');
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sign out other devices.');
    }
  };

  const handleForgotPassword = async () => {
    try {
      await apiClient.post(`${API_BASE}/auth/forgot-password`, { email: user?.email });
      toast.success('Password reset instructions generated and recorded.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to trigger reset flow.');
    }
  };

  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);

  const [sysInfo, setSysInfo] = useState(null);

  const [updateStatus, setUpdateStatus] = useState(null);

  const [updateLoading, setUpdateLoading] = useState(false);

  const [applyLoading, setApplyLoading] = useState(false);

  const [uploadLoading, setUploadLoading] = useState(false);

  const [rollbackLoading, setRollbackLoading] = useState(false);

  const [updateMessage, setUpdateMessage] = useState(null);

  const fileInputRef = useRef(null);

  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);



  // Notification preferences state

  const [notifPrefs, setNotifPrefs] = useState(null);



  // Organization renaming state

  const [editingOrg, setEditingOrg] = useState(false);

  const [newOrgName, setNewOrgName] = useState(user?.org_name || '');

  const [savingOrg, setSavingOrg] = useState(false);



  const handleSaveOrgName = async () => {

    if (!newOrgName.trim()) return;

    setSavingOrg(true);

    try {

      const res = await apiClient.put(`${API_BASE}/org/name`, { name: newOrgName.trim() });

      toast.success(res.data?.message || 'Organization updated successfully');

      setEditingOrg(false);

      const updatedUser = { ...user, org_name: newOrgName.trim() };

      localStorage.setItem('rms_user', JSON.stringify(updatedUser));

      window.location.reload();

    } catch (err) {

      toast.error(err.response?.data?.error || 'Failed to update organization name');

    } finally {

      setSavingOrg(false);

    }

  };



  useEffect(() => {

    const fetchStats = async () => {

      try {

        const [dashRes, empRes] = await Promise.all([

          apiClient.get(`${API_BASE}/dashboard`),

          apiClient.get(`${API_BASE}/employees`).catch(() => ({ data: { employees: [] } }))

        ]);

        const dashData = dashRes.data;

        const empList = empRes.data?.employees || [];

        const photoMap = dashData?.photos_per_person || {};



        const combinedPeople = empList.length > 0

          ? empList.map(e => ({

              name: e.name,

              department: e.department || 'General',

              employee_code: e.employee_code,

              email: e.email,

              photo_count: photoMap[e.name] !== undefined ? photoMap[e.name] : (e.image_count || 0),

              status: e.status

            }))

          : Object.keys(photoMap).map(name => ({

              name,

              department: 'General',

              employee_code: null,

              email: null,

              photo_count: photoMap[name],

              status: 'active'

            }));



        setStats({

          ...dashData,

          people: combinedPeople

        });

      } catch (err) {

        console.error('Failed to load dashboard stats for profile', err);

      } finally {

        setLoading(false);

      }

    };

    fetchStats();



    const fetchSysInfo = async () => {

      try {

        const res = await apiClient.get(`${API_BASE}/system/info`);

        setSysInfo(res.data);

      } catch (err) {

        // System info optional in local mode

      }

    };

    fetchSysInfo();



    const fetchNotifPrefs = async () => {

      try {

        const res = await apiClient.get(`${API_BASE}/notifications/preferences`);

        setNotifPrefs(res.data);

      } catch (err) {

        // Fallback default

        setNotifPrefs({

          unknown_face_alert: true,

          camera_offline_alert: true,

          model_stale_alert: false,

          db_unreachable_alert: true,

          daily_summary: false,

          channel_email: true,

          channel_webhook: false,

        });

      }

    };

    fetchNotifPrefs();

  }, [apiClient]);



  const initials = (user?.name || user?.email || 'AD')

    .split(' ')

    .map(w => w[0])

    .join('')

    .toUpperCase()

    .slice(0, 2);



  return (

    <motion.div

      initial={{ opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.3 }}

      className="pb-16 max-w-6xl mx-auto space-y-6 page-container"

    >

      {/* ── Executive Identity Header ── */}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm dark:shadow-2xl text-card-foreground">

        {/* Glow ambient background element */}

        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />



        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="flex items-center gap-5">

            {/* Avatar Pill */}

            <div className="relative">

              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1E293B] to-[#0F172A] border-2 border-[#059669]/40 flex items-center justify-center text-emerald-400 font-bold font-mono text-2xl shadow-xl shadow-emerald-950/20">

                {initials}

              </div>

              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card ring-2 ring-emerald-500/30" />

            </div>



            {/* Identity Details */}

            <div className="space-y-1">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">

                  {user?.name || 'Vatsal Vadgama'}

                </h1>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#059669]/15 text-emerald-400 border border-[#059669]/30 uppercase tracking-wider">

                  {user?.role === 'org_admin' ? 'Organization Admin' : (user?.role || 'Operator')}

                </span>

              </div>

              <p className="text-xs sm:text-sm text-muted-foreground font-mono">

                {user?.email || 'vatsalvadgama02@gmail.com'}

              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-400">

                <span className="flex items-center gap-1.5 text-foreground font-medium">

                  <Building size={14} className="text-emerald-400" />

                  {user?.org_name || 'RMC'}

                </span>

                <span className="text-zinc-600">•</span>

                <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                  {user?.org_id ? 'Cloud Multi-Tenant' : 'Local Sovereign Instance'}

                </span>

              </div>

            </div>

          </div>



          {/* Quick Header Actions */}

          <div className="flex flex-wrap items-center gap-2.5">

            {isAdmin && (

              <button

                onClick={() => {

                  setNewOrgName(user?.org_name || '');

                  setEditingOrg(true);

                }}

                className="button-secondary text-xs h-9 px-3.5 flex items-center gap-1.5 hover:border-[#059669]/50 transition-colors"

              >

                <Building size={14} className="text-zinc-400" />

                <span>Rename Org</span>

              </button>

            )}



            <button

              onClick={() => {

                sessionStorage.removeItem('onboarding_paused');

                sessionStorage.removeItem('welcome_shown');

                localStorage.removeItem('rms_onboarding_completed');

                localStorage.removeItem('rms_onboarding_dismissed');

                localStorage.setItem('rms_onboarding_step', '0');

                window.location.reload();

              }}

              className="button-secondary text-xs h-9 px-3.5 flex items-center gap-1.5 hover:border-[#059669]/50 transition-colors"

              title="Replay visual onboarding tour"

            >

              <RotateCcw size={14} className="text-zinc-400" />

              <span>Tour</span>

            </button>



            <button

              onClick={logout}

              className="h-9 px-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"

            >

              <LogOut size={14} />

              <span>Sign Out</span>

            </button>

          </div>

        </div>



        {/* In-place Org Renaming Bar */}

        <AnimatePresence>

          {editingOrg && (

            <motion.div

              initial={{ opacity: 0, height: 0 }}

              animate={{ opacity: 1, height: 'auto' }}

              exit={{ opacity: 0, height: 0 }}

              className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/50 p-4 rounded-xl border border-border"

            >

              <div className="flex-1">

                <label className="text-xs text-zinc-400 block mb-1">Organization Display Name</label>

                <input

                  type="text"

                  value={newOrgName}

                  onChange={(e) => setNewOrgName(e.target.value)}

                  placeholder="Enter organization name"

                  className="input-linear text-sm py-1.5 px-3 h-9 w-full sm:max-w-md text-foreground font-medium bg-card border border-border"

                  autoFocus

                />

              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-4">

                <button

                  onClick={handleSaveOrgName}

                  disabled={savingOrg}

                  className="button-primary text-xs h-9 px-4 font-semibold"

                >

                  {savingOrg ? 'Saving...' : 'Save Name'}

                </button>

                <button

                  onClick={() => setEditingOrg(false)}

                  disabled={savingOrg}

                  className="button-secondary text-xs h-9 px-3"

                >

                  Cancel

                </button>

              </div>

            </motion.div>

          )}

        </AnimatePresence>

      </div>



      {/* ── Liquid Glass Segmented Navigation ── */}
      <div className="segmented-nav w-full">
        {[
          { id: 'organization', label: 'Organization & Team', shortLabel: 'Team', icon: Users },
          { id: 'security', label: 'Security & Active Sessions', shortLabel: 'Security', icon: Lock },
          { id: 'notifications', label: 'Alerts & Notifications', shortLabel: 'Alerts', icon: Bell },
          { id: 'infrastructure', label: 'System Infrastructure', shortLabel: 'System', icon: Server },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`segment-item ${active ? 'active' : ''}`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="sm:hidden truncate">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

{/* ── TAB 1: Organization & Real Team Roster ── */}

      {activeTab === 'organization' && (

        <div className="space-y-6">

          {/* Real Metrics Banner */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="card-linear p-5 bg-card border border-border text-card-foreground rounded-xl space-y-2 shadow-sm">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Enrolled Personnel</span>

                <Users size={16} className="text-emerald-400" />

              </div>

              <div className="stat-number text-lg sm:text-2xl text-foreground font-bold">

                {stats?.total_people || 0}

              </div>

              <p className="text-[11px] text-zinc-500">Active biometric profiles</p>

            </div>



            <div className="card-linear p-5 bg-card border border-border text-card-foreground rounded-xl space-y-2 shadow-sm">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Reference Photos</span>

                <ImageIcon size={16} className="text-emerald-400" />

              </div>

              <div className="stat-number text-lg sm:text-2xl text-foreground font-bold">

                {stats?.total_photos || 0}

              </div>

              <p className="text-[11px] text-zinc-500">Multi-angle vector frames</p>

            </div>



            <div className="card-linear p-5 bg-card border border-border text-card-foreground rounded-xl space-y-2 shadow-sm">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Access Status</span>

                <ShieldCheck size={16} className="text-emerald-400" />

              </div>

              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">

                Verified

              </div>

              <p className="text-[11px] text-zinc-500">Autonomous kiosk active</p>

            </div>



            <div className="card-linear p-5 bg-card border border-border text-card-foreground rounded-xl space-y-2 shadow-sm">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Deployment</span>

                <Server size={16} className="text-indigo-400" />

              </div>

              <div className="text-lg font-bold text-foreground font-mono mt-1">

                Local Sovereign

              </div>

              <p className="text-[11px] text-zinc-500">Zero cloud leakage</p>

            </div>

          </div>



          {/* Genuine Enrolled Team Members Roster */}

          <div className="card-linear p-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm">

            <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>

                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">

                  <Users size={16} className="text-emerald-400" />

                  <span>Enrolled Personnel ({stats?.people?.length || 0})</span>

                </h3>

                <p className="text-xs text-zinc-400 mt-0.5">

                  Real individuals enrolled into {user?.org_name || 'your organization'}'s recognition model.

                </p>

              </div>



              <Link

                to="/upload"

                className="button-primary text-xs h-8 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"

              >

                <span>Enroll New Subject</span>

                <ArrowRight size={13} />

              </Link>

            </div>



            <div className="p-3 sm:p-5">

              {(!stats?.people || stats.people.length === 0) ? (

                <div className="py-12 text-center space-y-3">

                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">

                    <Users size={22} />

                  </div>

                  <h4 className="text-sm font-medium text-white">No Personnel Enrolled Yet</h4>

                  <p className="text-xs text-zinc-400 max-w-md mx-auto">

                    Your organization is clean with 0 synthetic dummy records. Enroll team members to activate autonomous attendance.

                  </p>

                  <Link

                    to="/upload"

                    className="inline-flex button-primary text-xs h-9 px-4 items-center gap-1.5 mt-2"

                  >

                    <span>Add First Team Member</span>

                  </Link>

                </div>

              ) : (

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  {stats.people.map(person => (
                    <div
                      key={person.name}
                      className="p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 transition-all flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-semibold text-xs text-emerald-400 shrink-0">
                          {formatPersonName(person.name).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs sm:text-sm text-white leading-snug break-words">
                            {formatPersonName(person.name)}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {person.department && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                {person.department}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {person.photo_count || 0} photos
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/persons/edit/${encodeURIComponent(person.name)}`}
                        className="button-secondary text-[11px] h-7 px-2 flex items-center gap-1 shrink-0"
                      >
                        <span>Edit</span>
                        <ChevronRight size={11} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Organization Parameters */}

          <div data-tour="org-settings" className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm">

            <div className="p-5 border-b border-border">

              <h3 className="text-sm font-semibold text-foreground">Organization Parameters</h3>

              <p className="text-xs text-zinc-400 mt-0.5">Workspace routing and governance parameters.</p>

            </div>

            <div className="p-5 space-y-4 text-xs">

              <div className="flex items-center justify-between py-1 border-b border-border/60 pb-3">

                <span className="text-zinc-400 font-medium">Tenant Display Name</span>

                <span className="text-white font-semibold font-mono">{user?.org_name || 'RMC'}</span>

              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/60 pb-3">

                <span className="text-zinc-400 font-medium">Organization UUID</span>

                <span className="font-mono text-foreground text-[10px] sm:text-[11px] bg-secondary px-2 py-0.5 rounded border border-border break-all max-w-[180px] sm:max-w-none text-right">

                  {user?.org_id || 'default-org-local'}

                </span>

              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/60 pb-3">

                <span className="text-zinc-400 font-medium">Primary Administrator</span>

                <span className="text-white font-mono">{user?.email || 'rmc@gmail.com'}</span>

              </div>

              <div className="flex items-center justify-between py-1">

                <span className="text-zinc-400 font-medium">Biometric Storage Tier</span>

                <span className="text-emerald-400 font-mono font-medium">Dedicated On-Premise Vector Store</span>

              </div>

            </div>

          </div>

        </div>

      )}



            {/* ── TAB: Security & Active Sessions ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Account Profile & Renaming */}
          <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User size={16} className="text-emerald-500" />
                <span>Account Profile & Organization</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your display name and corporate organization identity.
              </p>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={renameForm.name}
                    onChange={(e) => setRenameForm({ ...renameForm, name: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Vatsal Vadgama"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization / Company Name</label>
                  <input
                    type="text"
                    value={renameForm.orgName}
                    onChange={(e) => setRenameForm({ ...renameForm, orgName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Vatsal Enterprise"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingRename}
                  className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {savingRename ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password & Change Email Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Password Card */}
            <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Lock size={16} className="text-emerald-500" />
                      <span>Change Password</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enforce bcrypt cryptographic hash standards (minimum 8 characters).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <form onSubmit={handleChangePassword} className="p-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        className="w-full h-9 pl-3 pr-9 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">New Password (min 8 chars)</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      {savingPassword ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Change Email Card */}
            <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail size={16} className="text-emerald-500" />
                    <span>Change Email Address</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current address: <strong className="font-mono text-foreground">{user?.email || 'admin@rms.local'}</strong>
                  </p>
                </div>
                <form onSubmit={handleChangeEmail} className="p-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">New Email Address</label>
                    <input
                      type="email"
                      required
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="new.email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Confirm with Current Password</label>
                    <input
                      type="password"
                      required
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-secondary/60 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    Changing your email will update login credentials across all active API integrations.
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingEmail}
                      className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      {savingEmail ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                      <span>Update Email</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Active Logged-in Devices & Sessions */}
          <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Laptop size={16} className="text-emerald-500" />
                  <span>Active Device Logins & Sessions</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage browser and mobile device sessions authenticated to this account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRevokeAllOther}
                className="button-secondary text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:border-red-500/40 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Log Out All Other Devices</span>
              </button>
            </div>

            <div className="divide-y divide-border/60">
              {loadingSessions ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Loading active sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No other active device sessions found.</div>
              ) : (
                sessions.map((sess, idx) => (
                  <div key={sess.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground shrink-0">
                        {sess.device?.includes('iOS') || sess.device?.includes('Android') ? <Smartphone size={16} /> : <Laptop size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                          <span>{sess.device || 'Web Browser'}</span>
                          {sess.is_current && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              This Device (Current)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                          <span>IP: {sess.ip_address || '127.0.0.1'}</span>
                          <span>&bull;</span>
                          <span>Last active: {sess.last_active ? new Date(sess.last_active).toLocaleString() : 'Just now'}</span>
                        </div>
                      </div>
                    </div>
                    {!sess.is_current && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="button-secondary text-xs h-8 px-2.5 text-muted-foreground hover:text-red-500 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account Security Activity Log */}
          <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <History size={16} className="text-emerald-500" />
                  <span>Account Security Activity Log</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recent sign-ins, credential modifications, and session events.
                </p>
              </div>
              <button onClick={fetchSecurityData} className="button-secondary text-xs h-8 px-2.5 flex items-center gap-1.5 cursor-pointer">
                <RefreshCw size={12} className={loadingActivity ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="divide-y divide-border/60">
              {loadingActivity ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Loading activity history...</div>
              ) : activityLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No recent security events.</div>
              ) : (
                activityLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{log.type}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{log.details} &bull; <span className="font-mono">IP: {log.ip_address}</span></div>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── TAB 2: Notifications & Security ── */}

      {activeTab === 'notifications' && (

        <div className="card-linear p-0 bg-card border border-border rounded-xl space-y-6 shadow-sm">

          <div className="p-5 border-b border-border">

            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">

              <Bell size={16} className="text-emerald-400" />

              <span>Event Subscriptions & Alert Policies</span>

            </h3>

            <p className="text-xs text-zinc-400 mt-0.5">Configure real-time automated dispatches for security events.</p>

          </div>



          <div className="p-5 space-y-4">

            {[

              { key: 'unknown_face_alert', label: 'Unrecognized Face Intrusion Alerts', desc: 'Trigger an immediate alert when an unidentified individual attempts kiosk access' },

              { key: 'camera_offline_alert', label: 'Camera Disconnect Telemetry', desc: 'Alert security operators immediately when any RTSP stream or USB device drops offline' },

              { key: 'model_stale_alert', label: 'Model Retraining Reminders', desc: 'Notify operators when new employee photos are uploaded but embeddings have not been retrained' },

              { key: 'db_unreachable_alert', label: 'Storage / Database Connection Alerts', desc: 'Alert immediately if local SQLite or PostgreSQL connection latency spikes' },

              { key: 'daily_summary', label: 'Daily Automated Attendance Digest', desc: 'Send daily morning/evening employee check-in and punctuality summary report' },

            ].map(item => (

              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border">

                <div>

                  <div className="text-xs sm:text-sm font-medium text-white">{item.label}</div>

                  <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>

                </div>



                <button

                  type="button"

                  onClick={async () => {

                    const updated = { ...notifPrefs, [item.key]: !notifPrefs[item.key] };

                    setNotifPrefs(updated);

                    try {

                      await apiClient.post(`${API_BASE}/notifications/preferences`, updated);

                      toast.success('Preference updated.');

                    } catch (err) {

                      setNotifPrefs(notifPrefs);

                    }

                  }}

                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${

                    notifPrefs?.[item.key] ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'

                  }`}

                  aria-label={item.label}

                >

                  <span

                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${

                      notifPrefs?.[item.key] ? 'translate-x-5' : 'translate-x-0'

                    }`}

                  />

                </button>

              </div>

            ))}



            <div className="pt-4 border-t border-border">

              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Notification Dispatch Channels</h4>

              <div className="space-y-3">

                {[

                  { key: 'channel_email', label: 'Email Dispatch', desc: `Send alerts directly to ${user?.email || 'admin email'}` },

                  { key: 'channel_webhook', label: 'Webhook Integration (Slack / MS Teams)', desc: 'Post JSON telemetry payloads to an internal enterprise webhook URL' },

                ].map(item => (

                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border">

                    <div>

                      <div className="text-xs sm:text-sm font-medium text-white">{item.label}</div>

                      <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>

                    </div>



                    <button

                      type="button"

                      onClick={async () => {

                        const updated = { ...notifPrefs, [item.key]: !notifPrefs[item.key] };

                        setNotifPrefs(updated);

                        try {

                          await apiClient.post(`${API_BASE}/notifications/preferences`, updated);

                          toast.success('Channel updated.');

                        } catch (err) {

                          setNotifPrefs(notifPrefs);

                        }

                      }}

                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${

                        notifPrefs?.[item.key] ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'

                      }`}

                      aria-label={item.label}

                    >

                      <span

                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${

                          notifPrefs?.[item.key] ? 'translate-x-5' : 'translate-x-0'

                        }`}

                      />

                    </button>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      )}



      {/* ── TAB 3: System Infrastructure & Updates ── */}

      {activeTab === 'infrastructure' && (

        <div className="space-y-6">

          {/* Hardware & Core Specs */}

          <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm">

            <div className="p-5 border-b border-border">

              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">

                <Cpu size={16} className="text-emerald-400" />

                <span>Runtime Environment & AI Engines</span>

              </h3>

            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">

                <div className="flex items-center gap-2 text-zinc-400 mb-1">

                  <Server size={14} className="text-emerald-400" />

                  <span>Deployment Mode</span>

                </div>

                <div className="font-semibold text-white font-mono text-sm">

                  {user?.org_id ? 'Multi-Tenant (DB)' : 'Single-Tenant (Local)'}

                </div>

              </div>



              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">

                <div className="flex items-center gap-2 text-zinc-400 mb-1">

                  <Database size={14} className="text-emerald-400" />

                  <span>Storage Engine</span>

                </div>

                <div className="font-semibold text-white font-mono text-sm">

                  Local File System + SQLite

                </div>

              </div>



              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">

                <div className="flex items-center gap-2 text-zinc-400 mb-1">

                  <Cpu size={14} className="text-indigo-400" />

                  <span>Face Recognition Core</span>

                </div>

                <div className="font-semibold text-white font-mono text-sm">

                  GhostFaceNet / Facenet512

                </div>

              </div>

            </div>

          </div>



          {/* Software Updates & OTA Package Management */}

          {isAdmin && (

            <div className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm">

              <div className="p-5 border-b border-border flex items-center justify-between">

                <div>

                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">

                    <Package size={16} className="text-emerald-400" />

                    <span>Software Updates & Sovereign Air-Gap Packages</span>

                  </h3>

                  <p className="text-xs text-zinc-400 mt-0.5">Check for official releases or upload offline packages.</p>

                </div>

                {sysInfo?.app_version && (

                  <span className="px-2.5 py-0.5 rounded-full bg-[#059669]/15 text-emerald-400 border border-[#059669]/30 font-mono text-xs">

                    v{sysInfo.app_version}

                  </span>

                )}

              </div>



              <div className="p-5 space-y-4">

                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border text-xs">

                  <div>

                    <span className="text-zinc-400">Last Telemetry Check: </span>

                    <span className="font-mono text-white">

                      {sysInfo?.last_update_checked_at ? new Date(sysInfo.last_update_checked_at).toLocaleString() : 'Never'}

                    </span>

                  </div>



                  <button

                    onClick={async () => {

                      setUpdateLoading(true);

                      setUpdateMessage(null);

                      try {

                        const res = await apiClient.post(`${API_BASE}/system/check-update`);

                        setUpdateStatus(res.data);

                        setSysInfo(prev => ({

                          ...prev,

                          last_update_checked_at: new Date().toISOString(),

                          latest_available_version: res.data.latest_version,

                          update_available: res.data.status === 'update_available',

                        }));

                        toast.success('Update check complete.');

                      } catch (err) {

                        setUpdateMessage(`Check failed: ${err?.response?.data?.error || err.message}`);

                      } finally {

                        setUpdateLoading(false);

                      }

                    }}

                    disabled={updateLoading}

                    className="button-primary text-xs h-8 px-3.5 flex items-center gap-1.5"

                  >

                    <RefreshCw size={13} className={updateLoading ? 'animate-spin' : ''} />

                    <span>{updateLoading ? 'Checking...' : 'Check for Updates'}</span>

                  </button>

                </div>



                {updateStatus?.status === 'up_to_date' && (

                  <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-xs font-medium">

                    <CheckCircle size={16} />

                    <span>Your sovereign appliance is operating on the latest release.</span>

                  </div>

                )}



                {updateMessage && (

                  <div className="p-3.5 rounded-xl border bg-[#059669]/10 border-[#059669]/25 text-emerald-400 text-xs font-mono">

                    {updateMessage}

                  </div>

                )}



                {/* Offline Air-Gapped Upload */}

                <div className="pt-3 border-t border-border">

                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Offline Air-Gapped Package Deployment</h4>

                  <input

                    ref={fileInputRef}

                    type="file"

                    accept=".tar.gz"

                    className="hidden"

                    onChange={async (e) => {

                      const file = e.target.files?.[0];

                      if (!file) return;

                      setUploadLoading(true);

                      setUpdateMessage('Uploading update package...');

                      try {

                        const formData = new FormData();

                        formData.append('package', file);

                        const res = await apiClient.post(`${API_BASE}/system/upload-update`, formData, {

                          headers: { 'Content-Type': 'multipart/form-data' },

                          timeout: 120000,

                        });

                        setUpdateMessage(res.data.message || 'Update applied. Server restarting...');

                        toast.success('Package uploaded successfully.');

                      } catch (err) {

                        setUpdateMessage(`Upload failed: ${err?.response?.data?.error || err.message}`);

                        toast.error('Upload failed.');

                      } finally {

                        setUploadLoading(false);

                        if (fileInputRef.current) fileInputRef.current.value = '';

                      }

                    }}

                  />

                  <button

                    onClick={() => fileInputRef.current?.click()}

                    disabled={uploadLoading}

                    className="button-secondary text-xs h-9 px-4 flex items-center gap-2"

                  >

                    <Upload size={14} className={uploadLoading ? 'animate-pulse' : ''} />

                    <span>{uploadLoading ? 'Uploading Package...' : 'Upload Offline Update (.tar.gz)'}</span>

                  </button>

                </div>

              </div>

            </div>

          )}

        </div>

      )}

    </motion.div>

  );

}

