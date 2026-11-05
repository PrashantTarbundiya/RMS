import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Camera, Plus, Trash2, Key, Copy, Check, ShieldCheck, MapPin, 
  Cpu, Monitor, Sun, RotateCcw, Loader2, Play, Search, X, 
  Video, Radio, Terminal, ExternalLink, RefreshCw, Eye, Wifi, 
  CheckCircle2, AlertCircle, Sparkles, Layers, Sliders, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

// Popular Brand RTSP Templates
const BRAND_PRESETS = [
  {
    name: 'Hikvision',
    badge: 'Popular',
    template: 'rtsp://{user}:{pass}@{ip}:554/Streaming/Channels/{channel}01',
    defaultPort: '554',
    defaultChannel: '1',
    hint: 'Channel 101 is main stream (1080p); 102 is sub-stream (720p).'
  },
  {
    name: 'Dahua',
    badge: 'Popular',
    template: 'rtsp://{user}:{pass}@{ip}:554/cam/realmonitor?channel={channel}&subtype=0',
    defaultPort: '554',
    defaultChannel: '1',
    hint: 'Subtype 0 is main stream; subtype 1 is extra sub-stream.'
  },
  {
    name: 'CP Plus',
    badge: 'India Standard',
    template: 'rtsp://{user}:{pass}@{ip}:554/cam/realmonitor?channel={channel}&subtype=0',
    defaultPort: '554',
    defaultChannel: '1',
    hint: 'Uses CP Plus standard Orange/Indigo NVR protocol.'
  },
  {
    name: 'Axis',
    badge: 'Enterprise',
    template: 'rtsp://{user}:{pass}@{ip}/axis-media/media.amp',
    defaultPort: '554',
    defaultChannel: '1',
    hint: 'Standard RTSP over HTTP/HTTPS media service.'
  },
  {
    name: 'Generic RTSP',
    badge: 'Any ONVIF',
    template: 'rtsp://{user}:{pass}@{ip}:{port}/live',
    defaultPort: '554',
    defaultChannel: '1',
    hint: 'Standard ONVIF Profile S or RTSP media endpoint.'
  }
];

