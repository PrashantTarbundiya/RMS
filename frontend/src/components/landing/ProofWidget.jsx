import React, { useState } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Cpu, Eye, CheckCircle2, XCircle } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'auth_pass',
    title: 'Authorized Staff Check-In',
    outcome: 'ACCESS GRANTED',
    outcomeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    executionTime: '84.2 ms',
    subject: 'Alice Smith (ID: #4092)',
    department: 'Engineering & DevOps',
    confidence: '94.8%',
    stages: [
      { name: '1. Frame Acquisition', detail: '1080p RTSP Stream (Camera 01)', latency: '12.4 ms', status: 'PASS' },
      { name: '2. 68-Pt Landmark Alignment', detail: '3D Mesh Triangulation (Yaw: +4°, Pitch: -2°)', latency: '24.1 ms', status: 'PASS' },
      { name: '3. Surface Texture Liveness', detail: 'Micro-illumination & specular reflectance confirmed', latency: '18.6 ms', status: 'PASS' },
      { name: '4. 512-D Embedding Match', detail: 'Cosine similarity: 0.948 (Threshold: >= 0.650)', latency: '26.8 ms', status: 'PASS' },
      { name: '5. Access Control Dispatch', detail: 'Door relay unlatched; audit timestamp logged to PostgreSQL', latency: '2.3 ms', status: 'DISPATCHED' },
    ]
  },
  {
    id: 'spoof_reject',
    title: 'Presentation Attack / 2D Spoof',
    outcome: 'ATTACK REJECTED',
    outcomeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    executionTime: '34.8 ms (Early Exit)',
    subject: 'Unknown Individual',
    department: 'Unregistered / Attacker',
    confidence: '0.0% (Terminated at Liveness)',
    stages: [
      { name: '1. Frame Acquisition', detail: '1080p RTSP Stream (Camera 02)', latency: '11.8 ms', status: 'PASS' },
      { name: '2. 68-Pt Landmark Alignment', detail: 'Planar surface detected (Zero depth parallax)', latency: '19.2 ms', status: 'PASS' },
      { name: '3. Surface Texture Liveness', detail: 'FAIL: Paper texture moire pattern detected (Spoof Score: 0.98)', latency: '3.8 ms', status: 'BLOCKED' },
      { name: '4. 512-D Embedding Match', detail: 'Bypassed: Terminated early to save host CPU compute', latency: '0.0 ms', status: 'SKIPPED' },
      { name: '5. Security Incident Logged', detail: 'Security alert event flagged in Audit Log with snapshot evidence', latency: '2.1 ms', status: 'FLAGGED' },
    ]
  },
  {
    id: 'profile_pose',
    title: 'Walking Profile Pose Check-In',
    outcome: 'ACCESS GRANTED',
    outcomeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    executionTime: '91.6 ms',
    subject: 'Marcus Vance (ID: #1883)',
    department: 'Logistics Operations',
    confidence: '89.4%',
    stages: [
      { name: '1. Frame Acquisition', detail: '1080p RTSP Stream (Turnstile Gate B)', latency: '13.1 ms', status: 'PASS' },
      { name: '2. 68-Pt Landmark Alignment', detail: 'Profile alignment active (Yaw: +46° lateral rotation)', latency: '28.4 ms', status: 'PASS' },
      { name: '3. Surface Texture Liveness', detail: 'Natural ocular micro-motion confirmed', latency: '21.0 ms', status: 'PASS' },
      { name: '4. 512-D Embedding Match', detail: 'Cosine similarity: 0.894 against multi-angle gallery vector', latency: '26.9 ms', status: 'PASS' },
      { name: '5. Turnstile Gate Trigger', detail: 'Turnstile unlocked; check-in logged to attendance registry', latency: '2.2 ms', status: 'DISPATCHED' },
    ]
  }
];

export default function ProofWidget() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const scenario = SCENARIOS[activeScenarioIdx];

  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Inference Telemetry
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Real-Time Decision Sequence & Latency Inspector
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Observe the deterministic multi-stage evaluation executed for every camera frame in under 100 milliseconds.
          </p>
        </div>

        {/* Telemetry Inspector Console */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-lg">
          {/* Header Bar with Live Scenario Selectors */}
          <div className="p-4 border-b border-zinc-800/90 bg-[#0C0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Pipeline Verification Trace
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenarioIdx(idx)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    activeScenarioIdx === idx
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {sc.title}
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Status Summary Ribbon */}
          <div className="px-6 py-4 border-b border-zinc-800/80 bg-[#0A0D14] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Decision</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold border ${scenario.outcomeColor}`}>
                {scenario.outcome}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Latency</span>
              <span className="text-white font-semibold">{scenario.executionTime}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Target Subject</span>
              <span className="text-zinc-300 font-medium truncate block">{scenario.subject}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Metric Confidence</span>
              <span className="text-blue-400 font-semibold">{scenario.confidence}</span>
            </div>
          </div>

          {/* Pipeline Execution Stages */}
          <div className="p-6 space-y-3 font-mono text-xs">
            {scenario.stages.map((stage, sIdx) => {
              const isBlocked = stage.status === 'BLOCKED';
              const isSkipped = stage.status === 'SKIPPED';
              const isPass = stage.status === 'PASS' || stage.status === 'DISPATCHED';

              return (
                <div
                  key={sIdx}
                  className={`p-3.5 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isBlocked
                      ? 'bg-red-950/20 border-red-900/40 text-red-300'
                      : isSkipped
                      ? 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500'
                      : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-5 h-5 rounded flex items-center justify-center shrink-0">
                      {isBlocked ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : isSkipped ? (
                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </span>
                    <div>
                      <span className="font-semibold text-white mr-2">{stage.name}:</span>
                      <span className="text-zinc-400">{stage.detail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] text-zinc-500">{stage.latency}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isBlocked
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : isSkipped
                          ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
