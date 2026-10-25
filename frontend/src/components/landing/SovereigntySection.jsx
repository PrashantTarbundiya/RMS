import React from 'react';
import { Cpu, ShieldCheck, Database, Scale, Shield } from 'lucide-react';

const COMPLIANCE_SPECS = [
  {
    icon: Cpu,
    tag: 'LOCAL-COMPUTE',
    title: 'Air-Gapped Local Inference',
    desc: 'All neural backbone extraction and cosine similarity matching executes strictly on your server compute with zero telemetry or outbound traffic.'
  },
  {
    icon: ShieldCheck,
    tag: 'AES-GCM-256',
    title: 'Cryptographic Vector Isolation',
    desc: 'Biometric embeddings are encrypted at rest and separated into isolated organization namespaces to guarantee zero cross-tenant contamination.'
  },
  {
    icon: Database,
    tag: 'APPEND-ONLY',
    title: 'Immutable Audit Trail',
    desc: 'Every access granted or spoof attempt creates a tamper-resistant record with hardware timestamps, camera identifiers, and confidence values.'
  },
  {
    icon: Scale,
    tag: 'GDPR-ART-9',
    title: 'Global Compliance Governance',
    desc: 'Designed around GDPR Article 9 special category data requirements and Illinois BIPA standards with customizable data retention policies.'
  }
];

export default function SovereigntySection() {
  return (
    <section id="security" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-xl border border-zinc-800 bg-[#0A0D15] p-8 sm:p-12">
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Biometric Data Sovereignty</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Complete Control Over Biometric Templates & Personnel Data
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Unlike cloud biometric vendors that transmit sensitive human identity markers across public networks, RMS retains all raw images and mathematical vectors within your secured perimeter.
            </p>
          </div>

          {/* Technical Architecture Specification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPLIANCE_SPECS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 transition-colors flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
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
