import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Image as ImageIcon, Video, Maximize, Play, X, AlertCircle, ThumbsUp, ThumbsDown, Check, Loader2, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import ApertureReticle from '../components/ApertureReticle';


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
  const [feedbackState, setFeedbackState] = useState({}); // track feedback status per prediction_id
  const [personsList, setPersonsList] = useState([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState(null);
  const [feedbackIsPerson, setFeedbackIsPerson] = useState(null);
  const [feedbackIsNameCorrect, setFeedbackIsNameCorrect] = useState(null);
  const [feedbackIdentityType, setFeedbackIdentityType] = useState('existing');
  const [feedbackSelectedName, setFeedbackSelectedName] = useState('');
  const [feedbackCustomName, setFeedbackCustomName] = useState('');
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [feedbackShowDropdown, setFeedbackShowDropdown] = useState(false);
  
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const streamRef = useRef(null);

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
        } else if (res.data && Array.isArray(res.data)) {
          setPersonsList(res.data);
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
      
      streamRef.current = stream;
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
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamReady(false);
  }, []);

  useEffect(() => {
    return () => stopWebcam();
  }, [stopWebcam]);

  const [livePredicting, setLivePredicting] = useState(false);
  const liveLoopRef = useRef(null);

  const runLivePrediction = useCallback(async () => {
    if (mode !== 'webcam' || !videoRef.current || !webcamReady || livePredicting) return;
    setLivePredicting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.80));
      if (!blob) {
        setLivePredicting(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('image', new File([blob], 'live_frame.jpg', { type: 'image/jpeg' }));
      
      const res = await apiClient.post(`${API_BASE}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000,
      });
      
      if (mode === 'webcam' && videoRef.current) {
        setResults(res.data);
        setPreviewSize({
          width: videoRef.current.clientWidth,
          height: videoRef.current.clientHeight,
          naturalWidth: videoRef.current.videoWidth || 640,
          naturalHeight: videoRef.current.videoHeight || 480
        });
      }
    } catch (err) {
      console.error("Live prediction loop error:", err);
    } finally {
      setLivePredicting(false);
    }
  }, [mode, webcamReady, livePredicting, apiClient]);

  useEffect(() => {
    if (mode === 'webcam' && webcamReady && !isFeedbackModalOpen) {
      // Run once immediately
      runLivePrediction();
      liveLoopRef.current = setInterval(() => {
        runLivePrediction();
      }, 1500);
    } else {
      if (liveLoopRef.current) {
        clearInterval(liveLoopRef.current);
        liveLoopRef.current = null;
      }
    }
    return () => {
      if (liveLoopRef.current) {
        clearInterval(liveLoopRef.current);
        liveLoopRef.current = null;
      }
    };
  }, [mode, webcamReady, isFeedbackModalOpen, runLivePrediction]);

  const captureWebcam = useCallback(() => {
    // Legacy snapshot capture falls back to running a single manual prediction
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

  const captureAndPredict = useCallback(() => {
    if (!videoRef.current || !webcamReady) return;
    try {
      setLoading(true);
      setError('');
      setResults(null);

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const capturedFile = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          setMode('upload');
          stopWebcam();

          const formData = new FormData();
          formData.append('image', capturedFile);
          try {
            const res = await apiClient.post(`${API_BASE}/predict`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 30000,
            });
            setResults(res.data);
            
            setTimeout(() => {
              if (imgRef.current) {
                setPreviewSize({
                  width: imgRef.current.clientWidth,
                  height: imgRef.current.clientHeight,
                  naturalWidth: imgRef.current.naturalWidth,
                  naturalHeight: imgRef.current.naturalHeight
                });
              }
            }, 100);
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to run prediction');
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
          setError('Failed to generate image blob.');
        }
      }, 'image/jpeg', 0.90);
    } catch (err) {
      setLoading(false);
      setError('Failed to capture photo: ' + err.message);
    }
  }, [webcamReady, stopWebcam, apiClient]);

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
      setFeedbackIsPerson(null);
      setFeedbackIsNameCorrect(null);
      setFeedbackIdentityType('existing');
      setFeedbackSelectedName('');
      setFeedbackCustomName('');
      setFeedbackSearchQuery('');
      setFeedbackShowDropdown(false);
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
    
    // If the correction matches the prediction, treat it as correct
    const isCorrectVal = correctName === feedbackContext.predictedName;
    const finalCorrectName = isCorrectVal ? '' : correctName;

    try {
      await apiClient.post(`${API_BASE}/predict/feedback`, { 
        prediction_id: feedbackContext.predictionId, 
        is_correct: isCorrectVal, 
        correct_name: finalCorrectName 
      });
      setFeedbackState(prev => ({ ...prev, [feedbackContext.predictionId]: 'success' }));
    } catch (err) {
      setFeedbackState(prev => ({ ...prev, [feedbackContext.predictionId]: 'error' }));
    }
    setFeedbackContext(null);
  };

  const renderFeedbackModalContent = () => {
    const isPredictedUnknown = !feedbackContext?.predictedName || feedbackContext.predictedName.toLowerCase() === 'unknown';

    const handleSubmit = () => {
      if (feedbackIsPerson === 'no') {
        confirmFeedback('FALSE_DETECTION');
      } else if (feedbackIsPerson === 'yes') {
        if (isPredictedUnknown) {
          const finalName = feedbackIdentityType === 'existing' ? feedbackSelectedName : feedbackCustomName.trim().replace(/\s+/g, '_');
          if (finalName) {
            confirmFeedback(finalName);
          }
        } else {
          if (feedbackIsNameCorrect === 'yes') {
            confirmFeedback(feedbackContext.predictedName);
          } else if (feedbackIsNameCorrect === 'no') {
            const finalName = feedbackIdentityType === 'existing' ? feedbackSelectedName : feedbackCustomName.trim().replace(/\s+/g, '_');
            if (finalName) {
              confirmFeedback(finalName);
            }
          }
        }
      }
    };

    const isSubmitDisabled = () => {
      if (feedbackIsPerson === null) return true;
      if (feedbackIsPerson === 'no') return false;
      if (isPredictedUnknown) {
        if (feedbackIdentityType === 'existing') return !feedbackSelectedName;
        if (feedbackIdentityType === 'new') return !feedbackCustomName.trim();
      } else {
        if (feedbackIsNameCorrect === null) return true;
        if (feedbackIsNameCorrect === 'yes') return false;
        if (feedbackIsNameCorrect === 'no') {
          if (feedbackIdentityType === 'existing') return !feedbackSelectedName;
          if (feedbackIdentityType === 'new') return !feedbackCustomName.trim();
        }
      }
      return true;
    };

    return (
      <div className="flex flex-col gap-5 bg-[#0F1011] p-5 rounded-lg text-sm text-ink-muted">
        
        {/* Step 1: Is this actually a person's face? */}
        <div className="space-y-2">
          <label className="text-ink font-medium block">1. Was a person's face detected?</label>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => { setFeedbackIsPerson('yes'); setFeedbackIsNameCorrect(null); }}
              className={`flex-1 h-9 ${feedbackIsPerson === 'yes' ? 'button-primary text-white font-medium' : 'button-secondary'}`}
            >
              Yes, face detected
            </button>
            <button 
              type="button"
              onClick={() => { setFeedbackIsPerson('no'); setFeedbackIsNameCorrect(null); }}
              className={`flex-1 h-9 ${feedbackIsPerson === 'no' ? 'button-primary bg-[#F87171] hover:bg-red-600 text-white font-medium' : 'button-secondary text-[#F87171] hover:bg-[#F87171]/10 hover:border-[#F87171]/30'}`}
            >
              No, false detection
            </button>
          </div>
        </div>

        {/* Step 2: Is the predicted name correct? (Skip if Unknown) */}
        {feedbackIsPerson === 'yes' && !isPredictedUnknown && (
          <div className="space-y-2 fade-in">
            <label className="text-ink font-medium block">
              2. Is this person actually "{feedbackContext?.predictedName?.replace(/_/g, ' ')}"?
            </label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setFeedbackIsNameCorrect('yes')}
                className={`flex-1 h-9 ${feedbackIsNameCorrect === 'yes' ? 'button-primary text-white font-medium' : 'button-secondary'}`}
              >
                Yes
              </button>
              <button 
                type="button"
                onClick={() => setFeedbackIsNameCorrect('no')}
                className={`flex-1 h-9 ${feedbackIsNameCorrect === 'no' ? 'button-primary text-white font-medium' : 'button-secondary'}`}
              >
                No, wrong person
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Who is this person? (Shown if wrong person OR if prediction was Unknown) */}
        {feedbackIsPerson === 'yes' && (isPredictedUnknown || feedbackIsNameCorrect === 'no') && (
          <div className="space-y-3 fade-in p-4 bg-[#141516] border border-[#23252A] rounded-lg relative">
            <label className="text-ink font-medium block">
              {isPredictedUnknown ? '2. Who is this person?' : '3. Correct Identity'}
            </label>
            
            <div className="flex gap-4 text-xs font-mono mb-2">
              <label className="flex items-center gap-2 cursor-pointer text-ink-muted">
                <input 
                  type="radio" name="feedbackIdentityType" value="existing" 
                  checked={feedbackIdentityType === 'existing'} 
                  onChange={() => setFeedbackIdentityType('existing')}
                  className="accent-[#5E6AD2]"
                />
                <span>Existing Person</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-ink-muted">
                <input 
                  type="radio" name="feedbackIdentityType" value="new" 
                  checked={feedbackIdentityType === 'new'} 
                  onChange={() => setFeedbackIdentityType('new')}
                  className="accent-[#5E6AD2]"
                />
                <span>New Person</span>
              </label>
            </div>

            {feedbackIdentityType === 'existing' ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type name to search..."
                  value={feedbackSearchQuery}
                  onChange={(e) => {
                    setFeedbackSearchQuery(e.target.value);
                    setFeedbackSelectedName(''); // Reset selection when user types
                    setFeedbackShowDropdown(true);
                  }}
                  onFocus={() => setFeedbackShowDropdown(true)}
                  onBlur={() => setTimeout(() => setFeedbackShowDropdown(false), 200)}
                  className="input-linear w-full h-10 px-3 text-caption font-mono"
                />
                {feedbackShowDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-[#0F1011] border border-[#23252A] rounded-md z-50 shadow-xl scrollbar-thin">
                    {personsList
                      .filter(p => p.toLowerCase().includes(feedbackSearchQuery.toLowerCase()))
                      .map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setFeedbackSelectedName(p);
                            setFeedbackSearchQuery(p.replace(/_/g, ' '));
                            setFeedbackShowDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-caption text-ink-muted hover:bg-[#5E6AD2]/10 hover:text-ink transition-colors font-mono border-b border-[#23252A]/30 last:border-b-0"
                        >
                          {p.replace(/_/g, ' ')}
                        </button>
                      ))}
                    {personsList.filter(p => p.toLowerCase().includes(feedbackSearchQuery.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-caption text-ink-tertiary">No matching registered people</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <input 
                type="text"
                placeholder="Enter new name (e.g. John_Doe)"
                value={feedbackCustomName}
                onChange={(e) => setFeedbackCustomName(e.target.value.replace(/\s+/g, '_'))}
                className="input-linear w-full h-10 px-3 text-caption"
              />
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#23252A]">
          <button type="button" className="button-secondary text-caption py-1.5 px-4 h-9" onClick={() => { setIsFeedbackModalOpen(false); setFeedbackContext(null); }}>
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={isSubmitDisabled()} 
            className="button-primary text-caption py-1.5 px-4 h-9"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-7xl mx-auto space-y-6 page-container">
      
      <Modal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => { setIsFeedbackModalOpen(false); setFeedbackContext(null); }}
        title="Correct the Prediction"
      >
        {renderFeedbackModalContent()}
      </Modal>

      <div>
        <h1 className="text-headline font-semibold text-ink">Live Inference Console</h1>
        <p className="mt-1 text-caption text-ink-subtle">Test face recognition models simultaneously using upload or webcam.</p>
      </div>

      {error && (
        <div className="card-linear border-[#F87171]/20 bg-[#F87171]/5 p-4 flex gap-2 items-center text-[#F87171]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-caption font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        
        {/* Input Block */}
        <div className="card-linear p-0 overflow-hidden flex flex-col bg-[#0F1011] border-[#23252A]">
          <div className="flex flex-row items-center justify-between py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
             <h3 className="text-body font-medium text-ink">Target Image</h3>
             
             <div className="flex gap-1 p-1 bg-[#010102] rounded-lg border border-[#23252A]">
                <button 
                  onClick={switchToUpload}
                  className={`h-7 px-3 text-caption rounded-md transition-all ${
                    mode === 'upload' ? 'bg-[#141516] text-ink font-medium' : 'text-ink-tertiary hover:text-ink-subtle'
                  }`}
                >
                  Upload
                </button>
                <button 
                  onClick={switchToWebcam}
                  className={`h-7 px-3 text-caption rounded-md transition-all ${
                    mode === 'webcam' ? 'bg-[#141516] text-ink font-medium' : 'text-ink-tertiary hover:text-ink-subtle'
                  }`}
                >
                  Webcam
                </button>
             </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">

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
              className={`flex-1 flex flex-col justify-center items-center bg-[#010102]/30 rounded-lg overflow-hidden relative min-h-[350px] transition-colors border-2 ${
                isDragActive ? 'border-dashed border-[#828FFF] bg-[#5E6AD2]/5' : 'border-solid border-[#23252A]'
              }`}
            >
                {mode === 'webcam' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black min-h-[350px] relative">
                    {webcamError ? (
                       <div className="p-8 text-center">
                         <AlertCircle className="w-8 h-8 text-[#F87171] mx-auto mb-4" />
                         <p className="text-ink-subtle mb-4 text-caption">{webcamError}</p>
                         <button className="button-secondary text-caption" onClick={startWebcam}>Retry Camera</button>
                       </div>
                    ) : (
                      <>
                        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-[#010102]/20 h-full min-h-[350px]">
                          <video 
                            ref={videoRef} autoPlay playsInline muted 
                            className="max-w-full max-h-full object-contain pointer-events-none"
                            onPlay={() => {
                              setTimeout(() => {
                                if (videoRef.current) {
                                  setPreviewSize({
                                    width: videoRef.current.clientWidth,
                                    height: videoRef.current.clientHeight,
                                    naturalWidth: videoRef.current.videoWidth || 640,
                                    naturalHeight: videoRef.current.videoHeight || 480
                                  });
                                }
                              }, 500);
                            }}
                          />
                          {/* Live Feed Status Badge */}
                          {webcamReady && (
                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 uppercase animate-pulse">
                              Live Stream Active
                            </span>
                          )}
                          
                          {/* Bounding Boxes for Live Webcam (Corner Bracket Style) */}
                          {results && results.faces && previewSize.naturalWidth > 0 && results.faces.map((face, idx) => {
                             const targetElement = videoRef.current;
                             if (!targetElement) return null;
                             const scaleX = previewSize.width / previewSize.naturalWidth;
                             const scaleY = previewSize.height / previewSize.naturalHeight;
                             const imgRenderProps = targetElement.getBoundingClientRect();
                             const containerProps = targetElement.parentElement.getBoundingClientRect();
                             const offsetX = (containerProps.width - imgRenderProps.width) / 2;
                             const offsetY = (containerProps.height - imgRenderProps.height) / 2;
                             
                              const displayConf = face.predictions?.sota?.confidence || 0;
                              const displayLabel = face.predictions?.sota?.label || 'Unknown';
                              const isConfirmed = (displayConf > 0.8 && displayLabel !== 'Unknown');
                             const spoofed = face.prediction === 'SPOOF DETECTED' || displayLabel === 'SPOOF DETECTED';
                             const boxColor = spoofed ? '#FBBF24' : (isConfirmed ? '#27A644' : '#F87171');

                             return (
                                <div key={idx} className="absolute pointer-events-none" style={{
                                   left: offsetX + (face.bbox.x * scaleX), top: offsetY + (face.bbox.y * scaleY),
                                   width: face.bbox.w * scaleX, height: face.bbox.h * scaleY
                                 }}>
                                   {/* Corners (Aperture Reticle style) */}
                                   <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: boxColor }} />
                                   <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: boxColor }} />
                                   <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: boxColor }} />
                                   <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: boxColor }} />
                                   
                                   {/* Label */}
                                   <div className="absolute -top-6 left-0 px-2 py-0.5 text-[9px] font-bold font-mono tracking-widest uppercase text-black" style={{ backgroundColor: boxColor }}>
                                     {spoofed ? 'SPOOF' : (isConfirmed ? displayLabel.replace(/_/g, ' ') : 'UNKNOWN')}
                                   </div>
                                </div>
                             );
                          })}
                        </div>
                        {!webcamReady && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#010102]/85">
                            <Loader2 className="w-6 h-6 animate-spin text-ink-subtle" />
                            <span className="text-ink-tertiary text-caption font-mono uppercase tracking-wider">Initializing Camera...</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
               ) : (
                    file ? (
                     <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                         <button 
                            onClick={() => { setFile(null); setResults(null); }}
                            className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-[#010102]/80 border border-[#23252A] text-ink-subtle hover:text-ink flex items-center justify-center"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>

                         <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-[#010102]/20">
                           <img 
                             ref={imgRef} src={URL.createObjectURL(file)} alt="Input" 
                             className="max-w-full max-h-full object-contain pointer-events-none"
                             onLoad={(e) => setPreviewSize({ width: e.target.clientWidth, height: e.target.clientHeight, naturalWidth: e.target.naturalWidth, naturalHeight: e.target.naturalHeight })}
                           />
                           {/* Bounding Boxes (Corner Bracket Style) */}
                           {results && results.faces && previewSize.naturalWidth > 0 && results.faces.map((face, idx) => {
                              if (!imgRef.current || !imgRef.current.parentElement) return null;
                              
                              const scaleX = previewSize.width / previewSize.naturalWidth;
                              const scaleY = previewSize.height / previewSize.naturalHeight;
                              const imgRenderProps = imgRef.current.getBoundingClientRect();
                              const containerProps = imgRef.current.parentElement.getBoundingClientRect();
                              const offsetX = (containerProps.width - imgRenderProps.width) / 2;
                              const offsetY = (containerProps.height - imgRenderProps.height) / 2;
                              
                              const displayConf = face.predictions?.sota?.confidence || 0;
                              const displayLabel = face.predictions?.sota?.label || 'Unknown';
                              const isConfirmed = displayConf > 0.8 && displayLabel !== 'Unknown';
                              const spoofed = face.prediction === 'SPOOF DETECTED' || displayLabel === 'SPOOF DETECTED';
                              const boxColor = spoofed ? '#FBBF24' : (isConfirmed ? '#27A644' : '#F87171');

                              return (
                                 <div key={idx} className="absolute pointer-events-none" style={{
                                    left: offsetX + (face.bbox.x * scaleX), top: offsetY + (face.bbox.y * scaleY),
                                    width: face.bbox.w * scaleX, height: face.bbox.h * scaleY
                                  }}>
                                    {/* Corners (Aperture Reticle style) */}
                                    <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: boxColor }} />
                                    <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: boxColor }} />
                                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: boxColor }} />
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: boxColor }} />
                                    
                                    {/* Label */}
                                    <div className="absolute -top-6 left-0 px-2 py-0.5 text-[9px] font-bold font-mono tracking-widest uppercase text-black" style={{ backgroundColor: boxColor }}>
                                      {spoofed ? 'SPOOF' : (isConfirmed ? displayLabel.replace(/_/g, ' ') : 'UNKNOWN')}
                                    </div>
                                 </div>
                              );
                           })}
                         </div>
                     </div>
                   ) : (
                     <div className="p-8 text-center text-ink-subtle w-full h-full flex flex-col items-center justify-center">
                        <UploadCloud className="w-10 h-10 mb-4 opacity-50 text-ink-tertiary" />
                        <p className="text-caption mb-6">Drag and drop image, paste, or click to browse</p>
                        <input type="file" accept="image/jpeg,image/png,image/webp" id="test-upload" className="hidden" onChange={handleFileChange} />
                        <label htmlFor="test-upload" className="cursor-pointer">
                           <span className="button-secondary">Browse Files</span>
                        </label>
                     </div>
                   )
                )}
            </div>

            <div className="mt-6">
               {mode === 'upload' ? (
                 <button 
                   className="w-full button-primary flex items-center justify-center gap-2 h-10"
                   onClick={runPrediction} 
                   disabled={!file || loading}
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Play className="w-4 h-4 text-white" />}
                    <span className="text-button text-white">{loading ? 'Processing Identity...' : 'Execute Inference'}</span>
                 </button>
               ) : (
                 <button 
                   className="w-full button-primary flex items-center justify-center gap-2 h-10"
                   onClick={captureAndPredict} 
                   disabled={!webcamReady || loading}
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4 text-white" />}
                    <span className="text-button text-white">{loading ? 'Capturing & Testing...' : 'Capture & Run Inference'}</span>
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Results Block */}
        <div className="card-linear p-0 overflow-hidden flex flex-col bg-[#0F1011] border-[#23252A]">
          <div className="py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
            <h3 className="text-body font-medium text-ink">Telemetry & Results</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            
            <div className="flex gap-6 p-4 bg-[#010102]/40 rounded-lg border border-[#23252A] mb-6 items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5E6AD2]" />
                  <span className="text-caption font-mono text-ink-subtle">MobileNetV2: Active</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                 <div className="space-y-4">
                    <div className="w-48 h-4.5 shimmer mb-4" />
                    <div className="bg-[#010102]/30 border border-[#23252A] rounded-lg p-5 space-y-4">
                       <div className="w-20 h-4 shimmer" />
                       <div className="w-full h-24 border border-[#23252A] rounded-md bg-[#0F1011] p-4 space-y-2">
                          <div className="w-24 h-3 shimmer" />
                          <div className="w-40 h-6 shimmer" />
                       </div>
                       <div className="flex justify-between items-center pt-2">
                          <div className="w-32 h-4 shimmer" />
                          <div className="flex gap-2">
                             <div className="w-9 h-9 rounded shimmer" />
                             <div className="w-9 h-9 rounded shimmer" />
                          </div>
                       </div>
                    </div>
                 </div>

              ) : results ? (
                 results.faces && results.faces.length > 0 ? (
                    <div className="space-y-4">
                      {results.message && (
                        <div className="text-[#27A644] font-mono text-caption mb-4 border-l-2 border-[#27A644] pl-3">
                          [SYS] {results.message}
                        </div>
                      )}
                      
                      {results.faces.map((face, i) => {
                         const displayLabel = face.predictions?.sota?.label;
                         const displayConf = (face.predictions?.sota?.confidence || 0);
                         const isConfirmed = (displayConf > 0.8 && displayLabel !== 'Unknown');
                         
                         const spoofed = displayLabel === 'SPOOF DETECTED';
                         
                         const statusColor = spoofed ? 'text-[#FBBF24]' : (isConfirmed ? 'text-[#27A644]' : 'text-[#F87171]');
                         const statusBorder = spoofed ? 'border-[#FBBF24]/30' : (isConfirmed ? 'border-[#27A644]/30' : 'border-[#F87171]/30');
                         const statusBg = spoofed ? 'bg-[#FBBF24]/5' : (isConfirmed ? 'bg-[#27A644]/5' : 'bg-[#F87171]/5');
                         const flashClass = isConfirmed ? 'confirmed-flash' : 'error-flash';

                         return (
                          <div className={`bg-[#010102]/30 border border-[#23252A] rounded-lg p-5 relative overflow-hidden ${flashClass}`} key={i}>
                             <div className={`absolute top-0 left-0 w-1 h-full ${isConfirmed ? 'bg-[#27A644]' : (spoofed ? 'bg-[#FBBF24]' : 'bg-[#F87171]')}`} />
                             
                             <h3 className="m-0 mb-4 text-caption font-semibold text-ink-subtle font-mono tracking-wider">TARGET {i + 1}</h3>
                             
                             <div className={`p-4 rounded-lg border ${statusBorder} ${statusBg}`}>
                               <div className="flex justify-between items-start">
                                 <div>
                                   <div className="text-[10px] font-mono tracking-wider text-ink-subtle mb-1 uppercase">
                                     {spoofed ? 'LIVENESS FAILED' : (isConfirmed ? 'IDENTITY CONFIRMED' : 'NO MATCH FOUND')}
                                   </div>
                                   <div className={`text-xl font-medium tracking-tight ${statusColor}`}>
                                     {displayLabel ? displayLabel.replace(/_/g, ' ') : 'Unknown'}
                                   </div>
                                 </div>
                               </div>

                               <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#23252A]/50">
                                 <div className="text-[10px] text-ink-subtle font-mono tracking-wider uppercase">
                                   MTHD: SOTA Base | CONF: {(displayConf * 100).toFixed(1)}%
                                 </div>
                                 
                                 {face.prediction_id && !spoofed && (
                                   <div className="flex gap-1.5">
                                      {feedbackState[face.prediction_id] === 'success' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20 flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Logged
                                        </span>
                                      ) : (
                                        <>
                                          <button className="button-icon text-[#27A644] hover:bg-[#27A644]/10" onClick={() => submitFeedback(face.prediction_id, true, displayLabel)} title="Correct Detection">
                                            <ThumbsUp className="w-4 h-4" />
                                          </button>
                                          <button className="button-icon text-[#F87171] hover:bg-[#F87171]/10" onClick={() => submitFeedback(face.prediction_id, false, displayLabel)} title="Incorrect Detection">
                                            <ThumbsDown className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                   </div>
                                 )}
                               </div>
                             </div>

                             <div className="mt-4 flex flex-col gap-2 p-3 bg-[#0F1011] rounded-lg border border-[#23252A]">
                                 <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-ink-tertiary">MobileNetV2</span>
                                    <span className="text-ink-muted">{face.predictions?.sota?.label} ({(face.predictions?.sota?.confidence * 100).toFixed(1)}%)</span>
                                 </div>
                             </div>
                          </div>
                          );
                       })}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-ink-tertiary">
                       <Maximize className="w-10 h-10 mx-auto mb-4 opacity-50" />
                       <p className="text-caption">No faces detected in the provided frame.</p>
                    </div>
                  )
              ) : (
                 <div className="text-center py-20 text-ink-tertiary">
                    <p className="text-caption font-mono tracking-tight">Inference output will appear here.</p>
                 </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}
