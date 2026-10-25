import React from 'react';

/**
 * HeroReticleCanvas - Static technical grid background for the hero section.
 * Clean, lightweight architectural coordinate grid with zero distracting animations.
 */
export default function HeroReticleCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40" aria-hidden="true">
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
      >
        <defs>
          <pattern id="static-tech-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <line x1="60" y1="0" x2="60" y2="60" stroke="#1E293B" strokeWidth="0.75" />
            <line x1="0" y1="60" x2="60" y2="60" stroke="#1E293B" strokeWidth="0.75" />
          </pattern>
          <radialGradient id="fade-mask" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="60%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-mask">
            <rect width="1200" height="800" fill="url(#fade-mask)" />
          </mask>
        </defs>

        {/* Static Background Grid */}
        <rect width="1200" height="800" fill="url(#static-tech-grid)" mask="url(#hero-mask)" />

        {/* Minimal Corner Calibration Markers */}
        <g stroke="#334155" strokeWidth="1" opacity="0.6">
          <path d="M200 150h30v30" fill="none" />
          <path d="M1000 150h-30v30" fill="none" />
          <path d="M200 650h30v-30" fill="none" />
          <path d="M1000 650h-30v-30" fill="none" />
        </g>
      </svg>
    </div>
  );
}
