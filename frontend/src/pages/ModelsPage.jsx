import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Trash2, Box, Cpu, AlertTriangle, Settings, Save, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ModelsPage() {
  const { apiClient } = useAuth();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [config, setConfig] = useState(null);
  const [threshold, setThreshold] = useState(0.35);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [enableDeepFace, setEnableDeepFace] = useState(() => {
    return localStorage.getItem('enableDeepFace') !== 'false';
  });

  const handleToggleDeepFace = (checked) => {
    setEnableDeepFace(checked);
    localStorage.setItem('enableDeepFace', checked ? 'true' : 'false');
    // dispatch a custom event to notify other pages immediately if needed
    window.dispatchEvent(new Event('storage'));
  };

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Model Management</h1>
        <p className="mt-1 text-sm text-zinc-400">Export models for edge deployment or reset the system.</p>
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
              status.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
              status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}>
              {status.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              {status.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enableDeepFace && (
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-medium text-zinc-100">DeepFace 512</div>
                  <div className="text-sm text-zinc-500 font-mono">encodings.pickle</div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 m-0">
                Stores raw L2-normalized embeddings using Facenet512.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className={`bg-zinc-900/40 border-zinc-800 ${!enableDeepFace ? 'md:col-span-2' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-medium text-zinc-100">MobileNetV2</div>
                <div className="text-sm text-zinc-500 font-mono">best_mobile_sideface.pth</div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 m-0">
              SOTA lightweight model explicitly trained for edge device inference.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        
        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5" /> System Settings
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Adjust global recognition parameters and toggle active modules.
            </p>
            
            <div className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl mb-6">
              <div>
                <Label htmlFor="deepface-toggle" className="text-sm font-medium text-zinc-200 cursor-pointer">Enable DeepFace (Ensemble Model)</Label>
                <p className="text-xs text-zinc-500 mt-1">Run secondary deep embedding comparison alongside SOTA MobileNetV2.</p>
              </div>
              <Switch id="deepface-toggle" checked={enableDeepFace} onCheckedChange={handleToggleDeepFace} />
            </div>
            
            {enableDeepFace ? (
              <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800">
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-sm font-medium text-zinc-300">DeepFace Confirmation Threshold</label>
                   <span className="text-cyan-400 font-mono font-semibold">{threshold.toFixed(2)}</span>
                 </div>
                 <p className="text-xs text-zinc-500 mb-6">
                   Lower values = Stricter matching (fewer false positives). Higher values = Looser matching (fewer false negatives). Default is 0.35.
                 </p>
                 <div className="flex items-center gap-4 mb-6">
                   <span className="text-xs text-zinc-500">0.10 (Strict)</span>
                   <input 
                     type="range" min="0.10" max="0.50" step="0.01" value={threshold} 
                     onChange={(e) => setThreshold(parseFloat(e.target.value))}
                     className="flex-1 accent-cyan-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                   />
                   <span className="text-xs text-zinc-500">0.50 (Loose)</span>
                 </div>
                 <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                   {isSavingConfig ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>}
                 </Button>
              </div>
            ) : (
              <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800 text-center py-6 text-zinc-400 text-sm">
                <Info className="w-5 h-5 text-cyan-500 mx-auto mb-2" />
                DeepFace is currently disabled. Face recognition runs strictly using the SOTA MobileNetV2 model with a default confidence threshold of <span className="font-mono font-semibold text-zinc-200">0.80</span>.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2 mb-2">
              <Download className="w-5 h-5" /> Export MobileNetV2 for Edge
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Convert the trained PyTorch MobileNetV2 model into an ONNX format to deploy directly to iOS/Android apps or edge devices.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport} disabled={isExporting} variant="outline" className="bg-zinc-950/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                {isExporting ? 'Exporting...' : <><Cpu className="w-4 h-4 mr-2" /> 1. Generate ONNX Model</>}
              </Button>
              <Button onClick={handleDownload} variant="default" className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20">
                <Download className="w-4 h-4 mr-2" /> 2. Download ONNX File
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500/50 to-transparent"></div>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-red-500 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Resetting the system will permanently delete all trained models (DeepFace and MobileNetV2) and all collected identity datasets. You will need to re-register everyone.
            </p>
            
            {showConfirm ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-red-500/30 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-zinc-300">Are you absolutely sure? This action cannot be undone.</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">Cancel</Button>
                  <Button variant="destructive" onClick={handleReset} disabled={isResetting} className="bg-red-500 hover:bg-red-600 text-white">
                    {isResetting ? 'Resetting...' : 'Yes, Delete Everything'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowConfirm(true)} variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
                <Trash2 className="w-4 h-4 mr-2" /> Factory Reset AI
              </Button>
            )}
          </CardContent>
        </Card>

      </div>
    </motion.div>
  );
}
