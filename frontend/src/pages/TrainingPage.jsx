import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Terminal, CheckCircle, Download } from 'lucide-react'

import { API_BASE } from '../config'

export default function TrainingPage() {
  const [logs, setLogs] = useState([])
  const [isTraining, setIsTraining] = useState(false)
  const logsEndRef = useRef(null)
  const eventSourceRef = useRef(null)

  const connectToStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setIsTraining(true)
    const source = new EventSource(`${API_BASE}/train/status`)
    eventSourceRef.current = source

    source.onmessage = (e) => {
      if (e.data === '[DONE]') {
        setIsTraining(false)
        source.close()
      } else {
        setLogs(prev => [...prev, e.data])
      }
    }

    source.onerror = () => {
      source.close()
      setIsTraining(false)
    }
  }

  useEffect(() => {
    // Automatically connect on mount to see if training is running
    connectToStream()
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close()
    }
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Parse log to extract epoch dynamically
  const extractProgress = () => {
    let sotaPercent = 0
    let dfPercent = 100 // DeepFace is always 100% since it completes synchronously on upload

    let currentBlock = null

    for (let i = 0; i < logs.length; i++) {
        const line = logs[i]
        if (line.includes('SOTA MobileNetV2: Fine-tuning') || line.includes('Starting background model refinement')) {
            currentBlock = 'sota'
            sotaPercent = 5
        } else if (line.includes('Pipeline Completed') || line.includes('Saved updated model: sota_finetune') || line.includes('Saved updated model: best_mobile_sideface')) {
            sotaPercent = 100
            break
        }

        if (line.includes('Epoch [')) {
            const match = line.match(/Epoch \[(\d+)\/(\d+)\]/)
            if (match) {
                const currentE = parseInt(match[1], 10)
                const totalE = parseInt(match[2], 10)
                const p = Math.floor((currentE / totalE) * 100)
                if (currentBlock === 'sota') sotaPercent = p === 100 ? 99 : p 
            }
        }
    }

    // If training stream hasn't output anything yet but isTraining is true, sota is pending/starting
    if (isTraining && sotaPercent === 0) {
      sotaPercent = 1;
    }

    return { dfPercent, sotaPercent }
  }

  const { dfPercent, sotaPercent } = extractProgress()

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Model Refinement (Background Job)</h1>
      <p className="page-subtitle">DeepFace embeddings are processed instantly. SOTA MobileNetV2 fine-tuning runs asynchronously in the background to prevent blocking.</p>

      <div className="card-grid">
        <ModelProgressCard 
          title="DeepFace (Facenet512)" 
          subtitle="Instant Embeddings" 
          percent={dfPercent} 
          isTraining={false}
        />
        <ModelProgressCard 
          title="SOTA MobileNetV2" 
          subtitle="Edge Optimized" 
          percent={sotaPercent} 
          isTraining={isTraining && sotaPercent < 100}
        />
      </div>

      {(!isTraining && sotaPercent === 100) && (
        <div className="glass-panel" style={{ 
          marginTop: '2rem', padding: '1.5rem', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          background: 'var(--success-bg)',
          display: 'flex', flexDirection: 'column',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <CheckCircle size={32} color="var(--success)" />
            <div>
              <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '1.2rem' }}>Training Complete</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>All models have been successfully updated. Download your trained models below.</p>
            </div>
          </div>
          
          {/* Download Resources Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Core Trained Models */}
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14}/> Trained Model Files
              </h4>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <a href={`${API_BASE}/download-file?name=encodings.pickle`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> encodings.pickle
                </a>
                <a href={`${API_BASE}/download-file?name=best_mobile_sideface.pth`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> best_mobile_sideface.pth
                </a>
                <a href={`${API_BASE}/download-file?name=mobile_classes.txt`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> mobile_classes.txt
                </a>
              </div>
              <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                These are the core trained model files used by the recognition system.
              </p>
            </div>

            {/* ONNX Mobile Exports */}
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14}/> Mobile Edge Exports (ONNX)
              </h4>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <a href={`${API_BASE}/download-file?name=sideface_mobile.onnx`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> sideface_mobile.onnx
                </a>
                <a href={`${API_BASE}/download-file?name=facenet512.onnx`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> facenet512.onnx
                </a>
                <a href={`${API_BASE}/download-file?name=class_centroids.json`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> class_centroids.json
                </a>
                <a href={`${API_BASE}/download-file?name=label_map.json`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> label_map.json
                </a>
              </div>
              <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                ONNX exports for mobile deployment. Export via the <Link to="/models" style={{ color: 'var(--accent-teal)' }}>Models Page</Link> first.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="terminal mt-4">
        <div className="terminal-header">
          <div className="term-dot"></div>
          <div className="term-dot"></div>
          <div className="term-dot"></div>
          <span style={{ marginLeft: '10px' }}><Terminal size={14} /> Training Log Output</span>
        </div>
        
        {logs.length === 0 ? (
          <div style={{ opacity: 0.5 }}>Waiting for training to start...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="terminal-line">{log}</div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}

function ModelProgressCard({ title, subtitle, percent, isTraining }) {
  let statusClass = 'status-ready'
  let statusText = 'Complete'
  
  if (percent === 0) {
    statusClass = 'status-missing'
    statusText = 'Pending'
  } else if (isTraining || percent < 100) {
    statusClass = 'status-training'
    statusText = 'Training...'
  }

  return (
    <div className="glass-panel model-card">
      <div className="model-header">
        <div>
          <div className="model-title">{title}</div>
          <div className="model-subtitle">{subtitle}</div>
        </div>
        <div className={`status-badge ${statusClass}`}>
          <div className="status-dot"></div>
          {statusText}
        </div>
      </div>
      
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  )
}
