import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PwaContext = createContext({
  isInstallable: false,
  isInstalled: false,
  updateAvailable: false,
  installApp: async () => {},
  applyUpdate: () => {},
  dismissInstall: () => {},
  isPromptDismissed: false
});

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isPromptDismissed, setIsPromptDismissed] = useState(() => {
    return sessionStorage.getItem('rms_pwa_dismissed') === 'true';
  });

  // Check if already running standalone
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);
  }, []);

  // Register Service Worker and track updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);

            // Check if there is already a waiting worker on load
            if (reg.waiting) {
              setWaitingWorker(reg.waiting);
              setUpdateAvailable(true);
            }

            // Listen for future updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New update available');
                    setWaitingWorker(newWorker);
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });

      // Reload page when new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      // Prevent browser's default automatic banner
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install app function
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return false;
      }
    } catch (err) {
      console.error('[PWA] Install error:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Apply update function
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const dismissInstall = useCallback(() => {
    setIsPromptDismissed(true);
    sessionStorage.setItem('rms_pwa_dismissed', 'true');
  }, []);

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        updateAvailable,
        installApp,
        applyUpdate,
        dismissInstall,
        isPromptDismissed
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
