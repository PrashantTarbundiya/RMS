import React from 'react';

/**
 * High-Precision AuraPass™ Enterprise Brand Logo Component
 * Renders the official biometric aperture & sovereign shield emblem.
 */
export default function AuraPassLogo({ size = 32, className = '', showText = false, textClassName = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        style={{ width: size, height: size }} 
        className="rounded-xl overflow-hidden shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)] border border-emerald-500/30 bg-[#0B0F14] flex items-center justify-center relative group"
      >
        <img
          src="/logo.svg"
          alt="AuraPass Enterprise Logo"
          width={size}
          height={size}
          className="w-full h-full object-cover select-none pointer-events-none"
          onError={(e) => {
            // Fallback to embedded SVG if asset fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-foreground ${textClassName || 'text-base'}`}>
            AuraPass
          </span>
          <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Enterprise
          </span>
        </div>
      )}
    </div>
  );
}

