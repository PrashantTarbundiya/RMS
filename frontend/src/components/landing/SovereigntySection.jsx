import React from 'react';
import { Cpu, ShieldCheck, Database, Scale, Shield } from 'lucide-react';

const COMPLIANCE_SPECS = [
  {
    icon: Cpu,
    tag: '100% LOCAL',
    title: 'Runs 100% Locally',
    desc: 'Face recognition runs directly on your computer or local network. It never needs an internet connection or cloud server.'
  },
  {
    icon: ShieldCheck,
    tag: 'AES-256',
    title: 'Private Company Encryption',
    desc: 'Your employee attendance records and face templates are locked with bank-grade encryption (AES-256).'
  },
  {
    icon: Database,
    tag: 'TAMPER-PROOF',
    title: 'Clean & Accurate Logs',
    desc: 'Every punch, late check-in, or blocked attempt is safely recorded with date, time, and camera name.'
  },
  {
    icon: Scale,
    tag: 'PRIVACY-READY',
    title: 'Privacy Law Compliant',
    desc: 'Fully adheres to Indian DPDP Act and international biometric data protection rules.'
  }
];

export default function SovereigntySection() {
  return (
    <section id="security" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-xl border border-zinc-800 bg-[#0A0D15] p-8 sm:p-12">
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Data Privacy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Your Employee Data Stays Safely Inside Your Company
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Unlike cloud software that sends your staff photos to external servers, AuraPass runs on your own office computer or local network. No photos or face records ever leave your building.
            </p>
          </div>

          {/* Technical Architecture Specification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPLIANCE_SPECS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 transition-colors flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
