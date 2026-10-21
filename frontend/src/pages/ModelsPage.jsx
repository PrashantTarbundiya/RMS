import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Download, Trash2, Box, Cpu, AlertTriangle, Settings, Save, CheckCircle, Info, Archive, Upload, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';


export default function ModelsPage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [config, setConfig] = useState(null);
  const [threshold, setThreshold] = useState(0.35);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [enableFacenet512, setEnableFacenet512] = useState(() => {
    return localStorage.getItem('enableFacenet512') !== 'false';
  });

  const [enableInsightFace, setEnableInsightFace] = useState(() => {
    return localStorage.getItem('enableInsightFace') === 'true'; // Default disabled/secondary
  });

  const [showConfidence, setShowConfidence] = useState(() => {
    return localStorage.getItem('showConfidence') !== 'false';
  });

  const handleToggleFacenet512 = (checked) => {
    setEnableFacenet512(checked);
    localStorage.setItem('enableFacenet512', checked ? 'true' : 'false');
    apiClient.post(`${API_BASE}/config`, { ...config, ENABLE_FACENET512: checked, CONFIRM_THRESHOLD: threshold }).then(res => setConfig(res.data));
    window.dispatchEvent(new Event('storage'));
  };

  const handleToggleInsightFace = (checked) => {
    setEnableInsightFace(checked);
    localStorage.setItem('enableInsightFace', checked ? 'true' : 'false');
    apiClient.post(`${API_BASE}/config`, { ...config, ENABLE_INSIGHTFACE: checked, CONFIRM_THRESHOLD: threshold }).then(res => setConfig(res.data));
    window.dispatchEvent(new Event('storage'));
  };

  const handleToggleConfidence = (checked) => {
    setShowConfidence(checked);
    localStorage.setItem('showConfidence', checked ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    apiClient.get(`${API_BASE}/config`).then(res => {
      setConfig(res.data);
      setThreshold(res.data.CONFIRM_THRESHOLD || 0.35);
      if (res.data.ENABLE_FACENET512 !== undefined) {
         setEnableFacenet512(res.data.ENABLE_FACENET512);
         localStorage.setItem('enableFacenet512', res.data.ENABLE_FACENET512 ? 'true' : 'false');
      }
      if (res.data.ENABLE_INSIGHTFACE !== undefined) {
         setEnableInsightFace(res.data.ENABLE_INSIGHTFACE);
         localStorage.setItem('enableInsightFace', res.data.ENABLE_INSIGHTFACE ? 'true' : 'false');
      }
    }).catch(err => console.error("Failed to load config", err));
  }, [apiClient]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await apiClient.post(`${API_BASE}/config`, { ...config, CONFIRM_THRESHOLD: threshold });
      setConfig(res.data);
      toast.success('Configuration saved successfully.');
    } catch (err) {
      toast.error('Failed to save configuration.');
    } finally { setIsSavingConfig(false); }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await apiClient.post(`${API_BASE}/models/reset`);
      toast.success(res.data.message || 'System reset complete.');
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset models');
    } finally { setIsResetting(false); }
  };

  const [isImportingDefaults, setIsImportingDefaults] = useState(false);

  const handleImportDefaults = async () => {
    setIsImportingDefaults(true);
    toast.info('Importing 70 benchmark persons & pre-trained AI weights...');
    try {
      const res = await apiClient.post(`${API_BASE}/models/import-defaults`);
      toast.success(res.data.message || 'Benchmark dataset & AI weights imported successfully!');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import benchmark weights.');
    } finally {
      setIsImportingDefaults(false);
    }
  };

  // ── Backup & Restore ──
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/backup/list`);
      setBackups(res.data.backups || []);
    } catch { /* ignore if not available */ }
  };

  useEffect(() => { fetchBackups(); }, []);

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await apiClient.post(`${API_BASE}/backup/create`);
      toast.success(res.data.message || 'Backup created successfully.');
      fetchBackups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create backup.');
    } finally { setBackupLoading(false); }
  };

  const restoreBackup = async (filename) => {
    if (!confirm(`Restore from backup "${filename}"? This will overwrite current data.`)) return;
    setRestoreLoading(true);
    try {
      const formData = new FormData();
      // Download the backup file and re-upload for restore
      const res = await apiClient.get(`${API_BASE}/backup/download/${filename}`, { responseType: 'blob' });
      formData.append('backup', new Blob([res.data]), filename);
      await apiClient.post(`${API_BASE}/backup/restore`, formData);
      toast.success('Backup restored successfully. Reload may be needed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to restore backup.');
    } finally { setRestoreLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">Model Management</h1>
        <p className="mt-1 text-caption text-ink-subtle">Export models for edge deployment or reset the system.</p>
      </div>



      <div className={`grid grid-cols-1 ${enableFacenet512 && enableInsightFace ? 'md:grid-cols-2' : ''} gap-4`}>
        {enableFacenet512 && (
          <div className="card-linear p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center text-[#828FFF] border border-[#5E6AD2]/20">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-body font-medium text-ink">Facenet512</div>
                <div className="text-caption text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Primary Backbone
                </div>
              </div>
            </div>
            <p className="text-caption text-ink-subtle m-0">
              Authoritative high-accuracy facial recognition model producing 512-dimensional metric embeddings. Primary engine for all authentication and testing.
            </p>
          </div>
        )}

        {enableInsightFace && (
          <div className="card-linear p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center text-[#828FFF] border border-[#5E6AD2]/20">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-body font-medium text-ink">InsightFace ArcFace</div>
                <div className="text-caption text-[#828FFF] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#828FFF]"></span> Secondary Verifier
                </div>
              </div>
            </div>
            <p className="text-caption text-ink-subtle m-0">
              State-of-the-art ONNX-accelerated inference model. Used as an optional secondary verifier for multi-angle face verification.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        
        <div className="card-linear p-6">
          <div>
            <h3 className="text-body font-medium text-ink flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-ink-subtle" /> System Settings
            </h3>
            <p className="text-caption text-ink-subtle mb-6">
              Adjust global recognition parameters and toggle active modules. Disabled models will be completely hidden across the platform.
            </p>
            
            <div className="flex items-center justify-between p-4 bg-[#010102]/60 border border-[#23252A] rounded-lg mb-6">
              <div>
                <label htmlFor="facenet512-toggle" className="text-caption font-medium text-ink cursor-pointer">Enable Facenet512 (Authoritative Primary Model)</label>
                <p className="text-[11px] text-ink-tertiary mt-1">Run primary high-accuracy model with 512-d embeddings.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="facenet512-toggle"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={enableFacenet512} 
                  onChange={e => handleToggleFacenet512(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-[#141516] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[3px] after:bg-ink-muted after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#5E6AD2] border border-[#23252A]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#010102]/60 border border-[#23252A] rounded-lg mb-6">
              <div>
                <label htmlFor="insightface-toggle" className="text-caption font-medium text-ink cursor-pointer">Enable InsightFace (Optional Secondary Verifier)</label>
                <p className="text-[11px] text-ink-tertiary mt-1">Run secondary fast embedding comparison as a supporting verifier.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="insightface-toggle"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={enableInsightFace} 
                  onChange={e => handleToggleInsightFace(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-[#141516] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[3px] after:bg-ink-muted after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#5E6AD2] border border-[#23252A]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#010102]/60 border border-[#23252A] rounded-lg mb-6">
              <div>
                <label htmlFor="confidence-toggle" className="text-caption font-medium text-ink cursor-pointer">Show Confidence Percentages</label>
                <p className="text-[11px] text-ink-tertiary mt-1">Display exact model confidence scores in the UI. Turn off for cleaner presentations.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="confidence-toggle"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showConfidence} 
                  onChange={e => handleToggleConfidence(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-[#141516] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[3px] after:bg-ink-muted after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#5E6AD2] border border-[#23252A]"></div>
              </label>
            </div>
            
            {enableInsightFace ? (
              <div className="bg-[#010102]/50 p-5 rounded-lg border border-[#23252A]">
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-caption font-medium text-ink-subtle">InsightFace Confirmation Threshold</label>
                   <span className="text-[#828FFF] font-mono font-semibold">{threshold.toFixed(2)}</span>
                 </div>
                 <p className="text-[11px] text-ink-tertiary mb-6">
                   Lower values = Stricter matching (fewer false positives). Higher values = Looser matching (fewer false negatives). Default is 0.35.
                 </p>
                 <div className="flex items-center gap-4 mb-6">
                   <span className="text-xs text-ink-tertiary">0.10 (Strict)</span>
                   <input 
                     type="range" min="0.10" max="0.50" step="0.01" value={threshold} 
                     onChange={(e) => setThreshold(parseFloat(e.target.value))}
                     className="flex-1 accent-[#5E6AD2] h-1.5 bg-[#141516] rounded-lg appearance-none cursor-pointer"
                   />
                   <span className="text-xs text-ink-tertiary">0.50 (Loose)</span>
                 </div>
                 <button onClick={handleSaveConfig} disabled={isSavingConfig} className="w-full button-primary flex items-center justify-center gap-2">
                   <Save className="w-4 h-4 text-white" />
                   <span className="text-button text-white">{isSavingConfig ? 'Saving...' : 'Save Configuration'}</span>
                 </button>
              </div>
            ) : (
              <div className="bg-[#010102]/50 p-5 rounded-lg border border-[#23252A] text-center py-6 text-ink-subtle text-caption">
                <Info className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                Facenet512 is running as the authoritative primary model with 512-d embeddings. Secondary verifiers are currently disabled.
              </div>
            )}
          </div>
        </div>

        {/* Benchmark Foundation & Pre-trained Weights */}
        <div className="card-linear p-6 border border-[#5E6AD2]/30 bg-gradient-to-b from-[#5E6AD2]/10 to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">RECOMMENDED</span>
              <h3 className="text-body font-medium text-ink flex items-center gap-2">
                <Box className="w-5 h-5 text-[#828FFF]" /> Benchmark Dataset & Pre-Trained AI Weights
              </h3>
            </div>
            <p className="text-caption text-ink-subtle mb-6 leading-relaxed">
              Import 70 pre-cleaned benchmark personnel and pre-computed high-accuracy 512-d embeddings directly into your organization. Gives your team an immediate high-accuracy foundation so live recognition works instantly without an empty roster.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleImportDefaults} 
                disabled={isImportingDefaults} 
                className="button-primary bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white flex items-center gap-2 font-medium shadow-lg shadow-[#5E6AD2]/25"
              >
                {isImportingDefaults ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                <span className="text-button text-white">{isImportingDefaults ? 'Importing Weights...' : 'Import 70 Personnel & AI Weights'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="card-linear p-6">
          <div>
            <h3 className="text-body font-medium text-ink flex items-center gap-2 mb-2">
              <Archive className="w-5 h-5 text-ink-subtle" /> Backup & Restore
            </h3>
            <p className="text-caption text-ink-subtle mb-6">
              Create snapshots of your trained models and dataset. Restore from a previous backup if needed.
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <button onClick={createBackup} disabled={backupLoading} className="button-primary text-white flex items-center gap-2 disabled:opacity-50">
                {backupLoading ? <Loader2 size={16} className="animate-spin text-white" /> : <Archive size={16} className="text-white" />}
                <span className="text-button text-white">{backupLoading ? 'Creating...' : 'Create Backup'}</span>
              </button>
            </div>

            {backups.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-2">Available Backups</div>
                {backups.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#010102]/50 rounded-lg border border-[#23252A]">
                    <div className="text-caption text-ink font-mono">{typeof b === 'string' ? b : b.filename || b.name}</div>
                    <div className="flex gap-2">
                      <a
                        href={`${API_BASE}/backup/download/${typeof b === 'string' ? b : b.filename || b.name}`}
                        className="button-secondary text-[11px] py-0.5 px-2 h-7 flex items-center gap-1"
                      >
                        <Download size={12} /> Download
                      </a>
                      <button
                        onClick={() => restoreBackup(typeof b === 'string' ? b : b.filename || b.name)}
                        disabled={restoreLoading}
                        className="button-secondary text-[11px] py-0.5 px-2 h-7 flex items-center gap-1 disabled:opacity-30"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-[#F87171]/20 bg-[#F87171]/5 rounded-lg overflow-hidden p-6">
          <div>
            <h3 className="text-body font-medium text-[#F87171] flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-caption text-ink-subtle mb-6">
              Resetting the system will permanently delete all trained models and all collected identity datasets. You will need to re-register everyone.
            </p>
            
            {showConfirm ? (
              <div className="bg-[#010102] p-4 rounded-lg border border-[#F87171]/30 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-caption text-ink-subtle font-medium">Are you absolutely sure? This action cannot be undone.</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirm(false)} className="button-secondary text-caption">Cancel</button>
                  <button onClick={handleReset} disabled={isResetting} className="button-primary bg-[#F87171] hover:bg-red-600 text-white text-caption">
                    {isResetting ? 'Resetting...' : 'Yes, Delete Everything'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="button-secondary border-[#F87171]/30 text-[#F87171] hover:bg-[#F87171] hover:text-white transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span className="text-button">Factory Reset AI</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
