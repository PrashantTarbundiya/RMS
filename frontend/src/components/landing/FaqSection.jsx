import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Does my facial biometric data leave my network?',
    a: 'No. The RMS platform runs entirely on-premise or in your private cloud context. All face detection, feature extraction, and neural network evaluations happen locally, ensuring complete privacy and compliance with biometric data laws.',
  },
  {
    q: 'How many training photos do I need to register a person?',
    a: 'You can train identity embeddings with as few as 3 photos (frontal, left side-profile, and right side-profile). For optimal recognition rates in variable lighting, we recommend uploading between 5 to 15 photos per person.',
  },
  {
    q: 'Which face recognition models does the system use?',
    a: 'The system runs a SOTA MobileNetV2 model (lightweight, optimized for fast CPU inference) alongside a high-dimensional embedding model. Detections are resolved using a weighted ensemble consensus logic.',
  },
  {
    q: 'Can the system recognize faces from profile/side angles?',
    a: 'Yes. Unlike generic systems that only work with direct frontal views, RMS integrates MediaPipe BlazeFace with custom keypoint-based pose estimators to align and identify faces up to a 60-degree rotation angle.',
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section id="faq" className="landing-section scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-eyebrow text-[#828FFF] mb-3">FAQ</p>
          <h2 className="text-headline text-ink font-display">
            Common questions, straight answers.
          </h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => {
            const isOpen = activeIndex === i;
            return (
              <div key={i} className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}>
                <button
                  onClick={() => setActiveIndex(isOpen ? null : i)}
                  className="faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className="faq-question">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="faq-chevron"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                      className="faq-panel-wrapper"
                    >
                      <div className="faq-answer">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
