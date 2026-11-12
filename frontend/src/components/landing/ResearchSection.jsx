import React from 'react';
import { Cpu, ShieldCheck, FileText, Lock, Zap, Award, Layers } from 'lucide-react';

export default function ResearchSection() {
  return (
    <section id="research" className="py-20 md:py-28 bg-[#0E0E10] border-b border-[#262626] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14 pb-6 border-b border-[#202022]">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PEER-REVIEWED SCIENTIFIC FOUNDATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
              Biometric AI & Privacy Research Architecture
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md md:text-right leading-relaxed">
            Our multi-model routing pipeline is built upon rigorous computer vision benchmarks, anti-spoof liveness testing, and cryptographic non-invertibility.
          </p>
        </div>

        {/* 3 Scientific Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#121214] border border-[#262626] space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
              BENCHMARK CITATION
            </span>
            <h3 className="text-base font-bold text-white">
              Multi-Backbone Consensus Routing
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard recognition models degrade when staff walk past cameras at side angles. AuraPass uses dynamic landmark angle extraction to route frontal faces to FaceNet-512 (99.65% LFW) and angled views (up to 45°) to InsightFace ArcFace (99.83% CFP-FP).
            </p>
            <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-[#1e1e20]">
              Validated on LFW, CFP-FP & AgeDB-30 datasets
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#121214] border border-[#262626] space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
              LIVENESS DEFENSE
            </span>
            <h3 className="text-base font-bold text-white">
              ISO/IEC 30107-3 PAD Compliance
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Presentation attacks (printed photos, iPad video replays, curved silicone masks) are detected in under 9 milliseconds via MiniVision CNN. Micro-texture gradient analysis and specular illumination reflection reject spoof attempts without requiring users to blink.
            </p>
            <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-[#1e1e20]">
              Conforms to Level A & Level B Presentation Attack Detection
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#121214] border border-[#262626] space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold">
              DATA SOVEREIGNTY
            </span>
            <h3 className="text-base font-bold text-white">
              512-D Non-Invertible Enclaves
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Facial biometric data is sensitive personal data under India's DPDP Act 2023. AuraPass never retains raw photos. All crops are irreversibly projected into 512-dimensional unit hyper-spheres encrypted with AES-256 GCM on your local on-premise hardware.
            </p>
            <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-[#1e1e20]">
              Zero cloud egress • Mathematical photo recovery is impossible
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

