import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Lock,
  Database,
  Eye,
  FileCheck,
  CheckCircle2,
  Cookie,
  Trash2,
  Clock,
  Scale,
  Server,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
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
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
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
        {/* Title Header */}
        <div className="mb-10 pb-8 border-b border-[#1A2234]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            Privacy & Data Safety
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            AuraPass Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Last Updated: November 2026 &bull; Plain English guide on how your workplace attendance data is kept safe and local.
          </p>
        </div>

        {/* 3 Core Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <Server className="w-5 h-5 text-emerald-400 mb-2" />
            <h2 className="text-xs font-bold text-white mb-1">Local Storage Only</h2>
            <p className="text-xs text-slate-400">All photos and employee records stay on your company computer. Never sent to any cloud server.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <Lock className="w-5 h-5 text-emerald-400 mb-2" />
            <h2 className="text-xs font-bold text-white mb-1">Face Codes Cannot Be Reversed</h2>
            <p className="text-xs text-slate-400">Faces are converted into mathematical codes that cannot be turned back into photographs.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
            <Trash2 className="w-5 h-5 text-purple-400 mb-2" />
            <h2 className="text-xs font-bold text-white mb-1">1-Click Deletion</h2>
            <p className="text-xs text-slate-400">Administrators can remove any employee and erase all their face data completely in one click.</p>
          </div>
        </div>

        {/* Sections in Simple English */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">01.</span>
              What Information AuraPass Stores
            </h2>
            <p>When your organization uses AuraPass, the software collects only what is needed to mark attendance:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-white">Employee Profile:</strong> Name, optional employee ID number, and organization department.</li>
              <li><strong className="text-white">Face Template:</strong> A set of mathematical numbers (512 coordinates) representing face measurements. Raw photographs used during initial enrollment can be removed after setup.</li>
              <li><strong className="text-white">Attendance Logs:</strong> Date, timestamp (e.g., 09:02 AM), and which camera detected the check-in.</li>
              <li><strong className="text-white">Login Cookies:</strong> Secure session tokens so administrators can log in to the web console without retyping their password on every page.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">02.</span>
              Zero Cloud Sharing
            </h2>
            <p>
              AuraPass is an on-premise system. That means the database, face matching engine, and web console run exclusively on your company's own hardware.
            </p>
            <p className="text-slate-400">
              We do not sell, rent, license, or transmit any employee photos, face codes, or attendance logs to any third-party advertising network, cloud vendor, or government agency.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">03.</span>
              Employee Consent & Privacy Laws
            </h2>
            <p>
              Under workplace privacy standards (such as Illinois BIPA 740 ILCS 14 and European GDPR Article 9), employees have the right to know when biometric tools are used.
            </p>
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638] space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Our Built-In Compliance Features</span>
              </div>
              <p className="text-xs text-slate-400">
                AuraPass records the date and time when an organization accepts legal terms, keeps an audit log of employee record changes, and automatically flags records older than 3 years for cleanup.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">04.</span>
              How Cookies Are Used
            </h2>
            <p>We keep cookie usage to the bare minimum:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-white">Session token:</strong> Remembers your administrator login so you stay signed in while using the dashboard.</li>
              <li><strong className="text-white">Cookie banner consent:</strong> Remembers that you clicked "Accept" or "Decline" on the bottom notice so it does not keep popping up.</li>
            </ul>
            <p className="text-slate-400">We do not use any third-party tracking, advertising, or cross-site cookies.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-xs">05.</span>
              How to Delete Your Data
            </h2>
            <p>
              Company administrators have total control. You can delete an individual employee, remove all attendance logs, or wipe the entire database directly from the settings page at any time. When deleted, the records are wiped immediately from your local storage.
            </p>
          </section>
        </div>

        {/* Footer help link */}
        <div className="mt-12 pt-6 border-t border-[#1A2234] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>Questions about our privacy practices? Contact your system administrator or email support.</p>
          <Link to="/support" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Visit Help Center &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
