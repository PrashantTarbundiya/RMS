import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, CheckCircle, Download, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';




export default function TrainingPage() {
  const [logs, setLogs] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const logsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  const connectToStream = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsTraining(true);
    const source = new EventSource(`${API_BASE}/train/status`);
    eventSourceRef.current = source;

    source.onmessage = (e) => {
      if (e.data === '[DONE]') {
        setIsTraining(false);
        source.close();
      } else {
        setLogs(prev => [...prev, e.data]);
      }
    };

    source.onerror = () => {
      source.close();
      setIsTraining(false);
    };
  };

  useEffect(() => {
    connectToStream();
    return () => { if (eventSourceRef.current) eventSourceRef.current.close(); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const extractProgress = () => {
    let sotaPercent = 0;
    let dfPercent = 100;
    let currentBlock = null;

    for (let i = 0; i < logs.length; i++) {
        const line = logs[i];
        if (line.includes('SOTA MobileNetV2: Fine-tuning') || line.includes('Starting background model refinement')) {
            currentBlock = 'sota';
            sotaPercent = 5;
        } else if (line.includes('Pipeline Completed') || line.includes('Saved updated model: sota_finetune') || line.includes('Saved updated model: best_mobile_sideface')) {
            sotaPercent = 100;
            break;
        }
        if (line.includes('Epoch [')) {
            const match = line.match(/Epoch \[(\d+)\/(\d+)\]/);
            if (match) {
                const currentE = parseInt(match[1], 10);
                const totalE = parseInt(match[2], 10);
                const p = Math.floor((currentE / totalE) * 100);
                if (currentBlock === 'sota') sotaPercent = p === 100 ? 99 : p;
            }
        }
    }
    if (isTraining && sotaPercent === 0) sotaPercent = 1;
    return { dfPercent, sotaPercent };
  };

  const { dfPercent, sotaPercent } = extractProgress();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>Model Refinement</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
          DeepFace embeddings are processed instantly. SOTA MobileNetV2 fine-tuning runs asynchronously in the background.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <ModelProgressCard title="DeepFace (Facenet512)" subtitle="Instant Embeddings" percent={dfPercent} isTraining={false} />
        <ModelProgressCard title="SOTA MobileNetV2" subtitle="Edge Optimized" percent={sotaPercent} isTraining={isTraining && sotaPercent < 100} />
      </div>

      <AnimatePresence>
        {(!isTraining && sotaPercent === 100) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--space-6)' }}>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ background: 'var(--success-bg)', borderColor: 'rgba(48, 209, 88, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <CheckCircle size={24} color="var(--confirm-green)" />
                <div>
                  <h3 style={{ margin: 0, color: 'var(--confirm-green)', fontSize: 'var(--text-lg)' }}>Training Complete</h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>All models have been successfully updated.</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} /> Core Models
                  </h4>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as="a" href={`${API_BASE}/download-file?name=encodings.pickle`} variant="primary" size="sm">
                      <Download size={14} style={{ marginRight: '6px' }} /> encodings.pickle
                    </button>
                    <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as="a" href={`${API_BASE}/download-file?name=best_mobile_sideface.pth`} variant="primary" size="sm">
                      <Download size={14} style={{ marginRight: '6px' }} /> best_mobile_sideface.pth
                    </button>
                  </div>
                </div>

                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} /> Edge Exports (ONNX)
                  </h4>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as="a" href={`${API_BASE}/download-file?name=sideface_mobile.onnx`} variant="secondary" size="sm">
                      <Download size={14} style={{ marginRight: '6px' }} /> sideface_mobile.onnx
                    </button>
                    <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as="a" href={`${API_BASE}/download-file?name=facenet512.onnx`} variant="secondary" size="sm">
                      <Download size={14} style={{ marginRight: '6px' }} /> facenet512.onnx
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <Terminal size={16} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)' }}>Terminal Output</h3>
        </div>
        
        <div style={{ 
          background: '#0a0a0a', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', 
          fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a3a3a3', height: '400px', overflowY: 'auto' 
        }}>
          {logs.length === 0 ? (
            <div style={{ opacity: 0.5 }}>Waiting for training telemetry...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#666', marginRight: '10px' }}>{String(i + 1).padStart(4, '0')}</span>
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </motion.div>
  );
}

function ModelProgressCard({ title, subtitle, percent, isTraining }) {
  let status = percent === 0 ? 'default' : (isTraining || percent < 100) ? 'progress' : 'success';
  let statusText = percent === 0 ? 'Pending' : (isTraining || percent < 100) ? 'Training' : 'Complete';

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h3>
          <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{subtitle}</p>
        </div>
        <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-xs" status={status}>{statusText}</span>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{percent}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'tween', duration: 0.5 }}
            style={{ height: '100%', background: status === 'success' ? 'var(--confirm-green)' : 'var(--accent-violet)' }}
          />
        </div>
      </div>
    </div>
  );
}
