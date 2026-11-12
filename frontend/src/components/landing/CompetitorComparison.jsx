import React from 'react';
import { Check, X, Shield, Zap, IndianRupee, Sparkles } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    feature: 'Extra Hardware to Purchase',
    aurapass: '₹0 (Use existing office CCTV / webcams)',
    rfid: '₹80–₹150 per badge + badge printers',
    fingerprint: '₹45,000–₹85,000 per entrance gate',
    cloud: 'Proprietary biometric tablets & locks',
    highlight: true
  },
  {
    feature: 'Gate Transit Check-In Speed',
    aurapass: 'Under 1 second (<300ms walk-through)',
    rfid: '3–5 seconds (causes entrance queues)',
    fingerprint: '4–8 seconds (fails on dusty/wet fingers)',
    cloud: '2–4 seconds (requires standing still)'
  },
  {
    feature: 'Buddy Punching / Proxy Attendance',
    aurapass: '100% Eliminated (ISO 30107-3 Liveness)',
    rfid: '0% (Badges easily traded between staff)',
    fingerprint: 'Partial (Silicone dummy copies pass)',
    cloud: 'Partial (Phone photos pass low-tier apps)'
  },
  {
    feature: 'Data Privacy & Sovereignty (DPDP 2023)',
    aurapass: '100% Local On-Premise (Zero cloud egress)',
    rfid: 'Local card readers only',
    fingerprint: 'Local device templates',
    cloud: 'High Risk (Uploads raw face crops to cloud)',
    highlight: true
  },
  {
    feature: 'Office Internet Outage Behavior',
    aurapass: '100% Operational (LAN vector database)',
    rfid: '100% Operational',
    fingerprint: '100% Operational',
    cloud: 'Fails completely when internet drops'
  },
  {
    feature: 'Turnstile & Speed Gate Triggering',
    aurapass: '24V DC opto-isolated relay (450ms pulse)',
    rfid: 'Built-in reader relays',
    fingerprint: 'Wiegand / RS-485 controller',
    cloud: 'Rarely supports turnstiles natively'
  },
  {
    feature: 'Monthly Recurring Software Cost',
    aurapass: '₹1,999 / mo flat (or ₹0 Starter)',
    rfid: '₹0 software + high card replacement fee',
    fingerprint: 'Annual AMC maintenance contracts',
    cloud: '₹60–₹120 per employee / month'
  }
];

export default function CompetitorComparison() {
  return (
    <section id="competitors" className="py-20 md:py-28 bg-[#0A0A0A] border-b border-[#262626] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HONEST COMPETITIVE BENCHMARK</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
            AuraPass vs Legacy Attendance Alternatives
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            See how on-premise computer vision compares against plastic RFID badges, wall-mounted fingerprint clocks, and consumer cloud facial apps.
          </p>
        </div>

        {/* Responsive Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#262626] bg-[#111111] shadow-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141416] border-b border-[#262626] text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6 w-[28%]">Evaluation Criteria</th>
                <th className="py-4 px-4 bg-emerald-500/10 text-emerald-300 font-bold border-l border-r border-emerald-500/20 w-[26%]">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AuraPass™ On-Premise</span>
                  </div>
                </th>
                <th className="py-4 px-4 w-[16%]">Plastic RFID Badges</th>
                <th className="py-4 px-4 w-[15%]">Fingerprint Clocks</th>
                <th className="py-4 px-4 w-[15%]">Cloud Facial SaaS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e20]">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className={`hover:bg-[#141416]/50 transition-colors ${row.highlight ? 'bg-emerald-500/[0.02]' : ''}`}>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-zinc-200">
                    {row.feature}
                  </td>

                  {/* AuraPass Column (Hero highlight) */}
                  <td className="py-3.5 px-4 bg-emerald-500/[0.06] border-l border-r border-emerald-500/20 font-semibold text-emerald-300 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{row.aurapass}</span>
                  </td>

                  <td className="py-3.5 px-4 text-zinc-400">
                    {row.rfid}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-400">
                    {row.fingerprint}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-400">
                    {row.cloud}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

