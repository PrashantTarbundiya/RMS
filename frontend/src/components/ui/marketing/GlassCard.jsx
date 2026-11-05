import React from 'react';

/**
 * Apple-inspired Liquid Glass Card Surface
 * Encodes material hierarchy, edge reflections, and specular highlights.
 */
export default function GlassCard({
  children,
  className = '',
  interactive = false,
  variant = 'default', // 'default' | 'elevated' | 'subtle'
  as: Component = 'div',
  ...rest
}) {
  const variantStyles = {
    default: 'glass-card',
    elevated: 'glass-card shadow-float',
    subtle: 'bg-card/50 backdrop-blur-md border border-border/80 rounded-2xl',
  };

  const interactiveStyles = interactive ? 'glass-card-interactive cursor-pointer' : '';

  return (
    <Component
      className={`${variantStyles[variant] || variantStyles.default} ${interactiveStyles} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

