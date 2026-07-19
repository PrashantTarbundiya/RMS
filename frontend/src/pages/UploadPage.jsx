import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, X, UploadCloud, CheckCircle, Video, AlertCircle, Info, Move, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const FIELD_TO_ANGLE = {
  left_img: 'left',
  front_img: 'frontal',
  right_img: 'right',
  extra_files: 'extra'
};

const ANGLE_TO_FIELD = {
  left: 'left_img',
  frontal: 'front_img',
  right: 'right_img',
  extra: 'extra_files',
  left_img: 'left_img',
  front_img: 'front_img',
  right_img: 'right_img',
  extra_files: 'extra_files'
};

export default function UploadPage() {
  const { apiClient } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('new'); // 'new' or 'update'
  const [existingPersons, setExistingPersons] = useState([]);
  const [personName, setPersonName] = useState('');
  const [existingPhotos, setExistingPhotos] = useState([]);
  
  const [images, setImages] = useState({
    front_img: [], left_img: [], right_img: [], extra_files: []
  });
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemToDelete: null });
  const [epochs, setEpochs] = useState(5);
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeField, setActiveField] = useState('front_img');
  const [dragActiveField, setDragActiveField] = useState(null);

  const totalNewImages = images.front_img.length + images.left_img.length + images.right_img.length + images.extra_files.length;
  const totalAvailablePhotos = totalNewImages + existingPhotos.length;

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const res = await apiClient.get(`${API_BASE}/persons`);
        setExistingPersons(res.data);
      } catch (err) {
        console.warn('Failed to load existing persons list', err);
      }
    };
    fetchPersons();
  }, [apiClient]);

  useEffect(() => {
    if (mode === 'update' && personName) {
      const fetchPhotos = async () => {
        try {
          const res = await apiClient.get(`${API_BASE}/persons/${personName}/photos`);
          setExistingPhotos(res.data);
        } catch (err) {
          setExistingPhotos([]);
        }
      };
      fetchPhotos();
    } else {
      setExistingPhotos([]);
    }
  }, [mode, personName, apiClient]);

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

  useEffect(() => {
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

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
      setStatus({ type: 'error', message: 'Only image files allowed.' });
      return;
    }
    setImages(prev => ({ ...prev, [field]: [...prev[field], ...validFiles] }));
  };

  const removeFile = (field, index) => {
    setImages(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

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

  const handleMoveExistingPhoto = async (sourceAngle, targetField, filename) => {
    const targetAngle = FIELD_TO_ANGLE[targetField] || targetField;
    try {
      setStatus({ type: 'info', message: 'Moving photo...' });
      const res = await apiClient.post(`${API_BASE}/persons/${personName}/photos/move`, { 
        source_angle: sourceAngle, 
        target_angle: targetAngle, 
        filename 
      });
      setExistingPhotos(prev => {
        const filtered = prev.filter(p => !(p.angle === sourceAngle && p.filename === filename));
        return [...filtered, { 
          angle: targetAngle, 
          filename: res.data.new_filename, 
          url: `/api/persons/${personName}/photos/${targetAngle}/${res.data.new_filename}` 
        }];
      });
      setStatus({ type: 'success', message: 'Photo moved successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to move photo.' });
    }
  };

  const handleDeleteExistingPhoto = (angle, filename) => {
    setConfirmModal({ isOpen: true, itemToDelete: { angle, filename } });
  };

  const executeDeleteExistingPhoto = async () => {
    if (!confirmModal.itemToDelete) return;
    const { angle, filename } = confirmModal.itemToDelete;
    try {
      await apiClient.delete(`${API_BASE}/persons/${personName}/photos/${angle}/${filename}`);
      setExistingPhotos(prev => prev.filter(p => !(p.angle === angle && p.filename === filename)));
      setStatus({ type: 'success', message: `Deleted photo successfully.` });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to delete photo.' });
    } finally {
      setConfirmModal({ isOpen: false, itemToDelete: null });
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
    setStatus({ type: 'success', message: `Moved upload to ${targetField.replace('_', ' ')}.` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) { setStatus({ type: 'error', message: 'Person Name is required.' }); return; }
    if (totalAvailablePhotos === 0) { setStatus({ type: 'error', message: 'Provide at least one photo.' }); return; }

    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'Processing...' });

    if (totalNewImages > 0) {
      const formData = new FormData();
      formData.append('person_name', personName.trim());
      formData.append('epochs', epochs);
      images.front_img.forEach(file => formData.append('front_img', file));
      images.left_img.forEach(file => formData.append('left_img', file));
      images.right_img.forEach(file => formData.append('right_img', file));
      images.extra_files.forEach(file => formData.append('extra_files', file));

      try {
        const res = await apiClient.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setStatus({ type: 'success', message: res.data.message });
        setPersonName('');
        setImages({ front_img: [], left_img: [], right_img: [], extra_files: [] });
        setTimeout(() => navigate('/training'), 3000);
      } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to upload.' });
      } finally { setIsSubmitting(false); }
    } else {
      try {
        const res = await apiClient.post(`${API_BASE}/persons/${personName.trim()}/retrain`, { epochs });
        setStatus({ type: 'success', message: res.data.message });
        setPersonName('');
        setTimeout(() => navigate('/training'), 3000);
      } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to trigger retrain.' });
      } finally { setIsSubmitting(false); }
    }
  };

  const renderCategoryCard = (field) => {
    const label = field.replace('_img', '').replace('_', ' ').toUpperCase();
    const isActive = activeField === field;
    
    const fieldExistingPhotos = existingPhotos.filter(p => (ANGLE_TO_FIELD[p.angle] || p.angle) === field);
    const fieldLocalImages = images[field];
    const totalFieldPhotos = fieldExistingPhotos.length + fieldLocalImages.length;

    return (
      <div 
        key={field} 
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveField(field); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveField(null); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setDragActiveField(null);
          const sourceType = e.dataTransfer.getData('sourceType');
          if (sourceType === 'local') {
            const sourceField = e.dataTransfer.getData('sourceField');
            const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10);
            handleMoveLocalFile(sourceField, field, sourceIndex);
          } else if (sourceType === 'existing') {
            const sourceField = e.dataTransfer.getData('sourceField');
            const sourceFilename = e.dataTransfer.getData('sourceFilename');
            handleMoveExistingPhoto(sourceField, field, sourceFilename);
          } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(field, e.dataTransfer.files);
          }
        }}
        className={`border rounded-xl p-4 transition-colors cursor-pointer flex flex-col justify-between h-full min-h-[180px] ${isActive ? 'border-zinc-500 bg-zinc-800/20' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'} ${dragActiveField === field ? 'border-violet-500 bg-violet-500/5' : ''}`}
        onClick={() => setActiveField(field)}
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs font-semibold tracking-wider ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>{label}</span>
            <Badge variant="outline" className="bg-zinc-950 font-mono text-[10px]">{totalFieldPhotos}</Badge>
          </div>
          
          <div className="relative group mb-3">
            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${dragActiveField === field ? 'border-violet-400 bg-violet-500/10' : 'border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-600'}`}>
              <div className="flex flex-col items-center justify-center pt-4 pb-5 text-center">
                <UploadCloud className={`w-6 h-6 mb-1 ${dragActiveField === field ? 'text-violet-400 animate-pulse' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                <p className={`text-[11px] ${dragActiveField === field ? 'text-violet-400 font-semibold' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  {dragActiveField === field ? 'Drop item here!' : 'Click, Paste or Drop'}
                </p>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFile(field, e.target.files)} />
            </label>
          </div>
        </div>

        {totalFieldPhotos > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 border-t border-zinc-800/30">
            {fieldExistingPhotos.map((photo, idx) => (
              <div 
                key={`exist-${idx}`} 
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('sourceType', 'existing');
                  e.dataTransfer.setData('sourceField', photo.angle);
                  e.dataTransfer.setData('sourceFilename', photo.filename);
                }}
                className="relative group w-12 h-12 rounded-md overflow-hidden border border-emerald-500/30 cursor-grab active:cursor-grabbing"
              >
                <img src={`${API_BASE.replace(/\/api$/, '')}${photo.url}?token=${sessionStorage.getItem('rms_access_token') || ''}`} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
                <Badge className="absolute top-0 left-0 bg-emerald-500 text-black text-[7px] py-0 px-1 rounded-none uppercase font-mono tracking-widest font-extrabold scale-75 origin-top-left">Enrolled</Badge>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteExistingPhoto(photo.angle, photo.filename); }} className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {fieldLocalImages.map((file, idx) => (
              <div 
                key={`local-${idx}`} 
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('sourceType', 'local');
                  e.dataTransfer.setData('sourceField', field);
                  e.dataTransfer.setData('sourceIndex', idx.toString());
                }}
                className="relative group w-12 h-12 rounded-md overflow-hidden border border-zinc-700 cursor-grab active:cursor-grabbing"
              >
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                <Badge className="absolute top-0 left-0 bg-violet-500 text-white text-[7px] py-0 px-1 rounded-none uppercase font-mono tracking-widest font-extrabold scale-75 origin-top-left">New</Badge>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(field, idx); }} className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{mode === 'new' ? 'Enroll New Personnel' : 'Update & Retrain Identity'}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === 'new' ? 'Register a new subject with frontal and side profiles.' : 'Manage existing photos and retrain the model.'}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={mode === 'new' ? 'default' : 'outline'} className={mode === 'new' ? 'bg-zinc-100 text-zinc-900' : ''} onClick={() => { setMode('new'); setPersonName(''); setStatus({ type: '', message: '' }); }}>
          Enroll New
        </Button>
        <Button variant={mode === 'update' ? 'default' : 'outline'} className={mode === 'update' ? 'bg-zinc-100 text-zinc-900' : ''} onClick={() => { setMode('update'); setPersonName(''); setStatus({ type: '', message: '' }); }}>
          Update Existing
        </Button>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            
            <AnimatePresence>
              {status.message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-4 rounded-lg flex items-center gap-3 text-sm mb-4 border ${
                    status.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    {status.message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="person-name" className="text-zinc-300">Subject Identifier</Label>
                {mode === 'new' ? (
                  <Input 
                    id="person-name"
                    value={personName} 
                    onChange={e => setPersonName(e.target.value.replace(/\s+/g, '_'))}
                    placeholder="e.g. John_Doe"
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700 font-mono"
                    required 
                  />
                ) : (
                  <select 
                    id="person-name"
                    value={personName} 
                    onChange={e => setPersonName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    required
                  >
                    <option value="" className="bg-zinc-950 text-zinc-400">-- Select Person --</option>
                    {existingPersons.map(p => (
                      <option key={p} value={p} className="bg-zinc-950 text-zinc-100">
                        {p.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-zinc-500">Unique ID (no spaces).</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="epochs" className="text-zinc-300">Training Epochs</Label>
                <div className="flex items-center gap-4">
                  <input 
                    id="epochs"
                    type="range" 
                    min="1" max="20" 
                    value={epochs} 
                    onChange={e => setEpochs(Number(e.target.value))}
                    className="flex-1 accent-zinc-500"
                  />
                  <span className="font-mono text-zinc-100 bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800 text-sm w-12 text-center">{epochs}</span>
                </div>
                <p className="text-xs text-zinc-500">Higher epochs = better accuracy but slower training.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center justify-between">
                <Label className="text-base text-zinc-100">Capture Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={showWebcam ? stopWebcam : startWebcam} className="text-zinc-400 hover:text-zinc-100">
                  <Video className="w-4 h-4 mr-2" />
                  {showWebcam ? 'Stop Camera' : 'Start Camera'}
                </Button>
              </div>

              {showWebcam && (
                <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[500px] object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button type="button" onClick={captureWebcam} className="bg-zinc-100 text-zinc-900 rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform p-0 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800/50 space-y-4">
              <Label className="text-base text-zinc-100 mb-2 block">Asset Allocation</Label>
              
              {/* Row 1: LEFT, FRONT, RIGHT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['left_img', 'front_img', 'right_img'].map(field => renderCategoryCard(field))}
              </div>
              
              {/* Row 2: EXTRA FILES */}
              <div className="grid grid-cols-1 gap-4">
                {['extra_files'].map(field => renderCategoryCard(field))}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                Total Files: <span className="font-mono text-zinc-100">{totalAvailablePhotos}</span>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || !personName || totalAvailablePhotos === 0}
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent mr-2" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-2" />
                )}
                {mode === 'new' ? 'Enroll & Train' : (totalNewImages > 0 ? 'Upload & Retrain' : 'Retrain Only')}
              </Button>
            </div>

          </CardContent>
        </form>
      </Card>

      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, itemToDelete: null })} title="Delete Photo">
        <div className="p-4 bg-zinc-950">
          <p className="text-zinc-300 mb-4">Are you sure you want to delete this photo from the dataset? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModal({ isOpen: false, itemToDelete: null })}>Cancel</Button>
            <Button variant="destructive" onClick={executeDeleteExistingPhoto}>Delete</Button>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}
