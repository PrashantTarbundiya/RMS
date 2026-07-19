import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, Users, Brain, Smartphone, Shield, Zap, 
  ChevronRight, ArrowRight, Lock, Eye, CheckCircle2, ChevronDown, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-[#010102] text-ink flex flex-col">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#23252A] bg-[#010102]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#23252A] flex items-center justify-center bg-[#0F1011]">
              <span className="font-mono text-ink font-bold text-sm">R</span>
            </div>
            <span className="text-ink font-semibold tracking-tight text-sm font-display">RMS Console</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-ink-subtle">
            <a href="#how-it-works" className="hover:text-ink transition-colors font-medium">How It Works</a>
            <a href="#features" className="hover:text-ink transition-colors font-medium">Features</a>
            <a href="#security" className="hover:text-ink transition-colors font-medium">Security</a>
            <a href="#faq" className="hover:text-ink transition-colors font-medium">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="button-primary text-white text-xs h-8 flex items-center px-4">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-ink-subtle hover:text-ink text-xs transition-colors px-2">
                  Sign In
                </Link>
                <Link to="/register" className="button-primary text-white text-xs h-8 flex items-center px-4">
                  Create Account
                </Link>
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
          className="relative rounded-2xl overflow-hidden border border-[#23252A] bg-[#0F1011]/30 min-h-[500px] flex items-center"
        >
          {/* Background AI grid mesh */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen pointer-events-none"
            style={{ backgroundImage: 'url(/landing-bg.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#010102]/40 to-[#010102] pointer-events-none" />
          
          <div className="relative z-10 w-full text-center py-20 px-6 max-w-4xl mx-auto flex flex-col items-center">
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }} 
              className="inline-flex items-center gap-2 bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 rounded-full px-3.5 py-1 mb-6 text-xs font-semibold text-[#828FFF] backdrop-blur-md"
            >
              <Zap className="w-3.5 h-3.5 text-[#828FFF] animate-pulse" /> Side-Profile Enabled Neural Inference
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 text-ink leading-[1.1] font-display"
            >
              On-Premise Face Recognition <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#828FFF] via-[#5E6AD2] to-[#828FFF]">
                Built for Private Edge Operations
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-caption sm:text-body text-ink-subtle max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Register personnel with standard profile photos, run continuous multi-model recognition streams, and synchronize biometrics seamlessly across mobile and web consoles.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="button-primary text-white flex items-center gap-2 h-11 px-6 text-caption">
                  Enter Console <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              ) : (
                <Link to="/register" className="button-primary text-white flex items-center gap-2 h-11 px-6 text-caption">
                  Get Started Free <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              )}
              <a href="#how-it-works" className="button-secondary flex items-center gap-2 h-11 px-6 text-caption">
                Learn How It Works
              </a>
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
            <h2 className="text-3xl font-bold tracking-tight text-ink font-display">Intelligent Pipeline</h2>
            <p className="text-ink-subtle text-caption mt-2">RMS processes identities through three integrated stages to guarantee verification accuracy.</p>
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
            <h2 className="text-3xl font-bold tracking-tight text-ink font-display">Engineered for Performance</h2>
            <p className="text-ink-subtle text-caption mt-2">Built to run reliably on edge environments with minimal resource consumption.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Eye className="w-5 h-5 text-[#828FFF]" />}
              title="Profile Recognition"
              desc="Optimized pose alignment algorithms map features at up to 60-degree rotation, enabling robust lateral identification."
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5 text-[#828FFF]" />}
              title="Liveness Detection"
              desc="Standard spoof filters verify physical presence, checking texture, depth, and illumination keypoints to block photo replicas."
            />
            <FeatureCard 
              icon={<Smartphone className="w-5 h-5 text-[#828FFF]" />}
              title="Mobile Synchronicity"
              desc="Sync biometrics directly to local mobile apps. Scan and verify entry logs remotely over secure local channels."
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5 text-[#828FFF]" />}
              title="Automated Feedback Roster"
              desc="Continuous learning updates embeddings on-the-fly when operators correct errors or confirm detections."
            />
            <FeatureCard 
              icon={<Zap className="w-5 h-5 text-[#828FFF]" />}
              title="Sub-100ms Inference"
              desc="SOTA MobileNetV2 architecture enables lightning-fast inference on standard CPU servers without GPU requirements."
            />
            <FeatureCard 
              icon={<Lock className="w-5 h-5 text-[#828FFF]" />}
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
          className="bg-[#0F1011]/30 border border-[#23252A] rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 scroll-mt-20"
        >
          <div className="flex-1 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#828FFF]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold text-ink font-display">100% Data Sovereignty</h3>
            <p className="text-ink-subtle text-caption leading-relaxed m-0">
              RMS operates fully offline, storing local images and neural vector embeddings securely within your localized workspace. Biometric parameters, attendance logs, and camera captures remain private and securely protected under your control.
            </p>
            <ul className="space-y-2 text-caption text-ink-subtle list-none p-0 m-0">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#27A644] shrink-0" /> Zero external server communication</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#27A644] shrink-0" /> Secure file hashing and database constraints</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#27A644] shrink-0" /> Compliance-ready architecture</li>
            </ul>
          </div>
          <div className="w-full md:w-80 bg-[#0F1011] border border-[#23252A] rounded-xl p-6 space-y-4 shadow-xl shrink-0 font-mono text-xs text-ink-muted">
            <div className="flex items-center justify-between border-b border-[#23252A] pb-3">
              <span className="text-ink-subtle font-semibold">Biometric Node Hashing</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27A644] animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>[INPUT]</span>
                <span className="text-ink-subtle">live_frame.jpg</span>
              </div>
              <div className="flex justify-between">
                <span>[LIVENESS]</span>
                <span className="text-[#27A644]">PASS (99.4%)</span>
              </div>
              <div className="flex justify-between">
                <span>[VECTOR]</span>
                <span className="text-ink-subtle text-[10px] truncate">0.124,-0.512,0.991...</span>
              </div>
              <div className="flex justify-between">
                <span>[MATCH]</span>
                <span className="text-[#27A644]">Alice_Smith</span>
              </div>
              <div className="flex justify-between">
                <span>[INFERENCE]</span>
                <span className="text-ink-subtle">84.2 ms</span>
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
            <h2 className="text-3xl font-bold tracking-tight text-ink font-display flex items-center justify-center gap-2.5">
              <HelpCircle className="w-6 h-6 text-ink-subtle" /> Frequently Asked Questions
            </h2>
            <p className="text-ink-subtle text-caption mt-2">Answers to common technical and operational questions.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div 
                  key={i} 
                  className="bg-[#0F1011]/30 border border-[#23252A] rounded-xl overflow-hidden transition-colors hover:border-[#34343A]"
                >
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full flex justify-between items-center p-5 text-left text-ink-subtle hover:text-ink font-semibold text-caption outline-none border-none bg-transparent cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${isOpen ? 'rotate-180 text-[#828FFF]' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-ink-muted leading-relaxed border-t border-[#23252A]/60">
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
          className="text-center py-16 px-6 bg-[#0F1011]/30 border border-[#23252A] rounded-2xl max-w-4xl mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5E6AD2]/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-ink font-display">Ready to secure your workspace?</h2>
          <p className="text-ink-subtle mb-8 max-w-md mx-auto text-caption">
            Deploy RMS locally, enroll your roster, and experience sub-100ms on-premise face recognition.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {isAuthenticated ? (
              <Link to="/dashboard" className="button-primary text-white text-caption h-11 px-6 flex items-center">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="button-primary text-white text-caption h-11 px-6 flex items-center">
                  Create Roster Console
                </Link>
                <Link to="/login" className="button-secondary text-caption h-11 px-6 flex items-center">
                  Already Registered? Sign In
                </Link>
              </>
            )}
          </div>
        </motion.section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#23252A] bg-[#010102] py-8 text-center text-xs text-ink-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 RMS Platform. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/support" className="hover:text-ink transition-colors">Documentation</Link>
            <Link to="/support" className="hover:text-ink transition-colors">Support Helpdesk</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

function StepCard({ num, icon, title, desc }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="h-full">
      <div className="card-linear h-full relative overflow-hidden group hover:border-[#34343A] transition-colors p-8 bg-[#0F1011] border-[#23252A] rounded-lg">
        <div className="absolute -top-4 -right-4 text-8xl font-black opacity-[0.02] text-zinc-100 pointer-events-none select-none group-hover:opacity-[0.04] transition-opacity">
          {num}
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#828FFF]">
            {icon}
          </div>
          <h3 className="text-body font-semibold text-ink font-display">{title}</h3>
          <p className="text-ink-subtle text-caption leading-relaxed m-0">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2 }} className="h-full">
      <div className="card-linear h-full hover:border-[#34343A] transition-colors p-6 flex items-start gap-4 bg-[#0F1011] border-[#23252A] rounded-lg">
        <div className="w-10 h-10 rounded-xl bg-[#141516] flex items-center justify-center text-ink-subtle shrink-0 border border-[#23252A] group-hover:border-[#34343A]">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-body text-ink mb-1 font-display">{title}</h4>
          <p className="text-caption text-ink-subtle leading-relaxed m-0">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
