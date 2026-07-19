import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, Users, Brain, Smartphone, Shield, Zap, 
  ChevronRight, ArrowRight, Lock, Eye, CheckCircle2, ChevronDown, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "Does my facial biometric data leave my network?",
      a: "No. The RMS platform runs entirely on-premise or in your private cloud context. All face detection, feature extraction, and neural network evaluations happen locally, ensuring complete privacy and compliance with biometric data laws."
    },
    {
      q: "How many training photos do I need to register a person?",
      a: "You can train identity embeddings with as few as 3 photos (frontal, left side-profile, and right side-profile). For optimal recognition rates in variable lighting, we recommend uploading between 5 to 15 photos per person."
    },
    {
      q: "Which face recognition models does the system use?",
      a: "The system runs a SOTA MobileNetV2 model (lightweight, optimized for fast CPU inference) alongside a high-dimensional FaceNet512 model. Detections are resolved using a weighted ensemble consensus logic."
    },
    {
      q: "Can the system recognize faces from profile/side angles?",
      a: "Yes. Unlike generic systems that only work with direct frontal views, RMS integrates MediaPipe BlazeFace with custom keypoint-based pose estimators to align and identify faces up to a 60-degree rotation angle."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900">
              <span className="font-mono text-zinc-200 font-bold text-sm">R</span>
            </div>
            <span className="text-zinc-100 font-medium tracking-tight text-sm">RMS Console</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#how-it-works" className="hover:text-zinc-200 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
            <a href="#security" className="hover:text-zinc-200 transition-colors">Security</a>
            <a href="#faq" className="hover:text-zinc-200 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 text-xs">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs">
                  <Link to="/register">Create Account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content wrapper */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 space-y-24">
        
        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-900/10 min-h-[500px] flex items-center"
        >
          {/* Background AI grid mesh */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen pointer-events-none"
            style={{ backgroundImage: 'url(/landing-bg.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950 pointer-events-none" />
          
          <div className="relative z-10 w-full text-center py-20 px-6 max-w-4xl mx-auto flex flex-col items-center">
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.05 }} 
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3.5 py-1 mb-6 text-xs font-medium text-emerald-400 backdrop-blur-md"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Side-Profile Enabled Neural Inference
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-zinc-100 leading-[1.1]"
            >
              On-Premise Face Recognition <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500">
                Built for Private Edge Operations
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Register personnel with standard profile photos, run continuous multi-model recognition streams, and synchronize biometrics seamlessly across mobile and web consoles.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-11 px-6">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    Enter Console <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-11 px-6">
                  <Link to="/register" className="flex items-center gap-2">
                    Get Started Free <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 h-11 px-6">
                <a href="#how-it-works">Learn How It Works</a>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section 
          id="how-it-works"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="scroll-mt-20"
        >
          <motion.div variants={itemVariants} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Intelligent Pipeline</h2>
            <p className="text-zinc-400 text-sm mt-2">RMS processes identities through three integrated stages to guarantee verification accuracy.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard 
              num="01"
              icon={<Camera className="w-6 h-6" />}
              title="1. Multi-Angle Enrollment"
              desc="Upload frontal and side-profile photos. The automated pre-processor cleans images, aligns facial landmarks, and caches crops locally."
            />
            <StepCard 
              num="02"
              icon={<Brain className="w-6 h-6" />}
              title="2. Hybrid Training"
              desc="Train two model architectures concurrently: high-dimensional DeepFace (Facenet512) embeddings alongside a customized, lightweight MobileNetV2 network."
            />
            <StepCard 
              num="03"
              icon={<Zap className="w-6 h-6" />}
              title="3. Ensemble Consensus"
              desc="Inference compares vectors across both classifiers, validating spoof liveness and resolving true match identities in milliseconds."
            />
          </div>
        </motion.section>

        {/* Platform Features Section */}
        <motion.section 
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="scroll-mt-20"
        >
          <motion.div variants={itemVariants} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Engineered for Performance</h2>
            <p className="text-zinc-400 text-sm mt-2">Built to run reliably on edge environments with minimal resource consumption.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Eye className="w-5 h-5 text-emerald-400" />}
              title="Profile Recognition"
              desc="Optimized pose alignment algorithms map features at up to 60-degree rotation, enabling robust lateral identification."
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5 text-emerald-400" />}
              title="Liveness Detection"
              desc="Standard spoof filters verify physical presence, checking texture, depth, and illumination keypoints to block photo replicas."
            />
            <FeatureCard 
              icon={<Smartphone className="w-5 h-5 text-emerald-400" />}
              title="Mobile Synchronicity"
              desc="Sync biometrics directly to local mobile apps. Scan and verify entry logs remotely over secure local channels."
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5 text-emerald-400" />}
              title="Automated Feedback Roster"
              desc="Continuous learning updates embeddings on-the-fly when operators correct errors or confirm detections."
            />
            <FeatureCard 
              icon={<Zap className="w-5 h-5 text-emerald-400" />}
              title="Sub-100ms Inference"
              desc="SOTA MobileNetV2 architecture enables lightning-fast inference on standard CPU servers without GPU requirements."
            />
            <FeatureCard 
              icon={<Lock className="w-5 h-5 text-emerald-400" />}
              title="Private Tenancy"
              desc="RMS supports single-tenant standalone nodes or multi-tenant database contexts, fully isolated for organization protection."
            />
          </div>
        </motion.section>

        {/* Local Security Showcase */}
        <motion.section 
          id="security"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 scroll-mt-20"
        >
          <div className="flex-1 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">100% Data Sovereignty</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              RMS operates fully offline, storing local images and neural vector embeddings securely within your localized workspace. Biometric parameters, attendance logs, and camera captures remain private and securely protected under your control.
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Zero external server communication</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Secure file hashing and database constraints</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Compliance-ready architecture</li>
            </ul>
          </div>
          <div className="w-full md:w-80 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xl shrink-0 font-mono text-xs text-zinc-500">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-zinc-300 font-semibold">Biometric Node Hashing</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>[INPUT]</span>
                <span className="text-zinc-400">live_frame.jpg</span>
              </div>
              <div className="flex justify-between">
                <span>[LIVENESS]</span>
                <span className="text-emerald-400">PASS (99.4%)</span>
              </div>
              <div className="flex justify-between">
                <span>[VECTOR]</span>
                <span className="text-zinc-400 text-[10px] truncate">0.124,-0.512,0.991...</span>
              </div>
              <div className="flex justify-between">
                <span>[MATCH]</span>
                <span className="text-emerald-400">Alice_Smith</span>
              </div>
              <div className="flex justify-between">
                <span>[INFERENCE]</span>
                <span className="text-zinc-400">84.2 ms</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section 
          id="faq"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="scroll-mt-20 max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-2.5">
              <HelpCircle className="w-6 h-6 text-zinc-400" /> Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-sm mt-2">Answers to common technical and operational questions.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div 
                  key={i} 
                  className="bg-zinc-900/20 border border-zinc-900 rounded-xl overflow-hidden transition-colors hover:border-zinc-800"
                >
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full flex justify-between items-center p-5 text-left text-zinc-200 hover:text-zinc-100 font-medium text-sm outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/60">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center py-16 px-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl max-w-4xl mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-zinc-100">Ready to secure your workspace?</h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm">
            Deploy RMS locally, enroll your roster, and experience sub-100ms on-premise face recognition.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                  <Link to="/register">Create Roster Console</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-zinc-400 hover:text-zinc-100">
                  <Link to="/login">Already Registered? Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </motion.section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 RMS Platform. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/support" className="hover:text-zinc-400 transition-colors">Documentation</Link>
            <Link to="/support" className="hover:text-zinc-400 transition-colors">Support Helpdesk</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

function StepCard({ num, icon, title, desc }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="h-full">
      <Card className="bg-zinc-900/20 border-zinc-900 h-full relative overflow-hidden group hover:border-zinc-800 transition-colors">
        <div className="absolute -top-4 -right-4 text-8xl font-black opacity-[0.02] text-zinc-100 pointer-events-none select-none group-hover:opacity-[0.04] transition-opacity">
          {num}
        </div>
        <CardContent className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2 }} className="h-full">
      <Card className="bg-zinc-900/20 border-zinc-900 h-full hover:border-zinc-800 transition-colors">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-900 group-hover:border-zinc-800">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-100 mb-1">{title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
