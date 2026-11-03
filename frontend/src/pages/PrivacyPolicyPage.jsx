import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Lock,
  Printer,
  ChevronRight,
  FileText
} from 'lucide-react';
import Callout from '../components/ui/marketing/Callout';
import TableOfContents from '../components/ui/marketing/TableOfContents';

const SECTIONS = [
  { id: 'plain-summary', title: 'Plain-Language Summary' },
  { id: '1-data-controller', title: '1. Data Controller & Deployment Model' },
  { id: '2-data-categories', title: '2. Information Processed & Stored' },
  { id: '3-biometric-protection', title: '3. Biometric Vectors & Irreversibility' },
  { id: '4-zero-cloud', title: '4. Local Processing & Zero Cloud Egress' },
  { id: '5-employee-rights', title: '5. Employee Biometric Rights & Consent' },
  { id: '6-retention-deletion', title: '6. Data Retention & 1-Click Purging' },
  { id: '7-contact-governance', title: '7. Policy Updates & Governance Contact' }
];

export default function PrivacyPolicyPage() {
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
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/docs" className="text-slate-400 hover:text-white transition-colors">Docs</Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/support" className="text-slate-400 hover:text-white transition-colors">Support</Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#141B2E] text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Policy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Document Layout */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-12 flex flex-col lg:flex-row gap-12">
        
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
                <Shield className="w-3.5 h-3.5" />
                <span>On-Premise Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Biometric data never leaves your workplace hardware. No external cloud processing.
              </p>
            </div>
          </div>
        </aside>

        {/* Center Legal Prose (max 760px) */}
        <div className="flex-1 min-w-0 max-w-[760px] space-y-10 text-slate-300 text-sm leading-relaxed">
          
          {/* Header Block */}
          <div className="pb-8 border-b border-white/[0.08] space-y-3">
            <span className="text-[11px] font-mono-tag uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block font-bold">
              Biometric Privacy & Data Governance
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              AuraPass Privacy Policy
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
                <li><strong>Local Ownership:</strong> Your organization is the sole Data Controller. AuraPass operates on your local equipment; our team has no access to your cameras or staff data.</li>
                <li><strong>One-Way Numeric Vectors:</strong> Facial imagery is converted into irreversible 512-dimensional numeric unit vectors. Original photographs are not required after enrollment.</li>
                <li><strong>Zero Cloud Egress:</strong> The software operates 100% offline. No face images, vectors, or timestamps are sent to external cloud APIs.</li>
                <li><strong>Employee Rights:</strong> Administrators can delete an employee profile and purge their facial vectors permanently in one click.</li>
                <li><strong>No Advertising or Tracking:</strong> The application contains zero commercial tracking pixels, telemetry scripts, or third-party cookies.</li>
              </ul>
            </Callout>
          </section>

          {/* Section 1 */}
          <section id="1-data-controller" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              1. Data Controller & Deployment Model
            </h2>
            <p>
              In the AuraPass software ecosystem, <strong>your organization is the sole Data Controller</strong>. AuraPass is delivered as an on-premise software package deployed within your private local network, internal workstation, or dedicated on-site server appliance.
            </p>
            <p className="text-slate-400 text-xs">
              AuraPass creators, maintainers, and hosting infrastructure providers act strictly as software authors. We do not have remote access, administrative credentials, or transmission pipelines to view, copy, or process your employee database or camera feeds.
            </p>
          </section>

          {/* Section 2 */}
          <section id="2-data-categories" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              2. Information Processed & Stored
            </h2>
            <p>
              AuraPass processes only the minimum data required to calculate automated attendance records:
            </p>

            <div className="overflow-x-auto my-4 rounded-xl border border-white/[0.08] bg-[#0A0E17]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0F1626] border-b border-white/[0.08] text-slate-300 font-mono-tag uppercase">
                  <tr>
                    <th className="p-3">Data Category</th>
                    <th className="p-3">Technical Description</th>
                    <th className="p-3">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="p-3 font-semibold text-white">Staff Metadata</td>
                    <td className="p-3 text-slate-300">Full name, badge ID, department assignment.</td>
                    <td className="p-3 text-slate-400">Duration of employment.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Biometric Vector</td>
                    <td className="p-3 text-slate-300">512-dimensional float32 coordinate vector.</td>
                    <td className="p-3 text-slate-400">Deleted immediately upon staff removal.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Attendance Logs</td>
                    <td className="p-3 text-slate-300">Date, timestamp, camera lane, match confidence.</td>
                    <td className="p-3 text-slate-400">Configured by customer retention policy.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section id="3-biometric-protection" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              3. Biometric Vectors & Irreversibility
            </h2>
            <p>
              Embeddings are designed as one-way numeric representations. AuraPass does not store raw face images after enrollment processing. Facial crops are transformed via neural network layers into a 512-dimensional hypersphere coordinate vector.
            </p>
            <p className="text-slate-400 text-xs">
              Because convolutional pooling and dense normalization discard raw pixel intensity matrices, the stored vector cannot be reverse-engineered to reconstruct the original employee photograph.
            </p>
          </section>

          {/* Section 4 */}
          <section id="4-zero-cloud" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              4. Local Processing & Zero Cloud Egress
            </h2>
            <p>
              AuraPass runs fully offline. No outbound internet connection is required for ongoing operations. All camera decoding, anti-spoofing liveness scoring, and database lookups execute within the physical confines of your local host.
            </p>
          </section>

          {/* Section 5 */}
          <section id="5-employee-rights" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              5. Employee Biometric Rights & Consent
            </h2>
            <p>
              AuraPass is built to support GDPR Article 9, Illinois BIPA, and California CCPA/CPRA requirements. Compliance depends on how your organization deploys and operates the system. As Data Controller, you are responsible for obtaining appropriate written employee notices or consent forms where required by regional labor regulations.
            </p>
          </section>

          {/* Section 6 */}
          <section id="6-retention-deletion" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              6. Data Retention & 1-Click Purging
            </h2>
            <p>
              Administrators maintain complete control over biometric template lifecycles. Removing a staff member from the console immediately purges their 512-dimensional embedding from the active index file.
            </p>
          </section>

          {/* Section 7 */}
          <section id="7-contact-governance" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-white pt-4 border-t border-white/[0.08]">
              7. Policy Updates & Governance Contact
            </h2>
            <p>
              We reserve the right to update this policy to reflect software architectural updates. Direct any governance questions to:
            </p>
            <div className="p-3.5 rounded-xl bg-[#0F1524] border border-white/[0.08] font-mono-tag text-xs text-emerald-300">
              TODO(owner): Insert organization legal contact email (e.g. privacy@aurapass.org)
            </div>
            <p className="text-[11px] text-slate-500 pt-2 italic">
              *Notice: This document provides software operational disclosures and does not substitute formal legal counsel review.*
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070D] py-8 px-6 text-center text-xs text-slate-500 font-mono-tag no-print">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Local Privacy Policy v2026.2.</p>
      </footer>
    </div>
  );
}
