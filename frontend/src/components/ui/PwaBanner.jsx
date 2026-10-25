import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export default function PwaBanner() {
  const {
    isInstallable,
    isInstalled,
    updateAvailable,
    installApp,
    applyUpdate,
    dismissInstall,
    isPromptDismissed
  } = usePwa();

  return (
    <>
      {/* ── 1. Update Available Banner (Highest Priority) ── */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[10000] w-[92%] max-w-md"
          >
            <div className="bg-[#0F1011] border border-[#23252A] shadow-lg rounded-lg p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#2563EB]/15 text-[#3B82F6] flex items-center justify-center shrink-0">
                  <RefreshCw size={15} className="animate-spin text-[#3B82F6]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>System Update Available</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Latest features and security patches downloaded.
                  </div>
                </div>
              </div>
              <button
                onClick={applyUpdate}
                className="button-primary text-xs py-1.5 px-3 h-8 whitespace-nowrap text-white font-medium flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors"
              >
                <span>Update Now</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Install App Floating Prompt ── */}
      <AnimatePresence>
        {isInstallable && !isInstalled && !isPromptDismissed && !updateAvailable && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 right-5 z-[9999] w-[90%] sm:w-auto sm:max-w-sm"
          >
            <div className="bg-[#0F1011] border border-[#23252A] shadow-lg rounded-lg p-3.5 flex items-center gap-3">
              <img
                src="/pwa-192x192.png"
                alt="RMS Icon"
                className="w-9 h-9 rounded-md border border-[#23252A] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>Install Enterprise App</span>
                  <ShieldCheck size={12} className="text-[#3B82F6]" />
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Dedicated kiosk mode & low-latency desktop access.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={installApp}
                  className="button-primary text-xs py-1.5 px-3 h-8 text-white font-medium flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors"
                >
                  <Download size={13} />
                  <span>Install</span>
                </button>
                <button
                  onClick={dismissInstall}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
