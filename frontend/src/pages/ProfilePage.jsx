import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, Building, Cpu, Database, Server, BarChart3, Image as ImageIcon, RefreshCw, Download, Upload, RotateCcw, CheckCircle, AlertTriangle, Info, Package, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';

const ADMIN_ROLES = ['org_admin', 'platform_owner'];

export default function ProfilePage() {
  const { user, apiClient } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sysInfo, setSysInfo] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null); // result of check-update
  const [updateLoading, setUpdateLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const fileInputRef = useRef(null);
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState(null);

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
        const res = await apiClient.get(`${API_BASE}/dashboard`);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats for profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    // Fetch system info
    const fetchSysInfo = async () => {
      try {
        const res = await apiClient.get(`${API_BASE}/system/info`);
        setSysInfo(res.data);
      } catch (err) {
        // System info may not be available in single-tenant mode
      }
    };
    fetchSysInfo();

    // Fetch notification preferences
    const fetchNotifPrefs = async () => {
      try {
        const res = await apiClient.get(`${API_BASE}/notifications/preferences`);
        setNotifPrefs(res.data);
      } catch (err) {
        // May not be available in single-tenant mode
      }
    };
    fetchNotifPrefs();
  }, [apiClient]);

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="pb-12 max-w-4xl mx-auto space-y-6 page-container"
    >
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">User Profile</h1>
        <p className="mt-1 text-caption text-ink-subtle">Manage your identity, settings, and organization parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="card-linear md:col-span-1 flex flex-col items-center text-center justify-center p-6 bg-[#0F1011] border-[#23252A]">
          <div className="w-20 h-20 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#828FFF] mb-4">
            <User className="w-10 h-10" />
          </div>
          
          <h2 className="text-body font-medium text-ink font-mono">{user?.name || 'Local Operator'}</h2>
          <p className="text-[11px] text-ink-tertiary mb-4">{user?.email || 'local@admin'}</p>
          
          <span className="px-2.5 py-0.5 rounded-full bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 uppercase tracking-widest font-mono text-[9px] font-semibold">
            {user?.role || 'Admin'}
          </span>
        </div>

        {/* Detailed Stats & Metadata */}
        <div className="md:col-span-2 space-y-6">
          
          {/* User Details */}
          <div data-tour="org-settings" className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
            <div className="py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
              <h3 className="text-body font-medium text-ink">Account Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
                <span className="font-mono text-ink">{user?.email || 'local@admin'}</span>
              </div>
              
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Shield className="w-4 h-4" />
                  <span>Access Level / Role</span>
                </div>
                <span className="text-ink capitalize">{user?.role || 'administrator'}</span>
              </div>
              
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Building className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                {editingOrg ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="input-linear text-caption py-1 px-2 h-7 w-44 text-ink"
                      placeholder="Organization name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveOrgName}
                      disabled={savingOrg}
                      className="button-primary text-[11px] py-0.5 px-2.5 h-7"
                    >
                      {savingOrg ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingOrg(false)}
                      disabled={savingOrg}
                      className="button-secondary text-[11px] py-0.5 px-2 h-7"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-ink font-medium">{user?.org_name || 'System Local'}</span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setNewOrgName(user?.org_name || '');
                          setEditingOrg(true);
                        }}
                        className="text-ink-subtle hover:text-[#828FFF] text-[11px] underline ml-1 cursor-pointer transition-colors"
                      >
                        Rename
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-[#23252A] flex justify-end">
                  <button
                    onClick={async () => {
                      sessionStorage.removeItem('onboarding_paused');
                      sessionStorage.removeItem('welcome_shown');
                      try {
                        await apiClient.post(`${API_BASE}/onboarding/state`, {
                          onboarding_state: { step: 0, completed: false }
                        });
                      } catch (err) {}
                      window.location.href = '/profile';
                    }}
                    className="button-secondary text-caption flex items-center gap-1.5 py-1 px-3"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay Setup Tour</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure context */}
          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
            <div className="py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
              <h3 className="text-body font-medium text-ink">System Environment</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Server className="w-4 h-4" />
                  <span>Deployment Mode</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 font-mono text-[10px]">
                  {user?.org_id ? 'Multi-Tenant (DB)' : 'Single-Tenant (Local)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Database className="w-4 h-4" />
                  <span>Storage Engine</span>
                </div>
                <span className="text-ink font-mono text-xs">Local File System</span>
              </div>

              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Cpu className="w-4 h-4" />
                  <span>Face Recognition Core</span>
                </div>
                <span className="text-ink font-mono text-xs">GhostFaceNet</span>
              </div>
            </div>
          </div>

          {/* Statistics summary */}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="card-linear p-5 flex items-center gap-3 bg-[#0F1011] border-[#23252A]">
                <div className="p-2.5 rounded-lg bg-[#010102] text-ink-subtle border border-[#23252A]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">Registered Persons</div>
                  <div className="text-lg font-mono font-medium text-ink mt-0.5">{stats.total_people}</div>
                </div>
              </div>

              <div className="card-linear p-5 flex items-center gap-3 bg-[#0F1011] border-[#23252A]">
                <div className="p-2.5 rounded-lg bg-[#010102] text-ink-subtle border border-[#23252A]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">Total Photo Samples</div>
                  <div className="text-lg font-mono font-medium text-ink mt-0.5">{stats.total_photos}</div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Preferences Card */}
          {notifPrefs && (
            <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
              <div className="p-4 border-b border-[#23252A] flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <span className="text-sm font-semibold text-ink">Notification Preferences</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { key: 'unknown_face_alert', label: 'Unknown Face Alerts', desc: 'Alert when unrecognized faces are detected' },
                  { key: 'camera_offline_alert', label: 'Camera Offline Alerts', desc: 'Alert when a camera goes offline' },
                  { key: 'model_stale_alert', label: 'Model Training Reminders', desc: 'Remind when model needs retraining' },
                  { key: 'db_unreachable_alert', label: 'Database Alerts', desc: 'Alert when database connection is lost' },
                  { key: 'daily_summary', label: 'Daily Attendance Summary', desc: 'Receive daily attendance report email' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-sm text-ink">{item.label}</div>
                      <div className="text-xs text-ink-subtle">{item.desc}</div>
                    </div>
                    <button
                      onClick={async () => {
                        const updated = { ...notifPrefs, [item.key]: !notifPrefs[item.key] };
                        setNotifPrefs(updated);
                        try {
                          await apiClient.post(`${API_BASE}/notifications/preferences`, updated);
                        } catch (err) {
                          setNotifPrefs(notifPrefs); // rollback
                        }
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        notifPrefs[item.key] ? 'bg-primary' : 'bg-[#333]'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}

                <div className="border-t border-[#23252A] pt-3 mt-3">
                  <div className="text-xs text-ink-subtle font-semibold uppercase mb-2">Delivery Channels</div>
                  {[
                    { key: 'channel_email', label: 'Email', desc: 'Receive alerts via email' },
                    { key: 'channel_webhook', label: 'Webhook (Slack/Teams)', desc: 'Send alerts to a webhook URL' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-sm text-ink">{item.label}</div>
                        <div className="text-xs text-ink-subtle">{item.desc}</div>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = { ...notifPrefs, [item.key]: !notifPrefs[item.key] };
                          setNotifPrefs(updated);
                          try {
                            await apiClient.post(`${API_BASE}/notifications/preferences`, updated);
                          } catch (err) {
                            setNotifPrefs(notifPrefs);
                          }
                        }}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifPrefs[item.key] ? 'bg-primary' : 'bg-[#333]'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Updates Card — visible to org_admin+ only */}
          {isAdmin && (
            <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
              <div className="py-4 px-6 border-b border-[#23252A] bg-[#0F1011] flex items-center justify-between">
                <h3 className="text-body font-medium text-ink flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  System Updates
                </h3>
                {sysInfo?.app_version && (
                  <span className="px-2 py-0.5 rounded-full bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 font-mono text-[10px]">
                    v{sysInfo.app_version}
                  </span>
                )}
              </div>
              <div className="p-6 space-y-4">
                {/* Current version + last check */}
                <div className="flex items-center justify-between text-caption">
                  <div className="flex items-center gap-2 text-ink-subtle">
                    <Info className="w-4 h-4" />
                    <span>Last Checked</span>
                  </div>
                  <span className="text-ink font-mono text-xs">
                    {sysInfo?.last_update_checked_at
                      ? new Date(sysInfo.last_update_checked_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>

                {/* Update available badge */}
                {updateStatus?.status === 'update_available' && (
                  <div className={`p-3 rounded-lg border ${
                    updateStatus.severity === 'critical'
                      ? 'bg-red-500/5 border-red-500/20 text-red-400'
                      : updateStatus.severity === 'recommended'
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                        : 'bg-[#5E6AD2]/5 border-[#5E6AD2]/20 text-[#828FFF]'
                  }`}>
                    <div className="flex items-center gap-2 text-caption font-medium mb-1">
                      {updateStatus.severity === 'critical'
                        ? <AlertTriangle className="w-4 h-4" />
                        : <Info className="w-4 h-4" />}
                      <span className="uppercase tracking-wider text-[10px]">
                        {updateStatus.severity} update available — v{updateStatus.latest_version}
                      </span>
                    </div>
                    {updateStatus.changelog && (
                      <p className="text-[11px] text-ink-subtle mt-1 whitespace-pre-line">{updateStatus.changelog}</p>
                    )}
                  </div>
                )}

                {updateStatus?.status === 'up_to_date' && (
                  <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-caption">
                    <CheckCircle className="w-4 h-4" />
                    <span>You're on the latest version</span>
                  </div>
                )}

                {/* Status message */}
                {updateMessage && (
                  <div className="p-3 rounded-lg border bg-[#5E6AD2]/5 border-[#5E6AD2]/20 text-[#828FFF] text-[11px] font-mono">
                    {updateMessage}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
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
                      } catch (err) {
                        setUpdateMessage(`Check failed: ${err?.response?.data?.error || err.message}`);
                      } finally {
                        setUpdateLoading(false);
                      }
                    }}
                    disabled={updateLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 hover:bg-[#5E6AD2]/20 transition-colors text-[11px] font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${updateLoading ? 'animate-spin' : ''}`} />
                    {updateLoading ? 'Checking...' : 'Check for Updates'}
                  </button>

                  {updateStatus?.status === 'update_available' && updateStatus?.download_url && (
                    <button
                      onClick={async () => {
                        setApplyLoading(true);
                        setUpdateMessage('Downloading update...');
                        try {
                          await apiClient.post(`${API_BASE}/system/download-update`, {
                            download_url: updateStatus.download_url,
                            checksum: updateStatus.checksum,
                            signature: updateStatus.signature,
                          });
                          setUpdateMessage('Download complete. Applying update...');
                          const applyRes = await apiClient.post(`${API_BASE}/system/apply-update`, {
                            checksum: updateStatus.checksum,
                            signature: updateStatus.signature,
                          });
                          setUpdateMessage(applyRes.data.message || 'Update applied. Server restarting...');
                        } catch (err) {
                          setUpdateMessage(`Update failed: ${err?.response?.data?.error || err.message}`);
                        } finally {
                          setApplyLoading(false);
                        }
                      }}
                      disabled={applyLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-[11px] font-medium disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 ${applyLoading ? 'animate-bounce' : ''}`} />
                      {applyLoading ? 'Applying...' : 'Download & Apply'}
                    </button>
                  )}

                  {sysInfo?.has_backup && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to rollback to the previous version?')) return;
                        setRollbackLoading(true);
                        setUpdateMessage('Rolling back...');
                        try {
                          const res = await apiClient.post(`${API_BASE}/system/rollback`);
                          setUpdateMessage(res.data.message || 'Rollback complete. Server restarting...');
                        } catch (err) {
                          setUpdateMessage(`Rollback failed: ${err?.response?.data?.error || err.message}`);
                        } finally {
                          setRollbackLoading(false);
                        }
                      }}
                      disabled={rollbackLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-[11px] font-medium disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${rollbackLoading ? 'animate-spin' : ''}`} />
                      {rollbackLoading ? 'Rolling back...' : 'Rollback'}
                    </button>
                  )}
                </div>

                {/* Offline upload section */}
                <div className="pt-3 border-t border-[#23252A]">
                  <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold mb-2">
                    Offline / Air-Gapped Update
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".tar.gz"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadLoading(true);
                        setUpdateMessage('Uploading package...');
                        try {
                          const formData = new FormData();
                          formData.append('package', file);
                          const res = await apiClient.post(`${API_BASE}/system/upload-update`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 120000,
                          });
                          setUpdateMessage(res.data.message || 'Update applied. Server restarting...');
                        } catch (err) {
                          setUpdateMessage(`Upload failed: ${err?.response?.data?.error || err.message}`);
                        } finally {
                          setUploadLoading(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1011] text-ink-subtle border border-[#23252A] hover:bg-[#1A1B1E] transition-colors text-[11px] font-medium disabled:opacity-50"
                    >
                      <Upload className={`w-3.5 h-3.5 ${uploadLoading ? 'animate-pulse' : ''}`} />
                      {uploadLoading ? 'Uploading...' : 'Upload Package (.tar.gz)'}
                    </button>
                  </div>
                  <p className="text-[10px] text-ink-tertiary mt-1.5">
                    For air-gapped installs — download the package from your admin portal, then upload here.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
