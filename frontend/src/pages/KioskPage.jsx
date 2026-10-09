import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Scan, Wifi, WifiOff, Clock, ChevronLeft, Settings, Maximize, Minimize, Eye, Volume2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPersonName } from '../utils/format';

// ─── Constants ─────────────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 30000;       // 30s until screensaver
const RESULT_DISPLAY_MS = 2600;      // Show result for 2.6s (crisp and swift)
const FRAME_INTERVAL_WS = 150;       // WebSocket frame rate pacing (zero queue backlog)
const FRAME_INTERVAL_HTTP = 800;     // HTTP polling fallback rate
const SCAN_LINE_DURATION = 2.2;      // Scan animation speed (s)
const MAX_CONSECUTIVE_UNKNOWNS = 8;  // Auto-pause after 8 unknowns

// ─── Status Enum ───────────────────────────────────────────────────────
const STATUS = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  GRANTED: 'granted',
  DENIED: 'denied',
  SPOOF: 'spoof',
  ERROR: 'error',
};

export default function KioskPage() {
  const { apiClient } = useAuth();

  // ─── Core State ────────────────────────────────────────────────
  const [status, setStatus] = useState(STATUS.IDLE);
  const [recognizedName, setRecognizedName] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [liveness, setLiveness] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentLogs, setRecentLogs] = useState([]);
  const [consecutiveUnknowns, setConsecutiveUnknowns] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [facesDetected, setFacesDetected] = useState(0);

  // ─── Refs ──────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const liveLoopRef = useRef(null);
  const inFlightTimerRef = useRef(null);
  const sendFrameRef = useRef(null);
  const idleTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const isRequestInFlightRef = useRef(false);
  const statusRef = useRef(status);
  const containerRef = useRef(null);
  const consecutiveUnknownsRef = useRef(0);
  const isPausedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { consecutiveUnknownsRef.current = consecutiveUnknowns; }, [consecutiveUnknowns]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Response-driven pacing: schedule next frame with clean debouncing
  const scheduleNextCapture = useCallback((delay = 100) => {
    if (liveLoopRef.current) clearTimeout(liveLoopRef.current);
    liveLoopRef.current = setTimeout(() => {
      sendFrameRef.current?.();
    }, delay);
  }, []);

  // ─── Clock ─────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Webcam Management ─────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    setWebcamError('');
    setWebcamReady(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setWebcamError('Browser does not support camera access');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            if (err.name !== 'AbortError') console.warn('Webcam play error:', err);
          });
          setWebcamReady(true);
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') setWebcamError('Camera permission denied');
      else if (err.name === 'NotFoundError') setWebcamError('No camera device found');
      else setWebcamError(`Camera error: ${err.message}`);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setWebcamReady(false);
  }, []);

  // ─── Start webcam on mount ────────────────────────────────────
  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  // ─── Idle Timer (screensaver) ──────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (statusRef.current === STATUS.IDLE) return;
    idleTimerRef.current = setTimeout(() => {
      setStatus(STATUS.IDLE);
      setRecognizedName('');
      setConfidence(0);
      setLiveness(null);
      setFacesDetected(0);
    }, IDLE_TIMEOUT_MS);
  }, []);

  // ─── Add to recent logs ────────────────────────────────────────
  const addLog = useCallback((name, granted, time) => {
    setRecentLogs(prev => {
      const next = [{ name, granted, time: time || new Date() }, ...prev];
      return next.slice(0, 5); // Keep last 5
    });
  }, []);

  // ─── Process Recognition Result ────────────────────────────────
  const processResult = useCallback((data) => {
    const rawCount = data?.total_faces_detected !== undefined 
      ? data.total_faces_detected 
      : (data?.faces ? data.faces.length : 0);
    setFacesDetected(rawCount);

    if (!data?.faces || data.faces.length === 0) {
      // No face detected — go to scanning (waiting)
      if (statusRef.current !== STATUS.GRANTED && statusRef.current !== STATUS.DENIED && statusRef.current !== STATUS.SPOOF) {
        setStatus(STATUS.SCANNING);
      }
      return;
    }

    const primary = data.faces[0];
    const ensemble = primary?.ensemble;
    const livenessData = primary?.liveness;

    if (!ensemble) return;

    setLiveness(livenessData);

    // SPOOF DETECTED
    if (ensemble.method === 'liveness_rejection' || ensemble.label === 'SPOOF DETECTED') {
      setStatus(STATUS.SPOOF);
      setRecognizedName('Spoof Detected');
      setConfidence(0);
      setConsecutiveUnknowns(0);
      addLog('SPOOF', false);
      // Auto-reset after display
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => {
        setStatus(STATUS.SCANNING);
        setRecognizedName('');
        isRequestInFlightRef.current = false;
        scheduleNextCapture(100);
      }, RESULT_DISPLAY_MS);
      return;
    }

    // CONFIRMED (ACCESS GRANTED)
    if (ensemble.is_confirmed) {
      const cleanName = formatPersonName(ensemble.label);
      setStatus(STATUS.GRANTED);
      setRecognizedName(cleanName);
      setConfidence(Math.round((ensemble.confidence || 0) * 100));
      setConsecutiveUnknowns(0);
      addLog(cleanName, true);
      // Auto-reset
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => {
        setStatus(STATUS.SCANNING);
        setRecognizedName('');
        setConfidence(0);
        isRequestInFlightRef.current = false;
        scheduleNextCapture(100);
      }, RESULT_DISPLAY_MS);
      return;
    }

    // NOT RECOGNIZED (ACCESS DENIED)
    setStatus(STATUS.DENIED);
    setRecognizedName('Unrecognized');
    setConfidence(0);
    const newCount = consecutiveUnknownsRef.current + 1;
    setConsecutiveUnknowns(newCount);
    addLog('Unknown', false);

    // Auto-pause if too many unknowns (prevent rapid alerts)
    if (newCount >= MAX_CONSECUTIVE_UNKNOWNS) {
      setIsPaused(true);
      setTimeout(() => {
        setIsPaused(false);
        setConsecutiveUnknowns(0);
        scheduleNextCapture(100);
      }, 10000);
    }

    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setStatus(STATUS.SCANNING);
      setRecognizedName('');
      isRequestInFlightRef.current = false;
      scheduleNextCapture(100);
    }, RESULT_DISPLAY_MS);
  }, [addLog, scheduleNextCapture]);

  // ─── WebSocket Connection ──────────────────────────────────────
  useEffect(() => {
    if (!webcamReady) return;
    const wsUrl = API_BASE.replace('http', 'ws');
    const socket = io(wsUrl, {
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('prediction_result', (data) => {
      if (inFlightTimerRef.current) clearTimeout(inFlightTimerRef.current);
      isRequestInFlightRef.current = false;
      if (data.error) {
        console.error('[Kiosk] WS prediction error:', data.error);
      } else {
        processResult(data);
      }
      resetIdleTimer();
      // Paced response-driven capture: only capture the NEXT frame after current one is returned!
      if (statusRef.current === STATUS.SCANNING || statusRef.current === STATUS.IDLE) {
        scheduleNextCapture(FRAME_INTERVAL_WS);
      }
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [webcamReady, processResult, resetIdleTimer, scheduleNextCapture]);

  // ─── Live Frame Capture & Send ─────────────────────────────────
  const sendFrame = useCallback(async () => {
    if (!videoRef.current || !webcamReady || isRequestInFlightRef.current || isPausedRef.current) return;
    // Don't send frames during access granted/denied/spoof cooldown display
    if (statusRef.current === STATUS.GRANTED || statusRef.current === STATUS.DENIED || statusRef.current === STATUS.SPOOF) return;
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) return;

    isRequestInFlightRef.current = true;

    // Safety watchdog: if server stalls or message drops, release lock after 2200ms
    if (inFlightTimerRef.current) clearTimeout(inFlightTimerRef.current);
    inFlightTimerRef.current = setTimeout(() => {
      if (isRequestInFlightRef.current) {
        isRequestInFlightRef.current = false;
        if (statusRef.current === STATUS.SCANNING || statusRef.current === STATUS.IDLE) {
          scheduleNextCapture(150);
        }
      }
    }, 2200);

    // Switch to scanning state on first frame
    if (statusRef.current === STATUS.IDLE) {
      setStatus(STATUS.SCANNING);
    }

    try {
      const rawW = videoRef.current.videoWidth || 640;
      const rawH = videoRef.current.videoHeight || 480;
      // High-performance downscale to max 640px wide while preserving aspect ratio
      const scale = Math.min(1, 640 / Math.max(rawW, 640));
      const targetW = Math.round(rawW * scale);
      const targetH = Math.round(rawH * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, targetW, targetH);

      if (socketConnected && socketRef.current?.connected) {
        const base64 = canvas.toDataURL('image/jpeg', 0.65);
        socketRef.current.emit('stream_frame', {
          image: base64,
          token: sessionStorage.getItem('rms_access_token'),
          single_focus: true,
          kiosk_mode: true
        });
      } else {
        // HTTP fallback
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.65));
        if (!blob) {
          isRequestInFlightRef.current = false;
          scheduleNextCapture(200);
          return;
        }
        const formData = new FormData();
        formData.append('image', new File([blob], 'kiosk_frame.jpg', { type: 'image/jpeg' }));
        formData.append('test_mode', 'true');
        formData.append('single_focus', 'true');
        formData.append('kiosk_mode', 'true');
        const res = await apiClient.post(`${API_BASE}/predict`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 6000,
        });
        if (inFlightTimerRef.current) clearTimeout(inFlightTimerRef.current);
        isRequestInFlightRef.current = false;
        processResult(res.data);
        resetIdleTimer();
        if (statusRef.current === STATUS.SCANNING || statusRef.current === STATUS.IDLE) {
          scheduleNextCapture(FRAME_INTERVAL_HTTP);
        }
      }
    } catch (err) {
      console.error('[Kiosk] Frame error:', err);
      if (inFlightTimerRef.current) clearTimeout(inFlightTimerRef.current);
      isRequestInFlightRef.current = false;
      scheduleNextCapture(300);
    }
  }, [webcamReady, socketConnected, apiClient, processResult, resetIdleTimer, scheduleNextCapture]);

  // Keep sendFrameRef up to date
  useEffect(() => {
    sendFrameRef.current = sendFrame;
  }, [sendFrame]);

  // ─── Frame Loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!webcamReady || isPaused) {
      if (liveLoopRef.current) { clearTimeout(liveLoopRef.current); liveLoopRef.current = null; }
      return;
    }
    // Kick off first frame
    scheduleNextCapture(250);
    return () => {
      if (liveLoopRef.current) { clearTimeout(liveLoopRef.current); liveLoopRef.current = null; }
      if (inFlightTimerRef.current) { clearTimeout(inFlightTimerRef.current); inFlightTimerRef.current = null; }
    };
  }, [webcamReady, isPaused, scheduleNextCapture]);

  // ─── Fullscreen Toggle ─────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ─── Cleanup ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ─── Derived UI State ──────────────────────────────────────────
  const statusConfig = useMemo(() => ({
    [STATUS.IDLE]: {
      borderColor: 'var(--accent-primary)',
      glowColor: 'rgba(94, 106, 210, 0.15)',
      icon: <Scan size={28} />,
      label: 'Step forward to begin',
      sublabel: 'Face authentication system',
      bgGradient: 'radial-gradient(ellipse at center, rgba(94,106,210,0.06) 0%, transparent 70%)',
    },
    [STATUS.SCANNING]: {
      borderColor: 'var(--accent-primary)',
      glowColor: 'rgba(94, 106, 210, 0.25)',
      icon: <Eye size={28} className="kiosk-pulse" />,
      label: 'Scanning...',
      sublabel: 'Hold steady, looking at the camera',
      bgGradient: 'radial-gradient(ellipse at center, rgba(94,106,210,0.08) 0%, transparent 70%)',
    },
    [STATUS.GRANTED]: {
      borderColor: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.3)',
      icon: <ShieldCheck size={32} />,
      label: `Welcome, ${recognizedName}`,
      sublabel: `Access Granted • ${confidence}% confidence`,
      bgGradient: 'radial-gradient(ellipse at center, rgba(34,197,94,0.10) 0%, transparent 70%)',
    },
    [STATUS.DENIED]: {
      borderColor: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.25)',
      icon: <ShieldAlert size={32} />,
      label: 'Access Denied',
      sublabel: 'Face not recognized in system',
      bgGradient: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)',
    },
    [STATUS.SPOOF]: {
      borderColor: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.3)',
      icon: <ShieldX size={32} />,
      label: 'Spoof Detected',
      sublabel: 'Liveness check failed — use real face',
      bgGradient: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)',
    },
    [STATUS.ERROR]: {
      borderColor: '#f87171',
      glowColor: 'rgba(248, 113, 113, 0.2)',
      icon: <ShieldAlert size={28} />,
      label: 'System Error',
      sublabel: 'Please try again or contact support',
      bgGradient: 'radial-gradient(ellipse at center, rgba(248,113,113,0.06) 0%, transparent 70%)',
    },
  }), [recognizedName, confidence]);

  const cfg = statusConfig[status];

  // ─── Formatted Time & Date ─────────────────────────────────────
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div ref={containerRef} className="kiosk-container" style={{ background: cfg.bgGradient }}>
      {/* ─── Ambient Glow Layer ─────────────────────────────── */}
      <div className="kiosk-ambient-glow" style={{ boxShadow: `0 0 120px 40px ${cfg.glowColor}` }} />

      {/* ─── Top Bar ───────────────────────────────────────── */}
      <header className="kiosk-header">
        <div className="kiosk-header-left">
          <Link to="/dashboard" className="kiosk-back-link">
            <ChevronLeft size={16} />
            <span>Console</span>
          </Link>
          <div className="kiosk-brand">
            <div className="kiosk-brand-icon">
              <span>R</span>
            </div>
            <span className="kiosk-brand-text">RMS Kiosk</span>
          </div>
        </div>
        <div className="kiosk-header-center">
          <div className="kiosk-connection-pill">
            {socketConnected ? (
              <><Wifi size={12} className="text-green-400" /><span className="text-green-400">Live</span></>
            ) : (
              <><WifiOff size={12} className="text-amber-400" /><span className="text-amber-400">Polling</span></>
            )}
          </div>
        </div>
        <div className="kiosk-header-right">
          <button onClick={toggleFullscreen} className="kiosk-icon-btn" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <div className="kiosk-clock">
            <Clock size={13} className="kiosk-clock-icon" />
            <span className="kiosk-clock-time">{timeStr}</span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Area ─────────────────────────────── */}
      <main className="kiosk-main">
        {/* Camera Viewport */}
        <div className="kiosk-viewport-wrapper">
          <div className="kiosk-viewport" style={{ '--kiosk-border-color': cfg.borderColor, '--kiosk-glow': cfg.glowColor }}>
            {/* Corner Reticle Brackets */}
            <div className="kiosk-reticle kiosk-reticle-tl" />
            <div className="kiosk-reticle kiosk-reticle-tr" />
            <div className="kiosk-reticle kiosk-reticle-bl" />
            <div className="kiosk-reticle kiosk-reticle-br" />

            {/* Scan Line Animation */}
            <AnimatePresence>
              {status === STATUS.SCANNING && (
                <motion.div
                  className="kiosk-scan-line"
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: SCAN_LINE_DURATION, repeat: Infinity, ease: 'easeInOut' }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            {/* Camera Feed */}
            {webcamError ? (
              <div className="kiosk-cam-error">
                <ShieldAlert size={48} className="text-red-400 mb-4" />
                <p className="text-lg font-medium mb-1">Camera Unavailable</p>
                <p className="text-sm text-[var(--ink-subtle)]">{webcamError}</p>
                <button onClick={startWebcam} className="kiosk-retry-btn">Retry</button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="kiosk-video"
              />
            )}

            {/* Status Overlay — shown on recognition events */}
            <AnimatePresence>
              {(status === STATUS.GRANTED || status === STATUS.DENIED || status === STATUS.SPOOF) && (
                <motion.div
                  className={`kiosk-result-overlay kiosk-result-${status}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="kiosk-result-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    {cfg.icon}
                  </motion.div>
                  <motion.h2
                    className="kiosk-result-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {cfg.label}
                  </motion.h2>
                  <motion.p
                    className="kiosk-result-subtitle"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {cfg.sublabel}
                  </motion.p>

                  {/* Confidence Ring (only for granted) */}
                  {status === STATUS.GRANTED && (
                    <motion.div
                      className="kiosk-confidence-ring"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <svg viewBox="0 0 100 100" className="kiosk-ring-svg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                        <motion.circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke="#22c55e"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - confidence / 100) }}
                          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <span className="kiosk-ring-value">{confidence}%</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle State Overlay */}
            <AnimatePresence>
              {status === STATUS.IDLE && !webcamError && (
                <motion.div
                  className="kiosk-idle-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="kiosk-idle-icon"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Shield size={56} strokeWidth={1.2} />
                  </motion.div>
                  <h2 className="kiosk-idle-title">{cfg.label}</h2>
                  <p className="kiosk-idle-subtitle">{cfg.sublabel}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Multi-Person Security Banner */}
            <AnimatePresence>
              {facesDetected > 1 && status === STATUS.SCANNING && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="kiosk-multi-person-banner"
                >
                  <Users size={14} className="text-amber-400 shrink-0" />
                  <span>Single-person security: Focusing on primary person ({facesDetected} detected)</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Face Count Badge */}
          {facesDetected > 0 && status === STATUS.SCANNING && (
            <div className={`kiosk-face-count ${facesDetected > 1 ? 'kiosk-multi-face-warning' : ''}`}>
              {facesDetected > 1 ? (
                <>
                  <Users size={13} className="text-amber-400" />
                  <span className="text-amber-400 font-medium">{facesDetected} faces · Primary Subject Locked</span>
                </>
              ) : (
                <>
                  <Eye size={13} />
                  <span>1 face detected</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Status Panel (Side Info) ──────────────────── */}
        <aside className="kiosk-sidebar">
          {/* Status Indicator Card */}
          <div className="kiosk-status-card" style={{ borderColor: cfg.borderColor }}>
            <div className="kiosk-status-dot" style={{ background: cfg.borderColor, boxShadow: `0 0 8px ${cfg.glowColor}` }} />
            <div className="kiosk-status-info">
              <span className="kiosk-status-label">{status === STATUS.SCANNING ? 'Analyzing' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <span className="kiosk-status-desc">{cfg.sublabel}</span>
            </div>
          </div>

          {/* Liveness Card */}
          {liveness && (
            <div className="kiosk-info-card">
              <div className="kiosk-card-header">
                <Shield size={14} />
                <span>Liveness</span>
              </div>
              <div className="kiosk-liveness-row">
                <span className={`kiosk-liveness-badge ${liveness.is_live ? 'kiosk-live' : 'kiosk-not-live'}`}>
                  {liveness.is_live ? 'LIVE' : 'NOT LIVE'}
                </span>
                <span className="kiosk-liveness-score">{Math.round((liveness.score || 0) * 100)}%</span>
              </div>
            </div>
          )}

          {/* Date Card */}
          <div className="kiosk-info-card">
            <div className="kiosk-card-header">
              <Clock size={14} />
              <span>Date & Time</span>
            </div>
            <p className="kiosk-date-text">{dateStr}</p>
            <p className="kiosk-time-large">{timeStr}</p>
          </div>

          {/* Recent Activity */}
          <div className="kiosk-info-card kiosk-activity-card">
            <div className="kiosk-card-header">
              <Scan size={14} />
              <span>Recent Activity</span>
            </div>
            {recentLogs.length === 0 ? (
              <p className="kiosk-no-activity">No scans yet</p>
            ) : (
              <ul className="kiosk-activity-list">
                {recentLogs.map((log, i) => (
                  <li key={i} className="kiosk-activity-item">
                    <span className={`kiosk-activity-dot ${log.granted ? 'kiosk-dot-green' : 'kiosk-dot-red'}`} />
                    <span className="kiosk-activity-name">{log.name}</span>
                    <span className="kiosk-activity-time">
                      {log.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Paused Banner */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                className="kiosk-paused-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p>Auto-paused: too many unrecognized attempts</p>
                <button onClick={() => { setIsPaused(false); setConsecutiveUnknowns(0); }} className="kiosk-resume-btn">Resume</button>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </main>

      {/* ─── Bottom Bar ────────────────────────────────────── */}
      <footer className="kiosk-footer">
        <span className="kiosk-footer-text">RMS Face AI • Biometric Authentication</span>
        <span className="kiosk-footer-text kiosk-footer-version">v2.0 Kiosk Mode</span>
      </footer>
    </div>
  );
}
