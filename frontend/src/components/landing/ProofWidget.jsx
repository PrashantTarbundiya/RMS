import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGsap } from '../../lib/useGsap';

const scenarios = [
  {
    lines: [
      { tag: 'INPUT', value: 'live_frame_0042.jpg', color: 'subtle' },
      { tag: 'DETECT', value: 'face_bbox [124, 87, 340, 303]', color: 'subtle' },
      { tag: 'LIVENESS', value: 'PASS  (99.4%)', color: 'success' },
      { tag: 'VECTOR', value: '512-d embedding → 0.124, -0.512, 0.991 …', color: 'subtle' },
      { tag: 'MATCH', value: 'Alice_Smith  (cosine: 0.94)', color: 'success' },
      { tag: 'INFERENCE', value: '84.2 ms  ✓', color: 'accent' },
    ],
  },
  {
    lines: [
      { tag: 'INPUT', value: 'live_frame_0117.jpg', color: 'subtle' },
      { tag: 'DETECT', value: 'face_bbox [201, 55, 412, 267]', color: 'subtle' },
      { tag: 'LIVENESS', value: 'FAIL  — spoof detected (printed photo)', color: 'error' },
      { tag: 'VECTOR', value: '— skipped (liveness gate)', color: 'muted' },
      { tag: 'MATCH', value: '— blocked', color: 'error' },
      { tag: 'INFERENCE', value: '31.7 ms  ✗', color: 'error' },
    ],
  },
];

const tagColorMap = {
  subtle: 'proof-val-subtle',
  success: 'proof-val-success',
  error: 'proof-val-error',
  accent: 'proof-val-accent',
  muted: 'proof-val-muted',
};

export default function ProofWidget() {
  const sectionRef = useRef(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const { gsapRef, scrollTriggerRef, ready, prefersReducedMotion } = useGsap();

  const currentScenario = scenarios[scenarioIndex];

  useEffect(() => {
    if (!ready || prefersReducedMotion || !sectionRef.current) {
      setVisibleLines(currentScenario.lines.length);
      return;
    }

    const ScrollTrigger = scrollTriggerRef.current;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 65%',
      end: 'bottom 50%',
      onUpdate: (self) => {
        const progress = self.progress;
        const totalLines = currentScenario.lines.length;
        const count = Math.min(Math.floor(progress * (totalLines + 1)), totalLines);
        setVisibleLines(count);
      },
    });

    return () => trigger.kill();
  }, [ready, prefersReducedMotion, scenarioIndex]);

  // Cycle scenarios
  useEffect(() => {
    const interval = setInterval(() => {
      setScenarioIndex((prev) => (prev + 1) % scenarios.length);
      setVisibleLines(0);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="landing-section landing-section-bg">
      {/* Background image */}
      <div
        className="landing-section-bg-image"
        style={{ backgroundImage: 'url(/bg-proof.png)' }}
        aria-hidden="true"
      />
      <div className="landing-section-bg-overlay" aria-hidden="true" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p
            className="text-eyebrow text-[#828FFF] mb-4"
            initial={{ opacity: 0, letterSpacing: '4px' }}
            whileInView={{ opacity: 1, letterSpacing: '0.4px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Live Proof
          </motion.p>
          <motion.h2
            className="text-display-md text-ink font-display"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Real inference. Real time.
          </motion.h2>
          <motion.p
            className="text-body-lg text-ink-subtle mt-4 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Watch the recognition pipeline process a frame — from detection to identity match.
          </motion.p>
        </div>

        <motion.div
          className="proof-terminal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="proof-terminal-header">
            <div className="proof-terminal-dots">
              <span className="proof-dot proof-dot-red" />
              <span className="proof-dot proof-dot-yellow" />
              <span className="proof-dot proof-dot-green" />
            </div>
            <span className="proof-terminal-title">rms-inference — biometric pipeline</span>
            <div className="proof-scenario-indicator">
              {scenarios.map((_, i) => (
                <span
                  key={i}
                  className={`proof-scenario-dot ${i === scenarioIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="proof-terminal-body">
            {currentScenario.lines.map((line, i) => (
              <div
                key={`${scenarioIndex}-${i}`}
                className={`proof-line ${i < visibleLines ? 'proof-line-visible' : 'proof-line-hidden'}`}
              >
                <span className="proof-tag">[{line.tag}]</span>
                <span className={`proof-value ${tagColorMap[line.color] || ''}`}>
                  {line.value}
                </span>
              </div>
            ))}
            {/* Blinking cursor */}
            <div className="proof-cursor">
              <span className="proof-cursor-blink">▌</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
