import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Image as ImageIcon, Video, Maximize, Play, X, AlertCircle, ThumbsUp, ThumbsDown, Check, Loader2, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  const [includeDeepFace, setIncludeDeepFace] = useState(true);
  const [feedbackState, setFeedbackState] = useState({}); // track feedback status per prediction_id
  const [personsList, setPersonsList] = useState([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState(null);
  
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
      <div className="flex flex-col gap-4 bg-zinc-950 p-4">
        <p className="text-zinc-400 text-sm">Who is this actually? Select from existing persons or mark as a false detection.</p>
        <select 
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          className="w-full p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-100 outline-none focus:border-zinc-600"
        >
          <option value="" disabled>Select a person...</option>
          <option value="FALSE_DETECTION" className="text-red-400 font-medium">Not a Person (False Detection)</option>
          {personsList.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={() => { setIsFeedbackModalOpen(false); setFeedbackContext(null); }}>Cancel</Button>
          <Button variant="default" onClick={() => confirmFeedback(selectedName)} disabled={!selectedName} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">Submit Feedback</Button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-7xl mx-auto space-y-6">
      
      <Modal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => { setIsFeedbackModalOpen(false); setFeedbackContext(null); }}
        title="Correct the Prediction"
      >
        <FeedbackModalContent />
      </Modal>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Live Inference Console</h1>
        <p className="mt-1 text-sm text-zinc-400">Test face recognition models simultaneously using upload or webcam.</p>
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
          <CardContent className="p-4 flex gap-2 items-center text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        
        {/* Input Block */}
        <Card className="bg-zinc-900/40 border-zinc-800 flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800">
             <CardTitle className="text-base font-medium">Target Image</CardTitle>
             
             <div className="flex gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                <Button 
                  variant={mode === 'upload' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={switchToUpload}
                  className={`h-7 px-3 text-xs ${mode === 'upload' ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Upload
                </Button>
                <Button 
                  variant={mode === 'webcam' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={switchToWebcam}
                  className={`h-7 px-3 text-xs ${mode === 'webcam' ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Video className="w-3.5 h-3.5 mr-1.5" /> Webcam
                </Button>
             </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">

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
              className={`flex-1 flex flex-col justify-center items-center bg-zinc-950/50 rounded-xl overflow-hidden relative min-h-[350px] transition-colors border-2 ${isDragActive ? 'border-dashed border-violet-500 bg-violet-500/5' : 'border-solid border-zinc-800'}`}
            >
               {mode === 'webcam' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                    {webcamError ? (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-4 text-sm">{webcamError}</p>
                        <Button variant="secondary" onClick={startWebcam}>Retry Camera</Button>
                      </div>
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {webcamReady ? (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <Button className="rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 hover:scale-105 transition-transform shadow-xl" onClick={captureWebcam}>
                              <Camera className="w-4 h-4 mr-2" /> Capture
                            </Button>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                            <span className="text-zinc-400 text-sm font-mono tracking-tight">Initializing Camera...</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
               ) : (
                   file ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                        <Button 
                           variant="outline" size="icon"
                           onClick={() => { setFile(null); setResults(null); }}
                           className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-zinc-950/80 border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                        ><X className="w-4 h-4" /></Button>

                        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                          <img 
                            ref={imgRef} src={URL.createObjectURL(file)} alt="Input" 
                            className="max-w-full max-h-full object-contain pointer-events-none"
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
                             const displayConf = useEnsemble ? (face.ensemble?.confidence || 0) : (face.predictions?.sota?.confidence || 0);
                             const displayLabel = useEnsemble ? (face.ensemble?.label || 'Unknown') : (face.predictions?.sota?.label || 'Unknown');
                             const isConfirmed = useEnsemble ? face.ensemble?.is_confirmed === true : (displayConf > 0.8 && displayLabel !== 'Unknown');
                             const spoofed = face.prediction === 'SPOOF DETECTED' || displayLabel === 'SPOOF DETECTED';
                             const boxColor = spoofed ? '#f59e0b' : (isConfirmed ? '#10b981' : '#ef4444'); // amber-500, emerald-500, or red-500

                             return (
                                <div key={idx} className="absolute pointer-events-none" style={{
                                   border: `2px solid ${boxColor}`,
                                   left: offsetX + (face.bbox.x * scaleX), top: offsetY + (face.bbox.y * scaleY),
                                   width: face.bbox.w * scaleX, height: face.bbox.h * scaleY
                                 }}>
                                   <div className="absolute -top-6 -left-0.5 px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-widest" style={{ background: boxColor, color: '#000' }}>
                                     FACE {idx + 1}
                                   </div>
                                </div>
                             );
                          })}
                        </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-500 w-full h-full flex flex-col items-center justify-center">
                       <UploadCloud className="w-10 h-10 mb-4 opacity-50 text-zinc-400" />
                       <p className="text-sm">Drag and drop, paste, or click to upload</p>
                       <input type="file" accept="image/jpeg,image/png,image/webp" id="test-upload" className="hidden" onChange={handleFileChange} />
                       <label htmlFor="test-upload" className="mt-6 cursor-pointer">
                          <span className="bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm inline-block">Browse Files</span>
                       </label>
                    </div>
                  )
               )}
            </div>

            <div className="mt-6">
              <Button 
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-sm h-11"
                onClick={runPrediction} 
                disabled={!file || loading}
              >
                 {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                 {loading ? 'Processing Identity...' : 'Execute Inference'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Block */}
        <Card className="bg-zinc-900/40 border-zinc-800 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800">
            <CardTitle className="text-base font-medium">Telemetry & Results</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            
            <div className="flex gap-4 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 mb-6">
              <div className="flex items-center space-x-2">
                <Switch id="sota" checked={true} disabled />
                <Label htmlFor="sota" className="text-xs font-mono text-zinc-400">MobileNetV2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="df" checked={includeDeepFace} onCheckedChange={setIncludeDeepFace} />
                <Label htmlFor="df" className="text-xs font-mono text-zinc-100 cursor-pointer">DeepFace / Ensemble</Label>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                 <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="mt-4 font-mono text-xs tracking-wider uppercase">Analyzing spatial data...</p>
                 </div>
              ) : results ? (
                 results.faces && results.faces.length > 0 ? (
                   <div className="space-y-4">
                      {results.message && (
                        <div className="text-emerald-500 font-mono text-xs mb-2 border-l-2 border-emerald-500 pl-2">
                          [SYS] {results.message}
                        </div>
                      )}
                      
                      {results.faces.map((face, i) => {
                         const useEnsemble = includeDeepFace;
                         const displayLabel = useEnsemble ? face.ensemble?.label : face.predictions?.sota?.label;
                         const displayConf = useEnsemble ? (face.ensemble?.confidence || 0) : (face.predictions?.sota?.confidence || 0);
                         const displayMethod = useEnsemble ? (face.ensemble?.method || 'N/A') : "SOTA Base";
                         const isConfirmed = useEnsemble ? face.ensemble?.is_confirmed === true : (displayConf > 0.8 && displayLabel !== 'Unknown');
                         
                         const spoofed = displayLabel === 'SPOOF DETECTED';
                         
                         const statusColor = spoofed ? 'text-amber-500' : (isConfirmed ? 'text-emerald-500' : 'text-red-500');
                         const statusBorder = spoofed ? 'border-amber-500/30' : (isConfirmed ? 'border-emerald-500/30' : 'border-red-500/30');
                         const statusBg = spoofed ? 'bg-amber-500/5' : (isConfirmed ? 'bg-emerald-500/5' : 'bg-red-500/5');

                         return (
                          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden" key={i}>
                             <div className={`absolute top-0 left-0 w-1 h-full ${isConfirmed ? 'bg-emerald-500' : (spoofed ? 'bg-amber-500' : 'bg-red-500')}`} />
                             
                             <h3 className="m-0 mb-4 text-xs font-semibold text-zinc-500 font-mono tracking-wider">TARGET {i + 1}</h3>
                             
                             <div className={`p-4 rounded-lg border ${statusBorder} ${statusBg}`}>
                               <div className="flex justify-between items-start">
                                 <div>
                                   <div className="text-[10px] font-mono tracking-wider text-zinc-500 mb-1 uppercase">
                                     {spoofed ? 'LIVENESS FAILED' : (isConfirmed ? 'IDENTITY CONFIRMED' : 'NO MATCH FOUND')}
                                   </div>
                                   <div className={`text-xl font-medium tracking-tight ${statusColor}`}>
                                     {displayLabel ? displayLabel.replace(/_/g, ' ') : 'Unknown'}
                                   </div>
                                 </div>
                               </div>

                               <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800/50">
                                 <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                                   MTHD: {displayMethod} | CONF: {(displayConf * 100).toFixed(1)}%
                                 </div>
                                 
                                 {face.prediction_id && !spoofed && (
                                   <div className="flex gap-1.5">
                                      {feedbackState[face.prediction_id] === 'success' ? (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-2 font-mono">
                                          <Check className="w-3 h-3 mr-1" /> Logged
                                        </Badge>
                                      ) : (
                                        <>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded" onClick={() => submitFeedback(face.prediction_id, true, displayLabel)} title="Correct Detection">
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded" onClick={() => submitFeedback(face.prediction_id, false, displayLabel)} title="Incorrect Detection">
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                          </Button>
                                        </>
                                      )}
                                   </div>
                                 )}
                               </div>
                             </div>

                             <div className="mt-4 flex flex-col gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                <div className="flex justify-between text-[11px] font-mono">
                                   <span className="text-zinc-500">MobileNetV2</span>
                                   <span className="text-zinc-300">{face.predictions?.sota?.label} ({(face.predictions?.sota?.confidence * 100).toFixed(1)}%)</span>
                                </div>
                                {includeDeepFace && face.predictions?.deepface && (
                                  <div className="flex justify-between text-[11px] font-mono border-t border-zinc-800/50 pt-2">
                                     <span className="text-zinc-500">Facenet512</span>
                                     <span className="text-zinc-300">{face.predictions.deepface.label} ({(face.predictions.deepface.confidence * 100).toFixed(1)}%)</span>
                                  </div>
                                )}
                             </div>
                          </div>
                         );
                      })}
                   </div>
                 ) : (
                   <div className="text-center py-20 text-zinc-500">
                      <Maximize className="w-10 h-10 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No faces detected in the provided frame.</p>
                   </div>
                 )
              ) : (
                 <div className="text-center py-20 text-zinc-500">
                    <p className="text-sm font-mono tracking-tight">Inference output will appear here.</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
        
      </div>
    </motion.div>
  );
}
