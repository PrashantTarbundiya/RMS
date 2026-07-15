import React, { useState, useRef, useCallback, useEffect } from 'react'
import axios from 'axios'
import { Camera, Image as ImageIcon, Video, RefreshCw, Maximize, Play, X, AlertCircle } from 'lucide-react'

import { API_BASE } from '../config'

export default function TestPage() {
  const [mode, setMode] = useState('upload') // 'upload' or 'webcam'
  const [file, setFile] = useState(null)
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [webcamError, setWebcamError] = useState('')
  const [webcamReady, setWebcamReady] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [includeCnn, setIncludeCnn] = useState(false)
  const [includeDeepFace, setIncludeDeepFace] = useState(false)
  
  const webcamRef = useRef(null)
  const imgRef = useRef(null)
  const videoRef = useRef(null)

  // Global Clipboard Paste Support
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (mode !== 'upload') return
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const pastedFile = items[i].getAsFile()
          if (pastedFile) {
            setFile(pastedFile)
            setResults(null)
            setError('')
            e.preventDefault()
            break
          }
        }
      }
    }
    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [mode])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, WebP).')
        return
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Maximum size is 10MB.')
        return
      }

      setFile(selectedFile)
      setResults(null)
      setError('')
    }
  }

  // Use native getUserMedia instead of react-webcam for better compatibility
  const startWebcam = useCallback(async () => {
    setWebcamError('')
    setWebcamReady(false)
    
    try {
      // Check if we're on HTTPS or localhost (required for getUserMedia)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
      
      if (!isSecure) {
        setWebcamError(
          `Webcam requires HTTPS or localhost. You are accessing from "${window.location.hostname}". ` +
          'Open the app at http://localhost:5173 instead, or use the Image upload mode.'
        )
        return
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setWebcamError('Your browser does not support webcam access. Please use Image upload mode.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setWebcamReady(true)
      }
    } catch (err) {
      console.error('Webcam error:', err)
      if (err.name === 'NotAllowedError') {
        setWebcamError('Camera permission denied. Please allow camera access in your browser settings and refresh.')
      } else if (err.name === 'NotFoundError') {
        setWebcamError('No camera device found. Make sure your webcam is connected.')
      } else if (err.name === 'NotReadableError') {
        setWebcamError('Camera is in use by another application. Close other apps using the camera and try again.')
      } else {
        setWebcamError(`Camera error: ${err.message}. Try using Image upload mode instead.`)
      }
    }
  }, [])

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setWebcamReady(false)
  }, [])

  const captureWebcam = useCallback(() => {
    if (!videoRef.current || !webcamReady) return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' })
          setFile(capturedFile)
          setMode('upload')
          setResults(null)
          setError('')
          stopWebcam()
        }
      }, 'image/jpeg', 0.85)
    } catch (err) {
      setError('Failed to capture photo: ' + err.message)
    }
  }, [webcamReady, stopWebcam])

  // Clean up webcam when switching modes
  const switchToUpload = useCallback(() => {
    stopWebcam()
    setMode('upload')
    setWebcamError('')
  }, [stopWebcam])

  const switchToWebcam = useCallback(() => {
    setMode('webcam')
    setFile(null)
    setResults(null)
    setWebcamError('')
    // Start webcam after a tick so the video element is rendered
    setTimeout(() => startWebcam(), 100)
  }, [startWebcam])

  const runPrediction = async () => {
    if (!file) {
      setError('Please provide an image first.')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await axios.post(`${API_BASE}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30 second timeout
      })
      setResults(res.data)
      
      // Update image dimensions for bounding box calculations
      if (imgRef.current) {
        setPreviewSize({
           width: imgRef.current.clientWidth,
           height: imgRef.current.clientHeight,
           naturalWidth: imgRef.current.naturalWidth,
           naturalHeight: imgRef.current.naturalHeight
        })
      }
      
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server may be overloaded. Try again.')
      } else if (!err.response) {
        setError('Cannot connect to the server. Make sure Flask is running on port 5000.')
      } else {
        setError(err.response?.data?.error || 'Failed to run prediction')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Live Inference Test</h1>
        <p className="page-subtitle">Test out the 3 trained models simultaneously using an uploaded photo or your webcam.</p>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        
        {/* Input Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>Input Source</h2>
             
             {/* Segmented Control */}
             <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
                <button 
                  onClick={switchToUpload}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: '500',
                    borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: mode === 'upload' ? 'var(--accent-cyan)' : 'transparent',
                    color: mode === 'upload' ? '#000' : 'var(--text-secondary)'
                  }}
                >
                  <ImageIcon size={16} /> Image
                </button>
                <button 
                  onClick={switchToWebcam}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: '500',
                    borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: mode === 'webcam' ? 'var(--accent-cyan)' : 'transparent',
                    color: mode === 'webcam' ? '#000' : 'var(--text-secondary)'
                  }}
                >
                  <Video size={16} /> Webcam
                </button>
             </div>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (mode === 'upload') setIsDragActive(true) }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false) }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation(); setIsDragActive(false)
              if (mode === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
                const selectedFile = e.dataTransfer.files[0]
                if (selectedFile.type.startsWith('image/')) {
                  setFile(selectedFile)
                  setResults(null)
                  setError('')
                } else {
                  setError('Please select a valid image file (JPEG, PNG, WebP).')
                }
              }
            }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              position: 'relative', 
              minHeight: '300px',
              border: isDragActive ? '2px dashed var(--primary)' : '1px solid var(--border)',
              transition: 'border-color 0.2s var(--ease)'
            }}
          >
             {mode === 'webcam' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {webcamError ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <AlertCircle size={48} style={{ color: 'var(--warning)', margin: '0 auto 1rem', opacity: 0.7 }} />
                      <p style={{ color: 'var(--warning)', marginBottom: '1rem', lineHeight: '1.6' }}>{webcamError}</p>
                      <button className="btn btn-secondary" onClick={startWebcam} style={{ marginRight: '0.5rem' }}>
                        Retry Camera
                      </button>
                      <button className="btn btn-secondary" onClick={switchToUpload}>
                        Use Image Upload
                      </button>
                    </div>
                  ) : (
                    <>
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {webcamReady && (
                        <div style={{ position: 'absolute', bottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={captureWebcam} style={{ borderRadius: '50px', padding: '0.8rem 2rem' }}>
                            <Camera size={20} /> Capture Photo
                          </button>
                        </div>
                      )}
                      {!webcamReady && !webcamError && (
                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <RefreshCw className="spin" size={32} style={{ color: 'var(--accent-cyan)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>Starting camera...</span>
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
                         className="remove-btn"
                         title="Remove Image"
                      >
                         <X size={16} />
                      </button>

                      <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img 
                          ref={imgRef}
                          src={URL.createObjectURL(file)} 
                          alt="Input" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                          onLoad={(e) => {
                             setPreviewSize({
                               width: e.target.clientWidth,
                               height: e.target.clientHeight,
                               naturalWidth: e.target.naturalWidth,
                               naturalHeight: e.target.naturalHeight
                             })
                          }}
                        />
                        {/* Bounding Boxes */}
                        {results && results.faces && previewSize.naturalWidth > 0 && results.faces.map((face, idx) => {
                           const scaleX = previewSize.width / previewSize.naturalWidth
                           const scaleY = previewSize.height / previewSize.naturalHeight
                           
                           const imgRenderProps = imgRef.current.getBoundingClientRect()
                           const containerProps = imgRef.current.parentElement.getBoundingClientRect()
                           
                           const offsetX = (containerProps.width - imgRenderProps.width) / 2
                           const offsetY = (containerProps.height - imgRenderProps.height) / 2

                           return (
                              <div key={idx} style={{
                                 position: 'absolute',
                                 border: '2px solid var(--accent-1)',
                                 left: offsetX + (face.bbox.x * scaleX),
                                 top: offsetY + (face.bbox.y * scaleY),
                                 width: face.bbox.w * scaleX,
                                 height: face.bbox.h * scaleY,
                                 pointerEvents: 'none'
                               }}>
                                 <div style={{ 
                                   position: 'absolute', top: '-25px', left: '-2px', 
                                   background: 'var(--accent-1)', color: '#000', 
                                   padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold',
                                   whiteSpace: 'nowrap'
                                 }}>
                                   Face {idx + 1}
                                 </div>
                              </div>
                           )
                        })}
                      </div>

                      {/* Helper UI overlay before running prediction */}
                      {!results && !loading && (
                        <div style={{ 
                          position: 'absolute', bottom: '1rem', background: 'rgba(0,0,0,0.6)', 
                          padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem',
                          backdropFilter: 'blur(4px)', color: 'var(--accent-cyan)'
                        }}>
                           Image selected. Click "Run Recognition" below.
                        </div>
                      )}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                     <ImageIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                     <p>Upload an image to start</p>
                     <input type="file" accept="image/jpeg,image/png,image/webp" id="test-upload" style={{ display: 'none' }} onChange={handleFileChange} />
                     <label htmlFor="test-upload" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block', cursor: 'pointer' }}>
                        Browse Files
                     </label>
                  </div>
                )
             )}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button 
               className="btn btn-primary" 
               style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '1rem' }}
               onClick={runPrediction}
               disabled={!file || loading}
            >
               {loading ? <RefreshCw className="spin" size={20} /> : <Play size={20} />}
               {loading ? 'Running Inference...' : 'Run Recognition on All Models'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600' }}>Model Predictions</h2>
          
          {/* Model Selection Checkboxes */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: '1px solid var(--border)',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Active Models:
            </span>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={true} disabled style={{ accentColor: 'var(--primary)' }} />
                <span>SOTA MobileNetV2 (Default)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={includeCnn} 
                  onChange={(e) => setIncludeCnn(e.target.checked)} 
                  style={{ accentColor: 'var(--primary)' }} 
                />
                <span>Custom CNN</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={includeDeepFace} 
                  onChange={(e) => setIncludeDeepFace(e.target.checked)} 
                  style={{ accentColor: 'var(--primary)' }} 
                />
                <span>DeepFace (Facenet512)</span>
              </label>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {loading ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  <RefreshCw className="spin" size={40} style={{ marginBottom: '1rem', color: 'var(--accent-1)' }} />
                  <p>Analyzing faces using active models...</p>
               </div>
            ) : results ? (
               results.faces.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ color: 'var(--success)', marginBottom: '0.5rem', fontWeight: '500' }}>
                       {results.message}
                    </div>
                    {results.faces.map((face, i) => {
                       const useEnsemble = includeCnn || includeDeepFace;
                       
                       const displayLabel = useEnsemble ? face.ensemble.label : face.predictions.sota.label;
                       const displayConf = useEnsemble ? face.ensemble.confidence : face.predictions.sota.confidence;
                       const displayMethod = useEnsemble ? face.ensemble.method : "SOTA Model Only";
                       const displayAgreement = useEnsemble ? face.ensemble.agreement : "N/A";
                       const resultTitle = useEnsemble ? "Ensemble Result" : "SOTA MobileNetV2 Result";

                       return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem' }}>
                           <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--accent-1)' }}>Face {i + 1}</h3>
                           
                           {/* Main Result */}
                           <div style={{ 
                             background: useEnsemble ? 'rgba(0, 240, 255, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                             border: useEnsemble ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', 
                             borderRadius: '8px', padding: '0.8rem', marginBottom: '1rem' 
                           }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                   {resultTitle}
                                 </span>
                                 <div style={{ fontSize: '1.25rem', fontWeight: '700', color: displayLabel === 'Unknown' ? 'var(--warning)' : '#fff', marginTop: '4px' }}>
                                   {displayLabel}
                                 </div>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '1.5rem', fontWeight: '700', color: useEnsemble ? 'var(--accent-1)' : 'var(--success)' }}>
                                   {(displayConf * 100).toFixed(1)}%
                                 </div>
                                 <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                   {displayMethod} · {displayAgreement}
                                 </span>
                               </div>
                             </div>
                           </div>

                           <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                             Individual Models
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                              <PredictionRow 
                                model="SOTA MobileNetV2" 
                                label={face.predictions.sota.label} 
                                conf={face.predictions.sota.confidence} 
                              />
                              {includeCnn && (
                                <PredictionRow 
                                  model="Custom CNN" 
                                  label={face.predictions.cnn.label} 
                                  conf={face.predictions.cnn.confidence} 
                                />
                              )}
                              {includeDeepFace && (
                                <PredictionRow 
                                  model="DeepFace (Facenet512)" 
                                  label={face.predictions.deepface.label} 
                                  conf={face.predictions.deepface.confidence} 
                                />
                              )}
                           </div>
                        </div>
                       );
                    })}
                 </div>
               ) : (
                 <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
                    <Maximize size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No faces found in the image.</p>
                 </div>
               )
            ) : (
               <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
                  <p>Outputs will appear here after running inference.</p>
               </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}

function PredictionRow({ model, label, conf }) {
  const confPercent = (conf * 100).toFixed(1)
  
  // Decide color based on confidence and training status
  let barColor = 'var(--accent-2)' // red-ish
  if (label.includes('UNTRAINED') || label.includes('Not Trained') || label.includes('Error')) {
     barColor = 'var(--text-secondary)'
  } else if (confPercent > 80) {
     barColor = 'var(--success)'
  } else if (confPercent > 50) {
     barColor = 'var(--accent-1)' // cyan
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
         <span style={{ color: 'var(--text-secondary)' }}>{model}</span>
         <span style={{ fontWeight: '500', color: label.includes('UNTRAINED') ? 'var(--text-secondary)' : '#fff' }}>
           {label}
         </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
           <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, confPercent))}%`, background: barColor, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: '0.8rem', color: barColor, width: '40px', textAlign: 'right' }}>
           {confPercent}%
        </span>
      </div>
    </div>
  )
}
