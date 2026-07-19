import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Camera, UploadCloud, Video, X, CheckCircle, AlertTriangle, Info, Image as ImageIcon, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex justify-center py-16">
        <RotateCw className="animate-spin w-8 h-8 text-violet-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Edit Enrolled Profile</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage photos and retrain the model for {originalName}.</p>
        </div>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-6">
          <form onSubmit={handleUpdate}>
            <AnimatePresence>
              {status.message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className={`p-4 rounded-lg flex items-center gap-3 text-sm border ${
                    status.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {status.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    {status.message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-2 min-w-[250px] space-y-2">
                <label className="text-sm font-medium text-zinc-400">Person Name</label>
                <Input 
                  type="text" 
                  value={personName} 
                  onChange={(e) => setPersonName(e.target.value.replace(/\s+/g, '_'))} 
                  required 
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-sm font-medium text-zinc-400">Training Epochs</label>
                <Input 
                  type="number" 
                  min="1" max="50" 
                  value={epochs} 
                  onChange={(e) => setEpochs(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-zinc-100 m-0">Reference Images</h3>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Total: {photos.length + totalNewImages}</Badge>
                <Button type="button" variant="outline" size="sm" onClick={showWebcam ? stopWebcam : startWebcam} className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-zinc-100">
                  {showWebcam ? <><X className="w-4 h-4 mr-2" /> Close Camera</> : <><Video className="w-4 h-4 mr-2" /> Open Webcam</>}
                </Button>
              </div>
            </div>

            {showWebcam && (
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 mb-6 text-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-[400px] rounded-lg mx-auto mb-4 bg-black object-cover aspect-video" />
                <div>
                  <Button type="button" onClick={captureWebcam} className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Camera className="w-4 h-4 mr-2" /> Capture Photo
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

            <h3 className="text-base font-semibold text-zinc-100 mb-1 m-0">Bulk Upload (Unsorted)</h3>
            <p className="text-sm text-zinc-500 mb-4">
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
              className={`min-h-[150px] p-6 rounded-lg text-center flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${activeField === 'extra_files' ? 'border-violet-500 border-dashed bg-violet-500/5' : 'border-zinc-800 border-dashed bg-transparent hover:border-zinc-700 hover:bg-zinc-900/50'}`}
            >
              <input type="file" multiple accept="image/*" id="bulk-upload-manage" className="hidden" onChange={(e) => handleFile('extra_files', e.target.files)} />
              
              {(images.extra_files.length === 0 && photos.filter(p => p.angle === 'extra').length === 0) ? (
                <label htmlFor="bulk-upload-manage" className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-300">
                  <UploadCloud className="w-8 h-8 mb-3 opacity-50" />
                  <div className="font-medium text-sm">Drop photos or click to browse</div>
                </label>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center w-full">
                  {photos.filter(p => p.angle === 'extra').map(p => (
                    <div key={p.filename} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "existing"); e.dataTransfer.setData("sourceAngle", "extra"); e.dataTransfer.setData("filename", p.filename); }} className="relative w-16 h-16 group cursor-grab active:cursor-grabbing">
                      <img src={`${API_BASE}/persons/${originalName}/photos/extra/${p.filename}`} className="w-full h-full object-cover rounded-md border border-violet-500/50 shadow-sm" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto('extra', p.filename); }} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 focus:outline-none">✕</button>
                    </div>
                  ))}
                  {images.extra_files.map((f, i) => (
                    <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "local"); e.dataTransfer.setData("sourceField", "extra_files"); e.dataTransfer.setData("sourceIndex", i.toString()); }} className="relative w-16 h-16 group cursor-grab active:cursor-grabbing">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover rounded-md border border-zinc-700 shadow-sm" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeNewFile('extra_files', i); }} className="absolute -top-2 -right-2 bg-zinc-800 border border-zinc-700 text-zinc-300 w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-zinc-700 focus:outline-none">✕</button>
                    </div>
                  ))}
                  <label htmlFor="bulk-upload-manage" className="w-16 h-16 border border-dashed border-zinc-600 rounded-md flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300">
                    <UploadCloud className="w-5 h-5" />
                  </label>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-8 bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              {isSubmitting ? 'Updating Profile & Models...' : 'Commit Changes & Retrain'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, itemToDelete: null })}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmModal({ isOpen: false, itemToDelete: null })} className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button variant="destructive" onClick={executeDeletePhoto} className="bg-red-500 hover:bg-red-600 text-white">Delete Photo</Button>
          </>
        }
      >
        <p className="text-zinc-400 text-sm m-0">Are you sure you want to permanently delete this reference photo? This action cannot be undone.</p>
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
      className={`relative min-h-[120px] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${
        isActive 
          ? 'border-violet-500 border-solid bg-violet-500/5' 
          : isDragActive 
            ? 'border-violet-500 border-dashed bg-violet-500/5' 
            : 'border-zinc-800 border-dashed bg-zinc-950/50 hover:bg-zinc-900'
      }`}
    >
      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
      
      {isActive && (
        <span className="absolute top-2 left-3 text-[10px] text-violet-500 font-bold font-mono tracking-wider">TARGET</span>
      )}

      {hasContent ? (
        <div className={`flex flex-wrap gap-2 justify-center w-full ${isActive ? 'mt-3' : 'mt-0'}`}>
          {existingFiles.map((p) => (
            <div key={p.filename} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "existing"); e.dataTransfer.setData("sourceAngle", p.angle); e.dataTransfer.setData("filename", p.filename); }} onClick={(e) => e.stopPropagation()} className="relative w-11 h-11 group cursor-grab active:cursor-grabbing">
              <img src={`${API_BASE}/persons/${personName}/photos/${p.angle}/${p.filename}`} className="w-full h-full object-cover rounded border border-violet-500/50 shadow-sm" />
              <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteExisting(p.filename); }} className="absolute -top-2 -right-2 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none shadow-md">✕</button>
            </div>
          ))}
          {files.map((f, i) => (
            <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData("sourceType", "local"); e.dataTransfer.setData("sourceField", field); e.dataTransfer.setData("sourceIndex", i.toString()); }} onClick={(e) => e.stopPropagation()} className="relative w-11 h-11 group cursor-grab active:cursor-grabbing">
              <img src={URL.createObjectURL(f)} className="w-full h-full object-cover rounded border border-zinc-700 shadow-sm" />
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i); }} className="absolute -top-2 -right-2 bg-zinc-800 border border-zinc-700 text-zinc-300 w-4 h-4 rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700 focus:outline-none shadow-md">✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-zinc-500">
          <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      )}
    </div>
  );
}
