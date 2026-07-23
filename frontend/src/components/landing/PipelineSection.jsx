import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Brain, Zap } from 'lucide-react';
import { useGsap } from '../../lib/useGsap';

const steps = [
  {
    num: '01',
    icon: Camera,
    title: 'Multi-Angle Enrollment',
    desc: 'Upload frontal and side-profile photos. The automated pre-processor cleans images, aligns facial landmarks, and caches crops locally.',
  },
  {
    num: '02',
    icon: Brain,
    title: 'Hybrid Model Training',
    desc: 'Train two model architectures concurrently: high-dimensional embeddings alongside a customized, lightweight MobileNetV2 network — both on your hardware.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Ensemble Consensus',
    desc: 'Inference compares vectors across both classifiers, validating spoof liveness and resolving true match identities in milliseconds.',
  },
];

const eyebrowVariants = {
  hidden: { opacity: 0, letterSpacing: '4px' },
  visible: { opacity: 1, letterSpacing: '0.4px', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function PipelineSection() {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);
  const stepRefs = useRef([]);
  const { gsapRef, scrollTriggerRef, ready, prefersReducedMotion } = useGsap();

  useEffect(() => {
    if (!ready || prefersReducedMotion || !sectionRef.current) return;

    const gsap = gsapRef.current;
    const ctx = gsap.context(() => {
      // Draw the connecting line
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              end: 'bottom 70%',
              scrub: 0.5,
            },
          }
        );
      }

      // Stagger step cards with slide + fade
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, x: -40, scale: 0.96 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 82%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [ready, prefersReducedMotion]);

  return (
    <section id="how-it-works" ref={sectionRef} className="landing-section landing-section-bg scroll-mt-20">
      {/* Background image */}
      <div
        className="landing-section-bg-image"
        style={{ backgroundImage: 'url(/bg-pipeline.png)' }}
        aria-hidden="true"
      />
      <div className="landing-section-bg-overlay" aria-hidden="true" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.p
            className="text-eyebrow text-[#828FFF] mb-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={eyebrowVariants}
          >
            How It Works
          </motion.p>
          <motion.h2
            className="text-display-md text-ink font-display"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Three stages. Zero cloud dependency.
          </motion.h2>
          <motion.p
            className="text-body-lg text-ink-subtle mt-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            RMS processes identities through an integrated pipeline — enrollment, training, and inference all happen on your infrastructure.
          </motion.p>
        </div>

        <div className="pipeline-track">
          {/* Connecting line */}
          <div className="pipeline-line-container">
            <div
              ref={lineRef}
              className="pipeline-line"
              style={prefersReducedMotion ? { transform: 'scaleY(1)' } : { transformOrigin: 'top center' }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, i) => (
            <div
              key={i}
              ref={(el) => (stepRefs.current[i] = el)}
              className="pipeline-step"
              style={prefersReducedMotion ? { opacity: 1 } : {}}
            >
              {/* Node dot */}
              <div className="pipeline-node">
                <div className="pipeline-node-dot" />
              </div>

              {/* Card */}
              <div className="pipeline-card liquid-glass">
                <div className="pipeline-card-num">{step.num}</div>
                <div className="pipeline-card-icon">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="text-card-title text-ink font-display mb-2">{step.title}</h3>
                <p className="text-body-sm text-ink-subtle m-0">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
