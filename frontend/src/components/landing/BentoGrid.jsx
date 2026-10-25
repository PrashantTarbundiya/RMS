import React from 'react';
import { ShieldCheck, Lock, Eye, Smartphone, Users, Zap, Layers, Server } from 'lucide-react';

const CAPABILITIES = [
  {
    category: 'Perceptual Verification Pipeline',
    items: [
      {
        icon: ShieldCheck,
        title: 'Multi-Stage Liveness Attestation',
        desc: 'Real-time anti-spoof algorithms inspect micro-texture variance, specular reflection, and motion continuity to neutralize 2D printed photos, digital screen replays, and silicone masks.',
        spec: 'Texture + Reflectance Analysis',
        badge: 'Anti-Spoofing'
      },
      {
        icon: Eye,
        title: 'Wide-Angle 3D Pose Alignment',
        desc: '68-point facial landmark triangulation compensates for up to 60 degrees of lateral yaw and pitch, enabling seamless walk-through identification without requiring rigid stationary poses.',
        spec: '60° Multi-Angle Yaw/Pitch',
        badge: 'Computer Vision'
      }
    ]
  },
  {
    category: 'Enterprise Data Sovereignty & Scale',
    items: [
      {
        icon: Lock,
        title: 'Strict Multi-Tenant Database Isolation',
        desc: 'Every organization maintains logically and cryptographically partitioned facial feature databases, attendance registries, and role permissions with zero cross-tenant visibility.',
        spec: 'Tenant-Isolated Embeddings',
        badge: 'Data Security'
      },
      {
        icon: Zap,
        title: 'Sub-100ms CPU-Optimized Inference',
        desc: 'Highly quantized neural embedding backbones execute in sub-100ms on commodity multicore server CPUs, eliminating the need for expensive dedicated GPU clusters at every access gate.',
        spec: '<85ms Execution on Standard CPUs',
        badge: 'Performance'
      }
    ]
  },
  {
    category: 'Operational Deployment & Continuous Refinement',
    items: [
      {
        icon: Smartphone,
        title: 'Autonomous Kiosk & Hardware Acceleration',
        desc: 'Deploy lightweight kiosk check-in stations directly to webcams, security tablets, or dedicated gate terminals with full local storage caching for zero-downtime attendance.',
        spec: 'Offline-First Kiosk Mode',
        badge: 'Field Operations'
      },
      {
        icon: Users,
        title: 'Human-in-the-Loop Operator Labeling',
        desc: 'Security controllers can review borderline similarity scores, inspect flagged mismatch attempts, and refine organization-specific threshold weights directly in the management console.',
        spec: 'Audit & Threshold Calibration',
        badge: 'Governance'
      }
    ]
  }
];

export default function BentoGrid() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            System Architecture
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Enterprise Verification & Access Architecture
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Engineered for high-throughput facility gates, defense perimeters, and sovereign corporate deployments.
          </p>
        </div>

        {/* Structured Architectural Modules */}
        <div className="space-y-8">
          {CAPABILITIES.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>{group.category}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="p-6 rounded-lg bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>Specification</span>
                      <span className="text-blue-400 font-medium">{item.spec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
