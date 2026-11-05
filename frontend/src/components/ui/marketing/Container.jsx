import React from 'react';

/**
 * Standard Layout Container
 * Fixed constraint: 1160px max width with responsive gutter padding.
 */
export default function Container({
  children,
  className = '',
  size = 'default', // 'default' (1160px) | 'prose' (740px) | 'narrow' (900px)
}) {
  const maxWidths = {
    default: 'max-w-[1160px]',
    prose: 'max-w-[740px]',
    narrow: 'max-w-[900px]',
  };

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${
        maxWidths[size] || maxWidths.default
      } ${className}`}
    >
      {children}
    </div>
  );
}
