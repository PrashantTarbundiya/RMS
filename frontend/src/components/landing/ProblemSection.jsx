import React from 'react';
import { CreditCard, KeyRound, Cloud } from 'lucide-react';

const beats = [
  {
    icon: CreditCard,
    stat: '62%',
    label: 'Physical Badge Vulnerabilities',
    line: 'Physical keycards get lost, cloned, or shared between staff. Your perimeter only validates the badge, not the actual person carrying it.',
  },
  {
    icon: KeyRound,
    stat: '47%',
    label: 'Credential Sharing Rate',
    line: 'PINs and entry codes are shared informally across shifts. Shared credentials create blind spots in your physical security audit trail.',
  },
  {
    icon: Cloud,
    stat: 'Zero',
    label: 'External Cloud Risk',
    line: 'Cloud biometric services send sensitive facial templates across the public internet. RMS processes every frame on-premise without external routing.',
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Operational Challenges
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Traditional Access Control Leaves Gaps in Verification
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Manual sign-in sheets and proximity cards fail to verify identity at the point of entry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {beats.map((beat, i) => (
            <div
              key={i}
              className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
                <beat.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-white mb-1">
                {beat.stat}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {beat.label}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {beat.line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
