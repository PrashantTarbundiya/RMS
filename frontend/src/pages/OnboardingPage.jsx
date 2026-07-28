import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Camera, Users, ScanFace, CheckCircle2, 
  ChevronRight, ChevronLeft, UploadCloud, Play, Loader2
} from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { apiClient, isMultiTenant } = useAuth();
  
  // Step 3 (Upload) State
  const [personName, setPersonName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Step 4 (Test) State
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [streamActive, setStreamActive] = useState(false);

  // Helper to mark onboarding complete
  const markComplete = () => {
    localStorage.setItem('rms_onboarding_complete', 'true');
    navigate('/dashboard');
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // ── Step 3: Handle Upload ──
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!personName || !uploadFile) return;
    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('name', personName);
    formData.append('files', uploadFile);
    
    try {
      await apiClient.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('success');
      setTimeout(() => {
        setUploadStatus('');
        setPersonName('');
        setUploadFile(null);
      }, 3000);
    } catch (err) {
      setUploadStatus('error');
      console.error(err);
    }
  };

  // ── Step 4: Handle Webcam Test ──
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setStreamActive(false);
    }
  }, []);

  useEffect(() => {
    if (step === 4) {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [step, stopWebcam]);

  const captureAndTest = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsTesting(true);
    setTestResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'test.jpg');
      
      try {
        const res = await apiClient.post('/api/predict', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTestResult({ success: true, data: res.data });
      } catch (err) {
        setTestResult({ success: false, error: err.response?.data?.error || 'Recognition failed' });
      } finally {
        setIsTesting(false);
      }
    }, 'image/jpeg');
  };

  // ── Step Content Renders ──
  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="onboarding-icon-wrapper"><Building2 size={48} className="icon-blue" /></div>
      <h2>Welcome to RMS AI Face Recognition</h2>
      <p>Let's get your intelligent attendance system up and running in minutes.</p>
      <div className="onboarding-info-box">
        <p><strong>What you'll do in this quick setup:</strong></p>
        <ul>
          <li>Connect an IP or local camera</li>
          <li>Enroll your first employee</li>
          <li>Run a live test scan</li>
        </ul>
      </div>
      <button className="primary-btn mt-6" onClick={nextStep}>Get Started <ChevronRight size={18} /></button>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="onboarding-icon-wrapper"><Camera size={48} className="icon-green" /></div>
      <h2>Connect Your First Camera</h2>
      <p>RMS AI works with any RTSP IP camera, or a local webcam on an edge appliance.</p>
      
      <div className="onboarding-code-box">
        <h4>1. Mobile App / Edge Camera App</h4>
        <p>If you are using our Mobile App as an edge camera, download the app and enter the Server URL in Settings:</p>
        <code className="block-code">http://{window.location.hostname}:5000</code>
      </div>
      
      <div className="onboarding-code-box mt-4">
        <h4>2. RTSP IP Camera</h4>
        <p>If you have an RTSP stream (e.g. Hikvision, Dahua), you can stream it using the API. You will need an API Key.</p>
        <p className="text-sm text-gray-500">Go to Settings &gt; API Keys later to generate one.</p>
      </div>

      <div className="onboarding-actions">
        <button className="secondary-btn" onClick={prevStep}>Back</button>
        <button className="primary-btn" onClick={nextStep}>Next: Enroll Employees <ChevronRight size={18} /></button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="onboarding-icon-wrapper"><Users size={48} className="icon-purple" /></div>
      <h2>Enroll Your First Employee</h2>
      <p>Upload a clear front-facing photo of a team member to add them to the system.</p>
      
      <form className="onboarding-upload-form" onSubmit={handleUpload}>
        <div className="input-group">
          <label>Employee Name</label>
          <input 
            type="text" 
            placeholder="e.g. Jane Doe" 
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Photo (JPEG/PNG)</label>
          <input 
            type="file" 
            accept="image/jpeg, image/png"
            onChange={(e) => setUploadFile(e.target.files[0])}
            required
          />
        </div>
        <button type="submit" className="primary-btn full-width" disabled={uploadStatus === 'uploading'}>
          {uploadStatus === 'uploading' ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <UploadCloud className="inline mr-2" size={18} />}
          {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload & Enroll'}
        </button>
        {uploadStatus === 'success' && <p className="success-text mt-2"><CheckCircle2 className="inline mr-1" size={16}/> Enrolled successfully!</p>}
        {uploadStatus === 'error' && <p className="error-text mt-2">Failed to upload. Try again.</p>}
      </form>

      <div className="onboarding-actions">
        <button className="secondary-btn" onClick={prevStep}>Back</button>
        <button className="primary-btn" onClick={nextStep}>Next: Test Scan <ChevronRight size={18} /></button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <div className="onboarding-icon-wrapper"><ScanFace size={48} className="icon-orange" /></div>
      <h2>Test Recognition</h2>
      <p>Position your face in the camera and run a test scan to verify the AI.</p>
      
      <div className="onboarding-webcam-container">
        <video ref={videoRef} autoPlay playsInline muted className="onboarding-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {testResult && testResult.success && (
          <div className="test-overlay success">
            {testResult.data.faces?.length > 0 ? (
              <p>Recognized: {testResult.data.faces[0].name} ({Math.round(testResult.data.faces[0].confidence * 100)}%)</p>
            ) : (
              <p>No face detected. Try again.</p>
            )}
          </div>
        )}
        {testResult && !testResult.success && (
          <div className="test-overlay error">
            <p>Error: {testResult.error}</p>
          </div>
        )}
      </div>

      <button className="secondary-btn mt-4 full-width" onClick={captureAndTest} disabled={!streamActive || isTesting}>
        {isTesting ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <Play className="inline mr-2" size={18} />}
        {isTesting ? 'Scanning...' : 'Run Test Scan'}
      </button>

      <div className="onboarding-actions">
        <button className="secondary-btn" onClick={prevStep}>Back</button>
        <button className="primary-btn" onClick={nextStep}>Next: Finalize <ChevronRight size={18} /></button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-step">
      <div className="onboarding-icon-wrapper"><CheckCircle2 size={64} className="icon-green" /></div>
      <h2>You're All Set!</h2>
      <p>RMS AI is ready to automate your attendance tracking.</p>
      
      <div className="onboarding-checklist">
        <div className="check-item"><CheckCircle2 size={20} className="text-green-500" /> Organization configured</div>
        <div className="check-item"><CheckCircle2 size={20} className="text-green-500" /> API / Cameras prepared</div>
        <div className="check-item"><CheckCircle2 size={20} className="text-green-500" /> AI pipeline tested</div>
      </div>

      <div className="onboarding-actions center">
        <button className="primary-btn launch-btn" onClick={markComplete}>
          Go to Dashboard <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Step Indicator */}
        <div className="onboarding-progress">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="onboarding-content-wrapper"
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </motion.div>
        </AnimatePresence>

        {/* Skip Button */}
        {step < 5 && (
          <button className="skip-btn" onClick={markComplete}>Skip Onboarding</button>
        )}
      </div>
    </div>
  );
}
