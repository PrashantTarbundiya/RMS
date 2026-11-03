import React from 'react';

export default function Container({ children, className = '', size = 'default' }) {
  const maxWidth = size === 'prose' ? 'max-w-[800px]' : size === 'narrow' ? 'max-w-[1100px]' : 'max-w-[1320px]';
  return (
    <div className={`w-full mx-auto px-6 sm:px-8 lg:px-12 ${maxWidth} ${className}`}>
      {children}
    </div>
  );
}
