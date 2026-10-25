import React from 'react';
import { CheckCircle2, Shield, Lock, Server } from 'lucide-react';

export default function SovereigntySection() {
  return (
    <section id="security" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl border border-zinc-800 bg-[#0C1019] p-8 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
              Data Sovereignty
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Complete Control Over Biometric Templates
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
              RMS operates fully within your local environment. Facial portraits and mathematical feature vectors remain exclusively on your host system, ensuring compliance with global privacy regulations without telemetry or external data routing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Local Inference Engine</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">All matching executed on your server with zero external calls</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Encrypted Template Storage</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Vector embeddings are securely isolated per organization</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Audit Trail Logging</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Immutable check-in timestamps and confidence records</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Compliance Ready</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Architecture supports GDPR Article 9 and BIPA guidelines</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
