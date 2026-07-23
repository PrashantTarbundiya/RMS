import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, CloudOff, Server } from 'lucide-react';
import { useGsap } from '../../lib/useGsap';

export default function SovereigntySection() {
  const sectionRef = useRef(null);
  const diagramRef = useRef(null);
  const { gsapRef, ready, prefersReducedMotion } = useGsap();

  useEffect(() => {
    if (!ready || prefersReducedMotion || !diagramRef.current) return;
    const gsap = gsapRef.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.airgap-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: diagramRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        '.cloud-strike',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.4,
          delay: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: diagramRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [ready, prefersReducedMotion]);

  return (
    <section id="security" ref={sectionRef} className="landing-section landing-section-bg scroll-mt-20">
      {/* Background image */}
      <div
        className="landing-section-bg-image"
        style={{ backgroundImage: 'url(/bg-sovereignty.png)' }}
        aria-hidden="true"
      />
      <div className="landing-section-bg-overlay" aria-hidden="true" />

      <motion.div
        className="sovereignty-container liquid-glass-strong relative z-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="sovereignty-content">
          <motion.p
            className="text-eyebrow text-[#828FFF] mb-4"
            initial={{ opacity: 0, letterSpacing: '4px' }}
            whileInView={{ opacity: 1, letterSpacing: '0.4px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Security & Sovereignty
          </motion.p>
          <h2 className="text-display-md text-ink font-display mb-6">
            100% Data Sovereignty.
          </h2>
          <p className="text-body-lg text-ink-subtle mb-8 max-w-xl">
            RMS operates fully offline, storing images and neural vector embeddings
            securely within your localized workspace. Biometric parameters, attendance logs,
            and camera captures remain under your exclusive control.
          </p>
          <ul className="sovereignty-checklist">
            <li>
              <CheckCircle2 className="w-4 h-4 text-[#27A644] shrink-0" />
              <span>Zero external server communication</span>
            </li>
            <li>
              <CheckCircle2 className="w-4 h-4 text-[#27A644] shrink-0" />
              <span>Secure file hashing and database constraints</span>
            </li>
            <li>
              <CheckCircle2 className="w-4 h-4 text-[#27A644] shrink-0" />
              <span>Compliance-ready architecture (GDPR / BIPA)</span>
            </li>
          </ul>
        </div>

        {/* Air gap diagram */}
        <div ref={diagramRef} className="sovereignty-diagram">
          <div className="sovereignty-node sovereignty-local">
            <Server className="w-6 h-6 text-[#828FFF]" />
            <span className="sovereignty-node-label">Your Infrastructure</span>
            <div className="sovereignty-node-sub">
              <span>Models</span>
              <span>Embeddings</span>
              <span>Logs</span>
            </div>
          </div>

          <div className="sovereignty-airgap">
            <div
              className="airgap-line"
              style={prefersReducedMotion ? { transform: 'scaleX(1)' } : { transformOrigin: 'center' }}
            />
            <span className="airgap-label">Air Gap</span>
          </div>

          <div className="sovereignty-node sovereignty-cloud">
            <div className="sovereignty-cloud-icon-wrapper">
              <CloudOff className="w-6 h-6 text-ink-muted" />
              <div
                className="cloud-strike"
                style={prefersReducedMotion ? { transform: 'scaleX(1)' } : { transformOrigin: 'center' }}
              />
            </div>
            <span className="sovereignty-node-label" style={{ color: 'var(--ink-muted)' }}>External Cloud</span>
            <span className="sovereignty-blocked-tag">Blocked</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
