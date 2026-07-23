import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Smartphone, Users, Zap } from 'lucide-react';

const heroCards = [
  {
    icon: Shield,
    title: 'Liveness Detection',
    desc: 'Standard spoof filters verify physical presence, checking texture, depth, and illumination keypoints to block photo replicas and deepfake attempts.',
    badge: 'Core Security',
  },
  {
    icon: Lock,
    title: 'Private Tenancy',
    desc: 'RMS supports single-tenant standalone nodes or multi-tenant database contexts, fully isolated for organization protection. Your data never leaves your perimeter.',
    badge: 'Data Sovereignty',
  },
];

const supportCards = [
  {
    icon: Eye,
    title: 'Profile Recognition',
    desc: 'Optimized pose alignment maps features at up to 60° rotation, enabling robust lateral identification.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Sync',
    desc: 'Sync biometrics to local mobile apps. Scan and verify entry logs remotely over secure channels.',
  },
  {
    icon: Users,
    title: 'Automated Feedback',
    desc: 'Continuous learning updates embeddings on-the-fly when operators correct or confirm detections.',
  },
  {
    icon: Zap,
    title: 'Sub-100ms Inference',
    desc: 'MobileNetV2 architecture enables lightning-fast inference on standard CPUs — no GPU required.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 20 } },
};

export default function BentoGrid() {
  return (
    <section id="features" className="landing-section landing-section-bg scroll-mt-20">
      {/* Background image */}
      <div
        className="landing-section-bg-image"
        style={{ backgroundImage: 'url(/bg-features.png)' }}
        aria-hidden="true"
      />
      <div className="landing-section-bg-overlay" aria-hidden="true" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={containerVariants}
        className="max-w-6xl mx-auto relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <motion.p
            className="text-eyebrow text-[#828FFF] mb-4"
            initial={{ opacity: 0, letterSpacing: '4px' }}
            whileInView={{ opacity: 1, letterSpacing: '0.4px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Capabilities
          </motion.p>
          <h2 className="text-display-md text-ink font-display">
            Engineered for the edge.
          </h2>
          <p className="text-body-lg text-ink-subtle mt-4 max-w-2xl mx-auto">
            Built to run reliably on edge environments with minimal resource consumption.
          </p>
        </motion.div>

        {/* Hero cards — large */}
        <div className="bento-hero-row">
          {heroCards.map((card, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -6, borderColor: 'var(--hairline-strong)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bento-hero-card liquid-glass"
            >
              <div className="bento-badge">{card.badge}</div>
              <div className="bento-hero-icon">
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="text-card-title text-ink font-display mb-3">{card.title}</h3>
              <p className="text-body-sm text-ink-subtle m-0 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Support cards — smaller grid */}
        <div className="bento-support-grid">
          {supportCards.map((card, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: 'var(--hairline-strong)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bento-support-card liquid-glass-subtle"
            >
              <div className="bento-support-icon">
                <card.icon className="w-4 h-4" />
              </div>
              <h4 className="text-body font-semibold text-ink font-display mb-1">{card.title}</h4>
              <p className="text-caption text-ink-subtle m-0 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
