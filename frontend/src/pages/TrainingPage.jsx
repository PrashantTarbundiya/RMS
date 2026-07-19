import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, CheckCircle, Download, Activity, Loader2 } from 'lucide-react';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">Model Refinement</h1>
        <p className="mt-1 text-caption text-ink-subtle">
          DeepFace embeddings are processed instantly. SOTA MobileNetV2 fine-tuning runs asynchronously in the background.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModelProgressCard title="DeepFace (Facenet512)" subtitle="Instant Embeddings" percent={dfPercent} isTraining={false} />
        <ModelProgressCard title="SOTA MobileNetV2" subtitle="Edge Optimized" percent={sotaPercent} isTraining={isTraining && sotaPercent < 100} />
      </div>

      <AnimatePresence>
        {(!isTraining && sotaPercent === 100) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="card-linear border-[#27A644]/20 bg-[#27A644]/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-[#27A644]" />
                  <div>
                    <h3 className="m-0 text-[#27A644] text-lg font-medium">Training Complete</h3>
                    <p className="m-0 mt-1 text-ink-subtle text-caption">All models have been successfully updated.</p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  <div className="p-4 bg-black/30 rounded-lg border border-[#23252A]">
                    <h4 className="m-0 mb-3 text-sm flex items-center gap-2 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">
                      <Terminal className="w-4 h-4 text-ink-tertiary" /> Core Models
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <a href={`${API_BASE}/download-file?name=encodings.pickle`} className="button-primary text-white text-caption flex items-center gap-2 h-9">
                        <Download className="w-4 h-4 text-white" /> encodings.pickle
                      </a>
                      <a href={`${API_BASE}/download-file?name=best_mobile_sideface.pth`} className="button-primary text-white text-caption flex items-center gap-2 h-9">
                        <Download className="w-4 h-4 text-white" /> best_mobile_sideface.pth
                      </a>
                    </div>
                  </div>

                  <div className="p-4 bg-black/30 rounded-lg border border-[#23252A]">
                    <h4 className="m-0 mb-3 text-sm flex items-center gap-2 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">
                      <Activity className="w-4 h-4 text-ink-tertiary" /> Edge Exports (ONNX)
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <a href={`${API_BASE}/download-file?name=sideface_mobile.onnx`} className="button-secondary text-caption flex items-center gap-2 h-9">
                        <Download className="w-4 h-4" /> sideface_mobile.onnx
                      </a>
                      <a href={`${API_BASE}/download-file?name=facenet512.onnx`} className="button-secondary text-caption flex items-center gap-2 h-9">
                        <Download className="w-4 h-4" /> facenet512.onnx
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card-linear p-6">
        <div className="flex items-center gap-2 border-b border-[#23252A] pb-3 mb-4">
          <Terminal className="w-4 h-4 text-ink-tertiary" />
          <h3 className="m-0 text-body font-mono text-ink-subtle">Terminal Output</h3>
        </div>
        
        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-ink-subtle h-[400px] overflow-y-auto border border-[#23252A]/50">
          {logs.length === 0 ? (
            <div className="opacity-50 flex items-center justify-center h-full gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#5E6AD2]" /> Waiting for training telemetry...
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-1 border-b border-white/5 flex">
                <span className="text-ink-muted mr-3 w-10 shrink-0 select-none">{String(i + 1).padStart(4, '0')}</span>
                <span className="break-all text-ink">{log}</span>
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
    <div className="card-linear p-6 flex flex-col justify-between h-full bg-[#0F1011] border-[#23252A]">
      <div className="flex flex-col h-full justify-between gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="m-0 text-body font-semibold text-ink font-display">{title}</h3>
            <p className="m-0 mt-1 text-caption text-ink-subtle">{subtitle}</p>
          </div>
          <span 
            className={`inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider ${
              status === 'success' ? 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20' : 
              status === 'progress' ? 'bg-[#5E6AD2]/10 text-[#828FFF] border-[#5E6AD2]/20 animate-pulse' : 
              'bg-[#141516] text-ink-muted border-[#23252A]'
            }`}
          >
            {statusText}
          </span>
        </div>
        
        <div>
          <div className="flex justify-between mb-2 text-xs text-ink-subtle font-mono">
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 bg-[#141516] rounded-full overflow-hidden border border-[#23252A]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'tween', duration: 0.5 }}
              className={`h-full ${status === 'success' ? 'bg-[#27A644]' : 'bg-[#5E6AD2]'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
