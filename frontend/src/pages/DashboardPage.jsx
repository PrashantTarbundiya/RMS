import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Image as ImageIcon, BarChart3, Clock, CheckCircle, 
  AlertTriangle, Trash2, Edit2, Check, X, RefreshCw, User, Compass, ArrowRight, Upload, Video, Activity 
} from 'lucide-react';
import { API_BASE } from '../config';
import ApertureReticle from '../components/ApertureReticle';
import { formatPersonName } from '../utils/format';

export default function DashboardPage() {
  const { user, apiClient } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem('rms_cached_stats');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [history, setHistory] = useState(() => {
    try {
      const cached = sessionStorage.getItem('rms_cached_history');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(!stats);
  const [error, setError] = useState('');
  const [dismissChecklist, setDismissChecklist] = useState(() => localStorage.getItem('rms_onboarding_dismissed') === 'true');
  
  const [editingPerson, setEditingPerson] = useState(null);
  const [newName, setNewName] = useState('');
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.allSettled([
        apiClient.get(`${API_BASE}/dashboard`),
        apiClient.get(`${API_BASE}/history`)
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
        setError('');
        try {
          sessionStorage.setItem('rms_cached_stats', JSON.stringify(statsRes.value.data));
        } catch {}
      }

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data);
        try {
          sessionStorage.setItem('rms_cached_history', JSON.stringify(historyRes.value.data));
        } catch {}
      }

      if (statsRes.status === 'rejected') {
        const err = statsRes.reason;
        console.warn('Dashboard fetch warning:', err);
        if (!stats) {
          const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
          setError(
            isTimeout
              ? 'Cloud backend is warming up. Syncing dashboard data...'
              : 'Connecting to biometric engine. Retrying...'
          );
        }
      }
    } catch (err) {
      console.error(err);
      if (!stats) {
        setError('Connecting to backend services...');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRename = async (oldName) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingPerson(null);
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.put(`${API_BASE}/persons/${oldName}`, { new_name: newName.trim() });
      setEditingPerson(null);
      toast.success(`Renamed "${formatPersonName(oldName)}" to "${formatPersonName(newName.trim())}"`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rename person.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (name) => {
    setIsActionLoading(true);
    try {
      await apiClient.delete(`${API_BASE}/persons/${name}`);
      setDeletingPerson(null);
      toast.success(`"${formatPersonName(name)}" has been removed from the roster.`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete person.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeClearHistory = async () => {
    try {
      await apiClient.delete(`${API_BASE}/history`);
      setHistory([]);
      toast.success('Telemetry logs cleared successfully.');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to clear history.');
    } finally {
      setIsClearHistoryModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container pb-12 space-y-6">
        {/* Header Shimmer */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-48 h-6 shimmer" />
            <div className="w-64 h-3.5 shimmer" />
          </div>
          <div className="w-24 h-9 shimmer" />
        </div>

        {/* KPI Grid Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-linear space-y-3 p-6">
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 shimmer" />
                <div className="w-5 h-5 rounded-full shimmer" />
              </div>
              <div className="w-16 h-7 shimmer" />
            </div>
          ))}
        </div>

        {/* Roster & Telemetry Shimmer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Roster Card */}
          <div className="card-linear p-0 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#23252A]">
              <div className="w-32 h-5 shimmer" />
              <div className="w-32 h-9 shimmer" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-[#23252A]/50">
                  <div className="w-36 h-4 shimmer" />
                  <div className="w-16 h-4 shimmer" />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded shimmer" />
                    <div className="w-8 h-8 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="card-linear p-0 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#23252A]">
              <div className="w-32 h-5 shimmer" />
              <div className="w-20 h-8 shimmer" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-[#23252A]/50">
                  <div className="w-24 h-4 shimmer" />
                  <div className="w-48 h-4 shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (error || !stats) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="card-linear border-[#F87171]/20 bg-[#F87171]/5 text-center p-8">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-[#F87171]" />
          <h2 className="text-card-title text-[#F87171] mb-2">System Offline</h2>
          <p className="text-caption text-ink-subtle mb-6">{error}</p>
          <button className="button-secondary text-ink hover:text-white" onClick={() => { setLoading(true); fetchDashboardData(); }}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { total_people, total_photos, photos_per_person, requires_retrain, models_loaded, history_stats } = stats;
  const { total_predictions, success_count, error_count } = history_stats;
  const successRate = total_predictions > 0 ? Math.round((success_count / total_predictions) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="page-container pb-12 space-y-6">
      
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-headline text-ink font-semibold">
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'System Dashboard'}
          </h1>
          <p className="text-ink-subtle text-caption mt-1">Real-time telemetry and management console.</p>
        </div>
        <button className="button-secondary flex items-center gap-2" onClick={() => { setLoading(true); fetchDashboardData(); }}>
          <RefreshCw className="h-4 w-4" />
          <span className="text-button">Refresh</span>
        </button>
      </motion.div>

      {/* Resumable Onboarding Checklist Card */}
      {user?.role && ['org_admin', 'platform_owner'].includes(user.role) && 
       localStorage.getItem('rms_onboarding_completed') !== 'true' &&
       user?.onboarding_state?.completed !== true && 
       !dismissChecklist && (
        <motion.div 
          variants={itemVariants} 
          className="p-5 bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-lg flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#2563EB]/20 text-[#3B82F6]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-body font-semibold text-ink">
                Setup Checklist (Step {Math.min(parseInt(localStorage.getItem('rms_onboarding_step') ?? (user?.onboarding_state?.step ?? 0), 10) + 1, 5)} of 5)
              </h3>
              <p className="text-caption text-ink-subtle mt-0.5">
                Resume your guided organization setup whenever you're ready.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                sessionStorage.removeItem('onboarding_paused');
                localStorage.removeItem('rms_onboarding_dismissed');
                sessionStorage.setItem('welcome_shown', 'true');
                const STEP_PATHS = ['/profile', '/cameras', '/upload', '/test', '/dashboard'];
                const savedStep = parseInt(localStorage.getItem('rms_onboarding_step') ?? (user?.onboarding_state?.step ?? 0), 10);
                const currentStep = Math.min(Math.max(savedStep, 0), STEP_PATHS.length - 1);
                const targetPath = STEP_PATHS[currentStep];
                navigate(targetPath);
                window.dispatchEvent(new CustomEvent('rms:start-onboarding', { detail: { step: currentStep } }));
              }}
              className="button-primary text-caption py-1.5 px-3 text-white flex items-center gap-1.5"
            >
              <span>Resume Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => {
                setDismissChecklist(true);
                localStorage.setItem('rms_onboarding_dismissed', 'true');
              }}
              className="p-1 text-ink-tertiary hover:text-ink text-xs"
              title="Dismiss for this browser"
            >
              <X className="w-4 h-4 text-ink-tertiary hover:text-ink" />
            </button>
          </div>
        </motion.div>
      )}

      {/* System Status Line (Calm) */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-6 p-4 bg-[#0F1011] border border-[#23252A] rounded-lg items-center text-caption text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="text-ink-subtle">Status:</span> 
          {requires_retrain ? (
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Retraining Required
              <Link to="/training" className="underline text-xs ml-1 text-amber-400 hover:text-amber-300">Retrain</Link>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Operational
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ink-subtle">Facenet512:</span>
          {models_loaded.deepface ? <span className="text-emerald-500 font-medium">Loaded</span> : <span className="text-ink-tertiary">Offline</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ink-subtle">InsightFace:</span>
          {models_loaded.insightface ? <span className="text-emerald-500 font-medium">Loaded</span> : <span className="text-ink-tertiary">Offline</span>}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div data-tour="today-summary" variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="h-5 w-5"/>} label="Total Enrolled" value={total_people} />
        <KpiCard icon={<ImageIcon className="h-5 w-5"/>} label="Faces Processed" value={total_photos} />
        <KpiCard icon={<Clock className="h-5 w-5"/>} label="Scan Events" value={total_predictions} />
        <KpiCard icon={<CheckCircle className="h-5 w-5"/>} label="Hard Match Rate" value={`${successRate}%`} highlight={true} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/upload" className="group p-4 bg-[#0F1011] border border-[#23252A] rounded-lg flex items-center gap-3 hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5 transition-all">
          <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#60A5FA] group-hover:bg-[#2563EB]/20 transition-colors"><Upload size={18} /></div>
          <div>
            <div className="text-sm font-medium text-ink">Enroll Person</div>
            <div className="text-[11px] text-ink-tertiary">Add a new face to the system</div>
          </div>
          <ArrowRight size={14} className="ml-auto text-ink-tertiary group-hover:text-[#60A5FA] transition-colors" />
        </Link>
        <Link to="/test" className="group p-4 bg-[#0F1011] border border-[#23252A] rounded-lg flex items-center gap-3 hover:border-[#27A644]/40 hover:bg-[#27A644]/5 transition-all">
          <div className="p-2 rounded-lg bg-[#27A644]/10 text-[#4ade80] group-hover:bg-[#27A644]/20 transition-colors"><Video size={18} /></div>
          <div>
            <div className="text-sm font-medium text-ink">Run Test</div>
            <div className="text-[11px] text-ink-tertiary">Test recognition accuracy</div>
          </div>
          <ArrowRight size={14} className="ml-auto text-ink-tertiary group-hover:text-[#4ade80] transition-colors" />
        </Link>
        <Link to="/analytics" className="group p-4 bg-[#0F1011] border border-[#23252A] rounded-lg flex items-center gap-3 hover:border-[#FBBF24]/40 hover:bg-[#FBBF24]/5 transition-all">
          <div className="p-2 rounded-lg bg-[#FBBF24]/10 text-[#fde68a] group-hover:bg-[#FBBF24]/20 transition-colors"><BarChart3 size={18} /></div>
          <div>
            <div className="text-sm font-medium text-ink">View Analytics</div>
            <div className="text-[11px] text-ink-tertiary">Attendance trends & reports</div>
          </div>
          <ArrowRight size={14} className="ml-auto text-ink-tertiary group-hover:text-[#fde68a] transition-colors" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Person Management Table */}
        <div className="card-linear p-0 overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-6 border-b border-[#23252A] gap-3 bg-[#0F1011]">
            <h3 className="text-body font-medium text-ink">Enrollment Roster</h3>
            <div className="flex items-center gap-2">
              <input 
                placeholder="Search roster..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="input-linear h-8 w-44 text-caption placeholder:text-ink-tertiary"
              />
              <Link to="/upload" className="button-primary h-8 py-0 flex items-center justify-center">
                <span className="text-button text-white">Add Person</span>
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px] relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#23252A] bg-[#141516]/50">
                  <th className="py-3 px-6 text-caption text-ink-subtle font-medium">Identifier</th>
                  <th className="py-3 px-6 text-caption text-ink-subtle font-medium">Samples</th>
                  <th className="py-3 px-6 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(photos_per_person).filter(name => name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-caption text-ink-tertiary">
                      {Object.keys(photos_per_person).length === 0 ? "No personnel enrolled." : "No matching personnel found."}
                    </td>
                  </tr>
                ) : (
                  Object.keys(photos_per_person)
                    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(name => {
                      const isEditing = editingPerson === name;
                      const isDeleting = deletingPerson === name;
                      
                      return (
                        <tr key={name} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30 transition-colors">
                          <td className="py-3 px-6 text-mono text-ink">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  value={newName} 
                                  onChange={e => setNewName(e.target.value.replace(/\s+/g, '_'))}
                                  className="input-linear h-8 py-1 px-2 text-caption"
                                  autoFocus
                                />
                                <button className="button-icon" onClick={() => handleRename(name)} disabled={isActionLoading}><Check className="h-4 w-4 text-[#27A644]"/></button>
                                <button className="button-icon" onClick={() => setEditingPerson(null)}><X className="h-4 w-4 text-[#F87171]"/></button>
                              </div>
                            ) : (
                              <Link 
                                to={`/persons/edit/${name}`} 
                                className="hover:text-[#60A5FA] hover:underline transition-all font-medium"
                                title="Manage Biometric Profile"
                              >
                                {formatPersonName(name)}
                              </Link>
                            )}
                          </td>
                          <td className="py-3 px-6 text-caption text-ink-muted">
                            {photos_per_person[name]} files
                          </td>
                          <td className="py-3 px-6 text-right">
                            {isDeleting ? (
                               <div className="inline-flex items-center gap-2">
                                 <span className="text-[#F87171] text-caption font-medium">Purge profile?</span>
                                 <button className="button-primary bg-[#F87171] hover:bg-red-600 text-white h-7 py-0 px-3 text-caption" onClick={() => handleDelete(name)} disabled={isActionLoading}>Purge</button>
                                 <button className="button-secondary h-7 py-0 px-3 text-caption" onClick={() => setDeletingPerson(null)}>Cancel</button>
                               </div>
                            ) : (
                               <div className="inline-flex gap-1.5">
                                 <Link to={`/persons/edit/${name}`} className="button-icon text-ink-subtle hover:text-[#60A5FA]" title="Manage Profile">
                                   <User className="h-4 w-4" />
                                 </Link>
                                 <button className="button-icon text-ink-subtle hover:text-ink" onClick={() => { setEditingPerson(name); setNewName(name); }} title="Rename Inline">
                                   <Edit2 className="h-4 w-4" />
                                 </button>
                                 <button className="button-icon text-[#F87171] hover:bg-[#F87171]/10 hover:border-[#F87171]/30" onClick={() => setDeletingPerson(name)} title="Purge Roster Profile">
                                   <Trash2 className="h-4 w-4" />
                                 </button>
                               </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Telemetry */}
        <div className="card-linear p-0 overflow-hidden flex flex-col">
          <div className="flex flex-row items-center justify-between py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
            <h3 className="text-body font-medium text-ink">Recent Activity</h3>
            {history.length > 0 && (
              <button 
                onClick={() => setIsClearHistoryModalOpen(true)}
                className="button-secondary h-8 py-0 text-caption text-ink-subtle hover:text-ink"
              >
                Clear Log
              </button>
            )}
          </div>
          <div className="overflow-x-auto max-h-[400px] relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#23252A] bg-[#141516]/50">
                  <th className="py-3 px-6 text-caption text-ink-subtle font-medium">Timestamp</th>
                  <th className="py-3 px-6 text-caption text-ink-subtle font-medium">Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((entry, idx) => (
                  <tr key={idx} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30 transition-colors">
                    <td className="py-3 px-6 text-mono text-caption text-ink-tertiary whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        {entry.status === 'error' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium font-mono uppercase tracking-wider bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20">
                            NOT FOUND
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium font-mono uppercase tracking-wider bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20">
                            CONFIRMED
                          </span>
                        )}
                        <span className="text-mono text-caption text-ink-muted">{entry.label}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center py-12 text-caption text-ink-tertiary">
                      No recent scan history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#010102]/80 backdrop-blur-sm">
          <div className="w-full max-w-sm card-linear bg-[#191A1B] border-[#23252A] p-6 space-y-4">
            <div>
              <h4 className="text-body font-semibold text-ink">Clear Telemetry Logs</h4>
              <p className="text-caption text-ink-subtle mt-1">
                Are you sure you want to purge all recognition telemetry logs? This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsClearHistoryModalOpen(false)}
                className="button-secondary text-caption py-1 px-3"
              >
                Cancel
              </button>
              <button 
                onClick={executeClearHistory}
                className="button-primary bg-[#F87171] hover:bg-red-600 text-white text-caption py-1 px-3"
              >
                Purge All
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}

function KpiCard({ icon, label, value, highlight = false }) {
  return (
    <ApertureReticle active={true} className="w-full" status="default">
      <div className="bg-[#0F1011] border border-[#23252A] rounded-lg p-5 flex items-start gap-4 h-full">
        <div className="text-ink-tertiary mt-1 shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-caption text-ink-subtle uppercase tracking-wider font-medium">{label}</div>
          <div className={`text-headline text-mono font-medium mt-1 ${highlight ? 'text-[#60A5FA]' : 'text-ink'}`}>{value}</div>
        </div>
      </div>
    </ApertureReticle>
  );
}
