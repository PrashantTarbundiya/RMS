import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Download, Trash2, Box, Cpu, AlertTriangle, Settings, Save } from 'lucide-react'

import { API_BASE } from '../config'

export default function ModelsPage() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isExporting, setIsExporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Config state
  const [config, setConfig] = useState(null)
  const [threshold, setThreshold] = useState(0.35)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  useEffect(() => {
    // Load config on mount
    axios.get(`${API_BASE}/config`).then(res => {
      setConfig(res.data)
      setThreshold(res.data.CONFIRM_THRESHOLD || 0.35)
    }).catch(err => console.error("Failed to load config", err))
  }, [])

  const handleSaveConfig = async () => {
    setIsSavingConfig(true)
    try {
      const res = await axios.post(`${API_BASE}/config`, {
        ...config,
        CONFIRM_THRESHOLD: threshold
      })
      setConfig(res.data)
      setStatus({ type: 'success', message: 'Configuration saved successfully.' })
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Failed to save configuration.' })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setStatus({ type: 'info', message: 'Exporting MobileNetV2 to ONNX format. This may take a few seconds...' })
    
    try {
      const res = await axios.post(`${API_BASE}/export-onnx`)
      setStatus({ 
        type: 'success', 
        message: `Successfully exported ONNX model (${res.data.size_mb} MB) to ${res.data.path}` 
      })
    } catch (err) {
      console.error(err)
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to export model' 
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    // Trigger download via anchor tag pointing to the GET endpoint
    window.location.href = `${API_BASE}/download-model`
  }

  const handleReset = async () => {
    setIsResetting(true)
    setStatus({ type: 'info', message: 'Deleting all trained models and dataset...' })
    
    try {
      const res = await axios.post(`${API_BASE}/models/reset`)
      setStatus({ type: 'success', message: res.data.message })
      setShowConfirm(false)
    } catch (err) {
      console.error(err)
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to reset models' 
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Model Management</h1>
      <p className="page-subtitle">Export models for edge deployment or reset the system.</p>

      {status.message && (
        <div className="mb-2" style={{
          padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', 
          background: status.type === 'error' ? 'var(--error-bg)' : 
                      status.type === 'success' ? 'var(--success-bg)' : 'var(--info-bg)',
          border: `1px solid ${status.type === 'error' ? 'rgba(239,68,68,0.3)' : 
                               status.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
          color: status.type === 'error' ? 'var(--error)' : 
                 status.type === 'success' ? 'var(--success)' : 'var(--info)',
          fontSize: '0.9rem'
        }}>
          {status.message}
        </div>
      )}

      <div className="card-grid">
        <div className="glass-panel model-card">
          <div className="flex-row">
            <Cpu size={24} color="var(--accent-cyan)" />
            <div>
              <div className="model-title">DeepFace 512</div>
              <div className="model-subtitle">encodings.pickle</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Stores raw L2-normalized embeddings using Facenet512.
          </p>
        </div>


        <div className="glass-panel model-card">
          <div className="flex-row">
            <Box size={24} color="var(--accent-teal)" />
            <div>
              <div className="model-title">MobileNetV2</div>
              <div className="model-subtitle">best_mobile_sideface.pth</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            SOTA lightweight model explicitly trained for edge device inference.
          </p>
        </div>
      </div>



      <div className="card-grid" style={{ marginTop: '2rem' }}>
        
        {/* System Settings Section */}
        <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} /> System Settings
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Adjust global recognition parameters. The confirmation threshold determines how strict the AI is when verifying identity.
          </p>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
               <label style={{ fontWeight: '600' }}>DeepFace Confirmation Threshold</label>
               <span style={{ color: 'var(--accent-1)', fontWeight: 'bold' }}>{threshold.toFixed(2)}</span>
             </div>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
               Lower values = Stricter matching (fewer false positives). Higher values = Looser matching (fewer false negatives). Default is 0.35.
             </p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>0.10 (Strict)</span>
               <input 
                 type="range" 
                 min="0.10" 
                 max="0.50" 
                 step="0.01" 
                 value={threshold} 
                 onChange={(e) => setThreshold(parseFloat(e.target.value))}
                 style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
               />
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>0.50 (Loose)</span>
             </div>
             <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
               <button 
                 className="btn btn-primary" 
                 onClick={handleSaveConfig}
                 disabled={isSavingConfig || (config && threshold === config.CONFIRM_THRESHOLD)}
               >
                 <Save size={16} style={{ marginRight: '6px' }} />
                 {isSavingConfig ? 'Saving...' : 'Save Configuration'}
               </button>
             </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-teal)' }}>Export & Download</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Convert the trained MobileNetV2 model to ONNX format (Open Neural Network Exchange). 
            This format is highly optimized for deployment on mobile devices (React Native) or edge hardware.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : '1. Export to ONNX'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleDownload}
            >
              <Download size={18} /> 2. Download Model
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Danger Zone
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            This action will permanently delete all trained model weights and raw face datasets from the system. 
            You will need to upload new faces to start fresh. This cannot be undone.
          </p>

          {!showConfirm ? (
            <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
              <Trash2 size={18} /> Reset All Models
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--error)', fontWeight: 600 }}>Are you sure?</span>
              <button className="btn btn-danger" onClick={handleReset} disabled={isResetting}>
                {isResetting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
