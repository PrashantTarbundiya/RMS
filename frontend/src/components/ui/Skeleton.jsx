import React from 'react';

/**
 * SkeletonLine — A single shimmering line placeholder.
 * @param {object} props
 * @param {string} [props.width='100%'] — CSS width
 * @param {string} [props.height='14px'] — CSS height
 * @param {string} [props.borderRadius='6px'] — border radius
 * @param {object} [props.style] — extra styles
 */
export function SkeletonLine({ width = '100%', height = '14px', borderRadius = '6px', style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--surface-3)',
        ...style,
      }}
    />
  );
}

/**
 * SkeletonAvatar — A circular avatar placeholder.
 * @param {object} props
 * @param {number} [props.size=40] — diameter in px
 */
export function SkeletonAvatar({ size = 40 }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--surface-3)',
        flexShrink: 0,
      }}
    />
  );
}

/**
 * SkeletonCard — A rectangular card placeholder.
 * @param {object} props
 * @param {string} [props.height='120px']
 */
export function SkeletonCard({ height = '120px', style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-3)',
        border: '1px solid var(--hairline)',
        ...style,
      }}
    />
  );
}

/**
 * SkeletonTable — A table placeholder with rows.
 * @param {object} props
 * @param {number} [props.rows=5] — number of rows
 * @param {number} [props.cols=4] — number of columns
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 12,
          padding: '14px 16px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        {Array.from({ length: cols }, (_, i) => (
          <SkeletonLine key={`h-${i}`} width={`${50 + Math.random() * 30}%`} height="12px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 12,
            padding: '12px 16px',
            borderBottom: row < rows - 1 ? '1px solid var(--hairline)' : 'none',
          }}
        >
          {Array.from({ length: cols }, (_, col) => (
            <SkeletonLine key={`r${row}-c${col}`} width={`${40 + Math.random() * 40}%`} height="12px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonStatCards — A row of stat card placeholders.
 * @param {object} props
 * @param {number} [props.count=4]
 */
export function SkeletonStatCards({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 16 }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            height: 88,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-3)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonLine width="60%" height="16px" />
            <SkeletonLine width="40%" height="10px" />
          </div>
        </div>
      ))}
    </div>
  );
}
