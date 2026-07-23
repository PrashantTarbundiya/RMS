import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGsap } from '../../lib/useGsap';

const stats = [
  { value: 84, suffix: 'ms', label: 'Average inference time', detail: 'On standard CPU, no GPU required' },
  { value: 60, suffix: '°', label: 'Supported rotation angle', detail: 'Side-profile recognition built in' },
  { value: 512, suffix: '-d', label: 'Embedding dimensions', detail: 'High-fidelity identity vectors' },
  { value: 3, suffix: '', label: 'Minimum training photos', detail: 'Frontal + left + right profile' },
];

function CountUpStat({ target, suffix, label, detail, shouldAnimate }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 1400;
          const step = target / (duration / 16);
          let raf;

          function tick() {
            start += step;
            if (start >= target) {
              setCount(target);
              return;
            }
            setCount(Math.floor(start));
            raf = requestAnimationFrame(tick);
          }

          tick();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [target, shouldAnimate]);

  return (
    <motion.div
      ref={ref}
      className="stat-card"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      whileHover={{ y: -4, borderColor: 'var(--hairline-strong)' }}
    >
      <div className="stat-number">
        {count}
        <span className="stat-suffix">{suffix}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-detail">{detail}</div>
    </motion.div>
  );
}

export default function StatsSection() {
  const { prefersReducedMotion } = useGsap();

  return (
    <section className="landing-section landing-section-bg">
      {/* Background image */}
      <div
        className="landing-section-bg-image"
        style={{ backgroundImage: 'url(/bg-stats.png)' }}
        aria-hidden="true"
      />
      <div className="landing-section-bg-overlay" aria-hidden="true" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p
            className="text-eyebrow text-[#828FFF] mb-4"
            initial={{ opacity: 0, letterSpacing: '4px' }}
            whileInView={{ opacity: 1, letterSpacing: '0.4px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Engineering Commitments
          </motion.p>
          <motion.h2
            className="text-display-md text-ink font-display"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Real numbers, not marketing.
          </motion.h2>
          <motion.p
            className="text-body-lg text-ink-subtle mt-4 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Verified engineering specifications — every number below is tested and reproducible on standard hardware.
          </motion.p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, i) => (
            <CountUpStat
              key={i}
              target={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              detail={stat.detail}
              shouldAnimate={!prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