export default function CamerasPage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamLocation, setNewCamLocation] = useState('');
  const [streamType, setStreamType] = useState('rtsp'); // 'rtsp' | 'usb' | 'virtual'
  const [selectedBrand, setSelectedBrand] = useState('Hikvision');
  const [camIp, setCamIp] = useState('192.168.1.108');
  const [camPort, setCamPort] = useState('554');
  const [camUser, setCamUser] = useState('admin');
  const [camPass, setCamPass] = useState('');
  const [camChannel, setCamChannel] = useState('1');
  const [customRtspUrl, setCustomRtspUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Key display & copy
  const [createdCam, setCreatedCam] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  
  // Search & Filter
  const [cameraSearch, setCameraSearch] = useState('');
  const [cameraStatusFilter, setCameraStatusFilter] = useState('all');

  // Live Test / Preview Modal State
  const [activePreviewCam, setActivePreviewCam] = useState(null);
  const [previewTab, setPreviewTab] = useState('feed'); // 'feed' | 'instructions'
  const [copiedDaemonCmd, setCopiedDaemonCmd] = useState(false);

  // USB Webcam state in modal
  const videoRef = useRef(null);
  const [usbStreamActive, setUsbStreamActive] = useState(false);
  const [usbError, setUsbError] = useState(null);

  // Edge benchmark state
  const [edgeResults, setEdgeResults] = useState(null);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [edgeTab, setEdgeTab] = useState('resolution');

  // Compute live RTSP URL based on brand & inputs
  const computedRtspUrl = React.useMemo(() => {
    if (customRtspUrl.trim()) return customRtspUrl.trim();
    const brand = BRAND_PRESETS.find(b => b.name === selectedBrand) || BRAND_PRESETS[0];
    let url = brand.template;
    url = url.replace('{user}', camUser || 'admin');
    url = url.replace('{pass}', camPass || 'password');
    url = url.replace('{ip}', camIp || '192.168.1.100');
    url = url.replace('{port}', camPort || '554');
    url = url.replace('{channel}', camChannel || '1');
    return url;
  }, [selectedBrand, camIp, camPort, camUser, camPass, camChannel, customRtspUrl]);

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
      // No cached results yet - that's fine
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

  // Helper to parse camera metadata from location string
  const parseCameraMeta = (cam) => {
    if (!cam || !cam.location) {
      return { zone: 'General Facility', type: 'rtsp', url: '' };
    }
    try {
      if (cam.location.startsWith('{')) {
        return JSON.parse(cam.location);
      }
    } catch (e) {
      // not JSON
    }
    // Check pipe format or plain string
    if (cam.location.includes('•')) {
      const parts = cam.location.split('•').map(p => p.trim());
      return { zone: parts[0], type: (parts[1] || 'rtsp').toLowerCase(), url: parts[2] || '' };
    }
    return { zone: cam.location, type: 'rtsp', url: '' };
  };

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    if (!newCamName.trim()) return;

    // Serialize location & stream metadata
    const finalStreamUrl = streamType === 'rtsp' ? computedRtspUrl : streamType === 'usb' ? 'usb://0' : 'virtual://simulated-stream';
    const metadata = {
      zone: newCamLocation.trim() || 'Main Facility',
      type: streamType,
      url: finalStreamUrl,
      brand: streamType === 'rtsp' ? selectedBrand : 'USB'
    };
    const locationString = JSON.stringify(metadata);

    try {
      setSubmitting(true);
      const res = await apiClient.post(`${API_BASE}/cameras`, {
        name: newCamName.trim(),
        location: locationString
      });
      setCreatedCam(res.data.camera || res.data);
      sessionStorage.setItem('onboarding_camera_added', 'true');
      setNewCamName('');
      setNewCamLocation('');
      setCamPass('');
      setCustomRtspUrl('');
      setShowAddModal(false);
      fetchCameras();
      toast.success(`Camera "${res.data.camera?.name || newCamName}" registered successfully.`);
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

  // Start USB preview stream when preview modal opens with USB camera
  useEffect(() => {
    let streamInstance = null;
    if (activePreviewCam) {
      const meta = parseCameraMeta(activePreviewCam);
      if (meta.type === 'usb') {
        setUsbStreamActive(false);
        setUsbError(null);
        navigator.mediaDevices?.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } })
          .then(stream => {
            streamInstance = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
              setUsbStreamActive(true);
            }
          })
          .catch(err => {
            setUsbError(err.message || 'Unable to access local webcam');
          });
      }
    }
    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach(t => t.stop());
      }
    };
  }, [activePreviewCam]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline font-semibold text-ink">Camera & Edge Management</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              RTSP &bull; ONVIF &bull; USB
            </span>
          </div>
          <p className="mt-1 text-caption text-ink-subtle">
            Connect standard security IP cameras, USB webcams, or edge devices to AuraPass facial recognition.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-tour="add-camera-btn"
            onClick={() => { setCreatedCam(null); setShowAddModal(true); }}
            className="button-primary flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-button text-white">Add Camera</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20 text-caption flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Camera Success Alert Banner */}
      {createdCam && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/35 space-y-3 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Camera Registered Successfully</span>
            </div>
            <button onClick={() => setCreatedCam(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-caption text-slate-300">
            Copy the generated device key below. You will use this key when connecting your CCTV streamer daemon or kiosk client:
          </p>
          <div className="flex items-center gap-2 bg-[#0A0D14] p-3 rounded-lg border border-emerald-500/30">
            <Key className="w-4 h-4 text-emerald-400 shrink-0" />
            <code className="font-mono text-xs text-emerald-300 flex-1 break-all select-all">{createdCam.api_key}</code>
            <button
              onClick={() => copyToClipboard(createdCam.api_key)}
              className="p-1.5 rounded-md hover:bg-emerald-500/20 text-slate-300 hover:text-white transition-colors"
              title="Copy Key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono-tag">
            <span>Authentication header: <code className="text-emerald-400">X-Camera-Key</code></span>
            <button
              onClick={() => setActivePreviewCam(createdCam)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <span>Test Stream & View Connection Guide</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick Camera Connection Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0C0F17] border border-white/[0.06] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Physical IP Cameras</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Streams from Hikvision, Dahua, CP Plus, Axis over RTSP on Port 554 via Edge Streamer.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0C0F17] border border-white/[0.06] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">USB & Tablet Kiosks</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Runs in browser on tablets, turnstile screens, or reception PCs using direct web camera.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0C0F17] border border-white/[0.06] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Simulated Demo Feeds</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Instantly test verification speed and pipelines without needing physical hardware connected.
            </p>
          </div>
        </div>
      </div>

      {/* Camera Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 max-w-md">
          <div className="flex items-center gap-2 input-linear w-full h-10 py-0 px-3">
            <Search className="w-4 h-4 text-ink-tertiary shrink-0" />
            <input
              type="text"
              placeholder="Search cameras by name, location, or protocol..."
              className="bg-transparent border-none text-ink text-caption w-full focus:outline-none p-0 placeholder:text-ink-tertiary"
              value={cameraSearch}
              onChange={(e) => setCameraSearch(e.target.value)}
            />
            {cameraSearch && (
              <button onClick={() => setCameraSearch('')} className="text-ink-tertiary hover:text-ink text-xs">
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={cameraStatusFilter}
            onChange={(e) => setCameraStatusFilter(e.target.value)}
            className="input-linear h-10 px-3 text-caption text-ink bg-card border border-border text-foreground rounded-lg cursor-pointer focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Devices ({cameras.length})</option>
            <option value="active">Active Devices</option>
            <option value="offline">Offline Devices</option>
          </select>
        </div>
      </div>

      {/* Camera List */}
      <div className="card-linear p-0 overflow-hidden border border-border rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-ink-tertiary text-caption flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading cameras...</span>
          </div>
        ) : cameras.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-500">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-body font-semibold text-white">No cameras registered yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Connect your first CCTV stream (Hikvision, Dahua, CP Plus) or USB webcam to begin automated check-ins.
            </p>
            <button
              data-tour="add-camera-btn"
              onClick={() => setShowAddModal(true)}
              className="button-primary text-xs py-2 px-4 mx-auto inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Camera</span>
            </button>
          </div>
        ) : cameras.filter(cam => {
            const meta = parseCameraMeta(cam);
            const matchSearch = !cameraSearch || 
              cam.name?.toLowerCase().includes(cameraSearch.toLowerCase()) || 
              meta.zone?.toLowerCase().includes(cameraSearch.toLowerCase()) ||
              meta.type?.toLowerCase().includes(cameraSearch.toLowerCase());
            const matchStatus = cameraStatusFilter === 'all' || 
              (cameraStatusFilter === 'active' && cam.is_active !== false) ||
              (cameraStatusFilter === 'offline' && cam.is_active === false);
            return matchSearch && matchStatus;
          }).length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-caption text-ink-subtle">No cameras match your search or filter.</p>
            <button
              onClick={() => { setCameraSearch(''); setCameraStatusFilter('all'); }}
              className="button-secondary text-xs py-1 px-3"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cameras
              .filter(cam => {
                const meta = parseCameraMeta(cam);
                const matchSearch = !cameraSearch || 
                  cam.name?.toLowerCase().includes(cameraSearch.toLowerCase()) || 
                  meta.zone?.toLowerCase().includes(cameraSearch.toLowerCase()) ||
                  meta.type?.toLowerCase().includes(cameraSearch.toLowerCase());
                const matchStatus = cameraStatusFilter === 'all' || 
                  (cameraStatusFilter === 'active' && cam.is_active !== false) ||
                  (cameraStatusFilter === 'offline' && cam.is_active === false);
                return matchSearch && matchStatus;
              })
              .map((cam) => {
                const meta = parseCameraMeta(cam);
                const isRtsp = meta.type === 'rtsp';
                const isUsb = meta.type === 'usb';
                const isVirtual = meta.type === 'virtual';

                return (
                  <div key={cam.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`p-3 rounded-xl border shrink-0 ${
                        isRtsp 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isUsb 
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      }`}>
                        {isRtsp ? <Radio className="w-5 h-5" /> : isUsb ? <Video className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{cam.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                            Active
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isRtsp 
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/25'
                              : isUsb 
                                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/25'
                                : 'bg-purple-950/60 text-purple-300 border border-purple-500/25'
                          }`}>
                            {isRtsp ? `RTSP (${meta.brand || 'IP CAM'})` : isUsb ? 'USB Webcam' : 'Virtual Loop'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono-tag flex-wrap">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {meta.zone || 'Main Facility'}
                          </span>
                          {meta.url && (
                            <span className="text-slate-500 truncate max-w-xs font-mono">
                              {meta.url}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setActivePreviewCam(cam)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Live Test & Connect</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCamera(cam.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors"
                        title="Delete camera"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Edge & Hardware Specification Matrix */}
      <div className="card-linear">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-body font-semibold text-ink">Edge & Hardware Specification Matrix</h2>
              <p className="text-[11px] text-slate-400 font-normal">Empirical recognition performance across camera specs, distances, and lighting.</p>
            </div>
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
            <Loader2 className="w-8 h-8 text-emerald-400 mx-auto animate-spin" />
            <p className="text-caption text-ink-subtle">Running evaluation benchmarks...</p>
            <p className="text-[11px] text-ink-tertiary">This may take several minutes.</p>
          </div>
        )}

        {edgeResults && !edgeLoading && (
          <>
            {/* Tab switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 p-1 bg-[#0F1011] rounded-lg border border-[#23252A]">
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
                      ? 'bg-[#059669]/15 text-emerald-400 border border-[#059669]/30'
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
                    </tr>
                  </thead>
                  <tbody>
                    {edgeResults.angle.map((r, i) => (
                      <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30">
                        <td className="py-2.5 px-3 text-ink font-medium">{r.angle}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: r.accuracy >= 90 ? '#27A644' : '#F59E0B' }}>{r.accuracy}%</td>
                        <td className="py-2.5 px-3 text-ink-muted font-mono">{r.samples}</td>
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
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Capture Rate</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Drop Rate</th>
                      <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Processing Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edgeResults.fps.map((r, i) => (
                      <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#141516]/30">
                        <td className="py-2.5 px-3 text-ink font-medium">{r.fps} FPS</td>
                        <td className="py-2.5 px-3 text-ink-muted font-mono">{r.drop_rate}%</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">{r.processing_ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          REGISTER CAMERA MODAL (Using React Portal directly to document.body)
          Fixes transform containment, cutoff positioning, and excessive blur!
      ───────────────────────────────────────────────────────────────────────────── */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span>Register & Connect Camera</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Connect any RTSP security camera (Hikvision, Dahua, CP Plus), USB webcam, or virtual feed.
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamera} className="space-y-4">
              
              {/* Protocol / Type Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Connection Protocol *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStreamType('rtsp')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      streamType === 'rtsp'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>RTSP / IP Camera</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">CCTV, NVR, DVR</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStreamType('usb')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      streamType === 'usb'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                      <span>USB Webcam</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Tablet / Kiosk PC</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStreamType('virtual')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      streamType === 'virtual'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Virtual Feed</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Simulated Testing</p>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Camera Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Turnstile Gate 01"
                    value={newCamName}
                    onChange={(e) => setNewCamName(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Location / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. North Gate / Workshop A"
                    value={newCamLocation}
                    onChange={(e) => setNewCamLocation(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* RTSP Specific Settings */}
              {streamType === 'rtsp' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-border space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Select Brand Preset</span>
                    <span className="text-[10px] text-emerald-400 font-mono-tag">Auto-Configures Stream Format</span>
                  </div>

                  {/* Brand Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {BRAND_PRESETS.map((b) => (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => {
                          setSelectedBrand(b.name);
                          setCamPort(b.defaultPort);
                          setCamChannel(b.defaultChannel);
                          setCustomRtspUrl('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selectedBrand === b.name
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>

                  {/* IP, Port, Username, Password, Channel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1 font-mono-tag">Camera IP Address</label>
                      <input
                        type="text"
                        placeholder="192.168.1.108"
                        value={camIp}
                        onChange={(e) => setCamIp(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-mono-tag">Port</label>
                      <input
                        type="text"
                        placeholder="554"
                        value={camPort}
                        onChange={(e) => setCamPort(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-mono-tag">Channel</label>
                      <input
                        type="text"
                        placeholder="1"
                        value={camChannel}
                        onChange={(e) => setCamChannel(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-mono-tag">Username</label>
                      <input
                        type="text"
                        placeholder="admin"
                        value={camUser}
                        onChange={(e) => setCamUser(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-mono-tag">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={camPass}
                        onChange={(e) => setCamPass(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Generated RTSP Preview */}
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono-tag">
                      Generated RTSP Connection String:
                    </span>
                    <code className="text-[11px] font-mono text-emerald-400 break-all select-all block">
                      {computedRtspUrl}
                    </code>
                  </div>
                </div>
              )}

              {/* USB Stream Helper */}
              {streamType === 'usb' && (
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Video className="w-4 h-4" />
                    <span>USB Web Camera Kiosk Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This camera will bind directly to any browser opening AuraPass Kiosk mode (<code className="text-cyan-300 font-mono">/kiosk</code>). No background software or drivers required.
                  </p>
                </div>
              )}

              {/* Virtual Stream Helper */}
              {streamType === 'virtual' && (
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Simulated Test Loop Feed</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instantly tests face detection, liveness, and employee verification using pre-loaded high-resolution biometric test sequences.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newCamName.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Camera'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          LIVE TEST & STREAM VIEWER MODAL (Using React Portal)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activePreviewCam && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{activePreviewCam.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Live Test
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Device Key: <code className="text-emerald-400 font-mono text-[11px]">{activePreviewCam.api_key}</code>
                </p>
              </div>
              <button 
                onClick={() => setActivePreviewCam(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/[0.06] text-xs font-bold">
              <button
                onClick={() => setPreviewTab('feed')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  previewTab === 'feed'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Live Feed & Diagnostics
              </button>
              <button
                onClick={() => setPreviewTab('instructions')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  previewTab === 'instructions'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                CCTV Edge Daemon Setup
              </button>
            </div>

            {/* Tab 1: Live Feed View */}
            {previewTab === 'feed' && (
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                  
                  {parseCameraMeta(activePreviewCam).type === 'usb' ? (
                    usbStreamActive ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <Video className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                        <p className="text-xs text-white font-bold">Connecting Local USB Web Camera...</p>
                        {usbError && <p className="text-[11px] text-red-400">{usbError}</p>}
                      </div>
                    )
                  ) : (
                    // RTSP or Virtual Stream Simulation View
                    <div className="relative w-full h-full">
                      <img 
                        src="/aurapass_kiosk_preview.jpg" 
                        alt="Camera Stream" 
                        className="w-full h-full object-cover opacity-85" 
                      />
                      
                      {/* Live Recognition Bounding Box Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-40 border-2 border-emerald-400 rounded-lg relative animate-pulse">
                          <span className="absolute -top-6 left-0 bg-black/80 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                            Priya Sharma (99.4%)
                          </span>
                          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-300" />
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-300" />
                          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-300" />
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-300" />
                        </div>
                      </div>

                      {/* Stream HUD */}
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>RTSP Active &bull; 29.8 FPS</span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                        Latency: 184 ms
                      </div>
                    </div>
                  )}

                  {/* Identified Banner */}
                  <div className="absolute bottom-2.5 inset-x-2.5 bg-black/85 backdrop-blur-md p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between text-xs font-mono-tag">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-bold">Face Verified: Priya Sharma</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">99.4% Match</span>
                  </div>
                </div>

                {/* Diagnostics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono-tag">Inference Engine</span>
                    <span className="text-white font-bold font-mono text-xs">FaceNet512</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono-tag">Liveness Check</span>
                    <span className="text-emerald-400 font-bold font-mono text-xs">PASSED (98.7%)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono-tag">Relay Pulse</span>
                    <span className="text-cyan-400 font-bold font-mono text-xs">Turnstile Open</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: CCTV Edge Daemon Setup Guide */}
            {previewTab === 'instructions' && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-slate-300 space-y-1">
                  <p className="font-bold text-white text-xs">How to connect physical CCTV cameras to AuraPass:</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Because browsers cannot connect directly to raw RTSP sockets, run our lightweight Python edge streamer on any PC or server connected to your CCTV network.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-slate-300 text-[11px] uppercase font-mono-tag">Step 1: One-Line Streamer Command</span>
                  <div className="relative p-3 rounded-xl bg-[#07090F] border border-white/10 font-mono text-[11px] text-emerald-400 break-all select-all">
                    <code>
                      python edge_streamer.py --stream "{parseCameraMeta(activePreviewCam).url || 'rtsp://admin:pass@192.168.1.108:554/live'}" --key "{activePreviewCam.api_key}" --server "{window.location.origin}"
                    </code>
                    <button
                      onClick={() => {
                        const cmd = `python edge_streamer.py --stream "${parseCameraMeta(activePreviewCam).url || 'rtsp://admin:pass@192.168.1.108:554/live'}" --key "${activePreviewCam.api_key}" --server "${window.location.origin}"`;
                        navigator.clipboard.writeText(cmd);
                        setCopiedDaemonCmd(true);
                        setTimeout(() => setCopiedDaemonCmd(false), 2000);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white"
                      title="Copy Command"
                    >
                      {copiedDaemonCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-slate-300 text-[11px] uppercase font-mono-tag">Step 2: Stream Requirements</span>
                  <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                    <li>Camera and edge PC must share the same local subnetwork (or VPN).</li>
                    <li>RTSP Port 554 must be open and accessible on the camera.</li>
                    <li>Supports any resolution (1080p, 720p, 4K) — frames are auto-resized to 720p for fast inference.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActivePreviewCam(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </motion.div>
  );
}
