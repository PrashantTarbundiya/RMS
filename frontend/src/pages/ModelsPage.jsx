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

  useEffect(() => {
    apiClient.get(`${API_BASE}/config`).then(res => {
      setConfig(res.data);
      setThreshold(res.data.CONFIRM_THRESHOLD || 0.35);
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
    setStatus({ type: 'info', message: 'Exporting MobileNetV2 to ONNX format. This may take a few seconds...' });
    
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>Model Management</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Export models for edge deployment or reset the system.</p>
      </div>

      <AnimatePresence>
        {status.message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <div style={{
              padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)',
              background: status.type === 'error' ? 'var(--error-bg)' : status.type === 'success' ? 'var(--success-bg)' : 'var(--bg-elevated)',
              border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : status.type === 'success' ? 'rgba(48, 209, 88, 0.3)' : 'var(--border-subtle)'}`,
              color: status.type === 'error' ? 'var(--alert-crimson)' : status.type === 'success' ? 'var(--confirm-green)' : 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)'
            }}>
              {status.type === 'error' ? <AlertTriangle size={16} /> : status.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
              {status.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Cpu size={24} color="var(--accent-violet)" />
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>DeepFace 512</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>encodings.pickle</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Stores raw L2-normalized embeddings using Facenet512.
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Box size={24} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>MobileNetV2</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>best_mobile_sideface.pth</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            SOTA lightweight model explicitly trained for edge device inference.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 style={{ margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-lg)' }}>
            <Settings size={20} /> System Settings
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Adjust global recognition parameters. The confirmation threshold determines how strict the AI is when verifying identity.
          </p>
          
          <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
               <label style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>DeepFace Confirmation Threshold</label>
               <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{threshold.toFixed(2)}</span>
             </div>
             <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
               Lower values = Stricter matching (fewer false positives). Higher values = Looser matching (fewer false negatives). Default is 0.35.
             </p>
             <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
               <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>0.10 (Strict)</span>
               <input 
                 type="range" min="0.10" max="0.50" step="0.01" value={threshold} 
                 onChange={(e) => setThreshold(parseFloat(e.target.value))}
                 style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
               />
               <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>0.50 (Loose)</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="primary" onClick={handleSaveConfig} disabled={isSavingConfig || (config && threshold === config.CONFIRM_THRESHOLD)}>
                 <Save size={16} style={{ marginRight: '6px' }} />
                 {isSavingConfig ? 'Saving...' : 'Save Configuration'}
               </button>
             </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 style={{ margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>Export & Download</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Convert the trained MobileNetV2 model to ONNX format (Open Neural Network Exchange). 
            This format is highly optimized for deployment on mobile devices (React Native) or edge hardware.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="secondary" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : '1. Export to ONNX'}
            </button>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="primary" onClick={handleDownload}>
              <Download size={16} style={{ marginRight: '8px' }} /> 2. Download Model
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ margin: '0 0 var(--space-4) 0', color: 'var(--alert-crimson)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-lg)' }}>
            <AlertTriangle size={20} /> Danger Zone
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            This action will permanently delete all trained model weights and raw face datasets from the system. 
            You will need to upload new faces to start fresh. This cannot be undone.
          </p>

          {!showConfirm ? (
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="danger" onClick={() => setShowConfirm(true)}>
              <Trash2 size={16} style={{ marginRight: '8px' }} /> Reset All Models
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <span style={{ color: 'var(--alert-crimson)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Are you sure?</span>
              <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="danger" onClick={handleReset} disabled={isResetting}>
                {isResetting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="ghost" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
