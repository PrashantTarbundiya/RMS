import React from 'react';

/**
 * High-Precision AuraPass™ Enterprise Brand Logo Component
 * Renders the clean standalone biometric aperture & sovereign gateway emblem.
 */
export default function AuraPassLogo({ size = 28, className = '', showText = false, textClassName = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.svg"
        alt="AuraPass Enterprise Logo"
        width={size}
        height={size}
        className="object-contain select-none pointer-events-none drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]"
      />

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
