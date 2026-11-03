import React from 'react';

export default function Container({ children, className = '', size = 'default' }) {
  const maxWidth = size === 'prose' ? 'max-w-[760px]' : 'max-w-[1200px]';
  return (
    <div className={`w-full mx-auto px-6 sm:px-8 ${maxWidth} ${className}`}>
      {children}
    </div>
  );
}
