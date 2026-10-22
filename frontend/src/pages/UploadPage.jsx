import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Image as ImageIcon, X, UploadCloud, CheckCircle, Video, 
  AlertCircle, Info, Move, Trash2, Zap, Archive, Folder, Sliders, Check, RefreshCw
} from 'lucide-react';
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
  
  // Method tab: 'auto' | 'bulk_zip' | 'bulk_folder' | 'manual'
  const [uploadMethod, setUploadMethod] = useState(() => sessionStorage.getItem('upload_method') || 'auto');
  const [mode, setMode] = useState(() => sessionStorage.getItem('upload_mode') || 'new');
  const [existingPersons, setExistingPersons] = useState([]);
  const [personName, setPersonName] = useState(() => sessionStorage.getItem('upload_personName') || '');
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('upload_searchQuery') || '');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Method 1: Smart Auto-Sort state
  const [autoPhotos, setAutoPhotos] = useState([]); // [{ id, file, url, angle: 'frontal'|'left'|'right', detecting: bool }]
  const [autoDragActive, setAutoDragActive] = useState(false);

  // Method 2: Bulk ZIP state
  const [zipFile, setZipFile] = useState(null);
  const [zipProgress, setZipProgress] = useState(0);
  const [isZipSubmitting, setIsZipSubmitting] = useState(false);
  const [zipResult, setZipResult] = useState(null);

  // Method 3: Bulk Folder state
  const [folderPersons, setFolderPersons] = useState([]); // [{ name, files: [], previewUrl, selected: true, status: 'pending', error: '' }]
  const [isFolderSubmitting, setIsFolderSubmitting] = useState(false);
  const [folderProgress, setFolderProgress] = useState({ current: 0, total: 0, currentName: '' });

  // Method 4: Manual Angle Allocation state
  const [images, setImages] = useState({
    front_img: [], left_img: [], right_img: [], extra_files: []
  });
  const [activeField, setActiveField] = useState('front_img');
  const [dragActiveField, setDragActiveField] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemToDelete: null });
  const [epochs, setEpochs] = useState(() => {
    const saved = sessionStorage.getItem('upload_epochs');
    return saved ? parseInt(saved, 10) : 15;
  });
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const folderInputRef = useRef(null);
  const zipInputRef = useRef(null);
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalNewImages = images.front_img.length + images.left_img.length + images.right_img.length + images.extra_files.length;
  const totalAvailablePhotos = totalNewImages + existingPhotos.length;

  useEffect(() => {
    sessionStorage.setItem('upload_method', uploadMethod);
  }, [uploadMethod]);

  useEffect(() => {
    sessionStorage.setItem('upload_mode', mode);
  }, [mode]);

  useEffect(() => {
    sessionStorage.setItem('upload_personName', personName);
  }, [personName]);

  useEffect(() => {
    sessionStorage.setItem('upload_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('upload_epochs', epochs.toString());
  }, [epochs]);

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

  // Webcam Handlers
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

  const captureWebcam = useCallback(async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (uploadMethod === 'auto') {
          handleAutoFiles([file]);
        } else {
          setImages(prev => ({ ...prev, extra_files: [...prev.extra_files, file] }));
          setStatus({ type: 'success', message: 'Photo captured.' });
        }
      }
    }, 'image/jpeg', 0.9);
  }, [uploadMethod]);

  // ──────────────────────────────────────────────────────────────────────────
  // METHOD 1: SMART AUTO-SORT HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const handleAutoFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setStatus({ type: 'error', message: 'Only image files (.jpg, .png, .webp) allowed.' });
      return;
    }

    const newEntries = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      angle: 'frontal',
      detecting: true
    }));

    setAutoPhotos(prev => [...prev, ...newEntries]);
    setStatus({ type: 'info', message: `Analyzing ${validFiles.length} photo(s) for head pose & angles...` });

    // Asynchronously detect angles
    for (const entry of newEntries) {
      try {
        const formData = new FormData();
        formData.append('image', entry.file);
        const res = await apiClient.post(`${API_BASE}/upload/detect-angle`, formData);
        const detectedAngle = res.data?.angle || 'frontal';
        setAutoPhotos(prev => prev.map(p => p.id === entry.id ? { ...p, angle: detectedAngle, detecting: false } : p));
      } catch (err) {
        setAutoPhotos(prev => prev.map(p => p.id === entry.id ? { ...p, detecting: false } : p));
      }
    }
    setStatus({ type: 'success', message: `Loaded & classified ${validFiles.length} photo(s). Click any badge to adjust.` });
  };

  const cycleAngle = (id) => {
    const cycle = { frontal: 'left', left: 'right', right: 'frontal' };
    setAutoPhotos(prev => prev.map(p => p.id === id ? { ...p, angle: cycle[p.angle] || 'frontal' } : p));
  };

  const removeAutoPhoto = (id) => {
    setAutoPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleAutoSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) { setStatus({ type: 'error', message: 'Person Name is required.' }); return; }
    if (autoPhotos.length === 0) { setStatus({ type: 'error', message: 'Please add at least one photo.' }); return; }

    setIsSubmitting(true);
    setStatus({ type: 'info', message: `Enrolling ${personName.trim()} with ${autoPhotos.length} photos...` });

    const formData = new FormData();
    formData.append('person_name', personName.trim());
    formData.append('epochs', epochs);

    autoPhotos.forEach(p => {
      formData.append('images', p.file);
      formData.append('angles', p.angle);
    });

    try {
      const res = await apiClient.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStatus({ type: 'success', message: res.data.message });
      setPersonName('');
      setSearchQuery('');
      setAutoPhotos([]);
      sessionStorage.removeItem('upload_personName');
      sessionStorage.removeItem('upload_searchQuery');
      setTimeout(() => navigate('/training'), 2500);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to upload.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // METHOD 2: BULK ZIP ARCHIVE HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const handleZipFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setStatus({ type: 'error', message: 'Please select a valid .zip archive file.' });
      return;
    }
    setZipFile(file);
    setZipResult(null);
    setStatus({ type: 'info', message: `Selected ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB). Ready to upload.` });
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) { setStatus({ type: 'error', message: 'Please select a .zip file first.' }); return; }

    setIsZipSubmitting(true);
    setZipProgress(10);
    setStatus({ type: 'info', message: 'Uploading archive and processing personnel...' });

    const formData = new FormData();
    formData.append('file', zipFile);
    formData.append('epochs', epochs);

    try {
      const res = await apiClient.post(`${API_BASE}/upload/bulk-zip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 70) / progressEvent.total);
            setZipProgress(pct);
          }
        }
      });
      setZipProgress(100);
      setZipResult(res.data);
      setStatus({ type: 'success', message: res.data.message || 'Bulk upload complete!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Bulk archive upload failed.' });
    } finally {
      setIsZipSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // METHOD 3: BULK FOLDER (DIRECT BROWSER SELECT) HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Group files by person folder
    const groups = {};
    for (const file of files) {
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.replace(/\\/g, '/').split('/').filter(Boolean);
      if (parts.length >= 2) {
        // Person folder name is typically parts[parts.length - 2]
        let name = parts[parts.length - 2];
        if (['front', 'frontal', 'left', 'right', 'extra'].includes(name.toLowerCase()) && parts.length >= 3) {
          name = parts[parts.length - 3];
        }
        name = name.replace(/[^a-zA-Z0-9_\-]/g, '_').trim();
        if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp)$/i.test(file.name)) {
          if (!groups[name]) groups[name] = [];
          groups[name].push(file);
        }
      }
    }

    const parsedList = Object.entries(groups).map(([name, groupFiles]) => ({
      name,
      files: groupFiles,
      previewUrl: groupFiles[0] ? URL.createObjectURL(groupFiles[0]) : '',
      selected: true,
      status: 'pending',
      error: ''
    }));

    if (parsedList.length === 0) {
      setStatus({ type: 'error', message: 'No personnel image folders found in the selected folder.' });
      return;
    }

    setFolderPersons(parsedList);
    setStatus({ type: 'success', message: `Found ${parsedList.length} personnel folders (${files.length} total files). Review and click Enroll All.` });
  };

  const toggleFolderPerson = (idx) => {
    setFolderPersons(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  const updateFolderPersonName = (idx, newName) => {
    setFolderPersons(prev => prev.map((p, i) => i === idx ? { ...p, name: newName.replace(/[^a-zA-Z0-9_\-]/g, '_') } : p));
  };

  const handleFolderBatchSubmit = async () => {
    const selected = folderPersons.filter(p => p.selected);
    if (selected.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one person to enroll.' });
      return;
    }

    setIsFolderSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const person = selected[i];
      setFolderProgress({ current: i + 1, total: selected.length, currentName: person.name });
      setFolderPersons(prev => prev.map(p => p.name === person.name ? { ...p, status: 'uploading' } : p));

      const formData = new FormData();
      formData.append('person_name', person.name);
      formData.append('epochs', epochs);
      formData.append('auto_sort', 'true');
      person.files.forEach(f => formData.append('images', f));

      try {
        await apiClient.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFolderPersons(prev => prev.map(p => p.name === person.name ? { ...p, status: 'success' } : p));
        successCount++;
      } catch (err) {
        const msg = err.response?.data?.error || 'Failed';
        setFolderPersons(prev => prev.map(p => p.name === person.name ? { ...p, status: 'error', error: msg } : p));
        failCount++;
      }
    }

    setIsFolderSubmitting(false);
    setStatus({
      type: failCount === 0 ? 'success' : 'info',
      message: `Batch complete: ${successCount} successfully enrolled, ${failCount} failed.`
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // METHOD 4: MANUAL ANGLE ALLOCATION HANDLERS (LEGACY)
  // ──────────────────────────────────────────────────────────────────────────
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

  const handleMoveExistingPhoto = async (sourceAngle, targetField, filename) => {
    const targetAngle = FIELD_TO_ANGLE[targetField] || targetField;
    if (sourceAngle === targetAngle) return;

    const originalPhotos = [...existingPhotos];
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
      setExistingPhotos(prev => prev.map(p => {
        if (p.angle === targetAngle && p.filename === filename) {
          return {
            ...p,
            filename: res.data.new_filename,
            url: `/api/persons/${personName}/photos/${targetAngle}/${res.data.new_filename}`
          };
        }
        return p;
      }));
      setStatus({ type: 'success', message: 'Photo moved successfully.' });
    } catch (err) {
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) { setStatus({ type: 'error', message: 'Person Name is required.' }); return; }
    if (totalAvailablePhotos === 0) { setStatus({ type: 'error', message: 'Provide at least one photo.' }); return; }

    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'Processing enrollment...' });

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
        setSearchQuery('');
        sessionStorage.removeItem('upload_personName');
        sessionStorage.removeItem('upload_searchQuery');
        setImages({ front_img: [], left_img: [], right_img: [], extra_files: [] });
        setTimeout(() => navigate('/training'), 2500);
      } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to upload.' });
      } finally { setIsSubmitting(false); }
    } else {
      try {
        const res = await apiClient.post(`${API_BASE}/persons/${personName.trim()}/retrain`, { epochs });
        setStatus({ type: 'success', message: res.data.message });
        setPersonName('');
        setSearchQuery('');
        sessionStorage.removeItem('upload_personName');
        sessionStorage.removeItem('upload_searchQuery');
        setTimeout(() => navigate('/training'), 2500);
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
          e.preventDefault();
          e.stopPropagation();
          setDragActiveField(null);
          const sourceType = e.dataTransfer.getData('sourceType');
          if (sourceType === 'local') {
            const srcField = e.dataTransfer.getData('sourceField');
            const srcIdx = parseInt(e.dataTransfer.getData('sourceIndex'), 10);
            if (!isNaN(srcIdx) && srcField) handleMoveLocalFile(srcField, field, srcIdx);
          } else if (sourceType === 'existing') {
            const srcAngle = e.dataTransfer.getData('sourceField');
            const filename = e.dataTransfer.getData('sourceFilename');
            if (srcAngle && filename) handleMoveExistingPhoto(srcAngle, field, filename);
          } else if (e.dataTransfer.files?.length > 0) {
            handleFile(field, e.dataTransfer.files);
          }
        }}
        onClick={() => setActiveField(field)}
        className={`p-4 rounded-xl border transition-all duration-200 relative ${
          isActive 
            ? 'border-[#828FFF] bg-[#141516] shadow-lg ring-1 ring-[#828FFF]/30' 
            : 'border-[#23252A] bg-[#191A1B] hover:border-[#34343A]'
        } ${dragActiveField === field ? 'border-dashed border-[#828FFF] bg-[#5E6AD2]/10 scale-[1.01]' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold text-ink tracking-wide">{label}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#828FFF] animate-pulse" />}
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101012] border border-[#23252A] text-ink-subtle">
            {totalFieldPhotos}
          </span>
        </div>

        <div className="relative group">
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

  const getAngleBadgeColor = (angle) => {
    switch (angle) {
      case 'left': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'right': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-6 page-container">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline font-semibold text-ink">Personnel Face Enrollment</h1>
          <p className="mt-1 text-caption text-ink-subtle">
            Select an enrollment method: Drop bulk photos with auto-angle sorting, upload multi-person ZIP archives, or pick entire folders.
          </p>
        </div>
      </div>

      {/* Upload Method Segmented Switcher */}
      <div className="bg-[#141516] p-1.5 rounded-xl border border-[#23252A] grid grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => { setUploadMethod('auto'); setStatus({ type: '', message: '' }); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            uploadMethod === 'auto'
              ? 'bg-[#5E6AD2] text-white shadow-md font-semibold'
              : 'text-ink-subtle hover:text-ink hover:bg-[#1C1D1F]'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Smart Auto-Sort</span>
        </button>

        <button
          type="button"
          onClick={() => { setUploadMethod('bulk_zip'); setStatus({ type: '', message: '' }); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            uploadMethod === 'bulk_zip'
              ? 'bg-[#5E6AD2] text-white shadow-md font-semibold'
              : 'text-ink-subtle hover:text-ink hover:bg-[#1C1D1F]'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Bulk ZIP Archive</span>
        </button>

        <button
          type="button"
          onClick={() => { setUploadMethod('bulk_folder'); setStatus({ type: '', message: '' }); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            uploadMethod === 'bulk_folder'
              ? 'bg-[#5E6AD2] text-white shadow-md font-semibold'
              : 'text-ink-subtle hover:text-ink hover:bg-[#1C1D1F]'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Bulk Folder Select</span>
        </button>

        <button
          type="button"
          onClick={() => { setUploadMethod('manual'); setStatus({ type: '', message: '' }); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            uploadMethod === 'manual'
              ? 'bg-[#5E6AD2] text-white shadow-md font-semibold'
              : 'text-ink-subtle hover:text-ink hover:bg-[#1C1D1F]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Manual Angle Slots</span>
        </button>
      </div>

      {/* Global Status Banner */}
      <AnimatePresence>
        {status.message && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm border shadow-lg ${
              status.type === 'error' ? 'bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171]' : 
              status.type === 'success' ? 'bg-[#27A644]/10 border-[#27A644]/30 text-[#27A644]' : 
              'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#828FFF]'
            }`}>
              {status.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
              {status.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
              {status.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
              <span className="flex-1 font-medium">{status.message}</span>
              <button onClick={() => setStatus({ type: '', message: '' })} className="hover:opacity-75 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* METHOD 1: SMART AUTO-SORT (SINGLE PERSON)                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {uploadMethod === 'auto' && (
        <div className="card-linear space-y-6">
          <form onSubmit={handleAutoSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Subject Identifier */}
              <div className="md:col-span-2 space-y-2 relative">
                <label className="text-body font-medium text-ink flex items-center gap-2">
                  <span>Subject Identifier</span>
                  <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Auto-Angle Enabled
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s+/g, '_');
                      setPersonName(val);
                      setSearchQuery(val);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="e.g. John_Doe, Vatsal_Vadgama"
                    className="input-primary w-full"
                  />
                  {showDropdown && searchQuery && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-[#191A1B] border border-[#23252A] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {existingPersons.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase())).map((name, i) => (
                        <div
                          key={i}
                          onClick={() => { setPersonName(name); setSearchQuery(name); setShowDropdown(false); }}
                          className="px-4 py-2 hover:bg-[#23252A] cursor-pointer text-sm text-ink flex items-center justify-between"
                        >
                          <span>{name}</span>
                          <span className="text-[10px] text-ink-subtle bg-[#101012] px-1.5 py-0.5 rounded">Existing</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-ink-tertiary">Drop all photos below. RMS automatically calculates 3D head-pose yaw and sorts into Front, Left, and Right profiles.</p>
              </div>

              {/* Training Epochs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-body font-medium text-ink">Epochs</label>
                  <span className="font-mono text-ink bg-[#141516] px-2.5 py-0.5 rounded border border-[#23252A] text-xs">{epochs}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-[#23252A] rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
                />
                <p className="text-[11px] text-ink-tertiary">15 epochs recommended for optimal balance.</p>
              </div>
            </div>

            {/* Camera Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-[#23252A]">
              <span className="text-sm font-medium text-ink">Capture via Camera</span>
              <button type="button" onClick={showWebcam ? stopWebcam : startWebcam} className="button-secondary flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>{showWebcam ? 'Stop Camera' : 'Start Camera'}</span>
              </button>
            </div>

            {showWebcam && (
              <div className="bg-black rounded-xl overflow-hidden border border-[#23252A] relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[360px] object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button type="button" onClick={captureWebcam} className="bg-white text-black rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform flex items-center justify-center p-0">
                    <Camera className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>
            )}

            {/* Single Unified Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setAutoDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setAutoDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAutoDragActive(false);
                if (e.dataTransfer.files?.length > 0) handleAutoFiles(e.dataTransfer.files);
              }}
              className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                autoDragActive ? 'border-[#828FFF] bg-[#5E6AD2]/10 scale-[1.01]' : 'border-[#23252A] hover:border-[#3E424A] bg-[#141516]/60'
              }`}
            >
              <label className="cursor-pointer block">
                <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${autoDragActive ? 'text-[#828FFF] animate-bounce' : 'text-ink-tertiary'}`} />
                <p className="text-sm font-medium text-ink">
                  {autoDragActive ? 'Drop all photos here now!' : 'Drop all photos for this person here, or click to browse'}
                </p>
                <p className="text-caption text-ink-subtle mt-1">
                  Select 5 to 15 photos at once (frontal & side angles). We'll auto-classify them instantly.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAutoFiles(e.target.files)}
                />
              </label>
            </div>

            {/* Photo Preview Grid with Angle Badges */}
            {autoPhotos.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-ink-subtle">
                  <span className="font-medium text-ink">Photos Ready ({autoPhotos.length})</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Frontal: {autoPhotos.filter(p => p.angle === 'frontal').length}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Left: {autoPhotos.filter(p => p.angle === 'left').length}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Right: {autoPhotos.filter(p => p.angle === 'right').length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-72 overflow-y-auto p-2 bg-[#121314] rounded-xl border border-[#23252A]">
                  {autoPhotos.map((p) => (
                    <div key={p.id} className="relative group rounded-lg overflow-hidden border border-[#23252A] bg-black aspect-square">
                      <img src={p.url} alt="subject" className="w-full h-full object-cover" />
                      
                      {/* Angle Badge (clickable to toggle) */}
                      <button
                        type="button"
                        onClick={() => cycleAngle(p.id)}
                        title="Click to change angle"
                        className={`absolute top-1 left-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border transition-colors shadow-md ${getAngleBadgeColor(p.angle)}`}
                      >
                        {p.detecting ? 'Analyzing...' : p.angle}
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeAutoPhoto(p.id)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-4 border-t border-[#23252A] flex items-center justify-between">
              <span className="text-caption text-ink-subtle">
                Total Photos: <span className="font-mono text-ink font-bold">{autoPhotos.length}</span>
              </span>
              <button
                data-tour="enroll-submit-btn"
                type="submit"
                disabled={isSubmitting || !personName || autoPhotos.length === 0}
                className="button-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span className="text-white font-semibold">Enroll & Train Person</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* METHOD 2: BULK ZIP ARCHIVE                                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {uploadMethod === 'bulk_zip' && (
        <div className="card-linear space-y-6">
          <form onSubmit={handleZipSubmit} className="space-y-6">
            
            {/* Explainer card */}
            <div className="p-4 rounded-xl bg-[#141516] border border-[#23252A] space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Archive className="w-4 h-4 text-[#828FFF]" />
                <span>Multi-Personnel ZIP Batch Upload</span>
              </div>
              <p className="text-caption text-ink-subtle">
                Upload a <code className="text-emerald-400 font-mono">.zip</code> archive containing photos of multiple people. 
                Each folder will become a person (e.g. <code className="font-mono text-ink">John_Doe/pic1.jpg</code>), or prefix files with their name (e.g. <code className="font-mono text-ink">John_Doe_01.jpg</code>).
                Angles are automatically estimated for each photo!
              </p>
            </div>

            {/* ZIP Drag & Drop zone */}
            <div
              onClick={() => zipInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-[#23252A] hover:border-[#828FFF] rounded-2xl text-center bg-[#141516]/60 cursor-pointer transition-all"
            >
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleZipFileChange}
              />
              <Archive className="w-12 h-12 text-[#828FFF] mx-auto mb-3" />
              {zipFile ? (
                <div>
                  <p className="text-base font-semibold text-ink">{zipFile.name}</p>
                  <p className="text-caption text-ink-subtle mt-1">
                    {(zipFile.size / (1024 * 1024)).toFixed(2)} MB • Click to choose a different archive
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-ink">Click or drop your .zip file here</p>
                  <p className="text-caption text-ink-subtle mt-1">Accepts archives up to 500 MB</p>
                </div>
              )}
            </div>

            {/* Epochs Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-body font-medium text-ink">Training Epochs for Bulk Batch</label>
                <span className="font-mono text-ink bg-[#141516] px-2.5 py-0.5 rounded border border-[#23252A] text-xs">{epochs}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#23252A] rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
              />
            </div>

            {/* Progress bar if uploading */}
            {isZipSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-ink-subtle">
                  <span>Uploading & extracting archive...</span>
                  <span className="font-mono">{zipProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#23252A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#5E6AD2] transition-all duration-300" style={{ width: `${zipProgress}%` }} />
                </div>
              </div>
            )}

            {/* Results display */}
            {zipResult && (
              <div className="p-4 rounded-xl bg-[#121314] border border-[#23252A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Enrollment Summary</span>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      ✓ {zipResult.success_count} Enrolled
                    </span>
                    {zipResult.failure_count > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                        ✗ {zipResult.failure_count} Failed
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-[#23252A]">
                  {zipResult.successes?.map((s, i) => (
                    <div key={i} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-mono text-ink">{s.name || s}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Enrolled {s.photos_count ? `(${s.photos_count} photos)` : ''}
                      </span>
                    </div>
                  ))}
                  {zipResult.failures?.map((f, i) => (
                    <div key={i} className="py-2 flex items-center justify-between text-xs text-red-400">
                      <span className="font-mono">{f.name}</span>
                      <span>{f.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#23252A] flex justify-end">
              <button
                type="submit"
                disabled={isZipSubmitting || !zipFile}
                className="button-primary flex items-center gap-2"
              >
                {isZipSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span className="text-white font-semibold">Process & Enroll Archive</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* METHOD 3: BULK FOLDER SELECT (DIRECT BROWSER FOLDER SELECT)                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {uploadMethod === 'bulk_folder' && (
        <div className="card-linear space-y-6">
          <div className="p-4 rounded-xl bg-[#141516] border border-[#23252A] space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Folder className="w-4 h-4 text-emerald-400" />
              <span>Direct Multi-Personnel Directory Picker</span>
            </div>
            <p className="text-caption text-ink-subtle">
              Pick a parent folder containing subfolders for each employee from your computer. RMS inspects the structure client-side, lets you verify names, and automatically uploads each subject with angle estimation.
            </p>
          </div>

          <div
            onClick={() => folderInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-[#23252A] hover:border-emerald-400 rounded-2xl text-center bg-[#141516]/60 cursor-pointer transition-all"
          >
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleFolderSelect}
            />
            <Folder className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-ink">Click to Select Personnel Folder</p>
            <p className="text-caption text-ink-subtle mt-1">Select a folder with subfolders (e.g., Company_Employees/Alice/, Bob/)</p>
          </div>

          {folderPersons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">
                  Detected Personnel ({folderPersons.length})
                </span>
                <span className="text-caption text-ink-subtle">
                  Total Photos: <span className="font-mono text-ink">{folderPersons.reduce((acc, p) => acc + p.files.length, 0)}</span>
                </span>
              </div>

              {isFolderSubmitting && (
                <div className="space-y-2 p-3 bg-[#101012] border border-[#23252A] rounded-xl">
                  <div className="flex justify-between text-xs text-ink">
                    <span>Enrolling {folderProgress.currentName}...</span>
                    <span className="font-mono">{folderProgress.current} / {folderProgress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-[#23252A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${(folderProgress.current / folderProgress.total) * 100}%` }} 
                    />
                  </div>
                </div>
              )}

              <div className="border border-[#23252A] rounded-xl overflow-hidden divide-y divide-[#23252A] max-h-80 overflow-y-auto bg-[#101012]">
                {folderPersons.map((person, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4 hover:bg-[#141516]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={person.selected}
                        onChange={() => toggleFolderPerson(idx)}
                        disabled={isFolderSubmitting}
                        className="rounded border-[#23252A] text-[#5E6AD2] focus:ring-0"
                      />
                      {person.previewUrl && (
                        <img src={person.previewUrl} alt={person.name} className="w-10 h-10 rounded-md object-cover border border-[#23252A]" />
                      )}
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updateFolderPersonName(idx, e.target.value)}
                        disabled={isFolderSubmitting}
                        className="bg-transparent border-b border-transparent hover:border-[#3E424A] focus:border-[#828FFF] text-sm text-ink px-1 py-0.5 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#1C1D1F] text-ink-subtle font-mono">
                        {person.files.length} photos
                      </span>
                      {person.status === 'success' && <span className="text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Done</span>}
                      {person.status === 'error' && <span className="text-red-400 font-semibold">Failed</span>}
                      {person.status === 'uploading' && <span className="text-[#828FFF] animate-pulse">Uploading...</span>}
                      {person.status === 'pending' && <span className="text-ink-tertiary">Ready</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleFolderBatchSubmit}
                  disabled={isFolderSubmitting || folderPersons.filter(p => p.selected).length === 0}
                  className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
                >
                  {isFolderSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>Enroll Selected ({folderPersons.filter(p => p.selected).length} Personnel)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* METHOD 4: MANUAL ANGLE ALLOCATION (LEGACY SLOTS)                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {uploadMethod === 'manual' && (
        <div className="card-linear">
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 space-y-2 relative">
                <label className="text-body font-medium text-ink">Subject Identifier</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s+/g, '_');
                      setPersonName(val);
                      setSearchQuery(val);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="e.g. John_Doe, Vatsal_Vadgama"
                    className="input-primary w-full"
                  />
                  {showDropdown && searchQuery && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-[#191A1B] border border-[#23252A] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {existingPersons.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase())).map((name, i) => (
                        <div
                          key={i}
                          onClick={() => { setPersonName(name); setSearchQuery(name); setShowDropdown(false); }}
                          className="px-4 py-2 hover:bg-[#23252A] cursor-pointer text-sm text-ink flex items-center justify-between"
                        >
                          <span>{name}</span>
                          <span className="text-[10px] text-ink-subtle bg-[#101012] px-1.5 py-0.5 rounded">Existing</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-ink-tertiary">Unique ID (no spaces).</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-body font-medium text-ink">Training Epochs</label>
                  <span className="font-mono text-ink bg-[#141516] px-3 py-1 rounded-md border border-[#23252A] text-sm w-12 text-center">{epochs}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-[#23252A] rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
                />
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

            <div data-tour="asset-allocation" className="pt-4 border-t border-[#23252A] space-y-4">
              <label className="text-body font-medium text-ink block">Asset Allocation</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['left_img', 'front_img', 'right_img'].map(field => renderCategoryCard(field))}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {['extra_files'].map(field => renderCategoryCard(field))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#23252A] flex items-center justify-between">
              <div className="text-caption text-ink-subtle">
                Total Files: <span className="font-mono text-ink">{totalAvailablePhotos}</span>
              </div>
              <button 
                data-tour="enroll-submit-btn"
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
          </form>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
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
