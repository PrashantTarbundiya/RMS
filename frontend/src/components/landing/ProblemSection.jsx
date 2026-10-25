import React from 'react';
import { CreditCard, KeyRound, ShieldAlert, Cpu, Fingerprint, LockKeyhole } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Perimeter Security Audit
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Traditional Credentials Fail at Point-of-Entry Identity Verification
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
            Proximity badges, magnetic keycards, and PIN keypads validate physical tokens, not actual human identity.
          </p>
        </div>

        {/* 2-Column Comparative Analysis Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: Legacy Credential Attack Surface */}
          <div className="p-7 rounded-lg bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Legacy Credential Vulnerabilities</h3>
                    <p className="text-[11px] text-zinc-500">Physical tokens, shared codes, and unverified badges</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  HIGH EXPOSURE
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800/60">
                  <CreditCard className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Badge Cloning & Unverified Loaners</span>
                      <span className="text-xs font-mono font-bold text-red-400">62% Risk</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      RFID cards are routinely forgotten, cloned with cheap hardware, or passed to unauthorized personnel without biometric verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800/60">
                  <KeyRound className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Buddy Punching & PIN Code Sharing</span>
                      <span className="text-xs font-mono font-bold text-red-400">47% Rate</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Shift workers informally share keypad access codes and badges, corrupting payroll hours and leaving unverified blind spots in entry logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Failure Mode: Token custody != Human identity</span>
              <span className="text-red-400/80">Audit Inconclusive</span>
            </div>
          </div>

          {/* Panel 2: RMS Cryptographic Edge Attestation */}
          <div className="p-7 rounded-lg bg-zinc-950/80 border border-blue-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">RMS Non-Repudiable Biometric Attestation</h3>
                    <p className="text-[11px] text-zinc-500">Local sub-second feature vector verification</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ZERO CLOUD RISK
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-blue-950/60">
                  <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Air-Gapped On-Premise Inference</span>
                      <span className="text-xs font-mono font-bold text-blue-400">100% Local</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Facial feature embeddings are extracted, aligned, and matched strictly on local host compute. No raw portraits or templates leave your perimeter.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-blue-950/60">
                  <LockKeyhole className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Multi-Angle Pose & Anti-Spoof Liveness</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">&lt; 0.01% FAR</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Deep texture and specular reflectance analysis blocks printed photos and digital screens while maintaining seamless natural motion recognition.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Attestation: Cryptographic vector match</span>
              <span className="text-emerald-400 font-semibold">Immutable Audit Trail</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
