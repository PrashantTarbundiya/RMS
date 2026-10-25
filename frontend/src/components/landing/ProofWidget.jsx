import React, { useState } from 'react';
import { Terminal, ShieldAlert, CheckCircle2 } from 'lucide-react';

const scenarios = [
  {
    title: 'Valid Staff Check-In',
    status: 'AUTHORIZED',
    statusColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    lines: [
      { tag: 'INPUT', value: 'video_frame_0042.jpg' },
      { tag: 'DETECT', value: 'face_bbox [124, 87, 340, 303]' },
      { tag: 'LIVENESS', value: 'PASS (Texture & Illumination Verified)' },
      { tag: 'VECTOR', value: '512-d embedding normalized' },
      { tag: 'MATCH', value: 'Alice_Smith (Cosine similarity: 0.94)' },
      { tag: 'LATENCY', value: '84.2 ms execution time' },
    ],
  },
  {
    title: 'Spoof Attempt Rejection',
    status: 'BLOCKED',
    statusColor: 'text-red-400 border-red-500/30 bg-red-500/10',
    lines: [
      { tag: 'INPUT', value: 'video_frame_0117.jpg' },
      { tag: 'DETECT', value: 'face_bbox [201, 55, 412, 267]' },
      { tag: 'LIVENESS', value: 'REJECT (Printed photo texture detected)' },
      { tag: 'VECTOR', value: 'Skipped by liveness threshold' },
      { tag: 'MATCH', value: 'Rejected before identification' },
      { tag: 'LATENCY', value: '31.7 ms early rejection' },
    ],
  },
];

export default function ProofWidget() {
  const [activeTab, setActiveTab] = useState(0);
  const currentScenario = scenarios[activeTab];

  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Verification Telemetry
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Real-Time Inference Execution Flow
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Inspect the sub-second decision sequence evaluated for every incoming frame.
          </p>
        </div>

        {/* Console Container */}
        <div className="rounded-lg border border-zinc-800 bg-[#0C0F17] overflow-hidden shadow-xl">
          {/* Top Bar */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="font-mono text-xs text-zinc-300 font-medium">
                Inference Stream Monitor
              </span>
            </div>

            <div className="flex gap-2">
              {scenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    activeTab === idx
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Scenario {idx + 1}: {sc.status}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-5 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <span className="text-zinc-400">{currentScenario.title}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${currentScenario.statusColor}`}>
                {currentScenario.status}
              </span>
            </div>

            <div className="space-y-2 pt-2">
              {currentScenario.lines.map((line, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-zinc-500 w-20 shrink-0 font-bold">
                    {line.tag}
                  </span>
                  <span className="text-zinc-300">
                    {line.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
