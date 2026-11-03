import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Server,
  Lock,
  ChevronRight,
  FileText
} from 'lucide-react';

const SECTIONS = [
  { id: 'license', title: '1. Software License & Deployment Scope' },
  { id: 'ownership', title: '2. Complete Customer Data Ownership' },
  { id: 'responsibilities', title: '3. Workplace Compliance & Employee Consent' },
  { id: 'hardware', title: '4. Hardware Compatibility & System Performance' },
  { id: 'ip', title: '5. Intellectual Property & Code Integrity' },
  { id: 'liability', title: '6. Limitation of Liability & Offline Support' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('license');

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Top Header */}
      <header className="border-b border-[#1A2234] bg-[#0A0D15]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <Link to="/docs" className="text-slate-400 hover:text-white transition-colors">
              Docs
            </Link>
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/support" className="text-slate-400 hover:text-white transition-colors">
              Support
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

      {/* Main Content Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col lg:flex-row gap-10">
        
        {/* Sticky Table of Contents (Desktop) */}
        <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Terms Outline
            </p>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-[#0E1422]'
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  {activeSection === sec.id && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </nav>

            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638] text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                <FileText className="w-4 h-4" />
                <span>Plain-English License</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Clear rights, full customer data sovereignty, and zero hidden telemetry.
              </p>
            </div>
          </div>
        </aside>

        {/* Legal Text Document */}
        <div className="flex-1 min-w-0 max-w-3xl space-y-10">
          
          {/* Header Card */}
          <div className="pb-8 border-b border-[#1A2234] space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono">
              <Scale className="w-3.5 h-3.5" />
              Enterprise Terms of Service
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AuraPass Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
              Version 2026.2 &bull; Effective Date: November 3, 2026 &bull; Commercial On-Premise License
            </p>
          </div>

          {/* Section 1 */}
          <section id="license" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">01.</span>
              Software License & Deployment Scope
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Subject to these Terms, AuraPass grants your organization a non-exclusive, non-transferable license to install, execute, and operate the AuraPass software across your internal workstations, servers, and security cameras solely for managing employee attendance and facility access.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              You are permitted to run AuraPass within completely air-gapped, isolated networks without requiring continuous connectivity to any central licensing server.
            </p>
          </section>

          {/* Section 2 */}
          <section id="ownership" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">02.</span>
              Complete Customer Data Ownership
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              **Your organization owns 100% of all data created, processed, or stored by your AuraPass deployment.** This includes employee enrollment photographs, 512-dimensional vector embeddings, camera identifiers, attendance logs, and shift rosters.
            </p>
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Zero Data Lock-In</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  You maintain the right to export all attendance records to CSV, Excel, or SQL dumps at any time, or permanently delete the database without requesting vendor permission.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="responsibilities" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">03.</span>
              Workplace Compliance & Employee Consent
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              As the Data Controller, your organization is responsible for ensuring that facial recognition attendance complies with all applicable national, state, and local labor and biometric privacy laws:
            </p>
            <ul className="text-xs sm:text-sm text-slate-400 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>Providing clear written notice to employees regarding biometric attendance capture.</li>
              <li>Obtaining employee consent where mandated by regional statutes (e.g. Illinois BIPA, Texas Capture or Use of Biometric Identifier Act).</li>
              <li>Ensuring cameras are positioned exclusively at authorized facility entrances, turnstiles, or reception checkpoints.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="hardware" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">04.</span>
              Hardware Compatibility & System Performance
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              AuraPass operates using standard RTSP/ONVIF security cameras and USB webcams. While AuraPass is tested extensively across multi-vendor cameras (Hikvision, Dahua, Axis, Hanwha), overall system recognition latency (under 300ms) depends upon adequate host computing resources (recommended 4+ CPU cores, 8 GB RAM) and appropriate entrance illumination.
            </p>
          </section>

          {/* Section 5 */}
          <section id="ip" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">05.</span>
              Intellectual Property & Code Integrity
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The AuraPass software architecture, user interface design systems, deep learning pipeline orchestration, and trade dress remain the intellectual property of AuraPass Enterprise. You agree not to distribute or sublicense the core proprietary software weights to third parties.
            </p>
          </section>

          {/* Section 6 */}
          <section id="liability" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">06.</span>
              Limitation of Liability & Offline Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The software is provided "as is" with enterprise warranty protections detailed in your commercial service-level agreement (SLA). Because AuraPass runs on customer-managed hardware, AuraPass is not liable for data loss arising from host computer physical failures, power outages, or unauthorized physical tampering with on-site camera wiring.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A2234] bg-[#06080E] py-8 px-4 sm:px-6 text-center text-xs text-slate-500 font-mono">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Commercial Terms of Service v2026.2.</p>
      </footer>
    </div>
  );
}
