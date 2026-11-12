import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, X, Check, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';

export default function AuthLegalModal({ isOpen, type, onClose, onAccept }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTerms = type === 'terms';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 select-text">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                {isTerms ? <FileText className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isTerms ? 'AuraPass™ Commercial Terms of Service' : 'AuraPass™ Biometric Privacy Policy'}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {isTerms ? 'Software license & operational terms for on-premise deployment' : '100% on-premise local data custody & employee protection'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Document Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
            {isTerms ? (
              <>
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Key Guarantee:</strong> AuraPass runs 100% on your local premises. We never claim ownership of your employee biometric templates or attendance logs.
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white text-sm">1. License Grant & On-Premise Scope</h4>
                  <p className="text-neutral-400">
                    AuraPass grants the registered organization a commercial license to deploy the software on local workstations, on-premise servers, or edge devices. You are licensed to connect authorized IP cameras, USB webcams, and turnstile kiosks for employee attendance and access verification.
                  </p>

                  <h4 className="font-semibold text-white text-sm">2. 100% Local Data Custody</h4>
                  <p className="text-neutral-400">
                    All facial embeddings, attendance records, employee photos, and camera streams remain strictly within your physical network. AuraPass has zero remote cloud telemetry, does not transmit biometric data over the internet, and contains no remote backdoors.
                  </p>

                  <h4 className="font-semibold text-white text-sm">3. Workplace Privacy & Compliance</h4>
                  <p className="text-neutral-400">
                    The deploying organization is solely responsible for obtaining employee consent in compliance with applicable local labor, biometric privacy, and data protection laws (including the Digital Personal Data Protection Act).
                  </p>

                  <h4 className="font-semibold text-white text-sm">4. Hardware Safety & Emergency Access</h4>
                  <p className="text-neutral-400">
                    When connecting dry-contact relays to physical turnstiles, speed gates, or magnetic door locks, the deploying organization must maintain physical manual break-glass overrides and fail-safe power-off egress compliant with local fire safety codes.
                  </p>

                  <h4 className="font-semibold text-white text-sm">5. Termination & Data Deletion</h4>
                  <p className="text-neutral-400">
                    You may uninstall the software or delete any enrolled employee at any time. Permanent deletion erases all associated vector embeddings and cached imagery immediately from disk.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero-Cloud Guarantee:</strong> All biometric verification happens on your local hardware. No employee photos or faces are ever sent to third parties or cloud servers.
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white text-sm">1. Mathematical Vector Protection</h4>
                  <p className="text-neutral-400">
                    AuraPass does not match against raw facial photos during day-to-day attendance. Instead, it extracts irreversible mathematical embeddings (512-dimensional numerical vectors). These mathematical numbers cannot be reverse-engineered back into a human face photograph.
                  </p>

                  <h4 className="font-semibold text-white text-sm">2. Air-Gapped Network Operation</h4>
                  <p className="text-neutral-400">
                    The biometric pipeline operates normally without an active internet connection. All face detection, spoof rejection, and attendance logging execute locally on your office network.
                  </p>

                  <h4 className="font-semibold text-white text-sm">3. Multi-Tenant Cryptographic Isolation</h4>
                  <p className="text-neutral-400">
                    Each organization's biometric index is stored in an isolated, encrypted directory. No organization can access, inspect, or query embeddings belonging to another organization.
                  </p>

                  <h4 className="font-semibold text-white text-sm">4. Employee Right to Deletion</h4>
                  <p className="text-neutral-400">
                    When an employee leaves the company, administrators can click "Delete Employee" to execute a zero-trace wipe of all face vectors and enrollment photos.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#262626] bg-[#141414] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>AuraPass Enterprise • Version 2026.2</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              {onAccept && (
                <button
                  type="button"
                  onClick={onAccept}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>I Accept & Agree</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
