import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Does facial biometric data leave our local network?',
    a: 'No. The RMS platform runs entirely on your local infrastructure or private virtual cloud. Face detection, feature extraction, vector indexing, and template matching happen locally, ensuring full compliance with enterprise privacy standards.',
  },
  {
    q: 'How many photos are required to register an employee?',
    a: 'Identity templates can be created with as few as 3 photos (frontal, left side-profile, and right side-profile). For optimal verification across varying office lighting conditions, we recommend enrolling 3 to 5 clear photos.',
  },
  {
    q: 'Which neural recognition backbones does the system use?',
    a: 'The system utilizes multi-model consensus combining FaceNet (512-dimensional embedding space) and InsightFace ArcFace models. Real-time liveness gates verify presence before identity classification.',
  },
  {
    q: 'Can the system recognize faces from profile and side angles?',
    a: 'Yes. RMS incorporates specialized landmark pose estimation and face alignment algorithms, accurately identifying registered personnel at head turn angles up to 60 degrees.',
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#0B0E17]/60">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Frequently Asked Questions
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Common Deployment & Technical Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = activeIndex === i;
            return (
              <div
                key={i}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden"
              >
                <button
                  onClick={() => setActiveIndex(isOpen ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-medium text-white hover:text-zinc-200 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
