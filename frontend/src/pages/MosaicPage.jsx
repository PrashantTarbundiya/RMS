import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Monitor, RefreshCw, Wifi, WifiOff, Users, AlertCircle, Settings2, RotateCw, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

/**
 * CameraFeedTile - Single camera feed tile with live recognition overlay.
 * Captures frames from a <video> element and sends to /api/predict.
 * Falls back to polling if SSE/WebSocket is unavailable.
 */
function CameraFeedTile({ camera, apiClient, columns }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const [results, setResults] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [isMirrored, setIsMirrored] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef(Date.now());
  const inFlightRef = useRef(false);

  // Start camera stream
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        // If camera has a device_id, try to use it; otherwise use default
        const constraints = { 
          video: camera.device_id 
            ? { deviceId: { exact: camera.device_id } } 
            : { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(`Cannot access camera: ${err.message}`);
          setIsLive(false);
        }
      }
    };
    startCamera();
    return () => { 
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (loopRef.current) clearTimeout(loopRef.current);
    };
  }, [camera.id, camera.device_id, facingMode]);

  // Prediction loop
  const predict = useCallback(async () => {
    if (!videoRef.current || !isLive || inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);

      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.7));
      if (!blob) { inFlightRef.current = false; return; }

      const formData = new FormData();
      formData.append('image', new File([blob], 'mosaic_frame.jpg', { type: 'image/jpeg' }));
      formData.append('test_mode', 'true');

      const res = await apiClient.post(`${API_BASE}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 8000,
      });

      setResults(res.data);
      const now = Date.now();
      setFps(Math.round(1000 / (now - lastFrameTime.current)));
      lastFrameTime.current = now;
    } catch (err) {
      // Silently handle - don't break the mosaic
    } finally {
      inFlightRef.current = false;
    }
  }, [isLive, apiClient]);

  useEffect(() => {
    if (!isLive) return;
    const scheduleNext = () => {
      loopRef.current = setTimeout(() => {
        predict();
        if (isLive) scheduleNext();
      }, columns <= 2 ? 2000 : 3000); // Slower for more tiles
    };
    predict();
    scheduleNext();
    return () => { if (loopRef.current) clearTimeout(loopRef.current); };
  }, [isLive, predict, columns]);

  // Draw overlays
  useEffect(() => {
    if (!results?.faces || !canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const vw = videoRef.current.clientWidth;
    const vh = videoRef.current.clientHeight;
    const nw = videoRef.current.videoWidth || 640;
    const nh = videoRef.current.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    ctx.clearRect(0, 0, vw, vh);

    const sx = vw / nw;
    const sy = vh / nh;

    results.faces.forEach(face => {
      const box = face.box || face.region;
      if (!box) return;
      const x = box.x * sx;
      const y = box.y * sy;
      const w = box.w * sx;
      const h = box.h * sy;

      const drawX = isMirrored ? (vw - (x + w)) : x;

      const ens = face.ensemble || {};
      const isRecognized = ens.is_recognized;
      const color = isRecognized ? '#4ade80' : '#f87171';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, y, w, h);

      // Label
      const label = ens.label || 'Unknown';
      const conf = ens.confidence ? `${(ens.confidence * 100).toFixed(0)}%` : '';
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.max(11, Math.min(14, vw / 40))}px Inter, sans-serif`;
      const text = conf ? `${label} (${conf})` : label;
      const tm = ctx.measureText(text);
      ctx.fillRect(drawX, y - 18, tm.width + 8, 18);
      ctx.fillStyle = '#000';
      ctx.fillText(text, drawX + 4, y - 4);
    });
  }, [results, isMirrored]);

  return (
    <div style={{
      position: 'relative', borderRadius: '12px', overflow: 'hidden',
      background: '#111111', border: '1px solid #262626',
      aspectRatio: '4/3',
    }}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isMirrored ? 'scaleX(-1)' : 'none'
        }}
      />

      {/* Overlay Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', pointerEvents: 'none',
        }}
      />

      {/* Camera Label */}
      <div style={{
        position: 'absolute', top: '8px', left: '8px',
        background: 'rgba(0,0,0,0.7)', borderRadius: '6px',
        padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        {isLive ? (
          <Wifi size={12} style={{ color: '#4ade80' }} />
        ) : (
          <WifiOff size={12} style={{ color: '#f87171' }} />
        )}
        <span style={{ fontSize: '11px', color: '#E0E0E0', fontWeight: 600 }}>
          {camera.name}
        </span>
      </div>

      {/* Camera Controls: Mirror & Facing */}
      {isLive && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setIsMirrored(m => !m)}
            style={{
              background: isMirrored ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0,0,0,0.7)',
              borderRadius: '4px', border: isMirrored ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid #262626',
              padding: '2px 6px', fontSize: '10px', color: isMirrored ? '#34d399' : '#d4d4d4', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}
            title={`Toggle Mirror Preview (Current: ${isMirrored ? 'Mirrored' : 'Natural'})`}
          >
            <FlipHorizontal size={11} />
            <span>{isMirrored ? 'Mirror' : 'Natural'}</span>
          </button>

          {!camera.device_id && (
            <button
              type="button"
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              style={{
                background: 'rgba(0,0,0,0.7)', borderRadius: '4px', border: '1px solid #262626',
                padding: '2px 6px', fontSize: '10px', color: '#34d399', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '3px',
              }}
              title="Toggle Front/Back Camera"
            >
              <RotateCw size={11} />
              <span>{facingMode === 'user' ? 'Front' : 'Back'}</span>
            </button>
          )}

          {fps > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.7)', borderRadius: '4px',
              padding: '2px 6px', fontSize: '10px', color: '#888',
            }}>
              ~{fps} fps
            </div>
          )}
        </div>
      )}
      {results?.faces && results.faces.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          background: 'rgba(0,0,0,0.7)', borderRadius: '6px',
          padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Users size={12} style={{ color: '#34D399' }} />
          <span style={{ fontSize: '11px', color: '#E0E0E0' }}>
            {results.faces.length} face{results.faces.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,16,17,0.95)', gap: '8px',
        }}>
          <AlertCircle size={24} style={{ color: '#f87171' }} />
          <span style={{ fontSize: '12px', color: '#f87171', textAlign: 'center', padding: '0 12px' }}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}


