import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Trash2, Camera, UploadCloud, Video, X, CheckCircle, AlertTriangle, Plus, RotateCw, Image as ImageIcon } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:5000/api'

export default function ManagePersonPage() {
  const { name } = useParams()
  const navigate = useNavigate()
  
  const [personName, setPersonName] = useState(name || '')
  const [originalName, setOriginalName] = useState(name || '')
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  
  // Retrain options
  const [epochs, setEpochs] = useState(10)
  const [activeField, setActiveField] = useState('front_img') // 'front_img', 'left_img', 'right_img'
  
  // Uploading new photos
  const [images, setImages] = useState({
    front_img: [],
    left_img: [],
    right_img: [],
    extra_files: []
  })
  
  // Webcam state
  const [showWebcam, setShowWebcam] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  
  const totalNewImages = images.front_img.length + images.left_img.length + images.right_img.length + images.extra_files.length

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

  // Load photos on mount
  const fetchPhotos = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/persons/${originalName}/photos`)
      setPhotos(res.data)
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Failed to fetch person photos.' })
    } finally {
      setIsLoading(false)
    }
  }, [originalName])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  // Cleanup webcam
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Webcam controls
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
      setStatus({ type: 'error', message: `Camera error: ${err.message}` })
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
        setStatus({ type: 'success', message: 'Photo captured and added to extra files.' })
      }
    }, 'image/jpeg', 0.9)
  }, [])

  // File Handling
  const handleFile = (field, files) => {
    if (!files) return
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (validFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please select valid image files only.' })
      return
    }
    setImages(prev => ({
      ...prev,
      [field]: [...prev[field], ...validFiles]
    }))
  }

  const removeNewFile = (field, index) => {
    setImages(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Delete existing photo
  const handleDeletePhoto = async (angle, filename) => {
    if (!window.confirm(`Are you sure you want to delete this photo from the ${angle} angle?`)) return
    try {
      setIsSubmitting(true)
      const res = await axios.delete(`${API_BASE}/persons/${originalName}/photos/${angle}/${filename}`)
      setStatus({ type: 'success', message: res.data.message })
      fetchPhotos()
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to delete photo.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Move existing photo on backend
  const handleMoveExistingPhoto = async (sourceAngle, targetAngle, filename) => {
    try {
      setStatus({ type: 'info', message: 'Moving photo...' })
      await axios.post(`${API_BASE}/persons/${originalName}/photos/move`, {
        source_angle: sourceAngle,
        target_angle: targetAngle,
        filename: filename
      })
      setStatus({ type: 'success', message: `Moved photo to ${targetAngle} category successfully.` })
      fetchPhotos()
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to move photo.' })
    }
  }

  // Move newly selected local file between categories
  const handleMoveLocalFile = (sourceField, targetField, index) => {
    if (sourceField === targetField) return
    const fileToMove = images[sourceField][index]
    setImages(prev => ({
      ...prev,
      [sourceField]: prev[sourceField].filter((_, i) => i !== index),
      [targetField]: [...prev[targetField], fileToMove]
    }))
    setStatus({ type: 'success', message: `Moved new photo to ${targetField.replace('_', ' ')}.` })
  }

  // Submit edits & retraining
  const handleSaveChanges = async (triggerRetrain = false) => {
    setIsSubmitting(true)
    setStatus({ type: 'info', message: 'Processing your changes...' })

    try {
      let currentActiveName = originalName

      // 1. Rename if changed
      if (personName.trim() && personName.trim() !== originalName) {
        const renameRes = await axios.put(`${API_BASE}/persons/${originalName}`, {
          new_name: personName.trim()
        })
        currentActiveName = personName.trim()
        setOriginalName(currentActiveName)
      }

      // 2. Upload new photos if any selected
      if (totalNewImages > 0) {
        const formData = new FormData()
        formData.append('person_name', currentActiveName)
        formData.append('epochs', epochs)
        
        images.front_img.forEach(file => formData.append('front_img', file))
        images.left_img.forEach(file => formData.append('left_img', file))
        images.right_img.forEach(file => formData.append('right_img', file))
        images.extra_files.forEach(file => formData.append('extra_files', file))

        const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        setStatus({ type: 'success', message: 'Photos uploaded successfully. Fine-tuning models...' })
        // Clear new images state
        setImages({ front_img: [], left_img: [], right_img: [], extra_files: [] })
        setTimeout(() => navigate('/training'), 800)
        return
      }

      // 3. Trigger retrain without adding photos (if requested)
      if (triggerRetrain) {
        const retrainRes = await axios.post(`${API_BASE}/persons/${currentActiveName}/retrain`, {
          epochs: epochs
        })
        setStatus({ type: 'success', message: retrainRes.data.message })
        setTimeout(() => navigate('/training'), 800)
        return
      }

      setStatus({ type: 'success', message: 'Changes saved successfully.' })
      fetchPhotos()

    } catch (err) {
      console.error(err)
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to save changes. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Categorize existing photos
  const frontalPhotos = photos.filter(p => p.angle === 'frontal')
  const leftPhotos = photos.filter(p => p.angle === 'left')
  const rightPhotos = photos.filter(p => p.angle === 'right')
  const extraPhotos = photos.filter(p => p.angle === 'extra')

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
        <p>Loading person details...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Back Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        Manage Person: <span style={{ color: 'var(--primary-light)' }}>{originalName.replace(/_/g, ' ')}</span>
      </h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        Modify database entries, delete incorrect crops, upload new training data, or fine-tune models.
      </p>

      {/* Status Banner */}
      {status.message && (
        <div className="animate-fade-in" style={{
          padding: '1rem', borderRadius: 'var(--radius-md)', 
          background: status.type === 'error' ? 'var(--error-bg)' : status.type === 'success' ? 'var(--success-bg)' : 'var(--info-bg)', 
          border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`, 
          color: status.type === 'error' ? 'var(--error)' : status.type === 'success' ? 'var(--success)' : 'var(--info)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem',
          marginBottom: '2rem'
        }}>
          {status.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {status.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* LEFT COLUMN: Name, Settings, Upload Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* General Settings */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              General Settings
            </h3>
            
            <div className="input-group">
              <label className="input-label">Rename Person Name</label>
              <input 
                type="text" 
                className="text-input" 
                value={personName} 
                onChange={e => setPersonName(e.target.value.replace(/\s+/g, '_'))}
                disabled={isSubmitting}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>⚠️ Renaming updates embedding tags instantly without requiring model retraining.</span>
            </div>

            <div className="input-group" style={{ marginTop: '1.5rem' }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fine-Tuning Epochs</span>
                <strong style={{ color: 'var(--primary-light)' }}>{epochs} epochs</strong>
              </label>
              <input 
                type="range" 
                min="1" max="50" 
                value={epochs} 
                onChange={e => setEpochs(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
                disabled={isSubmitting}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Epoch values between 10-15 are recommended for new profiles.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
              <button className="btn btn-primary hover-btn" style={{ flex: 1 }} onClick={() => handleSaveChanges(true)} disabled={isSubmitting}>
                <RotateCw size={16} /> Save & Retrain Models
              </button>
              <button className="btn btn-secondary" onClick={() => handleSaveChanges(false)} disabled={isSubmitting}>
                Save Details Only
              </button>
            </div>
          </section>

          {/* Upload / Capture Additional Images */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Add New Photos</h3>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={showWebcam ? stopWebcam : startWebcam}>
                {showWebcam ? <><X size={12} /> Close Camera</> : <><Video size={12} /> Live Capture</>}
              </button>
            </div>

            {/* Webcam Module */}
            {showWebcam && (
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', textAlign: 'center' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
                <button type="button" className="btn btn-primary hover-btn" onClick={captureWebcam}>
                  <Camera size={16} /> Capture Photo
                </button>
              </div>
            )}

            {/* Angle-Specific Dropzones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Frontal Profile</span>
                  {activeField === 'front_img' && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>Active Target</span>}
                </label>
                <DropBoxSmall 
                  field="front_img" 
                  files={images.front_img} 
                  isActive={activeField === 'front_img'} 
                  onFocus={() => setActiveField('front_img')} 
                  onFiles={f => handleFile('front_img', f)} 
                  onRemove={i => removeNewFile('front_img', i)} 
                  onDropMoveLocal={(sourceField, index) => handleMoveLocalFile(sourceField, 'front_img', index)}
                  onDropMoveExisting={(sourceAngle, filename) => handleMoveExistingPhoto(sourceAngle, 'frontal', filename)}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Left profile</span>
                  {activeField === 'left_img' && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>Active Target</span>}
                </label>
                <DropBoxSmall 
                  field="left_img" 
                  files={images.left_img} 
                  isActive={activeField === 'left_img'} 
                  onFocus={() => setActiveField('left_img')} 
                  onFiles={f => handleFile('left_img', f)} 
                  onRemove={i => removeNewFile('left_img', i)} 
                  onDropMoveLocal={(sourceField, index) => handleMoveLocalFile(sourceField, 'left_img', index)}
                  onDropMoveExisting={(sourceAngle, filename) => handleMoveExistingPhoto(sourceAngle, 'left', filename)}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Right profile</span>
                  {activeField === 'right_img' && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>Active Target</span>}
                </label>
                <DropBoxSmall 
                  field="right_img" 
                  files={images.right_img} 
                  isActive={activeField === 'right_img'} 
                  onFocus={() => setActiveField('right_img')} 
                  onFiles={f => handleFile('right_img', f)} 
                  onRemove={i => removeNewFile('right_img', i)} 
                  onDropMoveLocal={(sourceField, index) => handleMoveLocalFile(sourceField, 'right_img', index)}
                  onDropMoveExisting={(sourceAngle, filename) => handleMoveExistingPhoto(sourceAngle, 'right', filename)}
                />
              </div>
            </div>

            {totalNewImages > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-primary btn-block hover-btn" onClick={() => handleSaveChanges(true)} disabled={isSubmitting}>
                  <CheckCircle size={18} /> Upload & Fine-Tune Models
                </button>
              </div>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN: Current Photos Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section className="glass-panel" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cleaned Photos Database</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{photos.length} files total</span>
            </h3>

            {photos.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
                <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No photos in database for this person.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: '650px', paddingRight: '6px' }}>
                
                {/* Frontal Category */}
                {frontalPhotos.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>FRONTAL ANGLE</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                      {frontalPhotos.map(p => (
                        <PhotoThumb key={p.filename} photo={p} name={originalName} onDelete={() => handleDeletePhoto(p.angle, p.filename)} disabled={isSubmitting} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Left Profile Category */}
                {leftPhotos.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LEFT PROFILE</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                      {leftPhotos.map(p => (
                        <PhotoThumb key={p.filename} photo={p} name={originalName} onDelete={() => handleDeletePhoto(p.angle, p.filename)} disabled={isSubmitting} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Right Profile Category */}
                {rightPhotos.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>RIGHT PROFILE</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                      {rightPhotos.map(p => (
                        <PhotoThumb key={p.filename} photo={p} name={originalName} onDelete={() => handleDeletePhoto(p.angle, p.filename)} disabled={isSubmitting} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Category */}
                {extraPhotos.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>EXTRA ANGLE</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                      {extraPhotos.map(p => (
                        <PhotoThumb key={p.filename} photo={p} name={originalName} onDelete={() => handleDeletePhoto(p.angle, p.filename)} disabled={isSubmitting} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </section>

        </div>

      </div>

    </div>
  )
}

// Compact photo thumbnail component with hover delete button
function PhotoThumb({ photo, name, onDelete, disabled }) {
  const [hovered, setHovered] = useState(false)
  const fullUrl = `${API_BASE}/persons/${name}/photos/${photo.angle}/${photo.filename}`
  
  return (
    <div 
      style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', cursor: 'grab' }}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("sourceType", "existing")
        e.dataTransfer.setData("sourceAngle", photo.angle)
        e.dataTransfer.setData("filename", photo.filename)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={fullUrl} alt="face crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {hovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            type="button" 
            onClick={onDelete} 
            disabled={disabled}
            style={{ border: 'none', background: 'var(--error)', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// Small custom dropbox input for management screen
function DropBoxSmall({ field, files, isActive, onFocus, onFiles, onRemove, onDropMoveLocal, onDropMoveExisting }) {
  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)
  
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation() }
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false) }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragActive(false)
    
    const sourceType = e.dataTransfer.getData("sourceType")
    if (sourceType === "local") {
      const sourceField = e.dataTransfer.getData("sourceField")
      const index = parseInt(e.dataTransfer.getData("sourceIndex"))
      if (sourceField && !isNaN(index)) {
        onDropMoveLocal(sourceField, index)
      }
    } else if (sourceType === "existing") {
      const sourceAngle = e.dataTransfer.getData("sourceAngle")
      const filename = e.dataTransfer.getData("filename")
      if (sourceAngle && filename) {
        onDropMoveExisting(sourceAngle, filename)
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files)
    }
  }

  return (
    <div 
      className={`dropzone ${(files && files.length > 0) ? 'active' : ''}`}
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
        padding: '0.5rem 1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        minHeight: '45px', 
        borderStyle: isActive ? 'solid' : 'dashed', 
        borderWidth: isActive ? '2px' : '1px',
        borderColor: (isActive || isDragActive) ? 'var(--primary)' : 'var(--border)',
        boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
        transition: 'all 0.25s var(--ease)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer'
      }}
    >
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={e => e.target.files && onFiles(e.target.files)} 
      />
      
      {files && files.length > 0 ? (
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flex: 1, paddingRight: '12px' }} onClick={e => e.stopPropagation()}>
          {files.map((file, idx) => (
            <div key={idx} style={{ position: 'relative', width: '32px', height: '32px' }}>
              <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }} />
              <button 
                type="button" 
                onClick={() => onRemove(idx)}
                style={{ position: 'absolute', top: -3, right: -3, background: 'var(--error)', border: 'none', color: '#fff', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UploadCloud size={14} /> Click or Drop files here
        </span>
      )}
    </div>
  )
}
