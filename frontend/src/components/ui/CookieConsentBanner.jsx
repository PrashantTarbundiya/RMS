import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'aurapass_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so it animates in cleanly after initial paint
        const timer = setTimeout(() => setVisible(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(false);
    }
  }, []);

  const handleDecision = (accepted) => {
    const record = {
      accepted,
      timestamp: new Date().toISOString(),
      version: '2026.1',
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to save cookie consent to localStorage', e);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Notice"
      className="fixed bottom-0 left-0 right-0 z-[10002] px-4 py-3 bg-[#0A0D14]/95 backdrop-blur-md border-t border-[#1C2333] shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Cookie className="w-4 h-4" />
          </div>
          <p className="leading-relaxed text-slate-300 text-xs sm:text-[13px]">
            We use essential cookies to keep your session secure and remember your settings. All employee and face attendance records stay on your local network and are never shared.{' '}
            <Link
              to="/privacy-policy"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium transition-colors"
            >
              Privacy Policy
            </Link>
            {' '}&bull;{' '}
            <Link
              to="/terms"
              className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
            >
              Terms
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={() => handleDecision(false)}
            className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#131722] hover:bg-[#1A2030] border border-[#232B3E] rounded-full transition-colors min-h-[36px] cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleDecision(true)}
            className="px-5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-full shadow-md shadow-emerald-500/20 transition-all min-h-[36px] cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
