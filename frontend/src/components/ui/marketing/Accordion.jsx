import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Clean Technical Accordion Component
 */
export default function Accordion({
  items = [],
  allowMultiple = false,
  className = '',
}) {
  const [openIndexes, setOpenIndexes] = useState([0]);

  const toggle = (index) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, idx) => {
        const isOpen = openIndexes.includes(idx);

        return (
          <div
            key={idx}
            className="rounded-xl border border-white/[0.08] bg-[#0B1013] overflow-hidden transition-colors"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer select-none"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-[#F3F6F5]">
                {item.q || item.title}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#3DDC97] shrink-0 transition-transform duration-200 stroke-[1.5] ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 sm:px-5 pb-5 pt-1 text-sm text-[#9AA7A3] leading-relaxed border-t border-white/[0.04]">
                {item.a || item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

