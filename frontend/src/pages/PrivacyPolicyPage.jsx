import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import Badge from '../components/ui/marketing/Badge';
import Button from '../components/ui/marketing/Button';
import {
  Shield,
  Printer,
  FileText,
  Lock,
  Server,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

const TOC_SECTIONS = [
  { id: 'section-01', title: '1. Introduction & Architectural Scope' },
  { id: 'section-02', title: '2. Biometric Data Collection & Representation' },
  { id: 'section-03', title: '3. Zero Cloud Egress & Local Data Residency' },
  { id: 'section-04', title: '4. Non-Invertibility of Vector Embeddings' },
  { id: 'section-05', title: '5. Storage & AES-256 Encryption at Rest' },
  { id: 'section-06', title: '6. Retention & Automated Deletion Lifecycle' },
  { id: 'section-07', title: '7. Access Control & Immutable Audit Logging' },
  { id: 'section-08', title: '8. Statutory Alignment & DPO Inquiries' },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('section-01');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = TOC_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(TOC_SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(TOC_SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen public-surface flex flex-col font-sans transition-colors duration-200">
      {/* Precision Print Styles */}
      <style>{`
        @media print {
          header, footer, aside, .no-print {
            display: none !important;
          }
          body, .public-surface {
            background: #ffffff !important;
            color: #000000 !important;
          }
          article {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Unified Public Header */}
      <PublicHeader />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Document Header & Legal Review Notice */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" dot>Biometric Data Sovereignty</Badge>
              <span className="text-xs font-mono text-muted-foreground">Version: 2026.2 LTS</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="no-print"
            >
              Print Policy / Save PDF
            </Button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            AuraPass™ Enterprise Biometric Privacy & Data Handling Policy
          </h1>

          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            This document outlines the technical and operational privacy protections built into AuraPass Enterprise software. It governs how facial biometric vectors, camera streams, and attendance records are processed on-premise.
          </p>

          {/* Legal Notice Callout */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <strong className="font-semibold">Notice for Deploying Organizations:</strong> This policy reflects the technical capabilities and zero-egress commitments of the AuraPass software. The deploying organization acts as the Data Controller under applicable privacy laws (e.g. GDPR, DPDP Act 2023, BIPA) and is responsible for obtaining employee consent and tailoring statutory policies to their jurisdiction.
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Column 1: Left Sticky Table of Contents ─── */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4 no-print">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
              <div className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
                Policy Sections
              </div>
              <nav className="space-y-1 text-xs">
                {TOC_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-xs ${
                      activeSection === sec.id
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">Data Protection Inquiries</div>
              <p className="text-[11px] leading-relaxed">
                For compliance verifications or questions regarding on-premise cryptographic isolation:
              </p>
              <a href="mailto:privacy@vixora.co.in" className="text-emerald-600 dark:text-emerald-400 font-mono text-xs hover:underline block">
                privacy@vixora.co.in
              </a>
            </div>
          </aside>

          {/* ─── Column 2: Legal Content Canvas (Solid, High Contrast) ─── */}
          <article className="lg:col-span-8 bg-card rounded-2xl border border-border p-6 sm:p-10 shadow-sm space-y-10 text-sm leading-relaxed text-muted-foreground">
            {/* Section 01 */}
            <section id="section-01" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                1. Introduction & Architectural Scope
              </h2>
              <p>
                AuraPass™ Enterprise operates as a self-contained, air-gapped presence verification and access control software appliance. It is deployed within the internal computer networks and on-premise hardware controlled exclusively by the customer organization ("Deploying Organization").
              </p>
              <p>
                In the context of statutory data protection legislation, the Deploying Organization acts as the **Data Controller** (determining the purposes and means of processing personal data), while AuraPass operates strictly as the technical execution substrate.
              </p>
            </section>

            {/* Section 02 */}
            <section id="section-02" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                2. Biometric Data Collection & Representation
              </h2>
              <p>
                AuraPass processes facial data exclusively for physical entrance authentication, shift attendance logging, and presentation attack rejection. The software collects and transforms data as follows:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Enrollment Protocol:</strong> Three optical facial crops (frontal, 15° left, 15° right) are captured once during initial registration to generate a normalized 512-dimensional vector.
                </li>
                <li>
                  <strong className="text-foreground">Inference Execution:</strong> Incoming live RTSP camera frames are held strictly in temporary volatile RAM buffer for under 300 milliseconds during landmark alignment and cosine comparison.
                </li>
                <li>
                  <strong className="text-foreground">Immediate Frame Purge:</strong> Raw video frames are discarded immediately post-inference and are never written to secondary storage or persistent disks.
                </li>
              </ul>
            </section>

            {/* Section 03 */}
            <section id="section-03" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                3. Zero Cloud Egress & Local Data Residency
              </h2>
              <p>
                AuraPass is built from the ground up for absolute local data sovereignty:
              </p>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Technical Air-Gap Verification</span>
                </div>
                <p>
                  The engine initiates zero outbound network connections. It does not transmit biometric data, employee identifiers, video feeds, or attendance records to external cloud services, third-party AI APIs, or foreign telemetry hosts.
                </p>
              </div>
            </section>

            {/* Section 04 */}
            <section id="section-04" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                4. Non-Invertibility of Vector Embeddings
              </h2>
              <p>
                Biometric identifiers are stored exclusively as 512-dimensional numerical floating-point coordinate vectors (using FaceNet512 / GhostFaceNet embeddings).
              </p>
              <p>
                These vectors represent non-linear mathematical distances across landmark coordinates. It is mathematically and cryptographically impossible to reverse-engineer or reconstruct an individual's original optical facial likeness from the stored numeric array.
              </p>
            </section>

            {/* Section 05 */}
            <section id="section-05" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                5. Storage & AES-256 Encryption at Rest
              </h2>
              <p>
                All local database files (SQLite WAL or PostgreSQL 15+) reside exclusively within the Deploying Organization's internal filesystem. Vector databases are encrypted at rest using AES-256 encryption keys managed directly by the Deploying Organization's system administrators.
              </p>
              <p>
                Multi-tenant deployments utilize isolated tenant schemas and cryptographically partitioned galleries, preventing any possibility of cross-organization vector leakage.
              </p>
            </section>

            {/* Section 06 */}
            <section id="section-06" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                6. Retention & Automated Deletion Lifecycle
              </h2>
              <p>
                The Deploying Organization configures data retention windows according to their corporate governance and local statutory guidelines:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Active Employment:</strong> Vectors remain active for matching during an employee's authorized tenure.
                </li>
                <li>
                  <strong className="text-foreground">One-Click Profile Deletion:</strong> Deleting an employee via the console executes a database <code className="text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground">CASCADE</code> operation that irreversibly overwrites their vector embeddings.
                </li>
                <li>
                  <strong className="text-foreground">Automated Audit Rotation:</strong> Verification logs can be configured to auto-purge after 30, 90, or 365 days.
                </li>
              </ul>
            </section>

            {/* Section 07 */}
            <section id="section-07" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                7. Access Control & Immutable Audit Logging
              </h2>
              <p>
                Access to the administrative console and reporting tools is strictly governed by Role-Based Access Control (RBAC):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="font-bold text-foreground">Organization Admin</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Full configuration, camera management, and employee deletion.</div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="font-bold text-foreground">HR Manager</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Attendance viewing, shift assignment, and payroll exports.</div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="font-bold text-foreground">Security Guard</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Live entrance monitor and manual punch override only.</div>
                </div>
              </div>
            </section>

            {/* Section 08 */}
            <section id="section-08" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                8. Statutory Alignment & DPO Inquiries
              </h2>
              <p>
                AuraPass Enterprise is architected to facilitate organizational compliance with international biometric data privacy legislation:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong className="text-foreground">European Union GDPR:</strong> Article 9 compliance for processing special category biometric data on a local sovereign basis.</li>
                <li><strong className="text-foreground">United States BIPA:</strong> Illinois Biometric Information Privacy Act (740 ILCS 14/) consent workflows and retention schedules.</li>
                <li><strong className="text-foreground">India DPDP Act 2023:</strong> Full data localization within India with zero cross-border transfer.</li>
              </ul>
              <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                <span>Formal Inquiries: <strong className="text-foreground">privacy@vixora.co.in</strong></span>
                <Link to="/terms" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                  Review Terms of Service →
                </Link>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* Unified Public Footer */}
      <PublicFooter />
    </div>
  );
}
