import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Monitor, RefreshCw, Wifi, WifiOff, Users, AlertCircle, Settings2 } from 'lucide-react';
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
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef(Date.now());
  const inFlightRef = useRef(false);

  // Start camera stream
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        // If camera has a device_id, try to use it; otherwise use default
        const constraints = { 
          video: camera.device_id 
            ? { deviceId: { exact: camera.device_id } } 
            : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
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
  }, [camera.id]);

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

      const ens = face.ensemble || {};
      const isRecognized = ens.is_recognized;
      const color = isRecognized ? '#4ade80' : '#f87171';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Label
      const label = ens.label || 'Unknown';
      const conf = ens.confidence ? `${(ens.confidence * 100).toFixed(0)}%` : '';
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.max(11, Math.min(14, vw / 40))}px Inter, sans-serif`;
      const text = conf ? `${label} (${conf})` : label;
      const tm = ctx.measureText(text);
      ctx.fillRect(x, y - 18, tm.width + 8, 18);
      ctx.fillStyle = '#000';
      ctx.fillText(text, x + 4, y - 4);
    });
  }, [results]);

  return (
    <div style={{
      position: 'relative', borderRadius: '12px', overflow: 'hidden',
      background: '#0F1011', border: '1px solid #23252A',
      aspectRatio: '4/3',
    }}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

      {/* FPS Counter */}
      {isLive && fps > 0 && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(0,0,0,0.7)', borderRadius: '4px',
          padding: '2px 6px', fontSize: '10px', color: '#888',
        }}>
          ~{fps} fps
        </div>
      )}

      {/* Face Count Badge */}
      {results?.faces && results.faces.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          background: 'rgba(0,0,0,0.7)', borderRadius: '6px',
          padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Users size={12} style={{ color: '#60a5fa' }} />
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
    <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Monitor size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Camera Mosaic
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              {cameras.length} camera{cameras.length !== 1 ? 's' : ''} - live recognition
            </p>
          </div>
        </div>

        {/* Grid Controls */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#181A1F', borderRadius: '8px', padding: '2px' }}>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setColumns(n)}
              style={{
                padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                background: columns === n ? 'var(--primary)' : 'transparent',
                color: columns === n ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {n}×{n}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '12px',
      }}>
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
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: 'var(--text-secondary)',
        }}>
          <Camera size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No cameras detected. Connect a camera or register cameras in Settings.</p>
        </div>
      )}
    </div>
  );
}
