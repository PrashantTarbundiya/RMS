import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Camera, UploadCloud, Video, X, CheckCircle, AlertTriangle, Info, Image as ImageIcon, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';





export default function ManagePersonPage() {
  const { apiClient } = useAuth();
  const { name } = useParams();
  const navigate = useNavigate();
  
  const [personName, setPersonName] = useState(name || '');
  const [originalName, setOriginalName] = useState(name || '');
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemToDelete: null });
  const [epochs, setEpochs] = useState(10);
  const [activeField, setActiveField] = useState('front_img');
  
  const [images, setImages] = useState({
    front_img: [], left_img: [], right_img: [], extra_files: []
  });
  
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const totalNewImages = images.front_img.length + images.left_img.length + images.right_img.length + images.extra_files.length;

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        setImages(prev => ({ ...prev, [activeField]: [...prev[activeField], ...files] }));
        setStatus({ type: 'success', message: `Pasted ${files.length} image(s) into ${activeField.replace('_', ' ')}.` });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeField]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/persons/${originalName}/photos`);
      setPhotos(res.data);
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to fetch person photos.' });
    } finally { setIsLoading(false); }
  }, [originalName, apiClient]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  useEffect(() => {
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setStatus({ type: 'error', message: `Camera error: ${err.message}` });
      setShowWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  const captureWebcam = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImages(prev => ({ ...prev, extra_files: [...prev.extra_files, file] }));
        setStatus({ type: 'success', message: 'Photo captured.' });
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const handleFile = (field, files) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please select valid image files only.' });
      return;
    }
    setImages(prev => ({ ...prev, [field]: [...prev[field], ...validFiles] }));
  };

  const removeNewFile = (field, index) => {
    setImages(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleDeletePhoto = (angle, filename) => {
    setConfirmModal({ isOpen: true, itemToDelete: { angle, filename } });
  };

  const executeDeletePhoto = async () => {
    if (!confirmModal.itemToDelete) return;
    const { angle, filename } = confirmModal.itemToDelete;
    try {
      setIsSubmitting(true);
      const res = await apiClient.delete(`${API_BASE}/persons/${originalName}/photos/${angle}/${filename}`);
      setStatus({ type: 'success', message: res.data.message });
      fetchPhotos();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to delete photo.' });
    } finally {
      setIsSubmitting(false);
      setConfirmModal({ isOpen: false, itemToDelete: null });
    }
  };

  const handleMoveExistingPhoto = async (sourceAngle, targetAngle, filename) => {
    try {
      setStatus({ type: 'info', message: 'Moving photo...' });
      await apiClient.post(`${API_BASE}/persons/${originalName}/photos/move`, { source_angle: sourceAngle, target_angle: targetAngle, filename });
      setStatus({ type: 'success', message: `Moved photo to ${targetAngle}.` });
      fetchPhotos();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to move photo.' });
    }
  };

  const handleMoveLocalFile = (sourceField, targetField, index) => {
    if (sourceField === targetField) return;
    const fileToMove = images[sourceField][index];
    setImages(prev => ({
      ...prev,
      [sourceField]: prev[sourceField].filter((_, i) => i !== index),
      [targetField]: [...prev[targetField], fileToMove]
    }));
    setStatus({ type: 'success', message: `Moved new upload to ${targetField}.` });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!personName.trim()) { setStatus({ type: 'error', message: 'Person Name is required.' }); return; }
    
    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'Updating...' });

    if (personName !== originalName) {
      try {
        await apiClient.put(`${API_BASE}/persons/${originalName}`, { new_name: personName.trim() });
        setOriginalName(personName.trim());
        navigate(`/persons/edit/${personName.trim()}`, { replace: true });
        setStatus({ type: 'success', message: 'Name updated successfully.' });
      } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to rename person.' });
        setIsSubmitting(false);
        return;
      }
    }

    if (totalNewImages > 0) {
      const formData = new FormData();
      formData.append('person_name', personName.trim());
      formData.append('epochs', epochs);
      images.front_img.forEach(file => formData.append('front_img', file));
      images.left_img.forEach(file => formData.append('left_img', file));
      images.right_img.forEach(file => formData.append('right_img', file));
      images.extra_files.forEach(file => formData.append('extra_files', file));
      
      try {
        await apiClient.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setStatus({ type: 'success', message: 'Photos uploaded and retraining triggered.' });
        setImages({ front_img: [], left_img: [], right_img: [], extra_files: [] });
        setTimeout(() => navigate('/training'), 3000);
      } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Upload failed.' });
        setIsSubmitting(false);
      }
    } else {
      try {
        await apiClient.post(`${API_BASE}/persons/${personName.trim()}/retrain`, { epochs });
        setStatus({ type: 'success', message: 'Retraining triggered with existing dataset.' });
        setTimeout(() => navigate('/training'), 3000);
      } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Retraining failed.' });
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <RotateCw className="spin" size={32} color="var(--accent-violet)" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={24} /></Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>Edit Enrolled Profile</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Manage photos and retrain the model for {originalName}.</p>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" as="form" onSubmit={handleUpdate}>
        <AnimatePresence>
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 'var(--space-6)' }}
            >
              <div style={{
                padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)',
                background: status.type === 'error' ? 'var(--error-bg)' : status.type === 'success' ? 'var(--success-bg)' : 'var(--bg-elevated)',
                border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : status.type === 'success' ? 'rgba(48, 209, 88, 0.3)' : 'var(--border-subtle)'}`,
                color: status.type === 'error' ? 'var(--alert-crimson)' : status.type === 'success' ? 'var(--confirm-green)' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)'
              }}>
                {status.type === 'error' ? <AlertCircle size={16} /> : status.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                {status.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <div style={{ flex: 2, minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Person Name</label>
            <Input type="text" value={personName} onChange={(e) => setPersonName(e.target.value.replace(/\s+/g, '_'))} required />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Training Epochs</label>
            <Input type="number" min="1" max="50" value={epochs} onChange={(e) => setEpochs(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>Reference Images</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-xs" status="default">Total: {photos.length + totalNewImages}</span>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" type="button" variant="secondary" size="sm" onClick={showWebcam ? stopWebcam : startWebcam}>
              {showWebcam ? <><X size={14} style={{ marginRight: '8px' }} /> Close Camera</> : <><Video size={14} style={{ marginRight: '8px' }} /> Open Webcam</>}
            </button>
          </div>
        </div>

        {showWebcam && (
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }} />
            <div>
              <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" type="button" variant="primary" onClick={captureWebcam}>
                <Camera size={16} style={{ marginRight: '8px' }} /> Capture Photo
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <DropBox 
            field="front_img" title="Frontal Face" files={images.front_img} existingFiles={photos.filter(p => p.angle === 'frontal')} personName={originalName}
            isActive={activeField === 'front_img'} onFocus={() => setActiveField('front_img')} onFiles={(files) => handleFile('front_img', files)} 
            onRemove={(idx) => removeNewFile('front_img', idx)} onDeleteExisting={(fn) => handleDeletePhoto('frontal', fn)}
            onDropMoveLocal={(src, idx) => handleMoveLocalFile(src, 'front_img', idx)} onDropMoveExisting={(src, fn) => handleMoveExistingPhoto(src, 'frontal', fn)}
          />
          <DropBox 
            field="left_img" title="Left Profile" files={images.left_img} existingFiles={photos.filter(p => p.angle === 'left')} personName={originalName}
            isActive={activeField === 'left_img'} onFocus={() => setActiveField('left_img')} onFiles={(files) => handleFile('left_img', files)} 
            onRemove={(idx) => removeNewFile('left_img', idx)} onDeleteExisting={(fn) => handleDeletePhoto('left', fn)}
            onDropMoveLocal={(src, idx) => handleMoveLocalFile(src, 'left_img', idx)} onDropMoveExisting={(src, fn) => handleMoveExistingPhoto(src, 'left', fn)}
          />
          <DropBox 
            field="right_img" title="Right Profile" files={images.right_img} existingFiles={photos.filter(p => p.angle === 'right')} personName={originalName}
            isActive={activeField === 'right_img'} onFocus={() => setActiveField('right_img')} onFiles={(files) => handleFile('right_img', files)} 
            onRemove={(idx) => removeNewFile('right_img', idx)} onDeleteExisting={(fn) => handleDeletePhoto('right', fn)}
            onDropMoveLocal={(src, idx) => handleMoveLocalFile(src, 'right_img', idx)} onDropMoveExisting={(src, fn) => handleMoveExistingPhoto(src, 'right', fn)}
          />
        </div>

        <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)', margin: 0 }}>Bulk Upload (Unsorted)</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
          {activeField === 'extra_files' ? 'Currently the active paste target.' : 'Click to make this the active paste target.'}
        </p>

        <div 
          onClick={() => setActiveField('extra_files')}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            const srcType = e.dataTransfer.getData("sourceType");
            if (srcType === "local") handleMoveLocalFile(e.dataTransfer.getData("sourceField"), 'extra_files', parseInt(e.dataTransfer.getData("sourceIndex")));
            else if (srcType === "existing") handleMoveExistingPhoto(e.dataTransfer.getData("sourceAngle"), 'extra', e.dataTransfer.getData("filename"));
            else if (e.dataTransfer.files) handleFile('extra_files', e.dataTransfer.files);
          }}
          style={{
            border: activeField === 'extra_files' ? '2px dashed var(--accent-violet)' : '1px dashed var(--border-subtle)',
            background: activeField === 'extra_files' ? 'var(--bg-elevated)' : 'transparent',
            padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', textAlign: 'center', transition: 'all var(--duration) var(--ease)', cursor: 'pointer',
            minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <input type="file" multiple accept="image/*" id="bulk-upload-manage" style={{ display: 'none' }} onChange={(e) => handleFile('extra_files', e.target.files)} />
          
          {(images.extra_files.length === 0 && photos.filter(p => p.angle === 'extra').length === 0) ? (
            <label htmlFor="bulk-upload-manage" style={{ cursor: 'pointer', width: '100%', height: '100%' }}>
              <UploadCloud size={24} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }} />
              <div style={{ color: 'var(--text-primary)' }}>Drop photos or click to browse</div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', width: '100%' }}>
              {photos.filter(p => p.angle === 'extra').map(p => (
                <div key={p.filename} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "existing"); e.dataTransfer.setData("sourceAngle", "extra"); e.dataTransfer.setData("filename", p.filename); }} style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img src={`${API_BASE}/persons/${originalName}/photos/extra/${p.filename}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--accent-violet)' }} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto('extra', p.filename); }} style={{ position: 'absolute', top: -4, right: -4, background: 'var(--alert-crimson)', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, fontSize: 10, cursor: 'pointer' }}>×</button>
                </div>
              ))}
              {images.extra_files.map((f, i) => (
                <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "local"); e.dataTransfer.setData("sourceField", "extra_files"); e.dataTransfer.setData("sourceIndex", i.toString()); }} style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeNewFile('extra_files', i); }} style={{ position: 'absolute', top: -4, right: -4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 16, height: 16, fontSize: 10, cursor: 'pointer' }}>×</button>
                </div>
              ))}
              <label htmlFor="bulk-upload-manage" style={{ width: '60px', height: '60px', border: '1px dashed var(--text-muted)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <UploadCloud size={16} color="var(--text-muted)" />
              </label>
            </div>
          )}
        </div>

        <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" type="submit" variant="primary" style={{ width: '100%', marginTop: 'var(--space-8)', justifyContent: 'center' }} disabled={isSubmitting}>
          {isSubmitting ? 'Updating Profile & Models...' : 'Commit Changes & Retrain'}
        </button>
      </div>
      
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, itemToDelete: null })}
        title="Confirm Deletion"
        footer={
          <>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="ghost" onClick={() => setConfirmModal({ isOpen: false, itemToDelete: null })}>Cancel</button>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="danger" onClick={executeDeletePhoto}>Delete Photo</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to permanently delete this reference photo? This action cannot be undone.</p>
      </Modal>
    </motion.div>
  );
}

function DropBox({ field, title, files, existingFiles, personName, isActive, onFocus, onFiles, onRemove, onDeleteExisting, onDropMoveLocal, onDropMoveExisting }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const hasContent = files.length > 0 || existingFiles.length > 0;

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
        const srcType = e.dataTransfer.getData("sourceType");
        if (srcType === "local") onDropMoveLocal(e.dataTransfer.getData("sourceField"), parseInt(e.dataTransfer.getData("sourceIndex")));
        else if (srcType === "existing") onDropMoveExisting(e.dataTransfer.getData("sourceAngle"), e.dataTransfer.getData("filename"));
        else if (e.dataTransfer.files) onFiles(e.dataTransfer.files);
      }}
      onClick={() => { onFocus(); fileInputRef.current?.click(); }}
      style={{
        border: isActive ? '2px solid var(--accent-violet)' : (isDragActive ? '2px dashed var(--accent-violet)' : '1px dashed var(--border-subtle)'),
        background: isActive ? 'rgba(91, 95, 239, 0.05)' : 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)', minHeight: '120px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', position: 'relative',
        cursor: 'pointer', transition: 'all var(--duration) var(--ease)'
      }}
    >
      <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && onFiles(e.target.files)} />
      
      {isActive && (
        <span style={{ position: 'absolute', top: 4, left: 6, fontSize: '10px', color: 'var(--accent-violet)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>TARGET</span>
      )}

      {hasContent ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', width: '100%', marginTop: isActive ? '14px' : '0' }}>
          {existingFiles.map((p) => (
            <div key={p.filename} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "existing"); e.dataTransfer.setData("sourceAngle", p.angle); e.dataTransfer.setData("filename", p.filename); }} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '40px', height: '40px' }}>
              <img src={`${API_BASE}/persons/${personName}/photos/${p.angle}/${p.filename}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--accent-violet)' }} />
              <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteExisting(p.filename); }} style={{ position: 'absolute', top: -4, right: -4, background: 'var(--alert-crimson)', color: '#fff', border: 'none', borderRadius: '50%', width: 14, height: 14, fontSize: 10, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          {files.map((f, i) => (
            <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "local"); e.dataTransfer.setData("sourceField", field); e.dataTransfer.setData("sourceIndex", i.toString()); }} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '40px', height: '40px' }}>
              <img src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i); }} style={{ position: 'absolute', top: -4, right: -4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 14, height: 14, fontSize: 10, cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <ImageIcon size={20} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{title}</span>
        </>
      )}
    </div>
  );
}
