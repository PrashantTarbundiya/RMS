import React from 'react';
import AuraPassBrand from './AuraPassBrand';

/**
 * AuraPassLogo (Backwards-compatible wrapper around AuraPassBrand)
 */
export default function AuraPassLogo({ 
  size = 28, 
  className = '', 
  showText = false, 
  textClassName = '',
  showBadge = false,
  badgeText = 'ENTERPRISE',
  variant = 'horizontal'
}) {
  return (
    <AuraPassBrand
      size={size}
      className={className}
      showText={showText}
      textClassName={textClassName}
      showBadge={showBadge}
      badgeText={badgeText}
      variant={showText ? variant : 'symbol'}
    />
  );
}
