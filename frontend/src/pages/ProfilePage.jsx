import React, { useState, useEffect, useRef } from 'react';

import { useNavigate, Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

import {

  User, Mail, Shield, Building, Cpu, Database, Server,

  Image as ImageIcon, RefreshCw, Download, Upload, RotateCcw,

  CheckCircle, AlertTriangle, Info, Package, Bell, Key, LogOut,

  ExternalLink, ChevronRight, Sparkles, Check, Users, ShieldCheck, ArrowRight

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

      <div className="relative overflow-hidden rounded-2xl border border-[#23252A] bg-gradient-to-b from-[#141517] via-[#0F1011] to-[#0A0B0C] p-6 sm:p-8 shadow-2xl">

        {/* Glow ambient background element */}

        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />



        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="flex items-center gap-5">

            {/* Avatar Pill */}

            <div className="relative">

              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1E293B] to-[#0F172A] border-2 border-[#059669]/40 flex items-center justify-center text-emerald-400 font-bold font-mono text-2xl shadow-xl shadow-emerald-950/20">

                {initials}

              </div>

              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0F1011] ring-2 ring-emerald-500/30" />

            </div>



            {/* Identity Details */}

            <div className="space-y-1">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">

                  {user?.name || 'Vatsal Vadgama'}

                </h1>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#059669]/15 text-emerald-400 border border-[#059669]/30 uppercase tracking-wider">

                  {user?.role === 'org_admin' ? 'Organization Admin' : (user?.role || 'Operator')}

                </span>

              </div>

              <p className="text-xs sm:text-sm text-zinc-400 font-mono">

                {user?.email || 'vatsalvadgama02@gmail.com'}

              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-400">

                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">

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

              className="mt-6 pt-5 border-t border-[#23252A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090A0C]/60 p-4 rounded-xl border border-zinc-800"

            >

              <div className="flex-1">

                <label className="text-xs text-zinc-400 block mb-1">Organization Display Name</label>

                <input

                  type="text"

                  value={newOrgName}

                  onChange={(e) => setNewOrgName(e.target.value)}

                  placeholder="Enter organization name"

                  className="input-linear text-sm py-1.5 px-3 h-9 w-full sm:max-w-md text-white font-medium"

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



      {/* ── Tabbed Section Navigation ── */}

      <div className="flex items-center gap-1 p-1 bg-[#0F1011] border border-[#23252A] rounded-xl overflow-x-auto no-scrollbar">

        {[

          { id: 'organization', label: 'Organization & Team', shortLabel: 'Team', icon: Users },

          { id: 'notifications', label: 'Alerts & Notifications', shortLabel: 'Alerts', icon: Bell },

          { id: 'infrastructure', label: 'System Infrastructure', shortLabel: 'System', icon: Server },

        ].map(tab => {

          const Icon = tab.icon;

          const active = activeTab === tab.id;

          return (

            <button

              key={tab.id}

              onClick={() => setActiveTab(tab.id)}

              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${

                active

                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-950/20'

                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'

              }`}

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

            <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-2">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Enrolled Personnel</span>

                <Users size={16} className="text-emerald-400" />

              </div>

              <div className="stat-number text-lg sm:text-2xl text-white">

                {stats?.total_people || 0}

              </div>

              <p className="text-[11px] text-zinc-500">Active biometric profiles</p>

            </div>



            <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-2">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Reference Photos</span>

                <ImageIcon size={16} className="text-emerald-400" />

              </div>

              <div className="stat-number text-lg sm:text-2xl text-white">

                {stats?.total_photos || 0}

              </div>

              <p className="text-[11px] text-zinc-500">Multi-angle vector frames</p>

            </div>



            <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-2">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Access Status</span>

                <ShieldCheck size={16} className="text-emerald-400" />

              </div>

              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">

                Verified

              </div>

              <p className="text-[11px] text-zinc-500">Autonomous kiosk active</p>

            </div>



            <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-2">

              <div className="flex items-center justify-between text-zinc-400 text-xs">

                <span>Deployment</span>

                <Server size={16} className="text-indigo-400" />

              </div>

              <div className="text-lg font-bold text-white font-mono mt-1">

                Local Sovereign

              </div>

              <p className="text-[11px] text-zinc-500">Zero cloud leakage</p>

            </div>

          </div>



          {/* Genuine Enrolled Team Members Roster */}

          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] overflow-hidden">

            <div className="p-5 border-b border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>

                <h3 className="text-sm font-semibold text-white flex items-center gap-2">

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
                      className="p-3 rounded-xl border border-[#23252A] bg-[#0A0B0D] hover:border-[#34343A] transition-all flex items-center justify-between gap-2.5"
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

          <div data-tour="org-settings" className="card-linear p-0 bg-[#0F1011] border-[#23252A]">

            <div className="p-5 border-b border-[#23252A]">

              <h3 className="text-sm font-semibold text-white">Organization Parameters</h3>

              <p className="text-xs text-zinc-400 mt-0.5">Workspace routing and governance parameters.</p>

            </div>

            <div className="p-5 space-y-4 text-xs">

              <div className="flex items-center justify-between py-1 border-b border-[#23252A]/50 pb-3">

                <span className="text-zinc-400 font-medium">Tenant Display Name</span>

                <span className="text-white font-semibold font-mono">{user?.org_name || 'RMC'}</span>

              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#23252A]/50 pb-3">

                <span className="text-zinc-400 font-medium">Organization UUID</span>

                <span className="font-mono text-zinc-300 text-[10px] sm:text-[11px] bg-black/40 px-2 py-0.5 rounded border border-[#23252A] break-all max-w-[180px] sm:max-w-none text-right">

                  {user?.org_id || 'default-org-local'}

                </span>

              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#23252A]/50 pb-3">

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



      {/* ── TAB 2: Notifications & Security ── */}

      {activeTab === 'notifications' && (

        <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] space-y-6">

          <div className="p-5 border-b border-[#23252A]">

            <h3 className="text-sm font-semibold text-white flex items-center gap-2">

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

              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]">

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

                    notifPrefs?.[item.key] ? 'bg-[#059669]' : 'bg-[#23252A]'

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



            <div className="pt-4 border-t border-[#23252A]">

              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Notification Dispatch Channels</h4>

              <div className="space-y-3">

                {[

                  { key: 'channel_email', label: 'Email Dispatch', desc: `Send alerts directly to ${user?.email || 'admin email'}` },

                  { key: 'channel_webhook', label: 'Webhook Integration (Slack / MS Teams)', desc: 'Post JSON telemetry payloads to an internal enterprise webhook URL' },

                ].map(item => (

                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]">

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

                        notifPrefs?.[item.key] ? 'bg-[#059669]' : 'bg-[#23252A]'

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

          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">

            <div className="p-5 border-b border-[#23252A]">

              <h3 className="text-sm font-semibold text-white flex items-center gap-2">

                <Cpu size={16} className="text-emerald-400" />

                <span>Runtime Environment & AI Engines</span>

              </h3>

            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">

              <div className="p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]">

                <div className="flex items-center gap-2 text-zinc-400 mb-1">

                  <Server size={14} className="text-emerald-400" />

                  <span>Deployment Mode</span>

                </div>

                <div className="font-semibold text-white font-mono text-sm">

                  {user?.org_id ? 'Multi-Tenant (DB)' : 'Single-Tenant (Local)'}

                </div>

              </div>



              <div className="p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]">

                <div className="flex items-center gap-2 text-zinc-400 mb-1">

                  <Database size={14} className="text-emerald-400" />

                  <span>Storage Engine</span>

                </div>

                <div className="font-semibold text-white font-mono text-sm">

                  Local File System + SQLite

                </div>

              </div>



              <div className="p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]">

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

            <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">

              <div className="p-5 border-b border-[#23252A] flex items-center justify-between">

                <div>

                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">

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

                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A] text-xs">

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

                <div className="pt-3 border-t border-[#23252A]">

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

