import React from 'react';

const stats = [
  { value: '84ms', label: 'Average Inference Latency', detail: 'Measured on standard quad-core CPU, zero dedicated GPU required' },
  { value: '60°', label: 'Supported Rotation Angle', detail: 'Side-profile alignment and verification built into detector' },
  { value: '512-d', label: 'Embedding Vector Size', detail: 'High-dimensional feature space for precise discrimination' },
  { value: '3-5', label: 'Minimum Enrollment Photos', detail: 'Frontal and lateral profile views for baseline registration' },
];

export default function StatsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#0B0E17]/60">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Engineering Specifications
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Performance Benchmarks on Standard Hardware
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Engineered for edge deployment without requiring proprietary cloud accelerators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl font-bold font-mono text-white mb-2 tracking-tight">
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-zinc-200 mb-1">
                  {s.label}
                </div>
              </div>
              <div className="text-xs text-zinc-400 leading-normal mt-3 pt-3 border-t border-zinc-800/60">
                {s.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
