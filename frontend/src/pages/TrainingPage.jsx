import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, CheckCircle, Download, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Model Refinement</h1>
        <p className="mt-1 text-sm text-zinc-400">
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
            <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="m-0 text-emerald-500 text-lg font-medium">Training Complete</h3>
                    <p className="m-0 mt-1 text-zinc-400 text-sm">All models have been successfully updated.</p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                    <h4 className="m-0 mb-3 text-sm flex items-center gap-2 text-zinc-300">
                      <Terminal className="w-4 h-4" /> Core Models
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <Button asChild variant="secondary" size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                        <a href={`${API_BASE}/download-file?name=encodings.pickle`}>
                          <Download className="w-4 h-4 mr-2" /> encodings.pickle
                        </a>
                      </Button>
                      <Button asChild variant="secondary" size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                        <a href={`${API_BASE}/download-file?name=best_mobile_sideface.pth`}>
                          <Download className="w-4 h-4 mr-2" /> best_mobile_sideface.pth
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                    <h4 className="m-0 mb-3 text-sm flex items-center gap-2 text-zinc-300">
                      <Activity className="w-4 h-4" /> Edge Exports (ONNX)
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <Button asChild variant="outline" size="sm" className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                        <a href={`${API_BASE}/download-file?name=sideface_mobile.onnx`}>
                          <Download className="w-4 h-4 mr-2" /> sideface_mobile.onnx
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                        <a href={`${API_BASE}/download-file?name=facenet512.onnx`}>
                          <Download className="w-4 h-4 mr-2" /> facenet512.onnx
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h3 className="m-0 text-base font-mono text-zinc-300">Terminal Output</h3>
          </div>
          
          <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-zinc-400 h-[400px] overflow-y-auto border border-zinc-800/50">
            {logs.length === 0 ? (
              <div className="opacity-50 flex items-center justify-center h-full gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for training telemetry...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 border-b border-white/5 flex">
                  <span className="text-zinc-600 mr-3 w-10 shrink-0 select-none">{String(i + 1).padStart(4, '0')}</span>
                  <span className="break-all">{log}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ModelProgressCard({ title, subtitle, percent, isTraining }) {
  let status = percent === 0 ? 'default' : (isTraining || percent < 100) ? 'progress' : 'success';
  let statusText = percent === 0 ? 'Pending' : (isTraining || percent < 100) ? 'Training' : 'Complete';

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 flex flex-col justify-between">
      <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="m-0 text-lg font-medium text-zinc-100">{title}</h3>
            <p className="m-0 mt-1 text-sm text-zinc-500">{subtitle}</p>
          </div>
          <Badge variant={status === 'success' ? 'default' : status === 'progress' ? 'secondary' : 'outline'} 
                 className={status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : status === 'progress' ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'text-zinc-500 border-zinc-700'}>
            {statusText}
          </Badge>
        </div>
        
        <div>
          <div className="flex justify-between mb-2 text-sm text-zinc-300 font-mono">
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'tween', duration: 0.5 }}
              className={`h-full ${status === 'success' ? 'bg-emerald-500' : 'bg-violet-500'}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
