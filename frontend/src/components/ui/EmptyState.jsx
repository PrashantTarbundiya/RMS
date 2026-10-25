import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState - A designed placeholder for empty lists/tables.
 *
 * @param {object} props
 * @param {React.ElementType} [props.icon=Inbox] - Lucide icon component
 * @param {string} props.title - Main heading (e.g., "No employees enrolled")
 * @param {string} [props.description] - Supporting text
 * @param {React.ReactNode} [props.action] - Optional CTA element (button/link)
 */
export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        minHeight: 220,
      }}
    >
      {/* Icon container with subtle glow */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon size={24} style={{ color: 'var(--accent-primary)', opacity: 0.7 }} />
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink)',
          margin: 0,
          marginBottom: description ? 6 : 0,
          letterSpacing: '-0.2px',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-subtle)',
            margin: 0,
            maxWidth: 340,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <div style={{ marginTop: 16 }}>
          {action}
        </div>
      )}
    </div>
  );
}
