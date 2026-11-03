import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, Scale, CheckCircle2, Server, Lock } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-[#1A2234] bg-[#0A0D15]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/support" className="text-slate-400 hover:text-white transition-colors">
              Help & Documentation
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 pb-8 border-b border-[#1A2234]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Scale className="w-3.5 h-3.5" />
            Plain-English Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            AuraPass Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Version 2026.2 &bull; Simple rules governing the use of AuraPass attendance software.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">01.</span>
              Software License
            </h2>
            <p>
              When you create an account or run AuraPass, we grant your organization permission to use the software on your company computers, servers, and cameras to manage employee attendance.
            </p>
            <p className="text-slate-400">
              You can run AuraPass locally inside your workplace without internet access. You are free to connect your existing IP cameras or webcams.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">02.</span>
              You Own 100% of Your Data
            </h2>
            <p>
              Your company owns every employee photo, face measurement code, and attendance record created inside your instance. AuraPass makes zero claim of ownership over your data.
            </p>
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Full Data Freedom</p>
                <p className="text-xs text-slate-400 mt-1">
                  You can export your complete attendance logs to CSV or Excel at any time, or permanently wipe all records from your system without asking for permission.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">03.</span>
              Your Responsibilities
            </h2>
            <p>To use AuraPass properly and lawfully:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>You agree to notify your workers and comply with local workplace privacy laws (such as getting employee consent where required).</li>
              <li>You agree not to use AuraPass for unlawful surveillance or harmful tracking.</li>
              <li>You agree to keep your administrator password safe.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">04.</span>
              System Reliability & Hardware
            </h2>
            <p>
              AuraPass is designed to run reliably on modern standard computers with 4-core processors. Because the software runs on your hardware and cameras, your check-in speed and uptime depend on your own equipment, power supply, and local network wiring.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">05.</span>
              Questions & Support
            </h2>
            <p>
              If you have any questions about these terms or need assistance setting up your hardware, please visit our documentation or contact our support team.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1A2234] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} AuraPass. All rights reserved.</p>
          <Link to="/support" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Need help? Visit Support &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
