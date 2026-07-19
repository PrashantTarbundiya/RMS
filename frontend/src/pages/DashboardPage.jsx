import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Image as ImageIcon, BarChart3, Clock, CheckCircle, 
  AlertTriangle, Trash2, Edit2, Check, X, RefreshCw 
} from 'lucide-react';
import { API_BASE } from '../config';
import ApertureReticle from '../components/ApertureReticle';

export default function DashboardPage() {
  const { apiClient } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingPerson, setEditingPerson] = useState(null);
  const [newName, setNewName] = useState('');
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [statsRes, historyRes] = await Promise.all([
        apiClient.get(`${API_BASE}/dashboard`),
        apiClient.get(`${API_BASE}/history`)
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Ensure the system is online.');
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
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (name) => {
    setIsActionLoading(true);
    try {
      await apiClient.delete(`${API_BASE}/persons/${name}`);
      setDeletingPerson(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeClearHistory = async () => {
    try {
      await apiClient.delete(`${API_BASE}/history`);
      setHistory([]);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearHistoryModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-subtle">
        <ApertureReticle active={true} className="w-10 h-10 flex items-center justify-center" status="loading" />
        <p className="mt-4 text-mono text-caption uppercase tracking-wider">Loading System Data...</p>
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
          <h1 className="text-headline text-ink font-semibold">System Dashboard</h1>
          <p className="text-ink-subtle text-caption mt-1">Real-time telemetry and management console.</p>
        </div>
        <button className="button-secondary flex items-center gap-2" onClick={() => { setLoading(true); fetchDashboardData(); }}>
          <RefreshCw className="h-4 w-4" />
          <span className="text-button">Refresh</span>
        </button>
      </motion.div>

      {/* System Status Line (Calm) */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-6 p-4 bg-[#0F1011] border border-[#23252A] rounded-lg items-center text-caption text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="text-ink-subtle">Status:</span> 
          {requires_retrain ? (
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Retraining Required
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Operational
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ink-subtle">DeepFace:</span>
          {models_loaded.deepface ? <span className="text-emerald-500 font-medium">Loaded</span> : <span className="text-ink-tertiary">Offline</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ink-subtle">SOTA:</span>
          {models_loaded.sota ? <span className="text-emerald-500 font-medium">Loaded</span> : <span className="text-ink-tertiary">Offline</span>}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="h-5 w-5"/>} label="Total Enrolled" value={total_people} />
        <KpiCard icon={<ImageIcon className="h-5 w-5"/>} label="Faces Processed" value={total_photos} />
        <KpiCard icon={<Clock className="h-5 w-5"/>} label="Scan Events" value={total_predictions} />
        <KpiCard icon={<CheckCircle className="h-5 w-5"/>} label="Accuracy Rate" value={`${successRate}%`} highlight={true} />
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
                                <button className="button-secondary h-8 w-8 p-0 flex items-center justify-center" onClick={() => handleRename(name)} disabled={isActionLoading}><Check className="h-4 w-4 text-[#27A644]"/></button>
                                <button className="button-secondary h-8 w-8 p-0 flex items-center justify-center" onClick={() => setEditingPerson(null)}><X className="h-4 w-4 text-[#F87171]"/></button>
                              </div>
                            ) : (
                              <span>{name}</span>
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
                                <button className="button-secondary h-8 w-8 p-0 flex items-center justify-center text-ink-subtle hover:text-ink" onClick={() => { setEditingPerson(name); setNewName(name); }}>
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button className="button-secondary h-8 w-8 p-0 flex items-center justify-center text-[#F87171] hover:bg-[#F87171]/10 hover:border-[#F87171]/30" onClick={() => setDeletingPerson(name)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010102]/80 backdrop-blur-sm">
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
          <div className={`text-headline text-mono font-medium mt-1 ${highlight ? 'text-[#828FFF]' : 'text-ink'}`}>{value}</div>
        </div>
      </div>
    </ApertureReticle>
  );
}
