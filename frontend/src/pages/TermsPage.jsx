import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import Badge from '../components/ui/marketing/Badge';
import Button from '../components/ui/marketing/Button';
import {
  Scale,
  Printer,
  Shield,
  AlertCircle,
  CheckCircle,
  FileText,
  Lock,
  Server
} from 'lucide-react';

const TERMS_SECTIONS = [
  { id: 'terms-01', title: '1. License Grant & Deployment Scope' },
  { id: 'terms-02', title: '2. Data Custody & Zero Cloud Egress' },
  { id: 'terms-03', title: '3. Workplace Consent & Labor Compliance' },
  { id: 'terms-04', title: '4. Physical Hardware Boundary & Turnstile Safety' },
  { id: 'terms-05', title: '5. Intellectual Property & Model Weights' },
  { id: 'terms-06', title: '6. Service Level Agreements & Warranties' },
  { id: 'terms-07', title: '7. Termination & Zero-Trace Disk Wipe' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('terms-01');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = TERMS_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(TERMS_SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(TERMS_SECTIONS[i].id);
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
        {/* Document Header */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="zinc" dot>Enterprise Software Terms</Badge>
              <span className="text-xs font-mono text-muted-foreground">Version: 2026.2 LTS</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="no-print"
            >
              Print Terms / Save PDF
            </Button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            AuraPass™ Enterprise Commercial Software License Agreement
          </h1>

          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            These terms govern the download, deployment, and operational execution of AuraPass Enterprise on-premise software.
          </p>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm text-muted-foreground leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-foreground" />
            <div>
              <strong className="font-semibold text-foreground">Commercial Agreement Notice:</strong> This document represents the standard software licensing terms. Custom enterprise master service agreements (MSAs) executed with AuraPass Enterprise take legal precedence over this online standard.
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Column 1: Left Sticky Navigation ─── */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4 no-print">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
              <div className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
                Agreement Sections
              </div>
              <nav className="space-y-1 text-xs">
                {TERMS_SECTIONS.map((sec) => (
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
              <div className="font-semibold text-foreground">Commercial Licensing Support</div>
              <p className="text-[11px] leading-relaxed">
                For custom on-premise site keys, distributor agreements, or SLA customizations:
              </p>
              <a href="mailto:legal@vixora.co.in" className="text-emerald-600 dark:text-emerald-400 font-mono text-xs hover:underline block">
                legal@vixora.co.in
              </a>
            </div>
          </aside>

          {/* ─── Column 2: Legal Content Canvas ─── */}
          <article className="lg:col-span-8 bg-card rounded-2xl border border-border p-6 sm:p-10 shadow-sm space-y-10 text-sm leading-relaxed text-muted-foreground">
            {/* Terms 01 */}
            <section id="terms-01" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                1. License Grant & Deployment Scope
              </h2>
              <p>
                Subject to the terms of this Agreement, AuraPass grants the Deploying Organization a non-exclusive, non-transferable, revocable license to deploy, execute, and operate the AuraPass Enterprise software solely within the organization's designated on-premise facilities and private cloud instances.
              </p>
              <p>
                Deployment is authorized for the number of enrolled employees and active RTSP camera feeds defined within the organization's active license tier (Starter, Business Pro, or Custom Enterprise).
              </p>
            </section>

            {/* Terms 02 */}
            <section id="terms-02" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                2. Data Custody & Zero Cloud Egress
              </h2>
              <p>
                The Deploying Organization retains 100% exclusive legal title, ownership, and custody over all databases, biometric vector embeddings, employee names, timestamps, and camera streams processed by the software.
              </p>
              <p>
                AuraPass affirms that the software does not transmit, replicate, or synchronize any customer biometric data to AuraPass, external third parties, or cloud hosting providers.
              </p>
            </section>

            {/* Terms 03 */}
            <section id="terms-03" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                3. Workplace Consent & Labor Compliance
              </h2>
              <p>
                The Deploying Organization is solely responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Procuring all legally required employee and contractor consents prior to biometric enrollment.</li>
                <li>Complying with applicable workplace monitoring, biometric privacy (e.g. BIPA, GDPR Art 9, DPDP Act 2023), and collective bargaining agreements.</li>
                <li>Providing accessible alternative check-in mechanisms (such as manual PIN or supervisory override) for staff who decline biometric presence verification.</li>
              </ul>
            </section>

            {/* Terms 04 */}
            <section id="terms-04" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                4. Physical Hardware Boundary & Turnstile Safety
              </h2>
              <p>
                AuraPass interfaces with physical access barriers (such as speed gates, flap turnstiles, and electromagnetic magnetic door locks) via standard dry-contact relay signals.
              </p>
              <p>
                <strong className="text-foreground">Life Safety Requirement:</strong> The Deploying Organization must ensure that all physical turnstiles and gates include a fail-open emergency hardware interlock connected to the building's central fire alarm control panel, independent of software operation.
              </p>
            </section>

            {/* Terms 05 */}
            <section id="terms-05" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                5. Intellectual Property & Model Weights
              </h2>
              <p>
                AuraPass and its licensors retain all intellectual property rights in the software architecture, deep neural network inference pipelines, compiled binaries, and user interfaces.
              </p>
              <p>
                The Deploying Organization shall not reverse engineer, decompile, extract neural weights, or redistribute the software engine to unauthorized third parties.
              </p>
            </section>

            {/* Terms 06 */}
            <section id="terms-06" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                6. Service Level Agreements & Warranties
              </h2>
              <p>
                AuraPass warrants that the software will perform substantially in accordance with the technical specifications published in the official documentation.
              </p>
              <p>
                Production recognition accuracy (benchmarked at 99.4% on academic benchmarks) depends upon adhering to documented illumination (300 to 700 Lux), camera angles (within 15° yaw), and network bandwidth requirements.
              </p>
            </section>

            {/* Terms 07 */}
            <section id="terms-07" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-foreground pb-2 border-b border-border">
                7. Termination & Zero-Trace Disk Wipe
              </h2>
              <p>
                Upon termination of the license agreement, the Deploying Organization retains its raw attendance records and payroll logs. The Deploying Organization agrees to discontinue use of the software engine and may execute a full zero-trace disk wipe of vector embeddings at their discretion.
              </p>
              <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                <span>Legal Counsel Inquiries: <strong className="text-foreground">legal@vixora.co.in</strong></span>
                <Link to="/privacy-policy" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                  Review Privacy Policy →
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
