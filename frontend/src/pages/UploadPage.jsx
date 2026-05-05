import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import axios from 'axios'
import { Camera, Image as ImageIcon, X, UploadCloud, CheckCircle, Video } from 'lucide-react'

// Make sure to match the backend port
const API_BASE = 'http://127.0.0.1:5000/api'

export default function UploadPage() {
  const navigate = useNavigate()
  const [personName, setPersonName] = useState('')
  const [images, setImages] = useState({
    front_img: [],
    left_img: [],
    right_img: [],
    extra_files: []
  })
  
  const [epochs, setEpochs] = useState(5)
  const [showWebcam, setShowWebcam] = useState(false)
  const webcamRef = useRef(null)
  
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFile = (field, files) => {
    if (!files) return
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    
    if (validFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please upload valid image files only.' })
      return
    }

    setImages(prev => ({
      ...prev,
      [field]: [...prev[field], ...validFiles]
    }))
  }

  const removeFile = (field, index) => {
    setImages(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const captureWebcam = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' })
            setImages(prev => ({ ...prev, extra_files: [...prev.extra_files, file] }))
            setShowWebcam(false)
          })
      }
    }
  }, [webcamRef])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!personName.trim()) {
      setStatus({ type: 'error', message: 'Person Name is required.' })
      return
    }

    const hasAnyImage = images.front_img.length > 0 || images.left_img.length > 0 || images.right_img.length > 0 || images.extra_files.length > 0
    if (!hasAnyImage) {
      setStatus({ type: 'error', message: 'Please provide at least one face photo.' })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'info', message: 'Uploading images and triggering processing...' })

    const formData = new FormData()
    formData.append('person_name', personName.trim())
    formData.append('epochs', epochs)
    
    images.front_img.forEach(file => formData.append('front_img', file))
    images.left_img.forEach(file => formData.append('left_img', file))
    images.right_img.forEach(file => formData.append('right_img', file))
    images.extra_files.forEach(file => formData.append('extra_files', file))

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStatus({ type: 'success', message: res.data.message })
      // Clear form on success
      setPersonName('')
      setImages({ front_img: [], left_img: [], right_img: [], extra_files: [] })
      
      // Redirect to training page exactly after successfully starting training
      setTimeout(() => navigate('/training'), 800)
    } catch (err) {
      console.error(err)
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to upload and start training. Check console for details.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fade-in">
      <h2 className="page-title">Register New Person</h2>
      <p className="page-subtitle">Provide photos from different angles to train the face recognition models.</p>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        
        {status.message && (
          <div className="mb-2" style={{
            padding: '1rem', borderRadius: '8px', 
            background: status.type === 'error' ? 'rgba(255, 71, 87, 0.1)' : 
                        status.type === 'success' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(0, 240, 255, 0.1)',
            border: `1px solid ${status.type === 'error' ? 'var(--danger)' : 
                                 status.type === 'success' ? 'var(--success)' : 'var(--accent-cyan)'}`,
            color: status.type === 'error' ? 'var(--danger)' : 
                   status.type === 'success' ? 'var(--success)' : 'var(--accent-cyan)'
          }}>
            {status.message}
          </div>
        )}

        <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 2 }}>
            <label className="input-label">Person Name</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="e.g. John_Doe (Use underscores)" 
              value={personName}
              onChange={(e) => setPersonName(e.target.value.replace(/\s+/g, '_'))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Training Epochs</label>
            <input 
              type="number" 
              className="text-input" 
              min="1" max="50"
              value={epochs}
              onChange={(e) => setEpochs(e.target.value)}
            />
          </div>
        </div>

        <div className="input-label" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Primary Angles (Multiple allowed)</span>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }} onClick={() => setShowWebcam(true)}>
            <Video size={16} /> Open Webcam
          </button>
        </div>
        
        {showWebcam && (
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Capture Photo from Webcam (Saved to Bulk)</h3>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowWebcam(false)}>Close</button>
            </div>
            <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
               <Webcam
                 audio={false}
                 ref={webcamRef}
                 screenshotFormat="image/jpeg"
                 videoConstraints={{ facingMode: "user" }}
                 style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
               />
            </div>
            <button type="button" className="btn btn-primary" onClick={captureWebcam}>
               <Camera size={18} /> Take Photo
            </button>
          </div>
        )}

        <div className="dropzone-grid">
          <DropBox 
            field="front_img" 
            title="Front Face" 
            files={images.front_img} 
            onFiles={(files) => handleFile('front_img', files)} 
            onRemove={(idx) => removeFile('front_img', idx)} 
          />
          <DropBox 
            field="left_img" 
            title="Left Profile" 
            files={images.left_img} 
            onFiles={(files) => handleFile('left_img', files)} 
            onRemove={(idx) => removeFile('left_img', idx)} 
          />
          <DropBox 
            field="right_img" 
            title="Right Profile" 
            files={images.right_img} 
            onFiles={(files) => handleFile('right_img', files)} 
            onRemove={(idx) => removeFile('right_img', idx)} 
          />
        </div>

        <div className="input-label" style={{ marginBottom: '1rem', marginTop: '2rem' }}>Additional Photos (Bulk Upload)</div>
        <div className="dropzone dropzone-bulk">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden-input" 
            style={{ display: 'none' }} 
            id="bulk-upload"
            onChange={(e) => {
              handleFile('extra_files', e.target.files)
            }}
          />
          <label htmlFor="bulk-upload" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
            <div className="dropzone-content text-center">
              <UploadCloud size={32} />
              <span className="dropzone-title">Click or Drag additional photos here</span>
              <span className="dropzone-subtitle">Accepts multiple files</span>
            </div>
          </label>

          {images.extra_files.length > 0 && (
            <div className="bulk-previews">
              {images.extra_files.map((file, i) => (
                <div key={i} className="bulk-thumb-container">
                  <img src={URL.createObjectURL(file)} className="bulk-thumb" alt="bulk thumb" />
                  <button type="button" className="bulk-remove" onClick={() => removeFile('extra_files', i)}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? (
            <>Uploading & Processing...</>
          ) : (
            <><CheckCircle size={20} /> Upload & Start Training</>
          )}
        </button>
      </form>
    </div>
  )
}

// Reusable DropBox component (now accepts multiple files)
function DropBox({ field, title, files, onFiles, onRemove }) {
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation() }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files)
    }
  }

  return (
    <div 
      className={`dropzone ${(files && files.length > 0) ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      
      {(files && files.length > 0) ? (
        <div className="bulk-previews" style={{ flexWrap: 'wrap', overflowY: 'auto', maxHeight: '100%', justifyContent: 'center' }}>
          {files.map((file, i) => (
             <div key={i} className="bulk-thumb-container" onClick={(e) => e.stopPropagation()}>
               <img src={URL.createObjectURL(file)} alt="preview" className="dropzone-preview" style={{ position: 'relative' }}/>
               <button type="button" className="remove-btn" style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20 }} onClick={(e) => { e.stopPropagation(); onRemove(i) }}>
                 <X size={12} />
               </button>
             </div>
          ))}
        </div>
      ) : (
        <div className="dropzone-content">
          <Camera size={32} />
          <span className="dropzone-title">{title}</span>
          <span className="dropzone-subtitle">JPEG, PNG (Multiple)</span>
        </div>
      )}
    </div>
  )
}
