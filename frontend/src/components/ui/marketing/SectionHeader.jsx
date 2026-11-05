import React from 'react';
import Badge from './Badge';

export default function SectionHeader({
  badge,
  badgeIcon,
  badgeVariant = 'accent',
  title,
  subtitle,
  align = 'center',
  className = ''
}) {
  const alignment = align === 'left' ? 'text-left' : 'text-center mx-auto';

  return (
    <div className={`mb-12 max-w-2xl ${alignment} ${className}`}>
      {badge && (
        <div className="mb-3">
          <Badge variant={badgeVariant} icon={badgeIcon}>
            {badge}
          </Badge>
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}

