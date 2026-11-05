import React from 'react';
import { Info, AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * Technical Callout Component
 * Supported types:
 * - note: subtle neutral container for architectural context
 * - important: emerald-accented container for operational requirements
 * - warning: high-contrast container for potential operational hazards
 */
export default function Callout({
  type = 'note', // 'note' | 'important' | 'warning'
  title,
  children,
  className = '',
}) {
  const configs = {
    note: {
      border: 'border-border bg-secondary/50',
      icon: Info,
      iconColor: 'text-muted-foreground',
      titleColor: 'text-foreground',
    },
    important: {
      border: 'border-emerald-500/30 bg-emerald-500/10',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      titleColor: 'text-emerald-700 dark:text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/30 bg-amber-500/10',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-700 dark:text-amber-400',
    },
  };

  const config = configs[type] || configs.note;
  const Icon = config.icon;

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border text-xs sm:text-sm leading-relaxed my-6 ${config.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 stroke-[2] ${config.iconColor}`} />
        <div className="space-y-1 w-full">
          {title && (
            <p className={`font-mono text-xs font-semibold tracking-wider uppercase ${config.titleColor}`}>
              {title}
            </p>
          )}
          <div className="text-muted-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
