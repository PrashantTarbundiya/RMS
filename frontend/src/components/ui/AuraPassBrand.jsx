import React from 'react';

/**
 * AuraPass™ Enterprise Master Brand Component
 * 
 * Supports:
 * - Variants: 'symbol' | 'horizontal' | 'stacked' | 'primary'
 * - Themes: 'dark' | 'light' | 'white' | 'black' | 'monochrome'
 * - Standardized sizes: 'xs' (20px) | 'sm' (24px) | 'md' (32px) | 'lg' (40px) | 'xl' (48px) | number
 */
export default function AuraPassBrand({
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  showBadge = false,
  badgeText = 'ENTERPRISE',
  showText = true,
  className = '',
  textClassName = '',
}) {
  // Size resolver
  const sizeMap = {
    xs: { symbol: 20, text: 'text-xs', height: 20 },
    sm: { symbol: 24, text: 'text-sm', height: 24 },
    md: { symbol: 30, text: 'text-base', height: 30 },
    lg: { symbol: 38, text: 'text-lg', height: 38 },
    xl: { symbol: 48, text: 'text-2xl', height: 48 },
  };

  const resolvedSize = typeof size === 'number' 
    ? { symbol: size, text: size >= 36 ? 'text-xl' : 'text-base', height: size }
    : (sizeMap[size] || sizeMap.md);

  // Image / SVG Source Resolver based on theme & variant
  let isEmblemImage = true;
  let symbolSrc = '/brand/aurapass-emblem.png';
  let symbolWebp = '/brand/aurapass-emblem.webp';

  if (theme === 'white') {
    isEmblemImage = false;
    symbolSrc = '/brand/aurapass-white.svg';
  } else if (theme === 'black') {
    isEmblemImage = false;
    symbolSrc = '/brand/aurapass-black.svg';
  } else if (theme === 'monochrome') {
    isEmblemImage = false;
    symbolSrc = '/brand/aurapass-monochrome.svg';
  } else if (theme === 'vector') {
    isEmblemImage = false;
    symbolSrc = '/brand/aurapass-symbol.svg';
  }

  const renderSymbol = (sz, dropShadowClass = 'drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]') => {
    if (isEmblemImage) {
      return (
        <picture className="shrink-0 inline-flex items-center justify-center">
          <source srcSet={symbolWebp} type="image/webp" />
          <img
            src={symbolSrc}
            alt="AuraPass Emblem"
            width={sz}
            height={sz}
            className={`object-contain select-none pointer-events-none ${dropShadowClass} shrink-0`}
            style={{ width: `${sz}px`, height: `${sz}px` }}
          />
        </picture>
      );
    }
    return (
      <img
        src={symbolSrc}
        alt="AuraPass"
        width={sz}
        height={sz}
        className={`object-contain select-none pointer-events-none ${dropShadowClass} shrink-0`}
        style={{ width: `${sz}px`, height: `${sz}px` }}
      />
    );
  };

  // 1. Symbol Only Variant
  if (variant === 'symbol' || !showText) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {renderSymbol(resolvedSize.symbol)}
      </div>
    );
  }

  // 2. Stacked Variant (Centered Vertical Lockup)
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center justify-center text-center gap-2.5 ${className}`}>
        {renderSymbol(resolvedSize.symbol * 1.5, 'drop-shadow-[0_0_16px_rgba(16,185,129,0.45)]')}
        <div className="flex flex-col items-center gap-1">
          <span className={`font-extrabold tracking-tight text-foreground font-display ${resolvedSize.text} ${textClassName}`}>
            AuraPass
            <span className="text-[10px] font-bold text-emerald-400 align-super ml-0.5">TM</span>
          </span>
          {showBadge && (
            <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-emerald-400 uppercase">
              {badgeText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 3. Primary or Horizontal Variant
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderSymbol(resolvedSize.symbol)}

      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-extrabold tracking-tight text-foreground font-display ${resolvedSize.text} ${textClassName}`}>
          AuraPass
        </span>
        <span className="text-[10px] font-bold text-emerald-400 align-super -ml-1">TM</span>

        {showBadge && (
          <span className="text-[9.5px] font-mono font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

