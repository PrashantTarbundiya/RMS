import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, X, Sparkles, CheckCircle2 } from 'lucide-react';
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
            <div className="bg-[#12141A] border border-[#5E6AD2]/50 shadow-2xl shadow-[#5E6AD2]/20 rounded-xl p-3.5 flex items-center justify-between gap-3 backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/20 text-[#828FFF] flex items-center justify-center shrink-0">
                  <RefreshCw size={16} className="animate-spin text-[#828FFF]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>New System Update Ready</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Latest features and security fixes are downloaded.
                  </div>
                </div>
              </div>
              <button
                onClick={applyUpdate}
                className="button-primary text-xs py-1.5 px-3 h-8 whitespace-nowrap text-white font-medium flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#6875E8] shadow-sm"
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
            <div className="bg-[#0F1117] border border-[#232738] shadow-2xl shadow-black/80 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-xl">
              <img
                src="/pwa-192x192.png"
                alt="RMS Icon"
                className="w-10 h-10 rounded-xl shadow-md border border-white/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>Install RMS Face AI</span>
                  <Sparkles size={11} className="text-[#828FFF]" />
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Fast kiosk mode, offline attendance & desktop app.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={installApp}
                  className="button-primary text-xs py-1.5 px-3 h-8 text-white font-medium flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#6875E8]"
                >
                  <Download size={13} />
                  <span>Install</span>
                </button>
                <button
                  onClick={dismissInstall}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
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
