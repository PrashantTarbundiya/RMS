import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function Callout({ type = 'info', title, children, className = '' }) {
  const configs = {
    info: {
      border: 'border-l-4 border-l-cyan-400 border-white/[0.08] bg-[#0A1220]',
      icon: Info,
      iconColor: 'text-cyan-400',
      titleColor: 'text-cyan-300',
    },
    success: {
      border: 'border-l-4 border-l-emerald-400 border-white/[0.08] bg-emerald-950/20',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300',
    },
    warning: {
      border: 'border-l-4 border-l-amber-400 border-white/[0.08] bg-amber-950/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
    },
    danger: {
      border: 'border-l-4 border-l-rose-500 border-white/[0.08] bg-rose-950/20',
      icon: AlertOctagon,
      iconColor: 'text-rose-400',
      titleColor: 'text-rose-300',
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed my-4 ${config.border} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="space-y-1">
          {title && (
            <p className={`font-semibold tracking-wide uppercase text-[11px] font-mono-tag ${config.titleColor}`}>
              {title}
            </p>
          )}
          <div className="text-slate-300 leading-relaxed font-normal">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

