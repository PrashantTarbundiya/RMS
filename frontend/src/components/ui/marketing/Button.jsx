import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Precision Button Component for AuraPass Enterprise Public surfaces.
 * Strictly adheres to Apple HIG tactile feedback and Emil Kowalski motion rules:
 * - active:scale-[0.97] on pointer-down
 * - compositor-only property transitions (no transition-all)
 * - dual-theme light/dark contrast compliance
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'glass' | 'ghost' | 'outline'
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
  const baseStyles = 'btn-tactile inline-flex items-center justify-center font-semibold select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50';

  const variants = {
    primary: 'btn-primary-emerald',
    secondary: 'btn-secondary-surface',
    glass: 'btn-glass-subtle',
    outline: 'border border-border bg-transparent text-foreground hover:bg-secondary',
    ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 min-h-[36px]',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-xl gap-2 min-h-[44px] sm:min-h-[40px]',
    lg: 'text-sm sm:text-base px-6 py-2.5 rounded-xl gap-2.5 min-h-[48px]',
  };

  const combinedClass = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4 shrink-0 stroke-[2]" />}
      <span>{children}</span>
      {IconRight && <IconRight className="w-4 h-4 shrink-0 stroke-[2]" />}
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
