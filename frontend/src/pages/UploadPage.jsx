import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, X, UploadCloud, CheckCircle, Video, AlertCircle, Info, Move, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';


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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
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
    if (sourceAngle === targetAngle) return;

    const originalPhotos = [...existingPhotos];

    // Optimistically move the photo in the UI state instantly
    setExistingPhotos(prev => {
      const filtered = prev.filter(p => !(p.angle === sourceAngle && p.filename === filename));
      return [...filtered, { 
        angle: targetAngle, 
        filename: filename, 
        url: `/api/persons/${personName}/photos/${targetAngle}/${filename}` 
      }];
    });

    try {
      const res = await apiClient.post(`${API_BASE}/persons/${personName}/photos/move`, { 
        source_angle: sourceAngle, 
        target_angle: targetAngle, 
        filename 
      });
      setExistingPhotos(prev => {
        return prev.map(p => {
          if (p.angle === targetAngle && p.filename === filename) {
            return {
              ...p,
              filename: res.data.new_filename,
              url: `/api/persons/${personName}/photos/${targetAngle}/${res.data.new_filename}`
            };
          }
          return p;
        });
      });
      setStatus({ type: 'success', message: 'Photo moved successfully.' });
    } catch (err) {
      // Revert back to original state on API failure
      setExistingPhotos(originalPhotos);
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
        className={`border rounded-lg p-4 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[190px] ${
          isActive ? 'border-[#5E6AD2] bg-[#141516]' : 'border-[#23252A] bg-[#0F1011] hover:border-[#34343A]'
        } ${dragActiveField === field ? 'border-[#828FFF] bg-[#5E6AD2]/5' : ''}`}
        onClick={() => setActiveField(field)}
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-[11px] font-semibold tracking-wider uppercase ${isActive ? 'text-ink' : 'text-ink-subtle'}`}>{label}</span>
            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#010102] border border-[#23252A] text-ink-muted">{totalFieldPhotos}</span>
          </div>
          
          <div className="relative group mb-3">
            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
              dragActiveField === field ? 'border-[#828FFF] bg-[#5E6AD2]/10' : 'border-[#23252A] hover:bg-[#141516] hover:border-[#34343A]'
            }`}>
              <div className="flex flex-col items-center justify-center pt-4 pb-5 text-center">
                <UploadCloud className={`w-6 h-6 mb-1 ${dragActiveField === field ? 'text-[#828FFF] animate-pulse' : 'text-ink-tertiary group-hover:text-ink-subtle'}`} />
                <p className={`text-[11px] ${dragActiveField === field ? 'text-[#828FFF] font-semibold' : 'text-ink-tertiary group-hover:text-ink-subtle'}`}>
                  {dragActiveField === field ? 'Drop to Add!' : 'Click or Drop file'}
                </p>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFile(field, e.target.files)} />
            </label>
          </div>
        </div>

        {totalFieldPhotos > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 border-t border-[#23252A]">
            {fieldExistingPhotos.map((photo, idx) => (
              <div 
                key={`exist-${idx}`} 
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('sourceType', 'existing');
                  e.dataTransfer.setData('sourceField', photo.angle);
                  e.dataTransfer.setData('sourceFilename', photo.filename);
                }}
                className="relative group w-12 h-12 rounded-md overflow-hidden border border-[#27A644]/30 cursor-grab active:cursor-grabbing shrink-0"
              >
                <img src={`${API_BASE.replace(/\/api$/, '')}${photo.url}?token=${sessionStorage.getItem('rms_access_token') || ''}`} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-0 left-0 bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20 text-[7px] py-0 px-1 rounded-none uppercase font-mono tracking-widest font-extrabold scale-75 origin-top-left">Enrolled</span>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteExistingPhoto(photo.angle, photo.filename); }} className="p-1 bg-[#F87171]/20 text-[#F87171] rounded hover:bg-[#F87171] hover:text-white transition-colors">
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
                className="relative group w-12 h-12 rounded-md overflow-hidden border border-[#23252A] cursor-grab active:cursor-grabbing shrink-0"
              >
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                <span className="absolute top-0 left-0 bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 text-[7px] py-0 px-1 rounded-none uppercase font-mono tracking-widest font-extrabold scale-75 origin-top-left">New</span>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(field, idx); }} className="p-1 bg-[#F87171]/20 text-[#F87171] rounded hover:bg-[#F87171] hover:text-white transition-colors">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      
      <div>
        <h1 className="text-headline font-semibold text-ink">{mode === 'new' ? 'Enroll New Personnel' : 'Update & Retrain Identity'}</h1>
        <p className="mt-1 text-caption text-ink-subtle">
          {mode === 'new' ? 'Register a new subject with frontal and side profiles.' : 'Manage existing photos and retrain the model.'}
        </p>
      </div>

      <div className="flex gap-2">
        <button 
          className={mode === 'new' ? 'button-primary text-white' : 'button-secondary'} 
          onClick={() => { setMode('new'); setPersonName(''); setSearchQuery(''); setStatus({ type: '', message: '' }); }}
        >
          Enroll New
        </button>
        <button 
          className={mode === 'update' ? 'button-primary text-white' : 'button-secondary'} 
          onClick={() => { setMode('update'); setPersonName(''); setSearchQuery(''); setStatus({ type: '', message: '' }); }}
        >
          Update Existing
        </button>
      </div>

      <div className="card-linear">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            <AnimatePresence>
              {status.message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-4 rounded-lg flex items-center gap-3 text-sm mb-4 border ${
                    status.type === 'error' ? 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20' : 
                    status.type === 'success' ? 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20' : 
                    'bg-[#5E6AD2]/10 text-[#828FFF] border-[#5E6AD2]/20'
                  }`}>
                    {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    <span className="text-caption">{status.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="person-name" className="text-caption text-ink-muted font-medium">Subject Identifier</label>
                {mode === 'new' ? (
                  <input 
                    id="person-name"
                    value={personName} 
                    onChange={e => setPersonName(e.target.value.replace(/\s+/g, '_'))}
                    placeholder="e.g. John_Doe"
                    className="input-linear font-mono"
                    required 
                  />
                ) : (
                  <div className="relative">
                    <input 
                      id="person-name"
                      type="text"
                      placeholder="Type name to search..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPersonName('');
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className="input-linear w-full h-10 px-3 text-caption font-mono"
                      required={!personName}
                    />
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-[#0F1011] border border-[#23252A] rounded-md z-50 shadow-xl scrollbar-thin">
                        {existingPersons
                          .filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setPersonName(p);
                                setSearchQuery(p.replace(/_/g, ' '));
                                setShowDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-caption text-ink-muted hover:bg-[#5E6AD2]/10 hover:text-ink transition-colors font-mono border-b border-[#23252A]/30 last:border-b-0"
                            >
                              {p.replace(/_/g, ' ')}
                            </button>
                          ))}
                        {existingPersons.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-caption text-ink-tertiary">No matching registered people</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-ink-tertiary">Unique ID (no spaces).</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="epochs" className="text-caption text-ink-muted font-medium">Training Epochs</label>
                <div className="flex items-center gap-4">
                  <input 
                    id="epochs"
                    type="range" 
                    min="1" max="20" 
                    value={epochs} 
                    onChange={e => setEpochs(Number(e.target.value))}
                    className="flex-1 accent-[#5E6AD2] h-1.5 bg-[#141516] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-ink bg-[#141516] px-3 py-1 rounded-md border border-[#23252A] text-sm w-12 text-center">{epochs}</span>
                </div>
                <p className="text-[11px] text-ink-tertiary">Higher epochs = better accuracy but slower training.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#23252A]">
              <div className="flex items-center justify-between">
                <label className="text-body font-medium text-ink">Capture Options</label>
                <button type="button" onClick={showWebcam ? stopWebcam : startWebcam} className="button-secondary flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span className="text-button">{showWebcam ? 'Stop Camera' : 'Start Camera'}</span>
                </button>
              </div>

              {showWebcam && (
                <div className="bg-black rounded-lg overflow-hidden border border-[#23252A] shadow-2xl relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[500px] object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button type="button" onClick={captureWebcam} className="bg-white text-black rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform flex items-center justify-center p-0">
                      <Camera className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#23252A] space-y-4">
              <label className="text-body font-medium text-ink block">Asset Allocation</label>
              
              {/* Row 1: LEFT, FRONT, RIGHT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['left_img', 'front_img', 'right_img'].map(field => renderCategoryCard(field))}
              </div>
              
              {/* Row 2: EXTRA FILES */}
              <div className="grid grid-cols-1 gap-4">
                {['extra_files'].map(field => renderCategoryCard(field))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#23252A] flex items-center justify-between">
              <div className="text-caption text-ink-subtle">
                Total Files: <span className="font-mono text-ink">{totalAvailablePhotos}</span>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || !personName || totalAvailablePhotos === 0}
                className="button-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span className="text-button text-white">
                  {mode === 'new' ? 'Enroll & Train' : (totalNewImages > 0 ? 'Upload & Retrain' : 'Retrain Only')}
                </span>
              </button>
            </div>

          </div>
        </form>
      </div>

      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, itemToDelete: null })} title="Delete Photo">
        <div className="p-6 bg-[#191A1B] text-ink space-y-4">
          <p className="text-caption text-ink-subtle">Are you sure you want to delete this photo from the dataset? This cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="button-secondary text-caption" onClick={() => setConfirmModal({ isOpen: false, itemToDelete: null })}>Cancel</button>
            <button className="button-primary bg-[#F87171] hover:bg-red-600 text-white text-caption" onClick={executeDeleteExistingPhoto}>Delete</button>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}
