import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'
import { Camera, Image as ImageIcon, Video, RefreshCw, Maximize, Play, X } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:5000/api'

export default function TestPage() {
  const [mode, setMode] = useState('upload') // 'upload' or 'webcam'
  const [file, setFile] = useState(null)
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const webcamRef = useRef(null)
  const imgRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResults(null)
      setError('')
    }
  }

  const captureWebcam = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        // Convert base64 to file
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const capturedFile = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' })
            setFile(capturedFile)
            setMode('upload') // Switch to display mode
            setResults(null)
            setError('')
          })
      }
    }
  }, [webcamRef])

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
        headers: { 'Content-Type': 'multipart/form-data' }
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
      setError(err.response?.data?.error || 'Failed to run prediction')
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
        <div style={{ padding: '1rem', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
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
                  onClick={() => setMode('upload')}
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
                  onClick={() => { setMode('webcam'); setFile(null); setResults(null); }}
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

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
             {mode === 'webcam' ? (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                     <button className="btn btn-primary" onClick={captureWebcam} style={{ borderRadius: '50px', padding: '0.8rem 2rem' }}>
                        <Camera size={20} /> Capture Photo
                     </button>
                  </div>
                </>
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
                           
                           // Calculate offset if image is letterboxed inside the flex container
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
                     <input type="file" accept="image/*" id="test-upload" style={{ display: 'none' }} onChange={handleFileChange} />
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
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {loading ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  <RefreshCw className="spin" size={40} style={{ marginBottom: '1rem', color: 'var(--accent-1)' }} />
                  <p>Analyzing faces using 3 internal models...</p>
               </div>
            ) : results ? (
               results.faces.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ color: 'var(--success)', marginBottom: '0.5rem', fontWeight: '500' }}>
                       {results.message}
                    </div>
                    {results.faces.map((face, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem' }}>
                         <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--accent-1)' }}>Face {i + 1}</h3>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <PredictionRow 
                              model="SOTA MobileNetV2" 
                              label={face.predictions.sota.label} 
                              conf={face.predictions.sota.confidence} 
                            />
                            <PredictionRow 
                              model="Custom CNN" 
                              label={face.predictions.cnn.label} 
                              conf={face.predictions.cnn.confidence} 
                            />
                            <PredictionRow 
                              model="DeepFace (Facenet512)" 
                              label={face.predictions.deepface.label} 
                              conf={face.predictions.deepface.confidence} 
                            />
                         </div>
                      </div>
                    ))}
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
