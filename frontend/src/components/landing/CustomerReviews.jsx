import React from 'react';
import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  {
    id: 'callum',
    name: 'Callum Vance',
    role: 'Operations Director, Nexus Logistics',
    initials: 'CV',
    headline: 'Highly recommend! Zero gate queues.',
    quote: 'Switched 4 warehouse turnstiles from RFID badges to AuraPass. Morning shift bottlenecks dropped from 15 minutes to under 2 minutes. Buddy punching is completely eliminated.',
    avatarBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'elena',
    name: 'Dr. Elena Rostova',
    role: 'CISO, Veloce Health Systems',
    initials: 'ER',
    headline: 'True air-gapped compliance!',
    quote: 'Our healthcare compliance strictly forbids transmitting facial templates outside our facility. AuraPass runs 100% locally on our LAN server with zero cloud egress.',
    avatarBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  {
    id: 'tariq',
    name: 'Tariq Mansoor',
    role: 'Head of IT & Security, Apex Labs',
    initials: 'TM',
    headline: 'Saved ₹15 Lakhs in Year One!',
    quote: 'No specialized biometric clock hardware to buy. Connected straight into our existing Hikvision RTSP cameras and had 300 staff verified in less than an hour.',
    avatarBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
];

export default function CustomerReviews() {
  return (
    <section id="reviews" className="py-16 md:py-24 bg-[#0A0A0A] border-b border-[#262626] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header (matching ScrapeOps layout) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-[#1E1E1E]">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>CUSTOMER REVIEWS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
              Trusted by 500+ facilities & security teams
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md md:text-right leading-relaxed">
            Don't just take our word for it. Here's what facility directors and security teams using AuraPass have to say.
          </p>
        </div>

        {/* 3 Compact Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#383838] transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* 5 Amber Stars + Quote Mark */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
                    ))}
                  </div>
                  <Quote size={16} className="text-zinc-600 rotate-180" />
                </div>

                {/* Review Headline */}
                <h3 className="text-sm font-bold text-white mb-2 font-display">
                  {review.headline}
                </h3>

                {/* Review Quote Body (concise, compact) */}
                <p className="text-xs text-zinc-400 leading-relaxed">
                  "{review.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[#1C1C1C]">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border shrink-0 ${review.avatarBg}`}
                >
                  {review.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {review.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate font-mono">
                    {review.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

