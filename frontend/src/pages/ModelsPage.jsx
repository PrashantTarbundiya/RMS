import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Trash2, Box, Cpu, AlertTriangle, Settings, Save, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';


export default function ModelsPage() {
  const { apiClient } = useAuth();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [config, setConfig] = useState(null);
  const [threshold, setThreshold] = useState(0.35);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [enableFacenet512, setEnableFacenet512] = useState(() => {
    return localStorage.getItem('enableFacenet512') !== 'false';
  });

  const [enableInsightFace, setEnableInsightFace] = useState(() => {
    return localStorage.getItem('enableInsightFace') !== 'false';
  });

  const [enableGhostFaceNet, setEnableGhostFaceNet] = useState(() => {
    return localStorage.getItem('enableGhostFaceNet') === 'true'; // Default disabled
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

  const handleToggleGhostFaceNet = (checked) => {
    setEnableGhostFaceNet(checked);
    localStorage.setItem('enableGhostFaceNet', checked ? 'true' : 'false');
    apiClient.post(`${API_BASE}/config`, { ...config, ENABLE_GHOSTFACENET: checked, CONFIRM_THRESHOLD: threshold }).then(res => setConfig(res.data));
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
      if (res.data.ENABLE_GHOSTFACENET !== undefined) {
         setEnableGhostFaceNet(res.data.ENABLE_GHOSTFACENET);
         localStorage.setItem('enableGhostFaceNet', res.data.ENABLE_GHOSTFACENET ? 'true' : 'false');
      }
    }).catch(err => console.error("Failed to load config", err));
  }, [apiClient]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await apiClient.post(`${API_BASE}/config`, { ...config, CONFIRM_THRESHOLD: threshold });
      setConfig(res.data);
      setStatus({ type: 'success', message: 'Configuration saved successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to save configuration.' });
    } finally { setIsSavingConfig(false); }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStatus({ type: 'info', message: 'Exporting GhostFaceNet to ONNX format. This may take a few seconds...' });
    
    try {
      const res = await apiClient.post(`${API_BASE}/export-onnx`);
      setStatus({ type: 'success', message: `Successfully exported ONNX model (${res.data.size_mb} MB) to ${res.data.path}` });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to export model' });
    } finally { setIsExporting(false); }
  };

  const handleDownload = () => {
    window.location.href = `${API_BASE}/download-model`;
  };

  const handleReset = async () => {
    setIsResetting(true);
    setStatus({ type: 'info', message: 'Deleting all trained models and dataset...' });
    
    try {
      const res = await apiClient.post(`${API_BASE}/models/reset`);
      setStatus({ type: 'success', message: res.data.message });
      setShowConfirm(false);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to reset models' });
    } finally { setIsResetting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">Model Management</h1>
        <p className="mt-1 text-caption text-ink-subtle">Export models for edge deployment or reset the system.</p>
      </div>

      <AnimatePresence>
        {status.message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm mb-2 border ${
              status.type === 'error' ? 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20' : 
              status.type === 'success' ? 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20' : 
              'bg-[#5E6AD2]/10 text-[#828FFF] border-[#5E6AD2]/20'
            }`}>
              {status.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              <span className="text-caption">{status.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {enableFacenet512 && (
          <div className="card-linear p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center text-[#828FFF] border border-[#5E6AD2]/20">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-body font-medium text-ink">Facenet512</div>
                <div className="text-caption text-ink-subtle font-mono">Original Baseline</div>
              </div>
            </div>
            <p className="text-caption text-ink-subtle m-0">
              Highly accurate server-side model providing 512-d embeddings. The primary model you requested.
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
                <div className="text-caption text-ink-subtle font-mono">primary_network.onnx</div>
              </div>
            </div>
            <p className="text-caption text-ink-subtle m-0">
              State-of-the-art ONNX-accelerated inference model. Highly optimized for speed.
            </p>
          </div>
        )}

        <div className={`card-linear p-6 ${(!enableFacenet512 && !enableInsightFace) ? 'md:col-span-3' : (!enableFacenet512 || !enableInsightFace) ? 'md:col-span-2' : ''}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center text-[#828FFF] border border-[#5E6AD2]/20">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="text-body font-medium text-ink">GhostFaceNet</div>
              <div className="text-caption text-ink-subtle font-mono">best_mobile_sideface.pth</div>
            </div>
          </div>
          <p className="text-caption text-ink-subtle m-0">
            Lightweight GhostFaceNet embedding model explicitly meant for edge device inference.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        <div className="card-linear p-6">
          <div>
            <h3 className="text-body font-medium text-ink flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-ink-subtle" /> System Settings
            </h3>
            <p className="text-caption text-ink-subtle mb-6">
              Adjust global recognition parameters and toggle active modules.
            </p>
            
            <div className="flex items-center justify-between p-4 bg-[#010102]/60 border border-[#23252A] rounded-lg mb-6">
              <div>
                <label htmlFor="facenet512-toggle" className="text-caption font-medium text-ink cursor-pointer">Enable Facenet512 (Original Model)</label>
                <p className="text-[11px] text-ink-tertiary mt-1">Run primary high-accuracy model.</p>
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
                <label htmlFor="insightface-toggle" className="text-caption font-medium text-ink cursor-pointer">Enable InsightFace (Fast ArcFace)</label>
                <p className="text-[11px] text-ink-tertiary mt-1">Run secondary fast embedding comparison.</p>
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
                <label htmlFor="ghostfacenet-toggle" className="text-caption font-medium text-ink cursor-pointer">Enable GhostFaceNet (Edge Model)</label>
                <p className="text-[11px] text-ink-tertiary mt-1">Run lightweight mobile-optimized edge inference.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="ghostfacenet-toggle"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={enableGhostFaceNet} 
                  onChange={e => handleToggleGhostFaceNet(e.target.checked)} 
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
            
            {(enableFacenet512 || enableInsightFace) ? (
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
                <Info className="w-5 h-5 text-[#828FFF] mx-auto mb-2" />
                InsightFace is currently disabled. Face recognition runs strictly using the GhostFaceNet model with a default confidence threshold of <span className="font-mono font-semibold text-ink">0.80</span>.
              </div>
            )}
          </div>
        </div>

        <div className="card-linear p-6">
          <div>
            <h3 className="text-body font-medium text-ink flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-ink-subtle" /> Export GhostFaceNet for Edge
            </h3>
            <p className="text-caption text-ink-subtle mb-6">
              Convert the trained PyTorch GhostFaceNet model into an ONNX format to deploy directly to iOS/Android apps or edge devices.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExport} disabled={isExporting} className="button-secondary flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span className="text-button">{isExporting ? 'Exporting...' : '1. Generate ONNX Model'}</span>
              </button>
              <button onClick={handleDownload} className="button-primary flex items-center gap-2 border border-[#5E6AD2]/30 text-white">
                <Download className="w-4 h-4 text-white" />
                <span className="text-button text-white">2. Download ONNX File</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border border-[#F87171]/20 bg-[#F87171]/5 rounded-lg overflow-hidden p-6">
          <div>
            <h3 className="text-body font-medium text-[#F87171] flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-caption text-ink-subtle mb-6">
              Resetting the system will permanently delete all trained models (InsightFace and GhostFaceNet) and all collected identity datasets. You will need to re-register everyone.
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
