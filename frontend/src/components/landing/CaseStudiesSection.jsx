import React from 'react';
import { Building2, GraduationCap, Factory, ArrowUpRight, CheckCircle2, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

const CASE_STUDIES = [
  {
    id: 'nirma',
    category: 'Higher Education Campus',
    client: 'NIRMA Institute of Technology',
    location: 'Ahmedabad, Gujarat',
    icon: GraduationCap,
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    headline: 'Eliminated 40-Meter Turnstile Morning Queues for 2,400+ Students',
    stats: [
      { label: 'Check-In Speed', value: '260 ms', sub: 'Per student gate transit' },
      { label: 'Buddy Punching', value: '0.0%', sub: '100% eliminated' },
      { label: 'Badge Cost Saved', value: '₹3.5L', sub: 'Annual card replacement' }
    ],
    challenge: '2,400+ students and professors arrived within a tight 30-minute morning window. Plastic RFID badge readers caused bottlenecks spilling 40+ meters into the parking lot. Proxy card tapping was unmanageable.',
    solution: 'Retrofit 4 overhead Hikvision DS-2CD IP cameras above existing turnstile lanes connected to a single local on-premise server running AuraPass with 24V dry-contact relay triggers.',
    result: 'Morning queue delay dropped from 18 minutes to zero. Students walk past at normal pace without stopping, and campus security maintains real-time headcount in the central dashboard.'
  },
  {
    id: 'rajkot-mfg',
    category: 'Heavy Manufacturing & Fabrication',
    client: 'Rajkot Precision Forgings Ltd.',
    location: 'Aji GIDC Industrial Area, Gujarat',
    icon: Factory,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    headline: '99.8% Check-In Reliability in Dusty, Oil-Mist Factory Floor Environment',
    stats: [
      { label: 'Shift Workers', value: '450 Staff', sub: '3 rotating 8-hour shifts' },
      { label: 'Sensor Failure', value: '0%', sub: 'Touchless optical CV' },
      { label: 'Monthly Saved', value: '₹40,000', sub: 'Overtime error disputes' }
    ],
    challenge: 'Optical fingerprint machines regularly failed on 38% of workers due to metal shavings, grease, or dry calluses. Shift supervisors spent 45 minutes manually marking muster rolls every shift.',
    solution: 'Installed two eye-level ambient cameras at the main worker entrance running AuraPass with InsightFace ArcFace wide-angle model routing and automated shift grace period rules.',
    result: 'Workers mark check-in instantly upon crossing the threshold without touching any surface. Shift supervisors now receive automated PDF and CSV muster summaries with zero payroll disputes.'
  },
  {
    id: 'shantigram-it',
    category: 'Multi-Tenant Commercial Tech Park',
    client: 'Adani Shantigram Corporate Center',
    location: 'S.G. Highway, Ahmedabad',
    icon: Building2,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    headline: 'Strict DPDP Act 2023 Local Biometric Isolation for 3,200+ Tech Employees',
    stats: [
      { label: 'Tenant Firms', value: '14 IT Parks', sub: 'Cryptographic separation' },
      { label: 'Cloud Egress', value: '0 Bytes', sub: '100% Air-gapped on LAN' },
      { label: 'Entrance Lanes', value: '12 Gates', sub: 'Speed gate relay sync' }
    ],
    challenge: 'Tenant IT corporations operating under global NDAs could not legally permit raw facial photos or biometric templates to leave their on-premise network or be stored in overseas multi-tenant clouds.',
    solution: 'Deployed AuraPass Sovereign Enclave mode. All face crops are transformed into non-invertible 512-D vectors encrypted with AES-256 GCM in local SQLite WAL databases per tenant.',
    result: 'Full compliance with India DPDP Act 2023. Fast sub-300ms transit across 12 speed-gate lanes with complete local audit trails for compliance officers.'
  }
];

export default function CaseStudiesSection() {
  return (
    <section id="case-studies" className="py-20 md:py-28 bg-[#0E0E10] border-b border-[#262626] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14 pb-6 border-b border-[#202022]">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PROVEN ENTERPRISE DEPLOYMENTS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
              Real Indian Enterprises. Real Measurable ROI.
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md md:text-right leading-relaxed">
            See how educational campuses, heavy manufacturing plants, and IT centers cut morning congestion and proxy attendance with existing cameras.
          </p>
        </div>

        {/* 3 Case Study Deep Dives */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CASE_STUDIES.map((cs) => {
            const Icon = cs.icon;
            return (
              <div
                key={cs.id}
                className="rounded-2xl bg-[#121214] border border-[#262626] hover:border-[#383838] transition-all p-6 flex flex-col justify-between shadow-xl group"
              >
                <div className="space-y-4">
                  {/* Category Chip & Client */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${cs.badgeColor}`}>
                      {cs.category}
                    </span>
                    <Icon className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {cs.client}
                    </h3>
                    <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                      📍 {cs.location}
                    </span>
                  </div>

                  {/* Headline */}
                  <p className="text-xs font-semibold text-zinc-200 leading-snug border-l-2 border-emerald-500 pl-3">
                    "{cs.headline}"
                  </p>

                  {/* 3 Stat Badges */}
                  <div className="grid grid-cols-3 gap-2 py-3 bg-[#0a0a0c] p-2.5 rounded-xl border border-[#202022]">
                    {cs.stats.map((st, i) => (
                      <div key={i} className="text-center">
                        <div className="text-sm font-extrabold font-mono text-emerald-400">{st.value}</div>
                        <div className="text-[9px] text-zinc-500 font-medium uppercase truncate">{st.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Challenge & Solution Summary */}
                  <div className="space-y-2 text-[11.5px] text-zinc-400 leading-relaxed">
                    <p>
                      <strong className="text-zinc-200">Challenge:</strong> {cs.challenge}
                    </p>
                    <p>
                      <strong className="text-zinc-200">Solution:</strong> {cs.solution}
                    </p>
                  </div>
                </div>

                {/* Bottom Result Callout */}
                <div className="pt-4 mt-4 border-t border-[#1e1e20] flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Production Impact</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

