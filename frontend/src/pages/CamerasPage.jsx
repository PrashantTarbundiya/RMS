import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Camera, Plus, Trash2, Key, Copy, Check, ShieldCheck, MapPin, Cpu, Monitor, Sun, RotateCcw, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

export default function CamerasPage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamLocation, setNewCamLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCam, setCreatedCam] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Edge benchmark state
  const [edgeResults, setEdgeResults] = useState(null);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [edgeTab, setEdgeTab] = useState('resolution');

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/cameras`);
      setCameras(res.data.cameras || []);
      setError('');
    } catch (err) {
      console.warn('Failed to load cameras', err);
      setError('Failed to fetch cameras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    fetchEdgeResults();
  }, [apiClient]);

  const fetchEdgeResults = async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/edge/camera-spec-test`);
      if (res.data?.results) setEdgeResults(res.data.results);
    } catch (err) {
      // No cached results yet — that's fine
    }
  };

  const runEdgeEvaluation = async () => {
    setEdgeLoading(true);
    try {
      const res = await apiClient.get(`${API_BASE}/edge/camera-spec-test?run=true`);
      if (res.data?.results) setEdgeResults(res.data.results);
    } catch (err) {
      setError('Edge evaluation failed. Ensure model is trained.');
    } finally {
      setEdgeLoading(false);
    }
  };

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    if (!newCamName.trim()) return;
    try {
      setSubmitting(true);
      const res = await apiClient.post(`${API_BASE}/cameras`, {
        name: newCamName.trim(),
        location: newCamLocation.trim()
      });
      setCreatedCam(res.data.camera);
      sessionStorage.setItem('onboarding_camera_added', 'true');
      setNewCamName('');
      setNewCamLocation('');
      setShowAddModal(false);
      fetchCameras();
      toast.success(`Camera "${res.data.camera?.name || newCamName}" registered.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create camera');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCamera = async (camId) => {
    if (!window.confirm('Are you sure you want to remove this camera?')) return;
    try {
      await apiClient.delete(`${API_BASE}/cameras/${camId}`);
      fetchCameras();
      toast.success('Camera removed.');
    } catch (err) {
      toast.error('Failed to delete camera.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-headline font-semibold text-ink">Camera & Edge Management</h1>
          <p className="mt-1 text-caption text-ink-subtle">
            Manage hardware kiosks and security camera streams authenticated via secure API keys.
          </p>
        </div>
        <button
          data-tour="add-camera-btn"
          onClick={() => { setCreatedCam(null); setShowAddModal(true); }}
          className="button-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-button text-white">Add Camera</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20 text-caption">
          {error}
        </div>
      )}

      {createdCam && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 space-y-3"
        >
          <div className="flex items-center gap-2 text-[#828FFF] font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#828FFF]" />
            <span>Camera Registered Successfully</span>
          </div>
          <p className="text-caption text-ink-subtle">
            Copy the generated device key below. Think of it like a separate password just for this device.
          </p>
          <div className="flex items-center gap-2 bg-[#0F1011] p-3 rounded border border-[#23252A]">
            <Key className="w-4 h-4 text-ink-tertiary shrink-0" />
            <code className="font-mono text-xs text-[#828FFF] flex-1 break-all">{createdCam.api_key}</code>
            <button
              onClick={() => copyToClipboard(createdCam.api_key)}
              className="p-1.5 rounded hover:bg-[#1C1D1F] text-ink-subtle hover:text-ink transition-colors"
            >
              {copiedKey ? <Check className="w-4 h-4 text-[#27A644]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      )}

      <div data-tour="camera-list" className="card-linear">
        {loading ? (
          <div className="py-12 text-center text-ink-tertiary text-caption">Loading cameras...</div>
        ) : cameras.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Camera className="w-10 h-10 text-ink-tertiary mx-auto opacity-50" />
            <p className="text-caption text-ink-subtle font-medium">No cameras registered yet</p>
            <p className="text-[12px] text-ink-tertiary max-w-sm mx-auto">
              Add your first physical kiosk or security camera feed to begin scanning.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#23252A]">
            {cameras.map((cam) => (
              <div key={cam.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#141516] border border-[#23252A] text-ink-muted">
                    <Camera className="w-5 h-5 text-[#828FFF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium text-ink">{cam.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20">
                        Active
                      </span>
                    </div>
                    {cam.location && (
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-ink-tertiary">
                        <MapPin className="w-3 h-3" />
                        <span>{cam.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDeleteCamera(cam.id)}
                    className="p-2 rounded hover:bg-[#F87171]/10 text-ink-tertiary hover:text-[#F87171] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Edge & Hardware Specification Matrix ═══ */}
      <div className="card-linear">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#828FFF]" />
            <h2 className="text-body font-semibold text-ink">Edge & Hardware Specification Matrix</h2>
          </div>
          <button
            onClick={runEdgeEvaluation}
            disabled={edgeLoading}
            className="button-secondary text-caption flex items-center gap-1.5"
          >
            {edgeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {edgeLoading ? 'Running...' : 'Run Evaluation'}
          </button>
        </div>

        {!edgeResults && !edgeLoading && (
          <div className="py-8 text-center space-y-2">
            <Monitor className="w-8 h-8 text-ink-tertiary mx-auto opacity-50" />
            <p className="text-caption text-ink-subtle">No evaluation data yet</p>
            <p className="text-[11px] text-ink-tertiary max-w-sm mx-auto">
              Click "Run Evaluation" to empirically test your recognition pipeline across camera resolutions, distances, lighting, and angles.
            </p>
          </div>
        )}

        {edgeLoading && (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-[#828FFF] mx-auto animate-spin" />
            <p className="text-caption text-ink-subtle">Running evaluation benchmarks...</p>
            <p className="text-[11px] text-ink-tertiary">This may take several minutes.</p>
          </div>
        )}

        {edgeResults && !edgeLoading && (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 p-1 bg-[#0F1011] rounded-lg border border-[#23252A]">
              {[
                { id: 'resolution', label: 'Resolution', icon: Monitor },
                { id: 'lighting', label: 'Lighting', icon: Sun },
                { id: 'angle', label: 'Angles', icon: RotateCcw },
                { id: 'fps', label: 'FPS', icon: Camera },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setEdgeTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-semibold transition-all ${
                    edgeTab === tab.id
                      ? 'bg-[#5E6AD2]/15 text-[#828FFF] border border-[#5E6AD2]/30'
                      : 'text-ink-tertiary hover:text-ink-muted'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Resolution Table */}
            {edgeTab === 'resolution' && edgeResults.resolution && (
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="border-b border-[#23252A]">
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Camera</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Distance</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Face Pixels</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Accuracy</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Latency</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeResults.resolution.map((r, i) => (
                      <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30">
                        <td className="py-2.5 px-3 text-ink font-medium">{r.config?.split(' @')[0]}</td>
                        <td className="py-2.5 px-3 text-ink-muted">{r.distance}</td>
                        <td className="py-2.5 px-3 text-ink-muted font-mono">{r.face_px}px</td>
                        <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: r.accuracy >= 95 ? '#27A644' : r.accuracy >= 80 ? '#F59E0B' : '#F87171' }}>{r.accuracy}%</td>
                        <td className="py-2.5 px-3 text-ink-tertiary font-mono">{r.avg_latency_ms}ms</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${r.passed ? 'bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20' : 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20'}`}>
                            {r.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lighting Table */}
            {edgeTab === 'lighting' && edgeResults.lighting && (
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="border-b border-[#23252A]">
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Condition</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Gamma</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Accuracy</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeResults.lighting.map((r, i) => (
                      <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30">
                        <td className="py-2.5 px-3 text-ink font-medium">{r.condition}</td>
                        <td className="py-2.5 px-3 text-ink-muted font-mono">{r.gamma}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: r.accuracy >= 90 ? '#27A644' : r.accuracy >= 70 ? '#F59E0B' : '#F87171' }}>{r.accuracy}%</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${r.passed ? 'bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20' : 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20'}`}>
                            {r.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Angle Table */}
            {edgeTab === 'angle' && edgeResults.angle && (
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="border-b border-[#23252A]">
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Viewing Angle</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Accuracy</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Samples</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeResults.angle.map((r, i) => (
                      <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30">
                        <td className="py-2.5 px-3 text-ink font-medium">{r.angle}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: r.accuracy >= 90 ? '#27A644' : r.accuracy >= 70 ? '#F59E0B' : '#F87171' }}>{r.accuracy}%</td>
                        <td className="py-2.5 px-3 text-ink-tertiary font-mono">{r.correct}/{r.tested}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${r.passed ? 'bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20' : 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20'}`}>
                            {r.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* FPS Table */}
            {edgeTab === 'fps' && edgeResults.fps && (
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="border-b border-[#23252A]">
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">FPS Setting</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Blur Kernel</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Accuracy</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeResults.fps.map((r, i) => (
                      <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30">
                        <td className="py-2.5 px-3 text-ink font-medium">{r.fps}</td>
                        <td className="py-2.5 px-3 text-ink-muted font-mono">{r.blur_kernel}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: r.accuracy >= 90 ? '#27A644' : r.accuracy >= 70 ? '#F59E0B' : '#F87171' }}>{r.accuracy}%</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${r.passed ? 'bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20' : 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20'}`}>
                            {r.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#141516] border border-[#23252A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-body font-semibold text-ink">Register New Camera</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-ink-tertiary hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCamera} className="space-y-4">
              <div>
                <label className="text-caption text-ink-muted font-medium block mb-1">Camera Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Main Lobby Gate 1"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  required
                  className="input-linear w-full h-10 px-3 text-caption"
                />
              </div>
              <div>
                <label className="text-caption text-ink-muted font-medium block mb-1">Location / Zone (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Building A - Entrance"
                  value={newCamLocation}
                  onChange={(e) => setNewCamLocation(e.target.value)}
                  className="input-linear w-full h-10 px-3 text-caption"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="button-secondary text-caption"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newCamName.trim()}
                  className="button-primary text-caption text-white"
                >
                  {submitting ? 'Creating...' : 'Register Camera'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
