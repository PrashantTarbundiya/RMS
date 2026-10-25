import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../../config';

/**
 * NetworkBanner - Shows a thin, non-intrusive bar when the backend is unreachable.
 * Auto-retries /api/ping every 10 seconds. Auto-dismisses when connection is restored.
 */
export default function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimerRef = useRef(null);
  const consecutiveFailsRef = useRef(0);

  const checkConnection = async () => {
    try {
      setIsRetrying(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      await fetch(`${API_BASE}/ping`, { 
        method: 'GET', 
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeout);
      consecutiveFailsRef.current = 0;
      setIsOffline(false);
    } catch {
      consecutiveFailsRef.current += 1;
      // Only show banner after 3 consecutive failures to avoid false alarms during heavy local ML ops
      if (consecutiveFailsRef.current >= 3) {
        setIsOffline(true);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    // Initial check after a short delay (let the app load first)
    const initialTimer = setTimeout(checkConnection, 3000);
    
    // Periodic check every 10 seconds
    retryTimerRef.current = setInterval(checkConnection, 10000);

    return () => {
      clearTimeout(initialTimer);
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden', width: '100%', zIndex: 9999 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(248, 113, 113, 0.1)',
              borderBottom: '1px solid rgba(248, 113, 113, 0.2)',
              fontSize: 13,
              color: '#fca5a5',
              fontWeight: 500,
            }}
          >
            <WifiOff size={14} />
            <span>Backend server is unreachable</span>
            <span style={{ color: 'var(--ink-tertiary)', fontSize: 12 }}>·</span>
            <button
              onClick={checkConnection}
              disabled={isRetrying}
              style={{
                background: 'none',
                border: 'none',
                color: '#F87171',
                cursor: isRetrying ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                padding: 0,
                opacity: isRetrying ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? 'Retrying…' : 'Retry now'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
