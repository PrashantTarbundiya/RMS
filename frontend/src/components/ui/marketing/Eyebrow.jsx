import React from 'react';

/**
 * Eyebrow / Technical Tag Component
 * Used exclusively for small category indicators, phase numbers, and subsystem telemetry.
 * Mono font, weight 500, letter-spacing 0.04em.
 */
export default function Eyebrow({
  children,
  variant = 'emerald', // 'emerald' | 'neutral' | 'danger'
  icon: Icon,
  className = '',
}) {
  const variants = {
    emerald: 'text-[#3DDC97] bg-[#3DDC97]/10 border-[#3DDC97]/25',
    neutral: 'text-[#9AA7A3] bg-white/[0.04] border-white/10',
    danger: 'text-[#FF6B6B] bg-[#FF6B6B]/10 border-[#FF6B6B]/25',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono tracking-wider uppercase select-none ${
        variants[variant] || variants.emerald
      } ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0 stroke-[1.5]" />}
      <span>{children}</span>
    </span>
  );
}

