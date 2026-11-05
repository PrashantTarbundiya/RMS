import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: 'rgba(39, 166, 68, 0.12)', border: 'rgba(39, 166, 68, 0.25)', icon: '#27A644', text: '#4ade80' },
  error: { bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.25)', icon: '#F87171', text: '#fca5a5' },
  warning: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)', icon: '#FBBF24', text: '#fde68a' },
  info: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', icon: '#10B981', text: '#6ee7b7' },
};

const AUTO_DISMISS_MS = {
  success: 4000,
  error: 0, // persistent
  warning: 6000,
  info: 4000,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});
  const recentToastsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    if (!message) return null;
    const now = Date.now();
    const lastSeen = recentToastsRef.current.get(message);
    // Deduplicate: If identical message was posted within 2200ms, ignore duplicate
    if (lastSeen && (now - lastSeen) < 2200) {
      return null;
    }
    recentToastsRef.current.set(message, now);

    const id = ++toastIdCounter;
    const duration = options.duration ?? AUTO_DISMISS_MS[type];

    setToasts(prev => {
      // Remove any existing toast with exact same message to prevent stacking
      const filtered = prev.filter(t => t.message !== message);
      const next = [...filtered, { id, message, type, title: options.title }];
      // Keep max 3 toasts to prevent cognitive clutter
      return next.length > 3 ? next.slice(-3) : next;
    });

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const toast = useCallback({
    success: (msg, opts) => addToast(msg, 'success', opts),
    error: (msg, opts) => addToast(msg, 'error', opts),
    warning: (msg, opts) => addToast(msg, 'warning', opts),
    info: (msg, opts) => addToast(msg, 'info', opts),
  }, [addToast]);

  // Fix: toast needs to be a function-like object
  const toastApi = useCallback((msg, type, opts) => addToast(msg, type, opts), [addToast]);
  toastApi.success = (msg, opts) => addToast(msg, 'success', opts);
  toastApi.error = (msg, opts) => addToast(msg, 'error', opts);
  toastApi.warning = (msg, opts) => addToast(msg, 'warning', opts);
  toastApi.info = (msg, opts) => addToast(msg, 'info', opts);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
          pointerEvents: 'none',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(t => {
            const color = COLORS[t.type] || COLORS.info;
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  pointerEvents: 'auto',
                  background: 'var(--surface-elevated, #FFFFFF)',
                  border: '1px solid var(--border, #E5E7EB)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.08)',
                }}
              >
                <Icon size={18} style={{ color: color.icon, marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.title && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                      {t.title}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.45 }}>
                    {t.message}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-tertiary)',
                    cursor: 'pointer',
                    padding: 2,
                    flexShrink: 0,
                    marginTop: 1,
                    lineHeight: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
