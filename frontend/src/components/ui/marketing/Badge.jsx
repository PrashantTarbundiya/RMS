import React from 'react';

export default function Badge({ children, variant = 'accent', icon: Icon, className = '' }) {
  const styles = {
    accent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    subtle: 'bg-[#141B2E] text-slate-300 border-white/[0.08]',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono-tag font-semibold tracking-wide uppercase ${styles[variant] || styles.accent} ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  );
}

