import React from 'react';
import { Camera, Brain, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Camera,
    title: 'Multi-Angle Enrollment',
    desc: 'Upload frontal and lateral profile photos. The pre-processor crops images, aligns facial landmarks, and computes initial quality metrics locally.',
  },
  {
    num: '02',
    icon: Brain,
    title: 'Local Embedding Generation',
    desc: 'Extract 512-dimensional vector representations using high-precision convolutional architectures, indexed directly in your local vector store.',
  },
  {
    num: '03',
    icon: CheckCircle2,
    title: 'Real-Time Consensus Verification',
    desc: 'Incoming camera frames are compared against enrolled templates in milliseconds, validating liveness and confirming identity with sub-second latency.',
  },
];

export default function PipelineSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#0B0E17]/60">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Technical Architecture
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Three-Stage Local Processing Pipeline
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            From enrollment to real-time verification, all computation executes on your host hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="p-6 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-zinc-500">
                    STAGE {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                    <step.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
