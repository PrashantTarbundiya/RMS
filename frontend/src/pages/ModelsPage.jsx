import React, { useState } from 'react'
import axios from 'axios'
import { Download, Trash2, Box, Cpu, HardDrive, AlertTriangle } from 'lucide-react'

import { API_BASE } from '../config'

export default function ModelsPage() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isExporting, setIsExporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
