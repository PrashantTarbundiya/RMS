import React from 'react';
import { CreditCard, KeyRound, ShieldAlert, Cpu, Fingerprint, LockKeyhole } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="py-20 px-4 sm:px-6 border-t border-[#262626] bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            Why Old Systems Fail
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Plastic Badges & PIN Codes Don't Verify Real People
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
            ID cards, PINs, and old fingerprint machines can be borrowed, shared, or faked. AuraPass verifies the actual person.
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
                    <h3 className="text-sm font-semibold text-white">Problems with Cards & PINs</h3>
                    <p className="text-[11px] text-zinc-500">Physical cards, shared codes, and fake punches</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  HIGH LOSS
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800/60">
                  <CreditCard className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Lost, Forgotten & Borrowed Cards</span>
                      <span className="text-xs font-mono font-bold text-red-400">Common Issue</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Employees forget cards at home, lose them, or pass them to colleagues at the entrance gate.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800/60">
                  <KeyRound className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Buddy Punching & Fake Attendance</span>
                      <span className="text-xs font-mono font-bold text-red-400">Payroll Leak</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Staff punch cards for friends who are arriving late or absent, causing unearned overtime payouts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Card shown does not mean person is present</span>
              <span className="text-red-400/80">Unverified Attendance</span>
            </div>
          </div>

          {/* Panel 2: AuraPass Face Verification */}
          <div className="p-7 rounded-lg bg-zinc-950/80 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">AuraPass™ Instant Face Verification</h3>
                    <p className="text-[11px] text-zinc-500">Fast, accurate check-in in under 1 second</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% RELIABLE
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-[#262626]">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">100% Private — Runs Inside Your Office</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">100% Local</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Face checks run entirely on your local computer or office network. No photos or attendance data are ever sent to external cloud servers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-md bg-zinc-900/60 border border-[#262626]">
                  <LockKeyhole className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Real Person Check (No Photo Cheating)</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">&gt; 99% Accuracy</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Smart camera checks make sure a real live human is present. Photo cutouts, phone screens, and videos are instantly rejected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Verified attendance with exact timestamps</span>
              <span className="text-emerald-400 font-semibold">100% Accurate Attendance</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
