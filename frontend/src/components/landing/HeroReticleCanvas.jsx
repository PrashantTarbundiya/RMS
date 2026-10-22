import React, { useEffect, useRef } from 'react';

/**
 * HeroReticleCanvas — Animated SVG reticle grid for the hero section.
 * 
 * Draws a subtle grid with scanning reticle bracket groups. Pure SVG + CSS
 * animation — no Three.js dependency, works without JS for the static state.
 */
export default function HeroReticleCanvas() {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="hero-reticle-canvas" aria-hidden="true">
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hero-reticle-svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background grid lines */}
        <defs>
          <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <line x1="80" y1="0" x2="80" y2="80" stroke="#23252A" strokeWidth="0.5" opacity="0.4" />
            <line x1="0" y1="80" x2="80" y2="80" stroke="#23252A" strokeWidth="0.5" opacity="0.4" />
          </pattern>
          {/* Radial fade-out */}
          <radialGradient id="hero-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-fade-mask">
            <rect width="800" height="600" fill="url(#hero-fade)" />
          </mask>
        </defs>

        {/* Grid with radial fade */}
        <rect width="800" height="600" fill="url(#hero-grid)" mask="url(#hero-fade-mask)" />

        {/* Scanning reticle group 1 — top-left area */}
        <g className="reticle-scan reticle-scan-1">
          <line x1="180" y1="140" x2="200" y2="140" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="180" y1="140" x2="180" y2="160" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="280" y1="140" x2="260" y2="140" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="280" y1="140" x2="280" y2="160" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="180" y1="220" x2="200" y2="220" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="180" y1="220" x2="180" y2="200" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="280" y1="220" x2="260" y2="220" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
          <line x1="280" y1="220" x2="280" y2="200" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.7" />
        </g>

        {/* Scanning reticle group 2 — center-right */}
        <g className="reticle-scan reticle-scan-2">
          <line x1="460" y1="230" x2="480" y2="230" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="460" y1="230" x2="460" y2="250" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="590" y1="230" x2="570" y2="230" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="590" y1="230" x2="590" y2="250" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="460" y1="340" x2="480" y2="340" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="460" y1="340" x2="460" y2="320" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="590" y1="340" x2="570" y2="340" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
          <line x1="590" y1="340" x2="590" y2="320" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* Scanning reticle group 3 — bottom-center */}
        <g className="reticle-scan reticle-scan-3">
          <line x1="320" y1="370" x2="340" y2="370" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="320" y1="370" x2="320" y2="390" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="420" y1="370" x2="400" y2="370" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="420" y1="370" x2="420" y2="390" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="320" y1="450" x2="340" y2="450" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="320" y1="450" x2="320" y2="430" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="420" y1="450" x2="400" y2="450" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
          <line x1="420" y1="450" x2="420" y2="430" stroke="#5E6AD2" strokeWidth="1.5" opacity="0.4" />
        </g>

        {/* Crosshair lines — subtle scan markers */}
        <line x1="395" y1="280" x2="405" y2="280" stroke="#5E6AD2" strokeWidth="0.8" opacity="0.3" className="crosshair-pulse" />
        <line x1="400" y1="275" x2="400" y2="285" stroke="#5E6AD2" strokeWidth="0.8" opacity="0.3" className="crosshair-pulse" />

        {/* Thin rings */}
        <circle cx="400" cy="300" r="120" stroke="#23252A" strokeWidth="0.5" fill="none" opacity="0.3" className="ring-rotate reticle-ring-1" />
        <circle cx="400" cy="300" r="180" stroke="#23252A" strokeWidth="0.3" fill="none" opacity="0.2" className="ring-rotate reticle-ring-2" />
        <circle cx="400" cy="300" r="240" stroke="#5E6AD2" strokeWidth="0.3" fill="none" opacity="0.08" className="ring-rotate reticle-ring-3" />
      </svg>
    </div>
  );
}
