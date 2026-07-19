import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, BookOpen, Monitor, Smartphone, Server,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle, 
  Camera, Brain, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';



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
    q: 'What are the 2 models and which is best?',
    a: 'The system uses: (1) DeepFace with Facenet512 embeddings — best for few-shot recognition with 1-3 photos. (2) SOTA MobileNetV2 — pretrained backbone fine-tuned on your faces, good balance of speed and accuracy. The Ensemble mode combines both for the most reliable result.'
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
    q: 'What does "Unknown" mean in results?',
    a: 'The Ensemble system returns "Unknown" when the confidence is below 25% or when the models disagree strongly. The SOTA MobileNetV2 model is weighted highest in the ensemble. Try uploading more/better photos of that person to improve accuracy.'
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
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>Help & Support</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
          Learn how to use the platform, troubleshoot issues, and get the most out of face recognition.
        </p>
      </div>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={22} color="var(--accent-violet)" />
          Quick Start Guide
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
          <GuideStep num={1} icon={<Camera size={20} />} title="Register a Person" link="/upload">
            Go to the <strong>Upload</strong> page. Enter the person's name and upload 3+ face photos from different angles.
          </GuideStep>
          <GuideStep num={2} icon={<Brain size={20} />} title="Train the Models" link="/training">
            Navigate to <strong>Training</strong>. All models train automatically when you upload. Watch the progress in the terminal.
          </GuideStep>
          <GuideStep num={3} icon={<Zap size={20} />} title="Test Recognition" link="/test">
            Go to <strong>Test</strong>. Upload a photo or use your webcam. The Ensemble result shows the combined prediction.
          </GuideStep>
          <GuideStep num={4} icon={<Smartphone size={20} />} title="Use Mobile App" link="/test">
            Open the mobile app, go to Settings → enter your PC's IP. Then use the camera to recognize faces on-the-go.
          </GuideStep>
        </div>
      </section>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="var(--confirm-green)" />
          Tips for Best Accuracy
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-6)' }}>
          <div>
            <h4 style={{ color: 'var(--confirm-green)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Do</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: 0 }}>
              <li>• Upload at least 3 photos per person</li>
              <li>• Include frontal + left + right angles</li>
              <li>• Use well-lit photos with clear faces</li>
              <li>• Keep faces centered and unobstructed</li>
              <li>• Use photos with consistent background</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--alert-crimson)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>❌ Avoid</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: 0 }}>
              <li>• Blurry or motion-blurred photos</li>
              <li>• Photos with sunglasses or masks</li>
              <li>• Very dark or overexposed images</li>
              <li>• Heavily cropped or zoomed images</li>
              <li>• Group photos (use individual face shots)</li>
            </ul>
          </div>
        </div>
      </div>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={22} color="var(--accent-violet)" />
          System Architecture
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          <ArchCard
            icon={<Server size={22} />}
            title="Backend (Flask API)"
            items={['Python 3.13 + Flask on port 5000', 'Handles training, inference, model management', 'Runs PyTorch models + DeepFace embeddings', 'RESTful API consumed by web + mobile']}
          />
          <ArchCard
            icon={<Monitor size={22} />}
            title="Web Dashboard (React)"
            items={['Vite + React on port 5173', 'Upload faces, trigger training, test predictions', 'Webcam support for live inference', 'Responsive design for all screen sizes']}
          />
          <ArchCard
            icon={<Smartphone size={22} />}
            title="Mobile App (Expo)"
            items={['React Native with Expo', 'Camera-based face capture + recognition', 'Connects to Flask server over WiFi', 'Works with Expo Go or standalone APK']}
          />
        </div>
      </section>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={22} color="var(--accent-cyan)" />
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </section>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ borderColor: 'rgba(217, 119, 6, 0.3)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="var(--alert-amber)" />
          Common Issues
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
    </motion.div>
  );
}

function GuideStep({ num, icon, title, link, children }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <motion.div whileHover={{ y: -2, scale: 1.01 }} style={{ height: '100%', cursor: 'pointer' }}>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-3)' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)',
              fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)'
            }}>{num}</div>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{title}</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{children}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function ArchCard({ icon, title, items }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-4)', color: 'var(--accent-violet)' }}>
        {icon}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
      overflow: 'hidden', transition: 'border-color var(--duration) var(--ease)',
      borderColor: open ? 'var(--accent-violet)' : 'var(--border-subtle)',
      background: 'var(--bg-surface)'
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)', background: 'transparent',
        border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
        fontWeight: 500, fontSize: 'var(--text-base)', fontFamily: 'inherit', textAlign: 'left',
      }}>
        {question}
        <ChevronDown size={18} style={{
          color: 'var(--text-muted)', transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0,
        }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 var(--space-4) var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
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
    <div style={{ borderLeft: '3px solid var(--alert-amber)', paddingLeft: 'var(--space-3)' }}>
      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px', color: 'var(--text-primary)' }}>{issue}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{fix}</div>
    </div>
  );
}
