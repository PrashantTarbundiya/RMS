import React from 'react';

/**
 * Standard Section Wrapper
 * Enforces vertical rhythm: 128px on desktop (py-32), 80px on mobile (py-20).
 */
export default function Section({
  id,
  children,
  className = '',
  hairline = true,
}) {
  return (
    <section
      id={id}
      className={`relative z-10 py-20 lg:py-32 ${
        hairline ? 'border-t border-white/[0.08]' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
}

