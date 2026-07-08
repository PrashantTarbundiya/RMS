import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Terminal, CheckCircle, Download } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:5000/api'

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
    let cnnPercent = 0
    let dfPercent = isTraining ? 50 : (logs.length > 5 ? 100 : 0)

    let currentBlock = null

    for (let i = 0; i < logs.length; i++) {
        const line = logs[i]
        if (line.includes('Custom CNN: Fine-tuning')) {
            currentBlock = 'cnn'
            cnnPercent = 5
        } else if (line.includes('SOTA MobileNetV2: Fine-tuning')) {
            currentBlock = 'sota'
            cnnPercent = 100 
            sotaPercent = 5
        } else if (line.includes('Pipeline Completed') || line.includes('Saved updated model: sota_finetune')) {
            cnnPercent = 100
            dfPercent = 100
            sotaPercent = 100
            break
        }

        if (line.includes('Epoch [')) {
            const match = line.match(/Epoch \[(\d+)\/(\d+)\]/)
            if (match) {
                const currentE = parseInt(match[1], 10)
                const totalE = parseInt(match[2], 10)
                const p = Math.floor((currentE / totalE) * 100)
                if (currentBlock === 'cnn') cnnPercent = p === 100 ? 99 : p 
                if (currentBlock === 'sota') sotaPercent = p === 100 ? 99 : p 
            }
        }
    }

    return { dfPercent, cnnPercent, sotaPercent }
  }

  const { dfPercent, cnnPercent, sotaPercent } = extractProgress()

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Training Status</h1>
      <p className="page-subtitle">Real-time training logs for the 3 face recognition models.</p>

      <div className="card-grid">
        <ModelProgressCard 
          title="DeepFace (Facenet512)" 
          subtitle="Incremental Embeddings" 
          percent={dfPercent} 
          isTraining={isTraining && dfPercent < 100}
        />
        <ModelProgressCard 
          title="Custom CNN" 
          subtitle="PyTorch Fine-Tuning" 
          percent={cnnPercent} 
          isTraining={isTraining && cnnPercent > 0 && cnnPercent < 100}
        />
        <ModelProgressCard 
          title="SOTA MobileNetV2" 
          subtitle="Edge Optimized" 
          percent={sotaPercent} 
          isTraining={isTraining && sotaPercent > 0 && sotaPercent < 100}
        />
      </div>

      {(!isTraining && sotaPercent === 100) && (
        <div className="glass-panel" style={{ 
          marginTop: '2rem', padding: '1.5rem', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          background: 'var(--success-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <CheckCircle size={32} color="var(--success)" />
            <div>
              <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '1.2rem' }}>Training Complete</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>All models have been successfully updated. Your mobile edge models are ready for export.</p>
            </div>
          </div>
          
          {/* Download Resources Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href={`${API_BASE}/download-file?name=sideface_mobile.onnx`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> SOTA: sideface_mobile.onnx
              </a>
              <Link to="/models" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Go to Models Page
              </Link>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14}/> DeepFace Mobile Exports (Facenet512)
              </h4>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
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
                Download these three files to use Facenet512 locally in React Native via <code>onnxruntime-react-native</code>.
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
