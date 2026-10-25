import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HelpCircle, BookOpen, Monitor, Smartphone, Server,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle, 
  Camera, Brain, Zap, Keyboard, Activity, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

const FAQ_DATA = [
  {
    q: 'How many photos do I need per person?',
    a: 'Minimum 1 photo works, but we recommend 3-5 photos from different angles (frontal, left profile, right profile) for best accuracy. More photos = better recognition.'
  },
  {
    q: 'Does it work with side-face / profile views?',
    a: 'Yes! The system is specifically designed for side-face recognition. It uses MediaPipe BlazeFace for detection which handles profile views well, and the training pipeline includes perspective augmentation for angle robustness.'
  },
  {
    q: 'What AI models are running under the hood?',
    a: 'The system uses: (1) InsightFace ArcFace embeddings: high-speed, high-accuracy primary model. (2) GhostFaceNet: optimized for fast edge inference. The Ensemble mode combines both for the most reliable result.'
  },
  {
    q: 'Do I need a GPU?',
    a: 'No, the system runs on CPU. Training a few people takes 1-2 minutes. For larger datasets (50+ people), a CUDA GPU will significantly speed up training.'
  },
  {
    q: 'How do I connect the mobile app?',
    a: 'Both your phone and computer must be on the same WiFi network. Open the app, go to Settings, and enter your computer\'s IP address (shown when the Flask server starts). The format is: http://YOUR_IP:5000'
  },
  {
    q: 'Why did the system predict "Unknown"?',
    a: 'The Ensemble system returns "Unknown" when the confidence is below 25% or when the models disagree strongly. The InsightFace ArcFace model is weighted highest in the ensemble. Try uploading more/better photos of that person to improve accuracy.'
  },
  {
    q: 'Can I delete a person after registration?',
    a: 'Yes! Go to the Dashboard page, find the person in the list, and click the delete button. This removes their photos and retrains the models. You can also rename people from the Dashboard.'
  },
  {
    q: 'Is my data sent to any cloud?',
    a: 'No. Everything runs 100% locally on your computer. No data leaves your network. The mobile app sends images to your computer\'s local Flask server over WiFi.'
  },
];

