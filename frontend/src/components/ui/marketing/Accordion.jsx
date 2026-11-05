import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * High-Performance Reflow-Free Accordion
 * Uses CSS Grid grid-template-rows (0fr -> 1fr) for smooth 60fps compositor transitions.
 * Eliminates Framer Motion height: auto layout thrashing.
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
        const headingId = `accordion-heading-${idx}`;
        const panelId = `accordion-panel-${idx}`;

        return (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card transition-colors duration-150 overflow-hidden"
          >
            <button
              id={headingId}
              type="button"
              onClick={() => toggle(idx)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer select-none text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors btn-tactile"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="text-sm sm:text-base font-semibold text-foreground">
                {item.q || item.title}
              </span>
              <ChevronDown
                size={16}
                className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              />
            </button>

            {/* GPU-Composited Grid Collapse */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              className={`grid transition-[grid-template-rows] duration-200 ease-apple ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 prose-readable">
                  {item.a || item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
