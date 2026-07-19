import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Image as ImageIcon, Video, Maximize, Play, X, AlertCircle, ThumbsUp, ThumbsDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';




import Modal from '../components/Modal';

export default function TestPage() {
  const { apiClient } = useAuth();
  const [mode, setMode] = useState('upload'); // 'upload' or 'webcam'
  const [file, setFile] = useState(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [webcamError, setWebcamError] = useState('');
  const [webcamReady, setWebcamReady] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [includeDeepFace, setIncludeDeepFace] = useState(false);
  const [feedbackState, setFeedbackState] = useState({}); // track feedback status per prediction_id
  const [personsList, setPersonsList] = useState([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState(null);
  
  const webcamRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);

  // Global Clipboard Paste Support
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (mode !== 'upload') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            setFile(pastedFile);
            setResults(null);
            setError('');
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [mode]);

  // Fetch persons for the feedback dropdown
  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const res = await apiClient.get(`${API_BASE}/persons`);
        if (res.data && res.data.persons) {
          setPersonsList(res.data.persons);
        }
      } catch (err) {
        console.error('Failed to fetch persons list', err);
      }
    };
    fetchPersons();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Maximum size is 10MB.');
        return;
      }
      setFile(selectedFile);
      setResults(null);
      setError('');
    }
  };

  const startWebcam = useCallback(async () => {
    setWebcamError('');
    setWebcamReady(false);
    
    try {
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        setWebcamError('Webcam requires HTTPS or localhost.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setWebcamError('Your browser does not support webcam access.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setWebcamReady(true);
      }
    } catch (err) {
      console.error('Webcam error:', err);
      if (err.name === 'NotAllowedError') setWebcamError('Camera permission denied.');
      else if (err.name === 'NotFoundError') setWebcamError('No camera device found.');
      else setWebcamError(`Camera error: ${err.message}`);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamReady(false);
  }, []);

  const captureWebcam = useCallback(() => {
    if (!videoRef.current || !webcamReady) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          setMode('upload');
          setResults(null);
          setError('');
          stopWebcam();
        }
      }, 'image/jpeg', 0.85);
    } catch (err) {
      setError('Failed to capture photo: ' + err.message);
    }
  }, [webcamReady, stopWebcam]);

  const switchToUpload = useCallback(() => {
    stopWebcam();
    setMode('upload');
    setWebcamError('');
  }, [stopWebcam]);

  const switchToWebcam = useCallback(() => {
    setMode('webcam');
    setFile(null);
    setResults(null);
    setWebcamError('');
    setTimeout(() => startWebcam(), 100);
  }, [startWebcam]);

  const runPrediction = async () => {
    if (!file) { setError('Please provide an image first.'); return; }
    setLoading(true); setError(''); setResults(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiClient.post(`${API_BASE}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setResults(res.data);
      if (imgRef.current) {
        setPreviewSize({
           width: imgRef.current.clientWidth,
           height: imgRef.current.clientHeight,
           naturalWidth: imgRef.current.naturalWidth,
           naturalHeight: imgRef.current.naturalHeight
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run prediction');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (predictionId, isCorrect, predictedName) => {
    if (!isCorrect) {
      setFeedbackContext({ predictionId, isCorrect, predictedName });
      setIsFeedbackModalOpen(true);
      return;
    }
    try {
      await apiClient.post(`${API_BASE}/predict/feedback`, { prediction_id: predictionId, is_correct: isCorrect, correct_name: '' });
      setFeedbackState(prev => ({ ...prev, [predictionId]: 'success' }));
    } catch (err) {
      setFeedbackState(prev => ({ ...prev, [predictionId]: 'error' }));
    }
  };

  const confirmFeedback = async (correctName) => {
    if (!feedbackContext) return;
    setIsFeedbackModalOpen(false);
    try {
      await apiClient.post(`${API_BASE}/predict/feedback`, { prediction_id: feedbackContext.predictionId, is_correct: feedbackContext.isCorrect, correct_name: correctName });
      setFeedbackState(prev => ({ ...prev, [feedbackContext.predictionId]: 'success' }));
    } catch (err) {
      setFeedbackState(prev => ({ ...prev, [feedbackContext.predictionId]: 'error' }));
    }
    setFeedbackContext(null);
  };

  const FeedbackModalContent = () => {
    const [selectedName, setSelectedName] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Who is this actually? Select from existing persons or mark as a false detection.</p>
        <select 
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          style={{ 
            width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', 
            background: 'var(--bg-input)', color: 'var(--text-primary)', 
            border: '1px solid var(--border-subtle)', outline: 'none'
          }}
        >
          <option value="" disabled>Select a person...</option>
          <option value="FALSE_DETECTION" style={{ color: 'var(--alert-crimson)' }}>Not a Person (False Detection)</option>
          {personsList.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="ghost" onClick={() => { setIsFeedbackModalOpen(false); setFeedbackContext(null); }}>Cancel</button>
          <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="primary" onClick={() => confirmFeedback(selectedName)} disabled={!selectedName}>Submit Feedback</button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 'var(--space-8)' }}>
      
      <Modal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => { setIsFeedbackModalOpen(false); setFeedbackContext(null); }}
        title="Correct the Prediction"
      >
        <FeedbackModalContent />
      </Modal>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>Live Inference Console</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Test models simultaneously using upload or webcam.</p>
      </div>

      {error && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ padding: 'var(--space-4)', border: '1px solid var(--alert-crimson)', background: 'rgba(248, 113, 113, 0.05)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
          <AlertCircle size={18} color="var(--alert-crimson)" style={{ marginTop: '2px' }} />
          <span style={{ color: 'var(--text-primary)' }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', minHeight: '500px' }}>
        
        {/* Input Block */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
             <h2 style={{ fontSize: 'var(--text-base)', margin: 0 }}>Target Image</h2>
             
             <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <button 
                  onClick={switchToUpload}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer', transition: 'all var(--duration) var(--ease)',
                    background: mode === 'upload' ? 'var(--text-primary)' : 'transparent',
                    color: mode === 'upload' ? 'var(--bg-base)' : 'var(--text-muted)'
                  }}
                >
                  <ImageIcon size={14} /> Upload
                </button>
                <button 
                  onClick={switchToWebcam}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer', transition: 'all var(--duration) var(--ease)',
                    background: mode === 'webcam' ? 'var(--text-primary)' : 'transparent',
                    color: mode === 'webcam' ? 'var(--bg-base)' : 'var(--text-muted)'
                  }}
                >
                  <Video size={14} /> Webcam
                </button>
             </div>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (mode === 'upload') setIsDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
              if (mode === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
                const selectedFile = e.dataTransfer.files[0];
                if (selectedFile.type.startsWith('image/')) {
                  setFile(selectedFile); setResults(null); setError('');
                } else setError('Please select a valid image file (JPEG, PNG, WebP).');
              }
            }}
            style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: isDragActive ? '2px dashed var(--accent-violet)' : '1px solid var(--border-subtle)',
              overflow: 'hidden', position: 'relative', transition: 'border-color var(--duration) var(--ease)', minHeight: '350px'
            }}
          >
             {mode === 'webcam' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {webcamError ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <AlertCircle size={32} color="var(--alert-crimson)" style={{ margin: '0 auto var(--space-4)' }} />
                      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>{webcamError}</p>
                      <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="secondary" onClick={startWebcam}>Retry Camera</button>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {webcamReady ? (
                        <div style={{ position: 'absolute', bottom: 'var(--space-4)' }}>
                          <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="primary" onClick={captureWebcam} style={{ borderRadius: 'var(--radius-full)' }}>
                            <Camera size={16} style={{ marginRight: '8px' }} /> Capture
                          </button>
                        </div>
                      ) : (
                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Loader2 className="spin" size={24} color="var(--accent-violet)" />
                          <span style={{ color: 'var(--text-muted)' }}>Initializing...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
             ) : (
                 file ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <button 
                         onClick={() => { setFile(null); setResults(null); }}
                         style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)', padding: '4px', cursor: 'pointer' }}
                      ><X size={14} /></button>

                      <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img 
                          ref={imgRef} src={URL.createObjectURL(file)} alt="Input" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                          onLoad={(e) => setPreviewSize({ width: e.target.clientWidth, height: e.target.clientHeight, naturalWidth: e.target.naturalWidth, naturalHeight: e.target.naturalHeight })}
                        />
                        {/* Bounding Boxes */}
                        {results && results.faces && previewSize.naturalWidth > 0 && results.faces.map((face, idx) => {
                           const scaleX = previewSize.width / previewSize.naturalWidth;
                           const scaleY = previewSize.height / previewSize.naturalHeight;
                           const imgRenderProps = imgRef.current.getBoundingClientRect();
                           const containerProps = imgRef.current.parentElement.getBoundingClientRect();
                           const offsetX = (containerProps.width - imgRenderProps.width) / 2;
                           const offsetY = (containerProps.height - imgRenderProps.height) / 2;
                           
                           const useEnsemble = includeDeepFace;
                           const displayConf = useEnsemble ? face.ensemble.confidence : face.predictions.sota.confidence;
                           const displayLabel = useEnsemble ? face.ensemble.label : face.predictions.sota.label;
                           const isConfirmed = useEnsemble ? face.ensemble.is_confirmed === true : (displayConf > 0.8 && displayLabel !== 'Unknown');
                           const boxColor = isConfirmed ? 'var(--confirm-green)' : 'var(--alert-crimson)';

                           return (
                              <div key={idx} style={{
                                 position: 'absolute', border: `2px solid ${boxColor}`,
                                 left: offsetX + (face.bbox.x * scaleX), top: offsetY + (face.bbox.y * scaleY),
                                 width: face.bbox.w * scaleX, height: face.bbox.h * scaleY, pointerEvents: 'none'
                               }}>
                                 <div style={{ 
                                   position: 'absolute', top: '-24px', left: '-2px', 
                                   background: boxColor, color: '#000', 
                                   padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)'
                                 }}>
                                   FACE {idx + 1}
                                 </div>
                              </div>
                           );
                        })}
                      </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                     <ImageIcon size={32} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
                     <p>Drag and drop, paste, or click to upload</p>
                     <input type="file" accept="image/jpeg,image/png,image/webp" id="test-upload" style={{ display: 'none' }} onChange={handleFileChange} />
                     <label htmlFor="test-upload" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
                        <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="secondary" as="span">Browse Files</button>
                     </label>
                  </div>
                )
             )}
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={runPrediction} disabled={!file || loading}>
               {loading ? <Loader2 className="spin" size={16} style={{ marginRight: '8px' }} /> : <Play size={16} style={{ marginRight: '8px' }} />}
               {loading ? 'Processing...' : 'Execute Identification'}
            </button>
          </div>
        </div>

        {/* Results Block */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', margin: 0 }}>Telemetry & Results</h2>
          
          <div style={{ display: 'flex', gap: 'var(--space-4)', background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={true} disabled /> MobileNetV2
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={includeDeepFace} onChange={(e) => setIncludeDeepFace(e.target.checked)} /> DeepFace (Facenet512)
            </label>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-500 animate-spin" isLoading />
                  <p style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>Analyzing spatial data...</p>
               </div>
            ) : results ? (
               results.faces.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ color: 'var(--confirm-green)', fontSize: 'var(--text-sm)' }}>{results.message}</div>
                    
                    {results.faces.map((face, i) => {
                       const useEnsemble = includeDeepFace;
                       const displayLabel = useEnsemble ? face.ensemble.label : face.predictions.sota.label;
                       const displayConf = useEnsemble ? face.ensemble.confidence : face.predictions.sota.confidence;
                       const displayMethod = useEnsemble ? face.ensemble.method : "SOTA Base";
                       const isConfirmed = useEnsemble ? face.ensemble.is_confirmed === true : (displayConf > 0.8 && displayLabel !== 'Unknown');
                       const statusStr = isConfirmed ? 'confirmed' : 'not-found';

                       return (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" key={i} padding="var(--space-4)" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                           <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FACE DETECTED {i + 1}</h3>
                           
                           <div className="w-8 h-8 rounded-full border-2 border-zinc-500 animate-spin" status={statusStr} style={{ display: 'block', padding: 'var(--space-4)', background: 'var(--bg-surface)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div>
                                 <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                   {isConfirmed ? 'IDENTITY CONFIRMED' : 'NO MATCH FOUND'}
                                 </span>
                                 <div style={{ fontSize: 'var(--text-lg)', fontWeight: '500', color: isConfirmed ? 'var(--confirm-green)' : 'var(--alert-crimson)', marginTop: '4px' }}>
                                   {isConfirmed ? displayLabel.replace(/_/g, ' ') : 'Unknown Person'}
                                 </div>
                               </div>
                               <div style={{ fontSize: 'var(--text-2xl)', color: isConfirmed ? 'var(--confirm-green)' : 'var(--alert-crimson)' }}>
                                 {isConfirmed ? '✓' : '✗'}
                               </div>
                             </div>

                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)' }}>
                               <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                 MTHD: {displayMethod.toUpperCase()} | CONF: {(displayConf * 100).toFixed(1)}%
                               </div>
                               
                               {face.prediction_id && (
                                 <div style={{ display: 'flex', gap: '4px' }}>
                                    {feedbackState[face.prediction_id] === 'success' ? (
                                      <span style={{ color: 'var(--confirm-green)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Check size={12} /> Logged
                                      </span>
                                    ) : (
                                      <>
                                        <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="ghost" size="sm" onClick={() => submitFeedback(face.prediction_id, true, displayLabel)} title="Correct Detection">
                                          <ThumbsUp size={14} color="var(--confirm-green)" />
                                        </button>
                                        <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="ghost" size="sm" onClick={() => submitFeedback(face.prediction_id, false, displayLabel)} title="Incorrect Detection">
                                          <ThumbsDown size={14} color="var(--alert-crimson)" />
                                        </button>
                                      </>
                                    )}
                                 </div>
                               )}
                             </div>
                           </div>

                           <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                                 <span style={{ color: 'var(--text-muted)' }}>MobileNetV2</span>
                                 <span style={{ color: 'var(--text-primary)' }}>{face.predictions.sota.label} ({(face.predictions.sota.confidence * 100).toFixed(1)}%)</span>
                              </div>
                              {includeDeepFace && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                                   <span style={{ color: 'var(--text-muted)' }}>Facenet512</span>
                                   <span style={{ color: 'var(--text-primary)' }}>{face.predictions.deepface.label} ({(face.predictions.deepface.confidence * 100).toFixed(1)}%)</span>
                                </div>
                              )}
                           </div>
                        </div>
                       );
                    })}
                 </div>
               ) : (
                 <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    <Maximize size={32} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
                    <p>No faces detected in the provided frame.</p>
                 </div>
               )
            ) : (
               <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', color: 'var(--text-muted)' }}>
                  <p>Inference output will appear here.</p>
               </div>
            )}
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}
