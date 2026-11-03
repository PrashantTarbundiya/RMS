import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ArrowLeft,
  ShieldCheck,
  Printer,
  ChevronRight,
  FileText
} from 'lucide-react';
import Callout from '../components/ui/marketing/Callout';
import TableOfContents from '../components/ui/marketing/TableOfContents';

const SECTIONS = [
  { id: 'plain-summary', title: 'Plain-Language Summary' },
  { id: '1-license-scope', title: '1. Software License & Scope' },
  { id: '2-customer-data-ownership', title: '2. Complete Customer Data Ownership' },
  { id: '3-workplace-compliance', title: '3. Workplace Compliance & Consent' },
  { id: '4-hardware-compatibility', title: '4. Hardware & System Performance' },
  { id: '5-ip-integrity', title: '5. Intellectual Property & Code Integrity' },
  { id: '6-liability-warranties', title: '6. Limitation of Liability & Support' },
  { id: '7-contact-inquiries', title: '7. Notices & Commercial Contact' }
];

export default function TermsPage() {
  const [activeTocId, setActiveTocId] = useState('plain-summary');

  const scrollTo = (id) => {
    setActiveTocId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen public-surface bg-[#070A12] flex flex-col font-sans relative">
      
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#070A12]/90 backdrop-blur-xl sticky top-0 z-30 no-print">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/docs" className="text-slate-400 hover:text-white transition-colors">Docs</Link>
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/support" className="text-slate-400 hover:text-white transition-colors">Support</Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#141B2E] text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Terms</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Document Layout */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Sticky Table of Contents (260px) */}
        <aside className="w-[260px] shrink-0 hidden lg:block no-print">
          <div className="sticky top-24 space-y-4">
            <TableOfContents
              items={SECTIONS}
              activeId={activeTocId}
              onItemClick={scrollTo}
            />

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/[0.08] text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono-tag">
                <FileText className="w-3.5 h-3.5" />
                <span>Commercial On-Premise License</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Clear license scope, 100% customer data sovereignty, and zero cloud lock-in.
              </p>
            </div>
          </div>
        </aside>

        {/* Center Legal Prose (max 760px) */}
        <div className="flex-1 min-w-0 max-w-[760px] space-y-10 text-slate-300 text-sm leading-relaxed">
          
          {/* Header Block */}
          <div className="pb-8 border-b border-white/[0.08] space-y-3">
            <span className="text-[11px] font-mono-tag uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block font-bold">
              Commercial Terms of Service
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              AuraPass Terms of Service
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono-tag pt-1">
              <span>Effective: November 3, 2026</span>
              <span>&bull;</span>
              <span>Last Updated: November 3, 2026</span>
              <span>&bull;</span>
              <span>Version: v2026.2</span>
            </div>
          </div>

          {/* Plain Language Summary Callout */}
          <section id="plain-summary" className="scroll-mt-24">
            <Callout type="info" title="Plain-Language Summary (Does Not Replace Full Legal Text)">
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                <li><strong>On-Premise License:</strong> You are granted a license to run AuraPass locally on your hardware for workplace attendance and access verification.</li>
                <li><strong>You Own All Data:</strong> Your organization owns 100% of employee photos, vectors, logs, and rosters. We make zero claim of ownership.</li>
                <li><strong>Workplace Compliance:</strong> You are responsible for complying with regional employee biometric notice and consent laws.</li>
                <li><strong>Hardware Performance:</strong> Under-300ms verification requires meeting recommended 4-core CPU and illumination guidelines.</li>
                <li><strong>No Hidden Cloud Fees:</strong> We do not charge per-scan fees or surge costs for local attendance events.</li>
              </ul>
            </Callout>
          </section>

          {/* Section 1 */}
          <section id="1-license-scope" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              1. Software License & Scope
            </h2>
            <p>
              Subject to these Terms, AuraPass grants your organization a non-exclusive, non-transferable commercial license to install, execute, and operate the AuraPass software across your internal workstations, servers, and security cameras solely for managing employee attendance and facility access.
            </p>
            <p className="text-slate-400 text-xs">
              You are permitted to run AuraPass within completely air-gapped, isolated networks without requiring continuous connectivity to any central licensing server.
            </p>
          </section>

          {/* Section 2 */}
          <section id="2-customer-data-ownership" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              2. Complete Customer Data Ownership
            </h2>
            <p>
              <strong>Your organization owns 100% of all data created, processed, or stored by your AuraPass deployment.</strong> This includes employee enrollment photographs, 512-dimensional vector embeddings, camera identifiers, attendance logs, and shift rosters.
            </p>
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/[0.08] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white font-mono-tag">Zero Vendor Lock-In</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  You maintain the right to export all attendance records to CSV, Excel, or SQL dumps at any time, or permanently delete the database without requesting vendor permission.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="3-workplace-compliance" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              3. Workplace Compliance & Consent
            </h2>
            <p>
              As Data Controller, your organization is responsible for ensuring that facial recognition attendance complies with all applicable national, state, and local labor and biometric privacy laws:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>Providing clear written notice to employees regarding biometric attendance capture.</li>
              <li>Obtaining employee consent where mandated by regional statutes (e.g. Illinois BIPA).</li>
              <li>Ensuring cameras are positioned exclusively at authorized facility entrances, turnstiles, or reception checkpoints.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="4-hardware-compatibility" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              4. Hardware & System Performance
            </h2>
            <p>
              AuraPass operates using standard RTSP / ONVIF security cameras and USB webcams. While AuraPass is tested across multi-vendor cameras (Hikvision, Dahua, Axis, Hanwha), overall system verification latency (under 300 ms) depends upon adequate host computing resources (recommended 4+ CPU cores, 8 GB RAM) and appropriate entrance illumination.
            </p>
          </section>

          {/* Section 5 */}
          <section id="5-ip-integrity" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              5. Intellectual Property & Code Integrity
            </h2>
            <p>
              The AuraPass software architecture, user interface design systems, deep learning pipeline orchestration, and trade dress remain the intellectual property of AuraPass Enterprise. You agree not to distribute or sublicense the core proprietary software weights to third parties.
            </p>
          </section>

          {/* Section 6 */}
          <section id="6-liability-warranties" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              6. Limitation of Liability & Support
            </h2>
            <p>
              The software is provided "as is" with enterprise warranty protections detailed in your commercial service-level agreement (SLA). Because AuraPass runs on customer-managed hardware, AuraPass is not liable for data loss arising from host computer physical failures, power outages, or unauthorized physical tampering with on-site camera wiring.
            </p>
          </section>

          {/* Section 7 */}
          <section id="7-contact-inquiries" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              7. Notices & Commercial Contact
            </h2>
            <p>
              For commercial licensing inquiries or contractual amendments, contact:
            </p>
            <div className="p-3.5 rounded-xl bg-[#0F1524] border border-white/[0.08] font-mono-tag text-xs text-emerald-300">
              TODO(owner): Insert organization legal contact email (e.g. legal@aurapass.org)
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070D] py-8 px-6 text-center text-xs text-slate-500 font-mono-tag no-print">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Commercial Terms of Service v2026.2.</p>
      </footer>
    </div>
  );
}
