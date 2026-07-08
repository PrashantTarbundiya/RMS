import React from 'react'
import { Link } from 'react-router-dom'
import { Camera, Users, Brain, Smartphone, Shield, Zap, ChevronRight, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>

      {/* ── HERO SECTION ── */}
      <section className="animate-fade-in" style={{
        textAlign: 'center',
        padding: '4rem 0 3rem',
        position: 'relative',
      }}>
        {/* Decorative gradient blobs */}
        <div style={{
          position: 'absolute', top: '-50px', left: '20%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '-30px', right: '15%', width: '250px', height: '250px',
          background: 'radial-gradient(circle, rgba(52,211,153,0.12), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="animate-float" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '9999px', padding: '6px 16px', marginBottom: '1.5rem',
            fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-light)',
          }}>
            <Zap size={14} /> Side-Face Recognition Powered by 3 AI Models
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '800',
            lineHeight: '1.15',
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
          }}>
            <span style={{ color: 'var(--text-primary)' }}>Intelligent Face</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #10B981, #059669, #34D399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Recognition Platform
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px',
            margin: '0 auto 2rem', lineHeight: '1.7',
          }}>
            Train custom face recognition models with just a few photos. Works with side-face profiles,
            runs inference across three models simultaneously, and deploys to web and mobile.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-primary hover-btn" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/support" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="animate-slide-up" style={{ margin: '3rem 0' }}>
        <h2 style={{
          textAlign: 'center', fontSize: '1.8rem', fontWeight: '700',
          letterSpacing: '-0.02em', marginBottom: '0.5rem',
        }}>How It Works</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          Three simple steps to train and deploy your own face recognition system
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          <StepCard
            number="01"
            icon={<Camera size={28} />}
            title="Upload Face Photos"
            description="Upload frontal, left, and right profile images of each person. The system accepts 1-20 photos per person."
          />
          <StepCard
            number="02"
            icon={<Brain size={28} />}
            title="Train Models"
            description="Three models train simultaneously: DeepFace embeddings, Custom CNN, and SOTA MobileNetV2 — optimized for side-face profiles."
          />
          <StepCard
            number="03"
            icon={<Zap size={28} />}
            title="Recognize Faces"
            description="Use the webcam or upload images to identify faces. An ensemble system combines all 3 models for maximum accuracy."
          />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="animate-slide-up" style={{ margin: '4rem 0' }}>
        <h2 style={{
          textAlign: 'center', fontSize: '1.8rem', fontWeight: '700',
          letterSpacing: '-0.02em', marginBottom: '0.5rem',
        }}>Platform Features</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          Built for accuracy, speed, and ease of use
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          <FeatureCard icon={<Brain size={22} />} title="3-Model Ensemble" desc="Combines DeepFace, CNN, and MobileNetV2 predictions for higher accuracy with weighted voting." />
          <FeatureCard icon={<Camera size={22} />} title="Side-Face Support" desc="Specialized for profile/side-face detection using MediaPipe BlazeFace and custom augmentation." />
          <FeatureCard icon={<Smartphone size={22} />} title="Mobile App" desc="React Native mobile app with live camera recognition. Connect to your server over WiFi." />
          <FeatureCard icon={<Users size={22} />} title="Multi-Person" desc="Register unlimited people. Each person can have multiple face angles for better accuracy." />
          <FeatureCard icon={<Zap size={22} />} title="Real-Time" desc="Fast inference on CPU. MobileNetV2 runs predictions in under 100ms on modern hardware." />
          <FeatureCard icon={<Shield size={22} />} title="Offline Capable" desc="All processing happens locally. No cloud dependency, no data leaves your network." />
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="glass-panel hover-scale" style={{
        padding: '3rem', textAlign: 'center', marginTop: '2rem',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(52,211,153,0.05))',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Ready to start recognizing faces?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          Upload photos of the people you want to recognize, train the models, and start testing in minutes.
        </p>
        <Link to="/upload" className="btn btn-primary hover-btn" style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}>
          Register a Person <ChevronRight size={18} />
        </Link>
      </section>
    </div>
  )
}

function StepCard({ number, icon, title, description }) {
  return (
    <div className="glass-panel hover-scale animate-fade-in" style={{
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-10px', right: '-5px',
        fontSize: '5rem', fontWeight: '800', opacity: 0.04,
        color: 'var(--primary)',
      }}>{number}</div>
      <div style={{
        width: '52px', height: '52px', borderRadius: 'var(--radius-md)',
        background: 'rgba(16, 185, 129, 0.08)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)',
        marginBottom: '1rem',
      }}>{icon}</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{description}</p>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="hover-scale" style={{
      padding: '1.25rem', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', background: 'var(--bg-card)',
      transition: 'all 0.25s var(--ease)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem',
        color: 'var(--primary-light)',
      }}>
        {icon}
        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{title}</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{desc}</p>
    </div>
  )
}
