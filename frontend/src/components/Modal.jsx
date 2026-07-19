import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(11, 14, 26, 0.8)',
              backdropFilter: 'blur(4px)'
            }}
          />
          
          {/* Modal Panel (Slide up spring physics) */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ 
              opacity: 1, y: 0, scale: 1, 
              transition: { type: 'spring', stiffness: 300, damping: 25 } 
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '500px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            {/* Header */}
            {title && (
              <div style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h2>
              </div>
            )}

            {/* Body */}
            <div style={{ padding: 'var(--space-5)', overflowY: 'auto' }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: 'var(--space-4) var(--space-5)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)'
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
