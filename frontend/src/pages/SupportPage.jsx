import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, BookOpen, Monitor, Smartphone, Server,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle, 
  Camera, Brain, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Help & Support</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Learn how to use the platform, troubleshoot issues, and get the most out of face recognition.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-100">
          <BookOpen className="w-5 h-5 text-violet-500" />
          Quick Start Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GuideStep num={1} icon={<Camera className="w-5 h-5" />} title="Register a Person" link="/upload">
            Go to the <strong className="text-zinc-200 font-medium">Upload</strong> page. Enter the person's name and upload 3+ face photos from different angles.
          </GuideStep>
          <GuideStep num={2} icon={<Brain className="w-5 h-5" />} title="Train the Models" link="/training">
            Navigate to <strong className="text-zinc-200 font-medium">Training</strong>. All models train automatically when you upload. Watch the progress in the terminal.
          </GuideStep>
          <GuideStep num={3} icon={<Zap className="w-5 h-5" />} title="Test Recognition" link="/test">
            Go to <strong className="text-zinc-200 font-medium">Test</strong>. Upload a photo or use your webcam. The Ensemble result shows the combined prediction.
          </GuideStep>
          <GuideStep num={4} icon={<Smartphone className="w-5 h-5" />} title="Use Mobile App" link="/test">
            Open the mobile app, go to Settings → enter your PC's IP. Then use the camera to recognize faces on-the-go.
          </GuideStep>
        </div>
      </section>

      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-100">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Tips for Best Accuracy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-emerald-500 text-sm font-semibold mb-2 uppercase tracking-wide">✅ Do</h4>
              <ul className="text-zinc-400 text-sm leading-relaxed space-y-1">
                <li>• Upload at least 3 photos per person</li>
                <li>• Include frontal + left + right angles</li>
                <li>• Use well-lit photos with clear faces</li>
                <li>• Keep faces centered and unobstructed</li>
                <li>• Use photos with consistent background</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-500 text-sm font-semibold mb-2 uppercase tracking-wide">❌ Avoid</h4>
              <ul className="text-zinc-400 text-sm leading-relaxed space-y-1">
                <li>• Blurry or motion-blurred photos</li>
                <li>• Photos with sunglasses or masks</li>
                <li>• Very dark or overexposed images</li>
                <li>• Heavily cropped or zoomed images</li>
                <li>• Group photos (use individual face shots)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-100">
          <Server className="w-5 h-5 text-violet-500" />
          System Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ArchCard
            icon={<Server className="w-5 h-5" />}
            title="Backend (Flask API)"
            items={['Python 3.13 + Flask on port 5000', 'Handles training, inference, model management', 'Runs PyTorch models + DeepFace embeddings', 'RESTful API consumed by web + mobile']}
          />
          <ArchCard
            icon={<Monitor className="w-5 h-5" />}
            title="Web Dashboard (React)"
            items={['Vite + React on port 5173', 'Upload faces, trigger training, test predictions', 'Webcam support for live inference', 'Responsive design for all screen sizes']}
          />
          <ArchCard
            icon={<Smartphone className="w-5 h-5" />}
            title="Mobile App (Expo)"
            items={['React Native with Expo', 'Camera-based face capture + recognition', 'Connects to Flask server over WiFi', 'Works with Expo Go or standalone APK']}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-100">
          <HelpCircle className="w-5 h-5 text-cyan-500" />
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </section>

      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-500">
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GuideStep({ num, icon, title, link, children }) {
  return (
    <Link to={link} className="block group">
      <Card className="h-full bg-zinc-900/40 border-zinc-800 transition-all group-hover:border-violet-500/50 group-hover:-translate-y-0.5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-violet-500 text-sm font-bold font-mono">
              {num}
            </div>
            <span className="font-semibold text-zinc-100">{title}</span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ArchCard({ icon, title, items }) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4 text-violet-500 font-semibold">
          {icon}
          <span className="text-zinc-100">{title}</span>
        </div>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${open ? 'border-violet-500/50 bg-zinc-900/60' : 'border-zinc-800 bg-zinc-950'}`}>
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full flex justify-between items-center p-4 text-left font-medium text-zinc-200 hover:text-zinc-100 focus:outline-none"
      >
        {question}
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${open ? 'rotate-180' : 'rotate-0'} shrink-0`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed">
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
    <div className="border-l-2 border-amber-500 pl-3">
      <div className="font-semibold text-sm mb-1 text-zinc-200">{issue}</div>
      <div className="text-sm text-zinc-400 leading-relaxed">{fix}</div>
    </div>
  );
}
