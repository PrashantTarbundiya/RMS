import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Download, Trash2, Box, Cpu, AlertTriangle, Settings as SettingsIcon,
  Save, CheckCircle, Info, Archive, Upload, RotateCcw, Loader2, Check,
  History, Clock, Sliders, Shield, Layers, HardDrive, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

export default function ModelsPage() {
  const { apiClient, user } = useAuth();
  const toast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'engine';

  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'engine') next.delete('tab'); else next.set('tab', tab);
      return next;
    }, { replace: true });
  };
  const [config, setConfig] = useState(null);
  const [threshold, setThreshold] = useState(0.35);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [enableFacenet512, setEnableFacenet512] = useState(() => {
    return localStorage.getItem('enableFacenet512') !== 'false';
  });

  const [enableInsightFace, setEnableInsightFace] = useState(() => {
    return localStorage.getItem('enableInsightFace') === 'true';
  });

  const [showConfidence, setShowConfidence] = useState(() => {
    return localStorage.getItem('showConfidence') === 'true';
  });

  // ── Downloadable Model Artefacts for Offline / Edge ──
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState({});

  // ── Backup & Restore ──
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // ── Training History ──
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleToggleFacenet512 = (checked) => {
    setEnableFacenet512(checked);
    localStorage.setItem('enableFacenet512', checked ? 'true' : 'false');
    apiClient.post(`${API_BASE}/config`, { ...config, ENABLE_FACENET512: checked, CONFIRM_THRESHOLD: threshold })
      .then(res => setConfig(res.data));
    window.dispatchEvent(new Event('storage'));
  };

  const handleToggleInsightFace = (checked) => {
    setEnableInsightFace(checked);
    localStorage.setItem('enableInsightFace', checked ? 'true' : 'false');
    apiClient.post(`${API_BASE}/config`, { ...config, ENABLE_INSIGHTFACE: checked, CONFIRM_THRESHOLD: threshold })
      .then(res => setConfig(res.data));
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
      const rawT = res.data.CONFIRM_THRESHOLD;
      const safeT = (typeof rawT === 'number' && rawT > 0.50) ? 0.32 : (rawT || 0.32);
      setThreshold(safeT);
      if (res.data.ENABLE_FACENET512 !== undefined) {
        setEnableFacenet512(res.data.ENABLE_FACENET512);
      }
      if (res.data.ENABLE_INSIGHTFACE !== undefined) {
        setEnableInsightFace(res.data.ENABLE_INSIGHTFACE);
      }
    }).catch(err => console.error('Failed to load config', err));

    fetchDownloadList();
    fetchBackups();
    fetchTrainingHistory();
  }, [apiClient]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await apiClient.post(`${API_BASE}/config`, { ...config, CONFIRM_THRESHOLD: threshold });
      setConfig(res.data);
      toast.success('Configuration saved successfully.');
    } catch (err) {
      toast.error('Failed to save configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const fetchDownloadList = async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/download-list`);
      if (res.data?.files) setDownloadFiles(res.data.files);
    } catch { /* ignore */ }
  };

  const handleDownloadModel = async (filename) => {
    setDownloadLoading(prev => ({ ...prev, [filename]: true }));
    try {
      toast.info(`Preparing ${filename}...`);
      const res = await apiClient.get(`${API_BASE}/download-file?name=${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || `Failed to download ${filename}`);
    } finally {
      setDownloadLoading(prev => ({ ...prev, [filename]: false }));
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/backup/list`);
      setBackups(res.data.backups || []);
    } catch (err) {
      console.warn('Backup list not available in current mode');
    }
  };

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await apiClient.post(`${API_BASE}/backup/create`);
      toast.success(res.data.message || 'Backup created successfully.');
      fetchBackups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackup = async (filename) => {
    if (!window.confirm(`Restore from snapshot "${filename}"? This will overwrite current model state.`)) return;
    setRestoreLoading(true);
    try {
      const res = await apiClient.get(`${API_BASE}/backup/download/${filename}`, { responseType: 'blob' });
      const formData = new FormData();
      formData.append('backup', new Blob([res.data]), filename);
      await apiClient.post(`${API_BASE}/backup/restore`, formData);
      toast.success('Backup restored successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to restore backup.');
    } finally {
      setRestoreLoading(false);
    }
  };

  const fetchTrainingHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get(`${API_BASE}/train/history`);
      setTrainingHistory(res.data?.history || []);
    } catch {
      setTrainingHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await apiClient.post(`${API_BASE}/models/reset`);
      toast.success(res.data.message || 'System reset complete.');
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset models');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pb-16 max-w-6xl mx-auto space-y-6 page-container"
    >
      {/* ── Executive Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-emerald-400" />
            <span>Platform & Recognition Settings</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Configure facial recognition backbones, confidence thresholds, offline exports, and data snapshots.
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs (Liquid Glass Segmented Nav) ── */}
      <div className="segmented-nav w-full">
        {[
          { id: 'engine', label: 'AI Engine & Accuracy Gates', shortLabel: 'AI Engine', icon: Sliders },
          { id: 'exports', label: 'Edge Models & Artifacts', shortLabel: 'Models', icon: HardDrive },
          { id: 'snapshots', label: 'Snapshots & Audit History', shortLabel: 'Snapshots', icon: Archive },
          { id: 'danger', label: 'System Maintenance', shortLabel: 'Maintenance', icon: AlertOctagon },
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

{/* ── TAB 1: AI Engine & Accuracy Gates ── */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          {/* Active Model Backbones Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">GhostFaceNet / Facenet512</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Primary Authoritative Engine</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                512-dimensional Euclidean metric vector embeddings. Primary authoritative backbone for instant, touchless kiosk identity verification.
              </p>
            </div>

            <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">InsightFace ArcFace</h3>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Multi-Angle Secondary Verifier</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ONNX-accelerated secondary confirmation engine. Provides angular pose invariance (profile & tilted angle scans) to prevent false rejections.
              </p>
            </div>
          </div>

          {/* Configuration Controls Card */}
          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] overflow-hidden">
            <div className="p-5 border-b border-[#23252A]">
              <h3 className="text-sm font-semibold text-white">Recognition & Gate Controls</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Configure live inference parameters and confidence scoring.</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Facenet512 Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#0A0B0D] border border-[#23252A] rounded-xl">
                <div>
                  <label htmlFor="facenet512-toggle" className="text-xs sm:text-sm font-medium text-white cursor-pointer block">
                    Facenet512 Primary Recognition
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    High-accuracy 512-d metric vector classification for all attendance scans.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    id="facenet512-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={enableFacenet512}
                    onChange={e => handleToggleFacenet512(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#23252A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
                </label>
              </div>

              {/* InsightFace Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#0A0B0D] border border-[#23252A] rounded-xl">
                <div>
                  <label htmlFor="insightface-toggle" className="text-xs sm:text-sm font-medium text-white cursor-pointer block">
                    InsightFace ArcFace Auxiliary Gate
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Multi-angle pose confirmation verifier for challenging camera perspectives.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    id="insightface-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={enableInsightFace}
                    onChange={e => handleToggleInsightFace(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#23252A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
                </label>
              </div>

              {/* Show Confidence Scores Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#0A0B0D] border border-[#23252A] rounded-xl">
                <div>
                  <label htmlFor="confidence-toggle" className="text-xs sm:text-sm font-medium text-white cursor-pointer block">
                    Display Confidence Percentages
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Show exact AI match confidence percentages (e.g., 94.2%) on live monitors and kiosks.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    id="confidence-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={showConfidence}
                    onChange={e => handleToggleConfidence(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#23252A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
                </label>
              </div>

              {/* Confirmation Threshold Slider */}
              <div className="p-5 rounded-xl bg-[#0A0B0D] border border-[#23252A] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-white">Recognition Confirmation Threshold</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Controls cosine distance cutoff. Stricter thresholds eliminate false positives; balanced values optimize user throughput.
                    </p>
                  </div>
                  <span className="text-lg font-mono font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-500/30">
                    {threshold.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <span className="text-[11px] text-zinc-400 font-mono">0.15 (Strict - Zero False Positives)</span>
                  <input
                    type="range"
                    min="0.15"
                    max="0.50"
                    step="0.01"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-500 h-2 bg-[#18191C] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-400 font-mono">0.50 (Permissive)</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="button-primary text-xs h-9 px-5 flex items-center gap-2 font-semibold"
                  >
                    <Save size={14} />
                    <span>{isSavingConfig ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Edge Models & Artifacts ── */}
      {activeTab === 'exports' && (
        <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] overflow-hidden">
          <div className="p-5 border-b border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <HardDrive size={16} className="text-emerald-400" />
                <span>Edge & Offline Model Exports</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download neural network weights, vector indices, and ONNX models for Raspberry Pi 4/5, Jetson, or air-gapped attendance hardware.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {[
              { name: 'encodings.pickle', title: 'Facenet512 Embeddings Index', desc: '512-d KNN metric index for primary authoritative face verification.' },
              { name: 'encodings_InsightFace.pickle', title: 'InsightFace ArcFace Embeddings', desc: '512-d ArcFace embedding index for fast secondary angle confirmation.' },
              { name: 'best_mobile_sideface.pth', title: 'MobileNetV2 SOTA Weights', desc: 'PyTorch deep CNN weights for 90° multi-view pose & profile classification.' },
              { name: 'w600k_mbf.onnx', title: 'InsightFace ArcFace ONNX Model', desc: 'Raw ONNX backbone model for offline CPU/GPU edge inference.' },
              { name: 'class_centroids.json', title: 'Class Centroids Index', desc: 'Normalized centroids map for fast mobile & low-power edge lookup.' }
            ].map((item, idx) => {
              const fileInfo = downloadFiles.find(f => f.name === item.name);
              const isAvail = fileInfo ? fileInfo.available : false;
              const sizeStr = fileInfo && fileInfo.size_mb > 0
                ? `${fileInfo.size_mb} MB`
                : (fileInfo && fileInfo.size_bytes > 0 ? `${Math.round(fileInfo.size_bytes / 1024)} KB` : null);
              const isLoading = downloadLoading[item.name];

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0A0B0D] rounded-xl border border-[#23252A] hover:border-[#34343A] transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-white">{item.title}</span>
                      <code className="text-[11px] font-mono text-emerald-400 bg-[#059669]/15 px-2 py-0.5 rounded border border-[#059669]/25">
                        {item.name}
                      </code>
                      {sizeStr && <span className="text-[11px] font-mono text-zinc-400">({sizeStr})</span>}
                    </div>
                    <p className="text-[11px] text-zinc-400">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadModel(item.name)}
                    disabled={isLoading || !isAvail}
                    className={`text-xs h-8 px-3.5 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-all shrink-0 ${
                      isAvail
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer'
                        : 'bg-zinc-800/40 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    <span>{isLoading ? 'Exporting...' : isAvail ? 'Download' : 'Not Exported'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: Snapshots & Audit History ── */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          {/* Snapshots & Backup */}
          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] overflow-hidden">
            <div className="p-5 border-b border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Archive size={16} className="text-emerald-400" />
                  <span>State Snapshots & Recovery</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create point-in-time archives of trained neural weights and employee biometric vectors.
                </p>
              </div>

              <button
                onClick={createBackup}
                disabled={backupLoading}
                className="button-primary text-xs h-8 px-4 flex items-center gap-1.5 shrink-0"
              >
                {backupLoading ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                <span>{backupLoading ? 'Creating...' : 'Create Snapshot'}</span>
              </button>
            </div>

            <div className="p-5">
              {backups.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No snapshots created yet. Create a snapshot before major roster updates.
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((b, i) => {
                    const name = typeof b === 'string' ? b : b.filename || b.name;
                    return (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-[#0A0B0D] rounded-xl border border-[#23252A] text-xs">
                        <span className="font-mono text-zinc-300">{name}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`${API_BASE}/backup/download/${name}`}
                            className="button-secondary text-[11px] h-7 px-2.5 flex items-center gap-1"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </a>
                          <button
                            onClick={() => restoreBackup(name)}
                            disabled={restoreLoading}
                            className="button-secondary text-[11px] h-7 px-2.5 flex items-center gap-1 text-amber-400 border-amber-500/25 hover:bg-amber-500/10"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Model Retraining Audit Table */}
          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] overflow-hidden">
            <div className="p-5 border-b border-[#23252A] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <History size={16} className="text-emerald-400" />
                  <span>Model Training & Fine-Tuning Audit Log</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Telemetry log of neural network retraining sessions.</p>
              </div>

              <button
                onClick={fetchTrainingHistory}
                disabled={loadingHistory}
                className="button-secondary text-xs h-8 px-3 flex items-center gap-1.5"
              >
                <RotateCcw size={13} className={loadingHistory ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#23252A] bg-[#0A0B0D] text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Model</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Samples</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252A]/50 font-mono text-[11px]">
                  {trainingHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-zinc-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-2.5 px-4 text-white font-sans font-medium">{item.model_name}</td>
                      <td className="py-2.5 px-4 text-emerald-400">{item.person_name || 'All'}</td>
                      <td className="py-2.5 px-4 text-zinc-400">{item.samples_count || 'Batch'}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          {item.status || 'SUCCESS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {trainingHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-500 font-sans">
                        No retraining history recorded yet. Enroll a person or trigger fine-tuning to view history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: System Maintenance & Danger Zone ── */}
      {activeTab === 'danger' && (
        <div className="card-linear p-6 border-red-500/25 bg-red-500/[0.03] rounded-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle size={20} />
            <h3 className="text-sm font-semibold">Factory Model Reset & Vector Space Purge</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            This operation will permanently purge all compiled embedding matrices and fine-tuned weights for {user?.org_name || 'this organization'}.
            Reference photos will remain in storage, but all models must be retrained before kiosk recognition will function.
          </p>

          <div className="pt-2">
            {showConfirm ? (
              <div className="p-4 rounded-xl border border-red-500/30 bg-[#0A0B0D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs text-red-300 font-medium">Are you certain you want to purge all active AI weights?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="button-secondary text-xs h-8 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="button-primary bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-4 font-semibold"
                  >
                    {isResetting ? 'Purging...' : 'Yes, Purge Model Weights'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="h-9 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Reset AI Weights</span>
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
