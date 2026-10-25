import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FinalCta() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#07090E]">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 sm:p-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Enterprise Deployment
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Deploy Face Recognition in Your Facility Today
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Install on any local workstation or server. Register team members, configure kiosk attendance stations, and maintain full custody of your biometric data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-white hover:bg-zinc-200 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Enter Management Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-white hover:bg-zinc-200 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Create Organization</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
