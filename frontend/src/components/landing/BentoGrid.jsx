import React from 'react';
import { ShieldCheck, Lock, Eye, Smartphone, Users, Zap, Layers, Server } from 'lucide-react';

const CAPABILITIES = [
  {
    category: 'Fast & Accurate Face Detection',
    items: [
      {
        icon: ShieldCheck,
        title: 'Real Human Check (Anti-Cheating)',
        desc: 'Detects real people instantly. Blocks printed photos, mobile screen photos, and videos so nobody can punch in for someone else.',
        spec: 'Real Person Detection',
        badge: 'Anti-Spoofing'
      },
      {
        icon: Eye,
        title: 'Works From Any Angle',
        desc: 'Recognizes staff even if they walk past quickly or look sideways. No need to stop and stand rigidly still in front of the camera.',
        spec: '60° Multi-Angle Recognition',
        badge: 'Smart Vision'
      }
    ]
  },
  {
    category: 'Privacy & Standard Office Hardware',
    items: [
      {
        icon: Lock,
        title: '100% Private to Your Company',
        desc: 'Your company employee data is kept completely private and locked. No other organization can ever view your records.',
        spec: 'Locked Organization Records',
        badge: 'Data Security'
      },
      {
        icon: Zap,
        title: 'Runs on Normal Office PCs',
        desc: 'Super fast on any normal office desktop or laptop computer. You do not need to buy costly graphics cards or specialized servers.',
        spec: '<85ms on Regular Computers',
        badge: 'High Speed'
      }
    ]
  },
  {
    category: 'Easy Setup & Admin Controls',
    items: [
      {
        icon: Smartphone,
        title: 'Turn Any Tablet or Laptop into a Kiosk',
        desc: 'Place an iPad, Android tablet, or old laptop at your reception or entrance gate. It keeps working smoothly even if the internet drops.',
        spec: 'Works Even Without Internet',
        badge: 'Touchless Kiosk'
      },
      {
        icon: Users,
        title: 'Easy HR & Admin Control Panel',
        desc: 'HR managers can easily review attendance logs, check unknown visitors, and adjust recognition sensitivity in just a few clicks.',
        spec: 'Simple Manager Controls',
        badge: 'HR Console'
      }
    ]
  }
];

export default function BentoGrid() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            Features & Capabilities
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Everything You Need for Smooth Daily Attendance
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Built for busy offices, factories, hospitals, and educational institutions.
          </p>
        </div>

        {/* Structured Architectural Modules */}
        <div className="space-y-8">
          {CAPABILITIES.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
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
                        <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
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
                      <span className="text-emerald-400 font-medium">{item.spec}</span>
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
