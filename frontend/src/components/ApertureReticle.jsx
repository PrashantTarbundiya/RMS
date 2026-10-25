import React from 'react';

export default function ApertureReticle({ children, className = '', active = false, status = 'default' }) {
  // status: 'default', 'success' (green), 'error' (red), 'loading' (pulsing)
  const statusColorMap = {
    default: 'border-[#2563EB]', // accent-primary
    success: 'border-[#27A644]', // success green
    error: 'border-[#F87171]',   // alert-crimson red
    loading: 'border-[#2563EB] animate-pulse'
  };
  const colorClass = statusColorMap[status] || 'border-[#2563EB]';

  return (
    <div className={`relative group reticle-container ${className} ${active ? 'reticle-active' : ''}`}>
      {/* Corner Brackets */}
      {/* Top Left */}
      <div className={`absolute top-[-2px] left-[-2px] w-3.5 h-3.5 border-t-2 border-l-2 ${colorClass} transition-all duration-300 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] z-10`} />
      {/* Top Right */}
      <div className={`absolute top-[-2px] right-[-2px] w-3.5 h-3.5 border-t-2 border-r-2 ${colorClass} transition-all duration-300 ease-out group-hover:-translate-x-[2px] group-hover:translate-y-[2px] z-10`} />
      {/* Bottom Left */}
      <div className={`absolute bottom-[-2px] left-[-2px] w-3.5 h-3.5 border-b-2 border-l-2 ${colorClass} transition-all duration-300 ease-out group-hover:translate-x-[2px] group-hover:-translate-y-[2px] z-10`} />
      {/* Bottom Right */}
      <div className={`absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 border-b-2 border-r-2 ${colorClass} transition-all duration-300 ease-out group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] z-10`} />
      
      {children}
    </div>
  );
}
