import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Users, Brain, Smartphone, Shield, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LandingPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ paddingBottom: 'var(--space-8)' }}>
      
      {/* Hero Section */}
      <motion.section variants={itemVariants} style={{ textAlign: 'center', padding: 'var(--space-8) 0', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%' }}>
          <motion.div whileHover={{ scale: 1.05 }} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--success-bg)', border: '1px solid rgba(48, 209, 88, 0.2)',
            borderRadius: '9999px', padding: '6px 16px', marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--confirm-green)',
          }}>
            <Zap size={14} /> Side-Face Recognition Powered by 3 AI Models
          </motion.div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 'var(--space-4)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Intelligent Face</span><br />
            <span style={{ color: 'var(--accent-violet)' }}>Recognition Platform</span>
          </h1>

          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-6)', lineHeight: 1.7 }}>
            Train custom face recognition models with just a few photos. Works with side-face profiles,
            runs inference across three models simultaneously, and deploys to web and mobile seamlessly.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as={Link} to="/upload" variant="primary" style={{ padding: '0.85rem 2rem', fontSize: 'var(--text-base)' }}>
              Get Started <ArrowRight size={18} style={{ marginLeft: '6px' }} />
            </button>
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as={Link} to="/support" variant="secondary" style={{ padding: '0.85rem 2rem', fontSize: 'var(--text-base)' }}>
              Learn How It Works
            </button>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} style={{ margin: 'var(--space-8) 0' }}>
        <motion.h2 variants={itemVariants} style={{ textAlign: 'center', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          How It Works
        </motion.h2>
        <motion.p variants={itemVariants} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)' }}>
          Three simple steps to train and deploy your own face recognition system
        </motion.p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <StepCard
            number="01"
            icon={<Camera size={28} />}
            title="Upload Face Photos"
            description="Upload frontal, left, and right profile images of each person. The system intelligently detects faces and accepts 1-20 photos per person."
          />
          <StepCard
            number="02"
            icon={<Brain size={28} />}
            title="Train Models"
            description="Two models train simultaneously: DeepFace embeddings and SOTA MobileNetV2 — optimized for side-face profiles."
          />
          <StepCard
            number="03"
            icon={<Zap size={28} />}
            title="Recognize Faces"
            description="Use the webcam or upload images to identify faces. An advanced ensemble system combines all 3 models for maximum accuracy."
          />
        </div>
      </motion.section>

      {/* Features */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} style={{ margin: 'var(--space-8) 0' }}>
        <motion.h2 variants={itemVariants} style={{ textAlign: 'center', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Platform Features
        </motion.h2>
        <motion.p variants={itemVariants} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)' }}>
          Built for accuracy, speed, and seamless integration
        </motion.p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          <FeatureCard icon={<Brain size={22} />} title="2-Model Ensemble" desc="Combines DeepFace and MobileNetV2 predictions for higher accuracy with weighted voting." />
          <FeatureCard icon={<Camera size={22} />} title="Side-Face Support" desc="Specialized for profile/side-face detection using MediaPipe BlazeFace and custom data augmentation." />
          <FeatureCard icon={<Smartphone size={22} />} title="Mobile App" desc="React Native mobile app with live camera recognition. Connect directly to your local server over WiFi." />
          <FeatureCard icon={<Users size={22} />} title="Multi-Person" desc="Register unlimited people. Each person can have multiple face angles for highly robust accuracy." />
          <FeatureCard icon={<Zap size={22} />} title="Real-Time" desc="Fast inference on CPU. MobileNetV2 runs predictions in under 100ms on standard modern hardware." />
          <FeatureCard icon={<Shield size={22} />} title="Offline Capable" desc="All processing happens locally. No cloud dependency, ensuring no sensitive data ever leaves your network." />
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: 'var(--space-8)', textAlign: 'center', marginTop: 'var(--space-8)',
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Ready to start recognizing faces?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '500px', margin: '0 auto var(--space-6)', fontSize: 'var(--text-base)' }}>
          Upload photos of the people you want to recognize, train the ensemble models, and start testing in minutes.
        </p>
        <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" as={Link} to="/upload" variant="primary" style={{ padding: '0.85rem 2.5rem', fontSize: 'var(--text-base)' }}>
          Register a Person <ChevronRight size={18} style={{ marginLeft: '6px' }} />
        </button>
      </motion.section>

    </motion.div>
  );
}

function StepCard({ number, icon, title, description }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" style={{ height: '100%', position: 'static' }}>
        <div style={{
          position: 'absolute', top: '-5px', right: '10px',
          fontSize: '6rem', fontWeight: 800, opacity: 0.03,
          color: 'var(--text-primary)', pointerEvents: 'none',
        }}>{number}</div>
        <div style={{
          width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
          background: 'var(--success-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--confirm-green)',
          marginBottom: 'var(--space-4)',
        }}>{icon}</div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{description}</p>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2, scale: 1.01 }}>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-2)', color: 'var(--accent-violet)' }}>
          {icon}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>{title}</span>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </motion.div>
  );
}
