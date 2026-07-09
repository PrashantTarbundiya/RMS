import React from 'react'
import { Link } from 'react-router-dom'
import { Camera, Users, Brain, Smartphone, Shield, Zap, ChevronRight, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function LandingPage() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ paddingBottom: '4rem' }}
    >

      {/* ── HERO SECTION ── */}
      <motion.section variants={itemVariants} style={{
        textAlign: 'center',
        padding: '5rem 0 4rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Decorative gradient blobs */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.2, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute', top: '-50px', left: '20%', width: '350px', height: '350px',
            background: 'radial-gradient(circle, var(--primary), transparent 70%)',
            filter: 'blur(70px)', pointerEvents: 'none',
          }} 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{
            position: 'absolute', top: '-30px', right: '15%', width: '300px', height: '300px',
            background: 'radial-gradient(circle, var(--info), transparent 70%)',
            filter: 'blur(70px)', pointerEvents: 'none',
          }} 
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%' }}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '9999px', padding: '6px 16px', marginBottom: '1.5rem',
              fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-light)',
            }}>
            <Zap size={14} /> Side-Face Recognition Powered by 3 AI Models
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
          }}>
            <span style={{ color: 'var(--text-primary)' }}>Intelligent Face</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary-light), var(--info))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Recognition Platform
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px',
            margin: '0 auto 2.5rem', lineHeight: '1.7',
          }}>
            Train custom face recognition models with just a few photos. Works with side-face profiles,
            runs inference across three models simultaneously, and deploys to web and mobile seamlessly.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/upload" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', boxShadow: 'var(--shadow-glow)' }}>
                Get Started <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/support" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', background: 'var(--bg-elevated)' }}>
                Learn How It Works
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ── */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} style={{ margin: '5rem 0 3rem' }}>
        <motion.h2 variants={itemVariants} style={{
          textAlign: 'center', fontSize: '2rem', fontWeight: '700',
          letterSpacing: '-0.02em', marginBottom: '0.5rem',
        }}>How It Works</motion.h2>
        <motion.p variants={itemVariants} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          Three simple steps to train and deploy your own face recognition system
        </motion.p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
        }}>
          <StepCard
            number="01"
            icon={<Camera size={28} />}
            title="Upload Face Photos"
            description="Upload frontal, left, and right profile images of each person. The system intelligently detects faces and accepts 1-20 photos per person."
            delay={0.1}
          />
          <StepCard
            number="02"
            icon={<Brain size={28} />}
            title="Train Models"
            description="Three models train simultaneously: DeepFace embeddings, Custom CNN, and SOTA MobileNetV2 — optimized for side-face profiles."
            delay={0.2}
          />
          <StepCard
            number="03"
            icon={<Zap size={28} />}
            title="Recognize Faces"
            description="Use the webcam or upload images to identify faces. An advanced ensemble system combines all 3 models for maximum accuracy."
            delay={0.3}
          />
        </div>
      </motion.section>

      {/* ── FEATURES ── */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} style={{ margin: '6rem 0 4rem' }}>
        <motion.h2 variants={itemVariants} style={{
          textAlign: 'center', fontSize: '2rem', fontWeight: '700',
          letterSpacing: '-0.02em', marginBottom: '0.5rem',
        }}>Platform Features</motion.h2>
        <motion.p variants={itemVariants} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          Built for accuracy, speed, and seamless integration
        </motion.p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          <FeatureCard icon={<Brain size={22} />} title="3-Model Ensemble" desc="Combines DeepFace, CNN, and MobileNetV2 predictions for higher accuracy with weighted voting." delay={0.1} />
          <FeatureCard icon={<Camera size={22} />} title="Side-Face Support" desc="Specialized for profile/side-face detection using MediaPipe BlazeFace and custom data augmentation." delay={0.2} />
          <FeatureCard icon={<Smartphone size={22} />} title="Mobile App" desc="React Native mobile app with live camera recognition. Connect directly to your local server over WiFi." delay={0.3} />
          <FeatureCard icon={<Users size={22} />} title="Multi-Person" desc="Register unlimited people. Each person can have multiple face angles for highly robust accuracy." delay={0.4} />
          <FeatureCard icon={<Zap size={22} />} title="Real-Time" desc="Fast inference on CPU. MobileNetV2 runs predictions in under 100ms on standard modern hardware." delay={0.5} />
          <FeatureCard icon={<Shield size={22} />} title="Offline Capable" desc="All processing happens locally. No cloud dependency, ensuring no sensitive data ever leaves your network." delay={0.6} />
        </div>
      </motion.section>

      {/* ── CTA SECTION ── */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: '4rem 3rem', textAlign: 'center', marginTop: '4rem',
          background: 'var(--gradient-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
        <div style={{
          position: 'absolute', top: '0', left: '0', right: '0', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--primary-light), transparent)'
        }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1rem' }}>
          Ready to start recognizing faces?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem', fontSize: '1.05rem' }}>
          Upload photos of the people you want to recognize, train the ensemble models, and start testing in minutes.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
          <Link to="/upload" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem', boxShadow: 'var(--shadow-glow)' }}>
            Register a Person <ChevronRight size={18} />
          </Link>
        </motion.div>
      </motion.section>
    </motion.div>
  )
}

function StepCard({ number, icon, title, description, delay }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -8, boxShadow: 'var(--shadow-lg)' }}
      className="glass-panel" 
      style={{
        padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)'
      }}>
      <div style={{
        position: 'absolute', top: '-5px', right: '10px',
        fontSize: '6rem', fontWeight: '800', opacity: 0.03,
        color: 'var(--text-primary)',
        pointerEvents: 'none',
      }}>{number}</div>
      <div style={{
        width: '56px', height: '56px', borderRadius: 'var(--radius-lg)',
        background: 'var(--success-bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)',
        marginBottom: '1.5rem',
      }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{description}</p>
    </motion.div>
  )
}

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ 
        y: -4, 
        borderColor: 'rgba(16, 185, 129, 0.4)',
        backgroundColor: 'var(--bg-card-hover)',
        boxShadow: 'var(--shadow-md)'
      }}
      style={{
        padding: '1.5rem', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', background: 'var(--bg-card)',
        transition: 'background-color 0.2s',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem',
        color: 'var(--primary-light)',
      }}>
        {icon}
        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{title}</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{desc}</p>
    </motion.div>
  )
}
