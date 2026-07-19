import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Camera, UploadCloud, Video, X, CheckCircle, AlertTriangle, Info, Image as ImageIcon, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import Modal from '../components/Modal';


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
  const [epochs, setEpochs] = useState(15);
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
    if (sourceAngle === targetAngle) return;

    const originalPhotos = [...photos];

    // Optimistically move the photo in the UI state instantly
    setPhotos(prev => {
      const filtered = prev.filter(p => !(p.angle === sourceAngle && p.filename === filename));
      return [...filtered, {
        angle: targetAngle,
        filename: filename,
        url: `/api/persons/${originalName}/photos/${targetAngle}/${filename}`
      }];
    });

    try {
      const res = await apiClient.post(`${API_BASE}/persons/${originalName}/photos/move`, { 
        source_angle: sourceAngle, 
        target_angle: targetAngle, 
        filename 
      });
      setPhotos(prev => {
        return prev.map(p => {
          if (p.angle === targetAngle && p.filename === filename) {
            return {
              ...p,
              filename: res.data.new_filename,
              url: `/api/persons/${originalName}/photos/${targetAngle}/${res.data.new_filename}`
            };
          }
          return p;
        });
      });
      setStatus({ type: 'success', message: `Moved photo to ${targetAngle}.` });
    } catch (err) {
      // Revert on error
      setPhotos(originalPhotos);
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
      <div className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
        {/* Back and Header Shimmer */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 rounded-full shimmer shrink-0" />
          <div className="space-y-2">
            <div className="w-48 h-6 shimmer" />
            <div className="w-72 h-3.5 shimmer" />
          </div>
        </div>

        {/* Profile Card Shimmer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#0F1011] border border-[#23252A] rounded-xl mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full shimmer shrink-0" />
            <div className="space-y-2">
              <div className="w-32 h-5 shimmer" />
              <div className="flex gap-2">
                <div className="w-16 h-4 shimmer" />
                <div className="w-24 h-4 shimmer" />
              </div>
            </div>
          </div>
          <div className="w-36 h-9 shimmer" />
        </div>

        {/* Forms & Inputs Shimmer */}
        <div className="card-linear space-y-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-2 min-w-[250px] space-y-2">
              <div className="w-20 h-4 shimmer" />
              <div className="w-full h-10 shimmer" />
            </div>
            <div className="flex-1 min-w-[150px] space-y-2">
              <div className="w-20 h-4 shimmer" />
              <div className="w-full h-10 shimmer" />
            </div>
          </div>

          {/* Dropbox Grids Shimmer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-h-[190px] rounded-lg p-4 border border-[#23252A] bg-[#0F1011] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-20 h-4 shimmer" />
                  <div className="w-8 h-4 shimmer" />
                </div>
                <div className="h-24 w-full border border-dashed border-[#23252A] rounded-lg flex items-center justify-center">
                  <div className="w-24 h-6 shimmer" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full h-10 shimmer mt-8" />
        </div>
      </div>
    );
  }

  const frontalPhoto = photos.find(p => p.angle === 'frontal');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      
      {/* Header and Back Link */}
      <div className="flex items-center gap-4 mb-4">
        <Link to="/dashboard" className="text-ink-subtle hover:text-ink transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-headline font-semibold text-ink font-display m-0">Employee Console</h1>
          <p className="mt-1 text-caption text-ink-subtle m-0">Configure biometric registration profiles and train individual classifiers.</p>
        </div>
      </div>

      {/* Premium Profile Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#0F1011] border border-[#23252A] rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-[#23252A] flex items-center justify-center bg-[#010102] overflow-hidden shrink-0">
            {frontalPhoto ? (
              <img src={`${API_BASE}/persons/${originalName}/photos/frontal/${frontalPhoto.filename}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-ink-subtle" />
            )}
          </div>
          <div>
            <h2 className="text-card-title font-semibold text-ink font-display m-0">{originalName.replace(/_/g, ' ')}</h2>
            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20 uppercase">Active / Enrolled</span>
              <span className="text-[12px] text-ink-tertiary font-mono">Reference Photos: {photos.length}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => { setEpochs(10); handleUpdate({ preventDefault: () => {} }); }}
            disabled={isSubmitting}
            className="button-primary flex items-center gap-2 h-9 py-1 px-4 text-caption"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Refine Face AI Model</span>
          </button>
        </div>
      </div>

      <div className="card-linear">
        <form onSubmit={handleUpdate}>
          <div className="space-y-6">
            <AnimatePresence>
              {status.message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className={`p-4 rounded-lg flex items-center gap-3 text-sm border ${
                    status.type === 'error' ? 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20' : 
                    status.type === 'success' ? 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20' : 
                    'bg-[#5E6AD2]/10 text-[#828FFF] border-[#5E6AD2]/20'
                  }`}>
                    {status.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    <span className="text-caption">{status.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-2 min-w-[250px] flex flex-col gap-1.5">
                <label className="text-caption font-medium text-ink-subtle">Person Name</label>
                <input 
                  type="text" 
                  value={personName} 
                  onChange={(e) => setPersonName(e.target.value.replace(/\s+/g, '_'))} 
                  required 
                  className="input-linear"
                />
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
                <label className="text-caption font-medium text-ink-subtle">Training Epochs</label>
                <input 
                  type="number" 
                  min="1" max="50" 
                  value={epochs} 
                  onChange={(e) => setEpochs(Number(e.target.value))} 
                  className="input-linear font-mono"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 pt-4 border-t border-[#23252A]">
              <h3 className="text-body font-medium text-ink m-0">Reference Images</h3>
              <div className="flex items-center gap-4">
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#010102] border border-[#23252A] text-ink-muted">Total: {photos.length + totalNewImages}</span>
                <button type="button" onClick={showWebcam ? stopWebcam : startWebcam} className="button-secondary flex items-center gap-2">
                  {showWebcam ? <><X className="w-4 h-4" /> Close Camera</> : <><Video className="w-4 h-4" /> Open Webcam</>}
                </button>
              </div>
            </div>

            {showWebcam && (
              <div className="p-4 bg-black rounded-lg border border-[#23252A] mb-6 text-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-[400px] rounded-lg mx-auto mb-4 bg-black object-cover aspect-video" />
                <div>
                  <button type="button" onClick={captureWebcam} className="button-primary text-white flex items-center gap-2 mx-auto">
                    <Camera className="w-4 h-4 text-white" /> Capture Photo
                  </button>
                </div>
              </div>
            )}

            {/* Row 1: LEFT, FRONT, RIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <DropBox 
                field="left_img" title="Left Profile" files={images.left_img} existingFiles={photos.filter(p => p.angle === 'left')} personName={originalName}
                isActive={activeField === 'left_img'} onFocus={() => setActiveField('left_img')} onFiles={(files) => handleFile('left_img', files)} 
                onRemove={(idx) => removeNewFile('left_img', idx)} onDeleteExisting={(fn) => handleDeletePhoto('left', fn)}
                onDropMoveLocal={(src, idx) => handleMoveLocalFile(src, 'left_img', idx)} onDropMoveExisting={(src, fn) => handleMoveExistingPhoto(src, 'left', fn)}
              />
              <DropBox 
                field="front_img" title="Frontal Face" files={images.front_img} existingFiles={photos.filter(p => p.angle === 'frontal')} personName={originalName}
                isActive={activeField === 'front_img'} onFocus={() => setActiveField('front_img')} onFiles={(files) => handleFile('front_img', files)} 
                onRemove={(idx) => removeNewFile('front_img', idx)} onDeleteExisting={(fn) => handleDeletePhoto('frontal', fn)}
                onDropMoveLocal={(src, idx) => handleMoveLocalFile(src, 'front_img', idx)} onDropMoveExisting={(src, fn) => handleMoveExistingPhoto(src, 'frontal', fn)}
              />
              <DropBox 
                field="right_img" title="Right Profile" files={images.right_img} existingFiles={photos.filter(p => p.angle === 'right')} personName={originalName}
                isActive={activeField === 'right_img'} onFocus={() => setActiveField('right_img')} onFiles={(files) => handleFile('right_img', files)} 
                onRemove={(idx) => removeNewFile('right_img', idx)} onDeleteExisting={(fn) => handleDeletePhoto('right', fn)}
                onDropMoveLocal={(src, idx) => handleMoveLocalFile(src, 'right_img', idx)} onDropMoveExisting={(src, fn) => handleMoveExistingPhoto(src, 'right', fn)}
              />
            </div>

            {/* Row 2: BULK UPLOAD (EXTRA) */}
            <h3 className="text-body font-medium text-ink mb-1 m-0 pt-4 border-t border-[#23252A]">Bulk Upload (Unsorted)</h3>
            <p className="text-[11px] text-ink-tertiary mb-4">
              {activeField === 'extra_files' ? 'Currently the active paste target.' : 'Click to make this the active paste target.'}
            </p>

            <div 
              onClick={() => setActiveField('extra_files')}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation();
                const srcType = e.dataTransfer.getData("sourceType");
                if (srcType === "local") handleMoveLocalFile(e.dataTransfer.getData("sourceField"), 'extra_files', parseInt(e.dataTransfer.getData("sourceIndex"), 10));
                else if (srcType === "existing") handleMoveExistingPhoto(e.dataTransfer.getData("sourceAngle"), 'extra', e.dataTransfer.getData("filename"));
                else if (e.dataTransfer.files) handleFile('extra_files', e.dataTransfer.files);
              }}
              className={`min-h-[150px] p-6 rounded-lg text-center flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${activeField === 'extra_files' ? 'border-[#828FFF] border-dashed bg-[#5E6AD2]/5' : 'border-[#23252A] border-dashed bg-transparent hover:border-[#34343A] hover:bg-[#141516]/50'}`}
            >
              <input type="file" multiple accept="image/*" id="bulk-upload-manage" className="hidden" onChange={(e) => handleFile('extra_files', e.target.files)} />
              
              {(images.extra_files.length === 0 && photos.filter(p => p.angle === 'extra').length === 0) ? (
                <label htmlFor="bulk-upload-manage" className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-ink-subtle hover:text-ink">
                  <UploadCloud className="w-8 h-8 mb-3 opacity-50 text-ink-tertiary" />
                  <div className="font-medium text-caption">Drop photos or click to browse</div>
                </label>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center w-full">
                  {photos.filter(p => p.angle === 'extra').map(p => (
                    <div key={p.filename} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "existing"); e.dataTransfer.setData("sourceAngle", "extra"); e.dataTransfer.setData("filename", p.filename); }} className="relative w-16 h-16 group cursor-grab active:cursor-grabbing shrink-0">
                      <img src={`${API_BASE}/persons/${originalName}/photos/extra/${p.filename}`} className="w-full h-full object-cover rounded border border-[#23252A] shadow-sm" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto('extra', p.filename); }} className="absolute -top-1.5 -right-1.5 bg-[#F87171] text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 focus:outline-none">✕</button>
                    </div>
                  ))}
                  {images.extra_files.map((f, i) => (
                    <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "local"); e.dataTransfer.setData("sourceField", "extra_files"); e.dataTransfer.setData("sourceIndex", i.toString()); }} className="relative w-16 h-16 group cursor-grab active:cursor-grabbing shrink-0">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover rounded border border-[#23252A] shadow-sm" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeNewFile('extra_files', i); }} className="absolute -top-1.5 -right-1.5 bg-[#F87171] text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 focus:outline-none">✕</button>
                    </div>
                  ))}
                  <label htmlFor="bulk-upload-manage" className="w-16 h-16 border border-dashed border-[#23252A] rounded-md flex items-center justify-center cursor-pointer hover:bg-[#141516] transition-colors text-ink-tertiary hover:text-ink-subtle">
                    <UploadCloud className="w-5 h-5" />
                  </label>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full button-primary text-white text-caption mt-8 h-10">
              <span className="text-button text-white">{isSubmitting ? 'Updating Profile & Models...' : 'Commit Changes & Retrain'}</span>
            </button>
          </div>
        </form>
      </div>
      
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, itemToDelete: null })}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-caption text-ink-subtle m-0">Are you sure you want to permanently delete this reference photo? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="button-secondary text-caption" onClick={() => setConfirmModal({ isOpen: false, itemToDelete: null })}>Cancel</button>
            <button className="button-primary bg-[#F87171] hover:bg-red-600 text-white text-caption" onClick={executeDeletePhoto}>Delete Photo</button>
          </div>
        </div>
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
        if (srcType === "local") onDropMoveLocal(e.dataTransfer.getData("sourceField"), parseInt(e.dataTransfer.getData("sourceIndex"), 10));
        else if (srcType === "existing") onDropMoveExisting(e.dataTransfer.getData("sourceAngle"), e.dataTransfer.getData("filename"));
        else if (e.dataTransfer.files) onFiles(e.dataTransfer.files);
      }}
      onClick={() => onFocus()}
      className={`relative min-h-[190px] rounded-lg p-4 flex flex-col justify-between transition-all border ${
        isActive 
          ? 'border-[#5E6AD2] bg-[#141516]' 
          : isDragActive 
            ? 'border-[#828FFF] bg-[#5E6AD2]/5' 
            : 'border-[#23252A] bg-[#0F1011] hover:border-[#34343A]'
      }`}
    >
      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[11px] font-semibold tracking-wider uppercase ${isActive ? 'text-ink' : 'text-ink-subtle'}`}>{title}</span>
          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#010102] border border-[#23252A] text-ink-muted">
            {files.length + existingFiles.length}
          </span>
        </div>

        {!hasContent && (
          <div 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="flex flex-col items-center justify-center pt-4 pb-5 text-center cursor-pointer border border-dashed border-[#23252A] hover:bg-[#141516] hover:border-[#34343A] rounded-lg h-24"
          >
            <UploadCloud className="w-6 h-6 mb-1 text-ink-tertiary" />
            <p className="text-[11px] text-ink-tertiary">Click or Drop file</p>
          </div>
        )}
      </div>

      {hasContent && (
        <div className="mt-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 border-t border-[#23252A] flex-1">
          {existingFiles.map((p) => (
            <div 
              key={p.filename} 
              draggable 
              onDragStart={(e) => { 
                e.dataTransfer.setData("sourceType", "existing"); 
                e.dataTransfer.setData("sourceAngle", p.angle); 
                e.dataTransfer.setData("filename", p.filename); 
              }} 
              onClick={(e) => e.stopPropagation()} 
              className="relative w-12 h-12 group cursor-grab active:cursor-grabbing shrink-0"
            >
              <img src={`${API_BASE}/persons/${personName}/photos/${p.angle}/${p.filename}`} className="w-full h-full object-cover rounded border border-[#27A644]/30 shadow-sm" />
              <span className="absolute top-0 left-0 bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20 text-[6px] py-0 px-0.5 rounded-none uppercase font-mono tracking-widest font-extrabold scale-75 origin-top-left">Enrolled</span>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteExisting(p.filename); }} className="p-1 bg-[#F87171]/20 text-[#F87171] rounded hover:bg-[#F87171] hover:text-white transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {files.map((f, i) => (
            <div 
              key={i} 
              draggable 
              onDragStart={(e) => { 
                e.dataTransfer.setData("sourceType", "local"); 
                e.dataTransfer.setData("sourceField", field); 
                e.dataTransfer.setData("sourceIndex", i.toString()); 
              }} 
              onClick={(e) => e.stopPropagation()} 
              className="relative w-12 h-12 group cursor-grab active:cursor-grabbing shrink-0"
            >
              <img src={URL.createObjectURL(f)} className="w-full h-full object-cover rounded border border-[#23252A] shadow-sm" />
              <span className="absolute top-0 left-0 bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 text-[6px] py-0 px-0.5 rounded-none uppercase font-mono tracking-widest font-extrabold scale-75 origin-top-left">New</span>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i); }} className="p-1 bg-[#F87171]/20 text-[#F87171] rounded hover:bg-[#F87171] hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          
          <label 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="w-12 h-12 border-2 border-dashed border-[#23252A] hover:bg-[#141516] hover:border-[#34343A] rounded flex items-center justify-center cursor-pointer text-ink-tertiary hover:text-ink-subtle shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
          </label>
        </div>
      )}
    </div>
  );
}
