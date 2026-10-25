import React from 'react';
import { Shield, Lock, Eye, Smartphone, Users, Zap } from 'lucide-react';

const heroCards = [
  {
    icon: Shield,
    title: 'Multi-Stage Liveness Verification',
    desc: 'Integrated anti-spoof checks analyze surface texture, specular glare, and illumination variance to prevent replay attacks and printed photo spoofing.',
    badge: 'Security',
  },
  {
    icon: Lock,
    title: 'Multi-Tenant Isolation',
    desc: 'Each department or client organization maintains completely segregated database contexts, template storage, and access permission hierarchies.',
    badge: 'Architecture',
  },
];

const supportCards = [
  {
    icon: Eye,
    title: 'Profile Pose Alignment',
    desc: 'Robust facial landmark alignment handles up to 60 degrees of lateral head rotation, recognizing personnel in natural motion.',
  },
  {
    icon: Smartphone,
    title: 'Mobile PWA Support',
    desc: 'Installable on iOS Safari and Android Chrome as a native web application with full hardware camera acceleration.',
  },
  {
    icon: Users,
    title: 'Continuous Quality Feedback',
    desc: 'Operators can review and label borderline detections directly within the console to refine model consensus.',
  },
  {
    icon: Zap,
    title: 'Sub-100ms Inference',
    desc: 'Optimized neural backbones deliver sub-second response times on standard multicore host processors without dedicated GPUs.',
  },
];

export default function BentoGrid() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#0B0E17]/60">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            System Capabilities
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Core Features Designed for Enterprise Security
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            High precision, robust multi-angle tolerance, and autonomous kiosk operation.
          </p>
        </div>

        {/* Primary Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {heroCards.map((card, i) => (
            <div
              key={i}
              className="p-7 rounded-lg bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-400">
                    <card.icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Supporting Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportCards.map((card, i) => (
            <div
              key={i}
              className="p-5 rounded-lg bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-3">
                  <card.icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">
                  {card.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
