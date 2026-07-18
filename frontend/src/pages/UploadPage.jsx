import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Camera, Image as ImageIcon, X, UploadCloud, CheckCircle, Video, AlertCircle, Info, ChevronRight, Move } from 'lucide-react'

import { API_BASE } from '../config'

const FIELD_TO_ANGLE = {
  front_img: 'frontal',
  left_img: 'left',
  right_img: 'right',
  extra_files: 'extra'
}

export default function UploadPage() {
  const navigate = useNavigate()
  
  // Selection Mode: 'new' or 'update'
  const [mode, setMode] = useState('new')
  const [existingPersons, setExistingPersons] = useState([])
  const [personName, setPersonName] = useState('')
  const [existingPhotos, setExistingPhotos] = useState([])
  
  const [images, setImages] = useState({
    front_img: [],
    left_img: [],
    right_img: [],
    extra_files: []
  })
  
  const [epochs, setEpochs] = useState(5)
  const [showWebcam, setShowWebcam] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeField, setActiveField] = useState('front_img')

  const totalNewImages = images.front_img.length + images.left_img.length + images.right_img.length + images.extra_files.length
  const totalAvailablePhotos = totalNewImages + existingPhotos.length

  // Fetch existing persons on mount
  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const res = await axios.get(`${API_BASE}/persons`)
        setExistingPersons(res.data)
      } catch (err) {
        console.warn('Failed to load existing persons list:', err)
      }
    }
    fetchPersons()
  }, [])

  // Fetch existing photos when personName changes in update mode
  useEffect(() => {
    if (mode === 'update' && personName) {
      const fetchPhotos = async () => {
        try {
          const res = await axios.get(`${API_BASE}/persons/${personName}/photos`)
          setExistingPhotos(res.data)
        } catch (err) {
          console.warn('Failed to fetch photos:', err)
          setExistingPhotos([])
        }
      }
      fetchPhotos()
    } else {
      setExistingPhotos([])
    }
  }, [mode, personName])

  // ── Webcam logic ──
  const startWebcam = async () => {
    setShowWebcam(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Camera error: ${err.message}. Use file upload instead.` })
      setShowWebcam(false)
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowWebcam(false)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const captureWebcam = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setImages(prev => ({ ...prev, extra_files: [...prev.extra_files, file] }))
        setStatus({ type: 'success', message: 'Photo captured and added to uploads.' })
      }
    }, 'image/jpeg', 0.9)
  }, [])

  // ── File handling ──
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

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            files.push(file)
          }
        }
      }
      if (files.length > 0) {
        setImages(prev => ({
          ...prev,
          [activeField]: [...prev[activeField], ...files]
        }))
        setStatus({ type: 'success', message: `Pasted ${files.length} image(s) into ${activeField.replace('_', ' ')}.` })
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [activeField])

  // Move existing photo on backend when dragged & dropped
  const handleMoveExistingPhoto = async (sourceAngle, targetAngle, filename) => {
    try {
      setStatus({ type: 'info', message: 'Moving saved photo...' })
      const res = await axios.post(`${API_BASE}/persons/${personName}/photos/move`, {
        source_angle: sourceAngle,
        target_angle: targetAngle,
        filename: filename
      })
      
      // Update UI state
      setExistingPhotos(prev => {
        const filtered = prev.filter(p => !(p.angle === sourceAngle && p.filename === filename))
        return [...filtered, {
          angle: targetAngle,
          filename: res.data.new_filename,
          url: `/api/persons/${personName}/photos/${targetAngle}/${res.data.new_filename}`
        }]
      })
      setStatus({ type: 'success', message: `Successfully moved photo to ${targetAngle} folder.` })
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to move photo on backend.' })
    }
  }

  // Delete existing photo instantly
  const handleDeleteExistingPhoto = async (angle, filename) => {
    if (!window.confirm(`Are you sure you want to delete this photo from the database?`)) return
    try {
      await axios.delete(`${API_BASE}/persons/${personName}/photos/${angle}/${filename}`)
      setExistingPhotos(prev => prev.filter(p => !(p.angle === angle && p.filename === filename)))
      setStatus({ type: 'success', message: `Deleted saved photo '${filename}' successfully.` })
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Failed to delete photo from database.' })
    }
  }

  // Drag and drop local thumbnails handler
  const handleMoveLocalFile = (sourceField, targetField, index) => {
    if (sourceField === targetField) return
    const fileToMove = images[sourceField][index]
    setImages(prev => ({
      ...prev,
      [sourceField]: prev[sourceField].filter((_, i) => i !== index),
      [targetField]: [...prev[targetField], fileToMove]
    }))
    setStatus({ type: 'success', message: `Moved new upload to ${targetField.replace('_', ' ')}.` })
  }

  // ── Form submission ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!personName.trim()) {
      setStatus({ type: 'error', message: 'Person Name is required.' })
      return
    }

    if (totalAvailablePhotos === 0) {
      setStatus({ type: 'error', message: 'Please provide or keep at least one face photo.' })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'info', message: 'Triggering processing...' })

    // If new photos were added, we submit via multipart upload endpoint
    if (totalNewImages > 0) {
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
        setPersonName('')
        setImages({ front_img: [], left_img: [], right_img: [], extra_files: [] })
        setTimeout(() => navigate('/training'), 3000)
      } catch (err) {
        console.error(err)
        setStatus({ 
          type: 'error', 
          message: err.response?.data?.error || 'Failed to upload and start training.' 
        })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Retrain existing photos only
      try {
        const res = await axios.post(`${API_BASE}/persons/${personName.trim()}/retrain`, {
          epochs: epochs
        })
        setStatus({ type: 'success', message: res.data.message })
        setPersonName('')
        setTimeout(() => navigate('/training'), 3000)
      } catch (err) {
        console.error(err)
        setStatus({
          type: 'error',
          message: err.response?.data?.error || 'Failed to trigger model retraining.'
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const statusColors = {
    error:   { bg: 'var(--error-bg)',   border: 'rgba(239, 68, 68, 0.3)',  color: 'var(--error)',   icon: <AlertCircle size={18} /> },
    success: { bg: 'var(--success-bg)', border: 'rgba(16, 185, 129, 0.3)', color: 'var(--success)', icon: <CheckCircle size={18} /> },
    info:    { bg: 'var(--info-bg)',    border: 'rgba(59, 130, 246, 0.3)', color: 'var(--info)',    icon: <Info size={18} /> },
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Dynamic Header */}
      <h1 className="page-title">{mode === 'new' ? 'Register New Person' : 'Update & Retrain Person'}</h1>
      <p className="page-subtitle">
        {mode === 'new' ? 'Register a new subject with frontal and side-face profiles.' : 'Add new photos or manage existing photos for this person, then retrain.'}
        <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px' }}>
          ({totalAvailablePhotos} photo{totalAvailablePhotos !== 1 ? 's' : ''} available)
        </span>
      </p>

      {/* Mode Selector Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
        <button 
          type="button" 
          className={`btn ${mode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setMode('new'); setPersonName(''); setStatus({ type: '', message: '' }); }}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          ➕ Register New
        </button>
        <button 
          type="button" 
          className={`btn ${mode === 'update' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setMode('update'); setPersonName(''); setStatus({ type: '', message: '' }); }}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          🔄 Add Photos & Retrain
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel hover-scale" style={{ padding: '2rem' }}>
        
        {/* Status Banner */}
        {status.message && (() => {
          const s = statusColors[status.type] || statusColors.info
          return (
            <div className="mb-2 animate-fade-in" style={{
              padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', 
              background: s.bg, border: `1px solid ${s.border}`, color: s.color,
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem',
              marginBottom: '1.5rem'
            }}>
              {s.icon} {status.message}
            </div>
          )
        })()}

        {/* Name Selector + Epochs */}
        <div className="input-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '250px' }}>
            <label className="input-label">{mode === 'new' ? 'Person Name' : 'Select Existing Person'}</label>
            {mode === 'new' ? (
              <input 
                type="text" 
                className="text-input" 
                placeholder="e.g. John_Doe (Use letters, numbers, underscores)" 
                value={personName}
                onChange={(e) => setPersonName(e.target.value.replace(/\s+/g, '_'))}
                required
              />
            ) : (
              <select 
                className="text-input" 
                value={personName} 
                onChange={(e) => setPersonName(e.target.value)}
                required
                style={{ appearance: 'none', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', height: '42px', padding: '0 1rem' }}
              >
                <option value="">-- Choose Person --</option>
                {existingPersons.map(p => (
                  <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
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

        {/* Angle Dropzones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
          <span className="input-label" style={{ margin: 0 }}>Primary Face Angles (Upload, Capture, or Drag between categories)</span>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={showWebcam ? stopWebcam : startWebcam}>
            {showWebcam ? <><X size={14} /> Close Camera</> : <><Video size={14} /> Open Webcam</>}
          </button>
        </div>

        {/* Native Webcam */}
        {showWebcam && (
          <div style={{ 
            padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', 
            marginBottom: '1.5rem', textAlign: 'center' 
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}
            />
            <div>
              <button type="button" className="btn btn-primary hover-btn" onClick={captureWebcam}>
                <Camera size={18} /> Capture Photo
              </button>
            </div>
          </div>
        )}
        
        <div className="dropzone-grid">
          <DropBox 
            field="front_img" 
            title="Front Face" 
            files={images.front_img} 
            existingFiles={existingPhotos.filter(p => p.angle === 'frontal')}
            personName={personName}
            isActive={activeField === 'front_img'}
            onFocus={() => setActiveField('front_img')}
            onFiles={(files) => handleFile('front_img', files)} 
            onRemove={(idx) => removeFile('front_img', idx)} 
            onDeleteExisting={(filename) => handleDeleteExistingPhoto('frontal', filename)}
            onDropMoveLocal={(sourceField, index) => handleMoveLocalFile(sourceField, 'front_img', index)}
            onDropMoveExisting={(sourceAngle, filename) => handleMoveExistingPhoto(sourceAngle, 'frontal', filename)}
          />
          <DropBox 
            field="left_img" 
            title="Left Profile" 
            files={images.left_img} 
            existingFiles={existingPhotos.filter(p => p.angle === 'left')}
            personName={personName}
            isActive={activeField === 'left_img'}
            onFocus={() => setActiveField('left_img')}
            onFiles={(files) => handleFile('left_img', files)} 
            onRemove={(idx) => removeFile('left_img', idx)} 
            onDeleteExisting={(filename) => handleDeleteExistingPhoto('left', filename)}
            onDropMoveLocal={(sourceField, index) => handleMoveLocalFile(sourceField, 'left_img', index)}
            onDropMoveExisting={(sourceAngle, filename) => handleMoveExistingPhoto(sourceAngle, 'left', filename)}
          />
          <DropBox 
            field="right_img" 
            title="Right Profile" 
            files={images.right_img} 
            existingFiles={existingPhotos.filter(p => p.angle === 'right')}
            personName={personName}
            isActive={activeField === 'right_img'}
            onFocus={() => setActiveField('right_img')}
            onFiles={(files) => handleFile('right_img', files)} 
            onRemove={(idx) => removeFile('right_img', idx)} 
            onDeleteExisting={(filename) => handleDeleteExistingPhoto('right', filename)}
            onDropMoveLocal={(sourceField, index) => handleMoveLocalFile(sourceField, 'right_img', index)}
            onDropMoveExisting={(sourceAngle, filename) => handleMoveExistingPhoto(sourceAngle, 'right', filename)}
          />
        </div>

        {/* Bulk Upload */}
        <div className="input-label" style={{ marginBottom: '1rem', marginTop: '2rem' }}>
          Additional Photos (Bulk Upload) — {activeField === 'extra_files' ? <strong style={{ color: 'var(--primary)' }}>Active paste target</strong> : <span style={{ color: 'var(--text-secondary)' }}>Click to select paste target</span>}
        </div>
        <div 
          className="dropzone dropzone-bulk" 
          onClick={() => setActiveField('extra_files')}
          onMouseEnter={() => setActiveField('extra_files')}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            const sourceType = e.dataTransfer.getData("sourceType")
            if (sourceType === "local") {
              const sourceField = e.dataTransfer.getData("sourceField")
              const index = parseInt(e.dataTransfer.getData("sourceIndex"))
              handleMoveLocalFile(sourceField, 'extra_files', index)
            } else if (sourceType === "existing") {
              const sourceAngle = e.dataTransfer.getData("sourceAngle")
              const filename = e.dataTransfer.getData("filename")
              handleMoveExistingPhoto(sourceAngle, 'extra', filename)
            } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFile('extra_files', e.dataTransfer.files)
            }
          }}
          style={{
            border: activeField === 'extra_files' ? '2px solid var(--primary)' : '1px dashed var(--border)',
            boxShadow: activeField === 'extra_files' ? 'var(--shadow-glow)' : 'none',
            transition: 'all 0.25s var(--ease)',
          }}
        >
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            style={{ display: 'none' }} 
            id="bulk-upload"
            onChange={(e) => handleFile('extra_files', e.target.files)}
          />
          <label htmlFor="bulk-upload" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
            <div className="dropzone-content text-center">
              <UploadCloud size={32} />
              <span className="dropzone-title">Click, Drag, or Paste additional photos here</span>
              <span className="dropzone-subtitle">Drag thumbnails between sections to re-categorize</span>
            </div>
          </label>

          {(images.extra_files.length > 0 || existingPhotos.filter(p => p.angle === 'extra').length > 0) && (
            <div className="bulk-previews" onClick={e => e.stopPropagation()}>
              {/* Existing Extra photos */}
              {existingPhotos.filter(p => p.angle === 'extra').map((p) => (
                <div 
                  key={p.filename} 
                  className="bulk-thumb-container" 
                  style={{ border: '1px solid var(--primary-light)', cursor: 'grab' }}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("sourceType", "existing")
                    e.dataTransfer.setData("sourceAngle", "extra")
                    e.dataTransfer.setData("filename", p.filename)
                  }}
                >
                  <img src={`${API_BASE}/persons/${personName}/photos/extra/${p.filename}`} className="bulk-thumb" alt="existing thumb" />
                  <button type="button" className="bulk-remove" style={{ background: 'var(--error)' }} onClick={() => handleDeleteExistingPhoto('extra', p.filename)}><X size={12} /></button>
                </div>
              ))}
              {/* New Extra photos */}
              {images.extra_files.map((file, i) => (
                <div 
                  key={i} 
                  className="bulk-thumb-container"
                  style={{ cursor: 'grab' }}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("sourceType", "local")
                    e.dataTransfer.setData("sourceField", "extra_files")
                    e.dataTransfer.setData("sourceIndex", i.toString())
                  }}
                >
                  <img src={URL.createObjectURL(file)} className="bulk-thumb" alt="bulk thumb" />
                  <button type="button" className="bulk-remove" onClick={() => removeFile('extra_files', i)}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary btn-block hover-btn" style={{ marginTop: '2rem' }} disabled={isSubmitting}>
          {isSubmitting ? (
            <>Uploading & Processing...</>
          ) : (
            <><CheckCircle size={20} /> {mode === 'new' ? 'Upload & Start Training' : 'Update & Retrain models'}</>
          )}
        </button>
      </form>
    </div>
  )
}

// Reusable DropBox component
function DropBox({ field, title, files, existingFiles = [], personName, isActive, onFocus, onFiles, onRemove, onDeleteExisting, onDropMoveLocal, onDropMoveExisting }) {
  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation() }
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false) }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    // Check if dragging local file from another category
    const sourceType = e.dataTransfer.getData("sourceType")
    if (sourceType === "local") {
      const sourceField = e.dataTransfer.getData("sourceField")
      const index = parseInt(e.dataTransfer.getData("sourceIndex"))
      if (sourceField && !isNaN(index)) {
        onDropMoveLocal(sourceField, index)
      }
    } else if (sourceType === "existing") {
      // Check if dragging existing photo from another category
      const sourceAngle = e.dataTransfer.getData("sourceAngle")
      const filename = e.dataTransfer.getData("filename")
      if (sourceAngle && filename) {
        onDropMoveExisting(sourceAngle, filename)
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files)
    }
  }

  const hasContent = files.length > 0 || existingFiles.length > 0

  return (
    <div 
      className={`dropzone ${hasContent ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        onFocus()
        fileInputRef.current?.click()
      }}
      onMouseEnter={onFocus}
      style={{
        border: isActive ? '2px solid var(--primary)' : (isDragActive ? '2px dashed var(--primary)' : '1px dashed var(--border)'),
        boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
        transition: 'all 0.25s var(--ease)',
        position: 'relative'
      }}
    >
      <input 
        type="file" 
        multiple
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      
      {isActive && (
        <span style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none', zIndex: 10 }}>
          Active Target
        </span>
      )}

      {hasContent ? (
        <div className="bulk-previews" style={{ flexWrap: 'wrap', overflowY: 'auto', maxHeight: '100%', justifyContent: 'center', paddingTop: isActive ? '20px' : '0' }}>
          {/* Render Existing Saved Photos */}
          {existingFiles.map((p) => {
            const imgUrl = `${API_BASE}/persons/${personName}/photos/${p.angle}/${p.filename}`
            return (
              <div 
                key={p.filename} 
                className="bulk-thumb-container" 
                style={{ border: '1px solid var(--primary-light)', cursor: 'grab' }} 
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("sourceType", "existing")
                  e.dataTransfer.setData("sourceAngle", p.angle)
                  e.dataTransfer.setData("filename", p.filename)
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <img src={imgUrl} alt="existing preview" className="dropzone-preview" style={{ position: 'relative' }}/>
                <button type="button" className="remove-btn" style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, background: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); onDeleteExisting(p.filename) }}>
                  <X size={12} />
                </button>
              </div>
            )
          })}
          
          {/* Render Newly Selected Photos */}
          {files.map((file, i) => (
             <div 
               key={i} 
               className="bulk-thumb-container" 
               draggable={true}
               onDragStart={(e) => {
                 e.dataTransfer.setData("sourceType", "local")
                 e.dataTransfer.setData("sourceField", field)
                 e.dataTransfer.setData("sourceIndex", i.toString())
               }}
               onClick={(e) => e.stopPropagation()}
             >
               <img src={URL.createObjectURL(file)} alt="new preview" className="dropzone-preview" style={{ position: 'relative' }}/>
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
