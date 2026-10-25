import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Terminal, CheckCircle, Download, Activity, Loader2, RefreshCw, Play, XCircle, Copy, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import EmptyState from '../components/ui/EmptyState';


export default function TrainingPage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isRetrigger, setIsRetrigger] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalContainerRef = useRef(null);
  const eventSourceRef = useRef(null);

  const connectToStream = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsTraining(true);
    const source = new EventSource(`${API_BASE}/train/status`);
    eventSourceRef.current = source;

    source.onmessage = (e) => {
      if (e.data === '[DONE]') {
        setIsTraining(false);
        toast.success('All models have finished training.');
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
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs.length, autoScroll]);

  const triggerRetrainAll = async () => {
    setIsRetrigger(true);
    try {
      await apiClient.post(`${API_BASE}/train/all`);
      toast.info('Full retraining started. Connecting to live log stream...');
      setLogs([]);
      // Reconnect to the SSE stream after a short delay
      setTimeout(connectToStream, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to trigger retraining.');
    } finally {
      setIsRetrigger(false);
    }
  };

  const handleDownloadFile = async (filename) => {
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
    }
  };

  const enableInsightFace = localStorage.getItem('enableInsightFace') === 'true';

  const extractProgress = () => {
    let facenet512 = 0;
    let insightface = 0;

    logs.forEach(line => {
      if (line.includes('Retraining Facenet512') || line.includes('Facenet512')) facenet512 = Math.max(facenet512, 30);
      if (line.includes('[OK] Facenet512') || line.includes('Facenet512 embeddings updated')) facenet512 = 100;
      if (line.includes('Retraining InsightFace') || line.includes('InsightFace')) insightface = Math.max(insightface, 30);
      if (line.includes('[OK] InsightFace') || line.includes('InsightFace embeddings updated')) insightface = 100;
      if (line.includes('[SUCCESS]') || line.includes('Models updated')) {
        facenet512 = 100;
        insightface = 100;
      }
    });

    if (isTraining && facenet512 === 0 && logs.length > 0) facenet512 = 5;

    return { facenet512, insightface };
  };

  const { facenet512, insightface } = extractProgress();
  const allDone = facenet512 === 100 && (!enableInsightFace || insightface === 100);

  const clearLogs = () => {
    setLogs([]);
    toast.info('Terminal cleared.');
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Logs copied to clipboard.');
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-headline font-semibold text-ink font-display">Model Refinement</h1>
          <p className="text-sm text-ink-subtle mt-1 max-w-xl">
            {enableInsightFace
              ? 'Retrains primary Facenet512 512-d embeddings and InsightFace verifier.'
              : 'Retrains authoritative Facenet512 512-d embeddings across all personnel.'}
          </p>
        </div>
        <button
          onClick={triggerRetrainAll}
          disabled={isTraining || isRetrigger}
          className="button-primary text-white flex items-center gap-2 h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrigger ? <Loader2 size={16} className="animate-spin text-white" /> : <Play size={16} className="text-white" />}
          {isTraining ? 'Training in Progress…' : 'Retrain Active Models'}
        </button>
      </div>

      {/* Model Progress Cards */}
      <div className={`grid grid-cols-1 ${enableInsightFace ? 'sm:grid-cols-2' : ''} gap-4`}>
        <ModelProgressCard title="Facenet512" subtitle="Primary 512-d Embedding" percent={facenet512} isTraining={isTraining && facenet512 < 100} />
        {enableInsightFace && (
          <ModelProgressCard title="InsightFace ArcFace" subtitle="Secondary ArcFace Verifier" percent={insightface} isTraining={isTraining && insightface < 100} />
        )}
      </div>

      {/* Training Complete Banner */}
      <AnimatePresence>
        {(!isTraining && allDone && logs.length > 0) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
            <div className="card-linear border-[#27A644]/20 bg-[#27A644]/5">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-[#27A644]" />
                  <div>
                    <h3 className="m-0 text-[#27A644] text-lg font-medium">Training Complete</h3>
                    <p className="m-0 mt-1 text-ink-subtle text-caption">Active facial recognition models have been successfully updated.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="p-4 bg-black/30 rounded-lg border border-[#23252A]">
                    <h4 className="m-0 mb-3 text-sm flex items-center gap-2 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">
                      <Terminal className="w-4 h-4 text-ink-tertiary" /> Encodings & Weights
                    </h4>
                    <div className="flex gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('encodings.pickle')}
                        className="button-primary text-white text-caption flex items-center gap-2 h-9 px-3"
                      >
                        <Download className="w-4 h-4 text-white" /> encodings.pickle (Facenet512)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('encodings_InsightFace.pickle')}
                        className="button-secondary text-ink text-caption flex items-center gap-2 h-9 px-3 border border-[#23252A] hover:border-[#2563EB]"
                      >
                        <Download className="w-4 h-4 text-ink-subtle" /> encodings_InsightFace.pickle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('best_mobile_sideface.pth')}
                        className="button-secondary text-ink text-caption flex items-center gap-2 h-9 px-3 border border-[#23252A] hover:border-[#2563EB]"
                      >
                        <Download className="w-4 h-4 text-ink-subtle" /> best_mobile_sideface.pth
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Output */}
      <div className="card-linear p-6">
        <div className="flex items-center justify-between border-b border-[#23252A] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-ink-tertiary" />
            <h3 className="m-0 text-body font-mono text-ink-subtle">Terminal Output</h3>
            {isTraining && <span className="w-2 h-2 rounded-full bg-[#27A644] animate-pulse" />}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-ink-tertiary cursor-pointer select-none mr-1">
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="accent-[#2563EB]" />
              Auto-scroll
            </label>
            <button
              type="button"
              onClick={copyLogs}
              disabled={logs.length === 0}
              className="h-7 px-2.5 rounded-md border border-[#23252A] bg-[#141516] hover:bg-[#1E2024] hover:border-[#60A5FA]/40 text-ink-subtle hover:text-ink text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="Copy terminal logs"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="h-7 px-2.5 rounded-md border border-[#23252A] bg-[#141516] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-ink-muted text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="Clear terminal output"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div ref={terminalContainerRef} className="bg-black/60 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-ink-subtle h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner">
          {logs.length === 0 ? (
            <EmptyState
              icon={Terminal}
              title="No training output"
              description={isTraining ? 'Waiting for training telemetry...' : 'Click "Retrain All Models" to start a new training session.'}
            />
          ) : (
            logs.map((log, i) => (
                <div key={i} className="py-0.5 border-b border-white/[0.02] flex">
                  <span className="text-ink-muted mr-4 w-9 shrink-0 select-none text-right font-normal">
                    {String(i + 1).padStart(4, '0')}
                  </span>
                  <span className={`break-all flex-1 ${
                    log.includes('[ERROR]') || log.includes('failed') ? 'text-[#F87171] font-medium' :
                    log.includes('[WARNING]') ? 'text-amber-400' :
                    log.includes('[SUCCESS]') || log.includes('[OK]') ? 'text-[#4ade80]' : ''
                  }`}>
                    {log}
                  </span>
                </div>
              ))
          )}
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
              status === 'progress' ? 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/20 animate-pulse' :
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
              className={`h-full ${status === 'success' ? 'bg-[#27A644]' : 'bg-[#2563EB]'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
