import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  HelpCircle, BookOpen, Monitor, Smartphone, Server,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Info,
  Camera, Upload, Brain, Zap, Settings
} from 'lucide-react'

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
]

export default function SupportPage() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Help & Support</h1>
      <p className="page-subtitle">Learn how to use the platform, troubleshoot issues, and get the most out of face recognition.</p>

      {/* ── QUICK START GUIDE ── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={22} style={{ color: 'var(--primary-light)' }} />
          Quick Start Guide
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <GuideStep num={1} icon={<Camera size={20} />} title="Register a Person" link="/upload">
            Go to the <strong>Upload</strong> page. Enter the person's name and upload 3+ face photos from different angles.
          </GuideStep>
          <GuideStep num={2} icon={<Brain size={20} />} title="Train the Models" link="/training">
            Navigate to <strong>Training</strong>. All 3 models will train automatically when you upload. Watch the progress in the terminal.
          </GuideStep>
          <GuideStep num={3} icon={<Zap size={20} />} title="Test Recognition" link="/test">
            Go to <strong>Test</strong>. Upload a photo or use your webcam. The Ensemble result shows the combined prediction.
          </GuideStep>
          <GuideStep num={4} icon={<Smartphone size={20} />} title="Use Mobile App" link="/test">
            Open the mobile app, go to Settings → enter your PC's IP. Then use the camera to recognize faces on-the-go.
          </GuideStep>
        </div>
      </section>

      {/* ── TIPS FOR BEST ACCURACY ── */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          Tips for Best Accuracy
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h4 style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Do</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
              <li>• Upload at least 3 photos per person</li>
              <li>• Include frontal + left + right angles</li>
              <li>• Use well-lit photos with clear faces</li>
              <li>• Keep faces centered and unobstructed</li>
              <li>• Use photos with consistent background</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>❌ Avoid</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
              <li>• Blurry or motion-blurred photos</li>
              <li>• Photos with sunglasses or masks</li>
              <li>• Very dark or overexposed images</li>
              <li>• Heavily cropped or zoomed images</li>
              <li>• Group photos (use individual face shots)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SYSTEM ARCHITECTURE ── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={22} style={{ color: 'var(--primary-light)' }} />
          System Architecture
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <ArchCard
            icon={<Server size={22} />}
            title="Backend (Flask API)"
            items={[
              'Python 3.13 + Flask on port 5000',
              'Handles training, inference, model management',
              'Runs PyTorch models + DeepFace embeddings',
              'RESTful API consumed by web + mobile',
            ]}
          />
          <ArchCard
            icon={<Monitor size={22} />}
            title="Web Dashboard (React)"
            items={[
              'Vite + React on port 5173',
              'Upload faces, trigger training, test predictions',
              'Webcam support for live inference',
              'Responsive design for all screen sizes',
            ]}
          />
          <ArchCard
            icon={<Smartphone size={22} />}
            title="Mobile App (Expo)"
            items={[
              'React Native with Expo',
              'Camera-based face capture + recognition',
              'Connects to Flask server over WiFi',
              'Works with Expo Go or standalone APK',
            ]}
          />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={22} style={{ color: 'var(--primary-light)' }} />
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </section>

      {/* ── TROUBLESHOOTING ── */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
          Common Issues
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      </section>
    </div>
  )
}

function GuideStep({ num, icon, title, link, children }) {
  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="glass-panel" style={{
        padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
        height: '100%',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(37, 99, 235, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)',
            fontSize: '0.8rem', fontWeight: '700',
          }}>{num}</div>
          <span style={{ fontWeight: '600', fontSize: '1rem' }}>{title}</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>{children}</p>
      </div>
    </Link>
  )
}

function ArchCard({ icon, title, items }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--primary-light)' }}>
        {icon}
        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '3px' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', transition: 'border-color 0.2s',
      borderColor: open ? 'rgba(37, 99, 235, 0.25)' : 'var(--border)',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.25rem', background: open ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-card)',
        border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
        fontWeight: '500', fontSize: '0.95rem', fontFamily: 'inherit', textAlign: 'left',
        transition: 'background 0.2s',
      }}>
        {question}
        <ChevronDown size={18} style={{
          color: 'var(--text-tertiary)', transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0,
        }} />
      </button>
      {open && (
        <div style={{
          padding: '0 1.25rem 1rem', color: 'var(--text-secondary)',
          fontSize: '0.9rem', lineHeight: '1.7', background: 'rgba(37, 99, 235, 0.02)',
        }}>
          {answer}
        </div>
      )}
    </div>
  )
}

function TroubleItem({ issue, fix }) {
  return (
    <div style={{ borderLeft: '3px solid var(--warning)', paddingLeft: '1rem' }}>
      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>{issue}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>{fix}</div>
    </div>
  )
}
