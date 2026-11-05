import React, { useEffect, useState } from 'react';

/**
 * Table of Contents Rail with Scroll-Spy
 * Dual-theme light/dark contrast compliant.
 */
export default function TableOfContents({
  headings = [],
  className = '',
}) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '0% 0% -70% 0%',
        threshold: 0.1,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length === 0) return null;

  return (
    <nav className={`text-xs space-y-3 ${className}`} aria-label="Table of contents">
      <p className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider">
        On this page
      </p>
      <ul className="space-y-2 border-l border-border pl-3">
        {headings.map(({ id, text, level }) => {
          const isActive = activeId === id;
          return (
            <li key={id} className={level === 3 ? 'pl-2.5' : ''}>
              <a
                href={`#${id}`}
                className={`block transition-colors py-0.5 leading-snug ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold -ml-[13px] border-l-2 border-emerald-500 pl-[11px]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