/**
 * MosaicPage - Multi-camera mosaic dashboard.
 * Shows all connected cameras in a tiled grid with live recognition overlays.
 */
export default function MosaicPage() {
  const { apiClient, user } = useAuth();
  const [columns, setColumns] = useState(2);
  const [cameras, setCameras] = useState([]);
  const [useLocal, setUseLocal] = useState(true);

  // Fetch registered cameras from API
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await apiClient.get(`${API_BASE}/cameras`);
        if (res.data?.cameras?.length > 0) {
          setCameras(res.data.cameras);
          setUseLocal(false);
        }
      } catch {
        // Use local camera fallback
      }
    };
    fetchCameras();
  }, [apiClient]);

  // If no registered cameras, use local webcam(s)
  useEffect(() => {
    if (!useLocal) return;
    const detectLocal = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length > 0) {
          setCameras(videoDevices.map((d, i) => ({
            id: d.deviceId || `local-${i}`,
            device_id: d.deviceId,
            name: d.label || `Camera ${i + 1}`,
          })));
        } else {
          // Fallback: single default camera
          setCameras([{ id: 'default', name: 'Default Camera' }]);
        }
      } catch {
        setCameras([{ id: 'default', name: 'Default Camera' }]);
      }
    };
    detectLocal();
  }, [useLocal]);

  return (
    <div className="pb-12 max-w-[1600px] mx-auto space-y-4 page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center">
            <Monitor size={20} className="text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-headline font-semibold text-ink font-display m-0">
              Camera Mosaic
            </h1>
            <p className="text-caption text-ink-subtle m-0">
              {cameras.length} camera{cameras.length !== 1 ? 's' : ''} · Multi-channel live monitoring
            </p>
          </div>
        </div>

        {/* Grid Controls */}
        <div className="flex items-center gap-1 bg-[#111111] border border-[#262626] rounded-lg p-1 w-fit">
          <span className="text-[11px] font-mono text-ink-tertiary px-2 hidden sm:inline">Grid:</span>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setColumns(n)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                columns === n
                  ? 'bg-[#059669] text-white shadow-sm font-semibold'
                  : 'text-ink-subtle hover:text-ink hover:bg-[#171717]'
              }`}
            >
              {n}×{n}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Grid with Mobile Responsiveness */}
      <div 
        className="grid gap-3"
        style={{
          gridTemplateColumns: window.innerWidth < 640 
            ? (columns === 1 ? '1fr' : 'repeat(2, 1fr)')
            : (window.innerWidth < 1024 
              ? `repeat(${Math.min(columns, 2)}, 1fr)` 
              : `repeat(${columns}, 1fr)`)
        }}
      >
        {cameras.slice(0, columns * columns).map(cam => (
          <CameraFeedTile
            key={cam.id}
            camera={cam}
            apiClient={apiClient}
            columns={columns}
          />
        ))}
      </div>

      {/* Empty State */}
      {cameras.length === 0 && (
        <div className="card-linear text-center py-16 space-y-3 bg-[#111111] border-[#262626]">
          <Camera size={44} className="mx-auto text-ink-tertiary opacity-40" />
          <p className="text-caption text-ink-subtle font-medium">No cameras detected</p>
          <p className="text-[12px] text-ink-tertiary max-w-sm mx-auto">
            Connect a USB camera, enable browser camera access, or register an IP camera stream.
          </p>
        </div>
      )}
    </div>
  );
}