export default function SupportPage() {
  const { apiClient } = useAuth();
  const [healthStatus, setHealthStatus] = useState('checking'); // checking, ok, error
  const [healthLatency, setHealthLatency] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      try {
        await apiClient.get(`${API_BASE}/ping`);
        setHealthLatency(Math.round(performance.now() - start));
        setHealthStatus('ok');
      } catch {
        setHealthStatus('error');
      }
    };
    checkHealth();
  }, [apiClient]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-8 page-container">
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">Help & Support</h1>
        <p className="mt-1 text-caption text-ink-subtle">
          Learn how to use the platform, troubleshoot issues, and get the most out of face recognition.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-body font-semibold flex items-center gap-2 text-ink uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-blue-400" />
          Quick Start Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GuideStep num={1} icon={<Camera className="w-4 h-4" />} title="Register a Person" link="/upload">
            Go to the <strong className="text-ink font-medium">Upload</strong> page. Enter the person's name and upload 3+ face photos from different angles.
          </GuideStep>
          <GuideStep num={2} icon={<Brain className="w-4 h-4" />} title="Train the Models" link="/training">
            Navigate to <strong className="text-ink font-medium">Training</strong>. All models train automatically when you upload. Watch the progress in the terminal.
          </GuideStep>
          <GuideStep num={3} icon={<Zap className="w-4 h-4" />} title="Test Recognition" link="/test">
            Go to <strong className="text-ink font-medium">Test</strong>. Upload a photo or use your webcam. The Ensemble result shows the combined prediction.
          </GuideStep>
          <GuideStep num={4} icon={<Smartphone className="w-4 h-4" />} title="Use Mobile App" link="/test">
            Open the mobile app, go to Settings → enter your PC's IP. Then use the camera to recognize faces on-the-go.
          </GuideStep>
        </div>
      </section>

      <div className="card-linear p-6">
        <div>
          <h2 className="text-body font-semibold mb-4 flex items-center gap-2 text-ink">
            <CheckCircle className="w-5 h-5 text-[#27A644]" />
            Tips for Best Accuracy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-[#27A644] text-[11px] font-semibold mb-2 uppercase tracking-wide font-mono">Recommended Practices</h4>
              <ul className="text-ink-subtle text-caption leading-relaxed space-y-1.5">
                <li>• Upload at least 3 photos per person</li>
                <li>• Include frontal + left + right angles</li>
                <li>• Use well-lit photos with clear faces</li>
                <li>• Keep faces centered and unobstructed</li>
                <li>• Use photos with consistent background</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#F87171] text-[11px] font-semibold mb-2 uppercase tracking-wide font-mono">Practices to Avoid</h4>
              <ul className="text-ink-subtle text-caption leading-relaxed space-y-1.5">
                <li>• Blurry or motion-blurred photos</li>
                <li>• Photos with sunglasses or masks</li>
                <li>• Very dark or overexposed images</li>
                <li>• Heavily cropped or zoomed images</li>
                <li>• Group photos (use individual face shots)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-body font-semibold flex items-center gap-2 text-ink uppercase tracking-wider">
          <Server className="w-4 h-4 text-blue-400" />
          System Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ArchCard
            icon={<Server className="w-4 h-4" />}
            title="Backend (Flask API)"
            items={['Python 3.13 + Flask on port 5000', 'Handles training, inference, model management', 'Runs PyTorch models + DeepFace embeddings', 'RESTful API consumed by web + mobile']}
          />
          <ArchCard
            icon={<Monitor className="w-4 h-4" />}
            title="Web Dashboard (React)"
            items={['Vite + React on port 5173', 'Upload faces, trigger training, test predictions', 'Webcam support for live inference', 'Responsive design for all screen sizes']}
          />
          <ArchCard
            icon={<Smartphone className="w-4 h-4" />}
            title="Mobile App (Expo)"
            items={['React Native with Expo', 'Camera-based face capture + recognition', 'Connects to Flask server over WiFi', 'Works with Expo Go or standalone APK']}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-body font-semibold flex items-center gap-2 text-ink uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-[#60A5FA]" />
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </section>

      <div className="border border-[#FBBF24]/20 bg-[#FBBF24]/5 rounded-lg p-6">
        <div>
          <h2 className="text-body font-semibold mb-4 flex items-center gap-2 text-[#FBBF24]">
            <AlertTriangle className="w-5 h-5" />
            Common Issues
          </h2>
          <div className="flex flex-col gap-4">
            <TroubleItem
              issue="Mobile app can't connect to server"
              fix="Ensure both devices are on the same WiFi. Check your PC's IP with 'ipconfig' (Windows) or 'ifconfig' (Mac). Enter it in the mobile app's Settings screen as http://YOUR_IP:5000"
            />
            <TroubleItem
              issue="Webcam shows black screen or error"
              fix="Webcam requires HTTPS or localhost. Open the dashboard at http://localhost:5173 (not via IP address). Also check that no other app is using the camera."
            />
            <TroubleItem
              issue="Recognition says 'Unknown' for everyone"
              fix="The confidence threshold is 35%. Upload more photos (5+ per person) from varied angles. After uploading, wait for training to complete before testing."
            />
            <TroubleItem
              issue="Server crashes on startup"
              fix="Ensure all Python dependencies are installed: pip install flask flask-cors torch torchvision opencv-python mediapipe deepface. Use Python 3.13."
            />
          </div>
        </div>
      </div>

      {/* System Health Check */}
      <section className="space-y-4">
        <h2 className="text-body font-semibold flex items-center gap-2 text-ink uppercase tracking-wider">
          <Activity className="w-4 h-4 text-[#60A5FA]" />
          System Health
        </h2>
        <div className="card-linear p-5 bg-[#0F1011] border-[#23252A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {healthStatus === 'checking' && <Loader2 className="w-5 h-5 text-[#60A5FA] animate-spin" />}
            {healthStatus === 'ok' && <CheckCircle className="w-5 h-5 text-[#27A644]" />}
            {healthStatus === 'error' && <AlertTriangle className="w-5 h-5 text-[#F87171]" />}
            <div>
              <div className="text-sm font-medium text-ink">
                {healthStatus === 'checking' ? 'Checking backend...' : healthStatus === 'ok' ? 'Backend Online' : 'Backend Unreachable'}
              </div>
              {healthLatency && (
                <div className="text-[11px] text-ink-tertiary font-mono">Latency: {healthLatency}ms</div>
              )}
            </div>
          </div>
          <span className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
            healthStatus === 'ok' ? 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20' :
            healthStatus === 'error' ? 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20' :
            'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/20'
          }`}>
            {healthStatus === 'ok' ? 'HEALTHY' : healthStatus === 'error' ? 'DOWN' : 'CHECKING'}
          </span>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="space-y-4">
        <h2 className="text-body font-semibold flex items-center gap-2 text-ink uppercase tracking-wider">
          <Keyboard className="w-4 h-4 text-[#60A5FA]" />
          Keyboard Shortcuts
        </h2>
        <div className="card-linear p-5 bg-[#0F1011] border-[#23252A]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { keys: 'Ctrl + V', desc: 'Paste image into upload' },
              { keys: 'Ctrl + S', desc: 'Save configuration' },
              { keys: 'Esc', desc: 'Close modals & dialogs' },
              { keys: 'Tab', desc: 'Navigate between fields' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-[#010102]/40 border border-[#23252A]/50">
                <span className="text-caption text-ink-subtle">{s.desc}</span>
                <kbd className="bg-[#141516] border border-[#23252A] text-ink-muted text-[11px] font-mono px-2 py-0.5 rounded">{s.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Version and Legal Links */}
      <div className="text-center text-[11px] text-ink-tertiary pt-4 border-t border-[#23252A] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>RMS Recognition Management System v2.0 • On-premise platform</span>
        <div className="flex gap-4">
          <Link to="/privacy-policy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
        </div>
      </div>
    </motion.div>
  );
}

function GuideStep({ num, icon, title, link, children }) {
  return (
    <Link to={link} className="block group">
      <div className="card-linear h-full transition-all group-hover:border-[#2563EB]/50 group-hover:bg-[#141516] p-6 bg-[#0F1011] border-[#23252A]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded bg-[#010102] border border-[#23252A] flex items-center justify-center text-[#60A5FA] text-[11px] font-bold font-mono">
            {num}
          </div>
          <span className="font-semibold text-ink text-caption">{title}</span>
        </div>
        <p className="text-caption text-ink-subtle leading-relaxed">{children}</p>
      </div>
    </Link>
  );
}

function ArchCard({ icon, title, items }) {
  return (
    <div className="card-linear p-6 bg-[#0F1011] border-[#23252A]">
      <div className="flex items-center gap-2 mb-4 text-[#60A5FA] font-semibold">
        {icon}
        <span className="text-ink text-caption font-medium">{title}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-caption text-ink-subtle flex items-start gap-2 leading-relaxed">
            <ChevronRight className="w-3.5 h-3.5 text-ink-tertiary shrink-0 mt-1" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${open ? 'border-[#2563EB]/50 bg-[#141516]' : 'border-[#23252A] bg-[#0F1011]'}`}>
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full flex justify-between items-center p-4 text-left font-medium text-ink hover:text-ink-subtle focus:outline-none"
      >
        <span className="text-caption">{question}</span>
        <ChevronDown className={`w-4 h-4 text-ink-subtle transition-transform ${open ? 'rotate-180' : 'rotate-0'} shrink-0`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 text-caption text-ink-subtle leading-relaxed border-t border-[#23252A]/30 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TroubleItem({ issue, fix }) {
  return (
    <div className="p-3.5 rounded-lg bg-[#141516] border border-[#23252A] space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
        <span className="font-semibold text-caption text-ink">{issue}</span>
      </div>
      <div className="text-caption text-ink-subtle leading-relaxed pl-3.5">{fix}</div>
    </div>
  );
}
