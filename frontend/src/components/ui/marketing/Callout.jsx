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
      border: 'border-white/10 bg-[#0B1013]',
      icon: Info,
      iconColor: 'text-[#9AA7A3]',
      titleColor: 'text-[#F3F6F5]',
    },
    important: {
      border: 'border-[#3DDC97]/30 bg-[#3DDC97]/[0.05]',
      icon: ShieldCheck,
      iconColor: 'text-[#3DDC97]',
      titleColor: 'text-[#3DDC97]',
    },
    warning: {
      border: 'border-white/20 bg-[#10171B]',
      icon: AlertTriangle,
      iconColor: 'text-[#F3F6F5]',
      titleColor: 'text-[#F3F6F5]',
    },
  };

  const config = configs[type] || configs.note;
  const Icon = config.icon;

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border text-sm leading-relaxed my-6 ${config.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 stroke-[1.5] ${config.iconColor}`} />
        <div className="space-y-1">
          {title && (
            <p className={`font-mono text-xs font-semibold tracking-wider uppercase ${config.titleColor}`}>
              {title}
            </p>
          )}
          <div className="text-[#9AA7A3] text-[15px] leading-relaxed font-normal">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
