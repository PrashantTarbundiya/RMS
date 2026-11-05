import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Precision Button Component for AuraPass Enterprise Public surfaces.
 * Strictly adheres to design direction:
 * - primary: solid emerald (#3DDC97), dark text (#06090B), weight 500/600
 * - secondary: transparent, hairline border (rgba(255,255,255,0.08)), text #F3F6F5
 * - ghost: transparent, no border, text #9AA7A3 hover #F3F6F5
 * Max two buttons side by side.
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  to,
  href,
  onClick,
  type = 'button',
  icon: Icon,
  iconRight: IconRight,
  className = '',
  disabled = false,
  ...rest
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97]/40';

  const variants = {
    primary: 'bg-[#3DDC97] text-[#06090B] font-semibold hover:bg-[#5FE8AD] shadow-[0_0_20px_rgba(61,220,151,0.22)] active:translate-y-px',
    secondary: 'bg-transparent text-[#F3F6F5] border border-white/10 hover:border-white/20 hover:bg-white/[0.03] active:translate-y-px',
    ghost: 'bg-transparent text-[#9AA7A3] hover:text-[#F3F6F5] hover:bg-white/[0.02]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 h-12',
  };

  const combinedClass = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4 shrink-0 stroke-[1.5]" />}
      <span>{children}</span>
      {IconRight && <IconRight className="w-4 h-4 shrink-0 stroke-[1.5]" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClass} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClass} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClass}
      {...rest}
    >
      {content}
    </button>
  );
}

