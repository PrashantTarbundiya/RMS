import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, KeyRound, Cloud } from 'lucide-react';

const beats = [
  {
    icon: CreditCard,
    stat: '62%',
    label: 'of badge-based breaches',
    line: 'Physical cards get stolen, cloned, and passed around — your perimeter only knows the badge, not the person.',
  },
  {
    icon: KeyRound,
    stat: '47%',
    label: 'of employees share PINs',
    line: 'PINs and passwords are shared routinely. Every shared credential is a security hole you can\'t audit.',
  },
  {
    icon: Cloud,
    stat: '$2.4M',
    label: 'avg. cloud biometric breach',
    line: 'Cloud recognition sends your most sensitive data — faces — to servers you don\'t control, in jurisdictions you didn\'t choose.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 22 } },
};

export default function ProblemSection() {
  return (
    <section className="landing-section landing-section-bg">
      {/* Background image */}
      <div
        className="landing-section-bg-image"
        style={{ backgroundImage: 'url(/bg-problem.png)' }}
        aria-hidden="true"
      />
      <div className="landing-section-bg-overlay" aria-hidden="true" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={containerVariants}
        className="max-w-5xl mx-auto relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <motion.p
            className="text-eyebrow text-[#828FFF] mb-4"
            initial={{ opacity: 0, letterSpacing: '4px' }}
            whileInView={{ opacity: 1, letterSpacing: '0.4px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            The Problem
          </motion.p>
          <h2 className="text-display-md text-ink font-display">
            Legacy access control is a<br />
            <span className="text-ink-subtle">liability, not a system.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {beats.map((beat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -6, borderColor: 'var(--hairline-strong)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="problem-beat-card liquid-glass"
            >
              <div className="problem-beat-icon">
                <beat.icon className="w-5 h-5" />
              </div>
              <div className="problem-beat-stat">{beat.stat}</div>
              <div className="problem-beat-label">{beat.label}</div>
              <p className="problem-beat-line">{beat.line}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
