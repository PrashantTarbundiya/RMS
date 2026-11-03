import React from 'react';

export default function Container({ children, className = '', size = 'default' }) {
  const maxWidth = size === 'prose' ? 'max-w-[840px]' : size === 'narrow' ? 'max-w-[1200px]' : 'max-w-[1720px]';
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 ${maxWidth} ${className}`}>
      {children}
    </div>
  );
}
