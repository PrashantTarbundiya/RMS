import React from 'react';

/**
 * Standardized High-Contrast Semantic Badge
 * WCAG AA/AAA compliant across Light and Dark surfaces.
 */
export default function Badge({
  children,
  variant = 'emerald', // 'emerald' | 'zinc' | 'amber' | 'blue' | 'red'
  dot = false,
  icon: Icon,
  className = '',
  ...rest
}) {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    zinc: 'bg-secondary text-foreground border-border',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    blue: 'bg-secondary text-foreground border-border',
    red: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    zinc: 'bg-zinc-400',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium font-mono-tabular tracking-tight ${
        styles[variant] || styles.emerald
      } ${className}`}
      {...rest}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-emerald-500'}`} />}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2]" />}
      <span>{children}</span>
    </span>
  );
}
