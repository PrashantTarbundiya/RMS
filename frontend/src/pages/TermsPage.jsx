import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Printer,
  Scale,
  CheckCircle,
  FileText,
  Key,
  Server,
  Gavel,
  ShieldCheck,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

const TERMS_TOC = [
  { id: 'terms-01', num: '01', title: 'License Grant & Scope' },
  { id: 'terms-02', num: '02', title: 'Data Custody & Egress' },
  { id: 'terms-03', num: '03', title: 'Workplace & Labor Consent' },
  { id: 'terms-04', num: '04', title: 'Hardware & SLA Boundary' },
  { id: 'terms-05', num: '05', title: 'IP & Weight Protection' },
  { id: 'terms-06', num: '06', title: 'Indemnity & Liability' },
  { id: 'terms-07', num: '07', title: 'Termination & Wipe' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('terms-01');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = TERMS_TOC.length - 1; i >= 0; i--) {
        const el = document.getElementById(TERMS_TOC[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(TERMS_TOC[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#06090B] text-[#F3F6F5] font-sans antialiased selection:bg-[#3DDC97]/20 selection:text-[#3DDC97] flex flex-col">
      {/* Precision Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-contrast-text {
            color: #111827 !important;
          }
          .print-box {
            border: 1px solid #9ca3af !important;
            background: #f9fafb !important;
            color: #111827 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #d1d5db !important;
            color: #111827 !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#06090B]/90 backdrop-blur-md border-b border-white/[0.08] no-print">
        <div className="flex justify-between items-center h-14 px-4 sm:px-6 max-w-[1160px] mx-auto w-full">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-[#3DDC97]/10 border border-[#3DDC97]/20 flex items-center justify-center text-[#3DDC97] group-hover:border-[#3DDC97]/40 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-wider text-[#F3F6F5]">AuraPass</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#3DDC97] px-1.5 py-0.5 rounded bg-[#3DDC97]/10 border border-[#3DDC97]/20">
                  Enterprise
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs">
              <Link to="/" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
                Home
              </Link>
              <Link to="/docs" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
                Docs Hub
              </Link>
              <Link to="/support" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
                Help Center
              </Link>
              <Link to="/privacy-policy" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-[#3DDC97] font-medium flex items-center gap-1">
                <span>Terms of Service</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] inline-block" />
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.2] bg-[#10171B] text-xs font-mono text-[#9AA7A3] hover:text-[#F3F6F5] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Terms</span>
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3DDC97] text-[#06090B] hover:bg-[#5FE8AD] text-xs font-semibold tracking-tight transition-all"
            >
              <span>Open Console</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-[#10171B] border border-white/[0.08] text-[#9AA7A3]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B1013] border-b border-white/[0.08] px-4 py-3 space-y-2">
            <Link to="/" className="block text-xs text-[#9AA7A3] py-1.5">Home</Link>
            <Link to="/docs" className="block text-xs text-[#9AA7A3] py-1.5">Docs Hub</Link>
            <Link to="/support" className="block text-xs text-[#9AA7A3] py-1.5">Help Center</Link>
            <Link to="/privacy-policy" className="block text-xs text-[#9AA7A3] py-1.5">Privacy Policy</Link>
            <div className="pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] font-mono text-[#66726E] uppercase mb-1">Jump to Section:</div>
              {TERMS_TOC.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left text-xs py-1 text-[#9AA7A3] hover:text-[#3DDC97]"
                >
                  {item.num} {item.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Banner */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12 border-b border-white/[0.08] bg-gradient-to-b from-[#0B1013] to-[#06090B]">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[11px] text-[#3DDC97] uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              ENTERPRISE SOFTWARE LICENSE // MASTER TERMS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#F3F6F5] tracking-tight mb-3">
            Terms of Service & Software Agreement
          </h1>
          <p className="text-[#9AA7A3] text-sm md:text-base max-w-[68ch] leading-relaxed mb-6">
            Commercial terms, sovereign on-premise execution licenses, warranty boundaries, and indemnification standards governing AuraPass enterprise node software.
          </p>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-4 border-t border-white/[0.08] font-mono text-xs text-[#66726E]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
              <span className="text-[#F3F6F5]">Version 2026.2 (Active)</span>
            </div>
            <span className="text-white/20">|</span>
            <div>
              <span>Effective: <strong className="text-[#9AA7A3] font-normal">October 24, 2026</strong></span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <span>Model: <span className="text-[#9AA7A3]">Per-Facility Sovereign Node</span></span>
            </div>
            <span className="text-white/20">|</span>
            <div>
              <span>Contract ID: <code className="text-[#3DDC97]">AP-AGR-TERMS-2026v2</code></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Canvas */}
      <main className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col md:flex-row gap-8 lg:gap-12 items-start flex-1 w-full">
        {/* Left Sticky Rail */}
        <aside className="w-full md:w-[270px] shrink-0 md:sticky md:top-20 space-y-6 no-print">
          <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#66726E] mb-1">
                License Classification
              </div>
              <div className="text-xs font-mono text-[#F3F6F5] flex items-center justify-between">
                <span>Enterprise Sovereign</span>
                <span className="text-[#3DDC97] text-[10px] bg-[#3DDC97]/10 px-1.5 py-0.5 rounded border border-[#3DDC97]/20">
                  Standard
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-mono text-[#9AA7A3] pt-3 border-t border-white/[0.08]">
              <div className="flex justify-between">
                <span className="text-[#66726E]">Seats:</span>
                <span className="text-[#F3F6F5]">Unlimited Local</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66726E]">Telemetry:</span>
                <span className="text-[#3DDC97]">Air-Gapped (Zero)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66726E]">Audit:</span>
                <span>Self-Hosted</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#10171B] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium text-[#F3F6F5] transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Agreement</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#66726E] mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Agreement Sections
            </h3>
            <nav className="space-y-1 text-xs">
              {TERMS_TOC.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#3DDC97] bg-[#3DDC97]/10 font-medium'
                        : 'text-[#9AA7A3] hover:text-[#F3F6F5] hover:bg-white/[0.02]'
                    }`}
                  >
                    <span>{item.num} {item.title}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Article Content */}
        <article className="w-full max-w-[760px] space-y-12 text-[#9AA7A3] text-sm leading-relaxed print-contrast-text">
          {/* Executive Plain-Language Summary Box */}
          <section className="border border-[#3DDC97]/30 bg-[#3DDC97]/[0.04] p-5 md:p-6 rounded-xl space-y-3 print-box">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#3DDC97] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                EXECUTIVE SUMMARY OF COMMERCIAL TERMS
              </span>
              <span className="text-[11px] font-mono text-[#66726E]">(Plain Language Overview)</span>
            </div>
            <p className="text-[#F3F6F5] text-sm leading-relaxed">
              AuraPass licenses software for on-premise execution inside your physical facilities. You retain 100% legal ownership and physical control of all attendance records, facial vectors, and database ledgers. AuraPass has zero egress rights, zero telemetry requirements, and charges flat per-facility rates without employee seat surcharges.
            </p>
          </section>

          {/* Section 01 */}
          <section className="space-y-4 pt-2" id="terms-01">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">01 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                License Grant & Scope of Use
              </h2>
            </div>
            <p>
              Subject to commercial compliance with the applicable order form, AuraPass grants Customer a non-exclusive, non-transferable license to install and run the AuraPass Edge Container Image within designated physical facilities ("Nodes").
            </p>
            <ul className="space-y-2 text-xs font-mono text-[#F3F6F5] pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>Unlimited Local Personnel: You may enroll all authorized staff without per-employee seat licensing caps.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>Multi-Stream Ingestion: Nodes support multiple concurrent RTSP camera streams up to host hardware capability.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>Offline Cryptographic Key: Activation is validated offline via local public key signature without outbound pings.</span>
              </li>
            </ul>
          </section>

          {/* Section 02 */}
          <section className="space-y-4 pt-4" id="terms-02">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">02 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Complete Customer Data Custody & Zero Cloud Egress
              </h2>
            </div>
            <p>
              AuraPass makes no claim of ownership over any data generated during operations. Customer maintains exclusive title to:
            </p>
            <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#3DDC97] font-mono">
                <Key className="w-3.5 h-3.5" />
                <span>Customer Sovereign Assets</span>
              </div>
              <p className="text-[#9AA7A3] leading-relaxed">
                All 512-dimensional vector embeddings, attendance records, check-in timestamps, camera assignments, and audit trails remain encrypted on customer-managed storage volumes under customer-held encryption keys. AuraPass cannot decrypt, access, or export customer data.
              </p>
            </div>
          </section>

          {/* Section 03 */}
          <section className="space-y-4 pt-4" id="terms-03">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">03 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Workplace Compliance & Labor Consent Obligations
              </h2>
            </div>
            <p>
              Customer represents and warrants that its physical deployment of biometric verification complies with all applicable workplace privacy and collective bargaining frameworks:
            </p>
            <ul className="space-y-2 text-xs text-[#9AA7A3] pl-2 list-disc list-inside">
              <li>Customer shall obtain written consent or provide statutory opt-out mechanisms where required by local employment statutes (e.g., BIPA 740 ILCS 14/, GDPR Art. 9, DPDP Act 2023).</li>
              <li>Customer shall maintain alternative non-biometric attendance verification paths (such as RFID badging or manual supervisor PIN entry) for exempt or non-consenting employees.</li>
              <li>Customer shall display visible physical signage at facility entrances notifying occupants of automated biometric presence verification.</li>
            </ul>
          </section>

          {/* Section 04 */}
          <section className="space-y-4 pt-4" id="terms-04">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">04 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Hardware Requirements & SLA Boundary
              </h2>
            </div>
            <p>
              Verification throughput and latency metrics (such as the sub-300ms verification cycle) depend upon minimum host system specifications and network conditions:
            </p>
            <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2 font-mono text-xs">
              <div className="text-[#F3F6F5] font-semibold">Minimum Edge Node Profile:</div>
              <div className="text-[#9AA7A3]">
                • CPU: 4+ physical cores (Intel Xeon, AMD EPYC, Core i5+, Apple Silicon, or ARM Neoverse)<br />
                • Memory: 8 GB RAM minimum (16 GB recommended for 8+ concurrent camera streams)<br />
                • Camera Stream: RTSP H.264/H.265 baseline profile with ≥15 FPS at 1080p<br />
                • Benchmark Reference: 99.4% on academic LFW; real-world accuracy depends on illumination (≥150 lux recommended) and camera angle (≤15° yaw/pitch).
              </div>
            </div>
          </section>

          {/* Section 05 */}
          <section className="space-y-4 pt-4" id="terms-05">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">05 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Intellectual Property & Model Weights Protection
              </h2>
            </div>
            <p>
              AuraPass retains all right, title, and interest in and to the Software, deep learning model architectures, compiled weights, and anti-spoofing heuristics. Customer agrees not to:
            </p>
            <ul className="space-y-1.5 text-xs text-[#9AA7A3] pl-2 list-disc list-inside">
              <li>Reverse engineer, decompile, or extract proprietary neural network weights from runtime container binaries.</li>
              <li>Re-distribute, sub-license, or lease the Software to third parties without prior written authorization.</li>
              <li>Alter or remove proprietary notices, cryptographic hashes, or license headers.</li>
            </ul>
          </section>

          {/* Section 06 */}
          <section className="space-y-4 pt-4" id="terms-06">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">06 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Warranties, Indemnification & Limitation of Liability
              </h2>
            </div>
            <p>
              <strong className="text-[#F3F6F5]">6.1 Air-Gap & Zero-Egress Warranty:</strong> AuraPass warrants that the compiled Software does not transmit biometric vectors or camera frames across third-party networks. In the event of a proven material breach of this warranty caused directly by unmodified AuraPass code, Licensor provides comprehensive enterprise indemnification.
            </p>
            <p>
              <strong className="text-[#F3F6F5]">6.2 Limitation of Damages:</strong> Except for indemnification obligations and willful misconduct, neither party's aggregate liability shall exceed the total license fees paid by Customer to Licensor during the twelve (12) months preceding the incident.
            </p>
          </section>

          {/* Section 07 */}
          <section className="space-y-4 pt-4 pb-8" id="terms-07">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">07 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Termination, Cryptographic Wipe & Governing Law
              </h2>
            </div>
            <p>
              Upon termination or expiration of the license agreement, Customer may execute the built-in cryptographic wipe command (`aurapass-ctl purge-vectors --all`) to irrevocably overwrite all local biometric vectors.
            </p>
            <div className="p-3.5 rounded-lg bg-[#10171B] border border-dashed border-[#3DDC97]/40 font-mono text-xs text-[#3DDC97] space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Gavel className="w-3.5 h-3.5" />
                GOVERNING LAW PLACEHOLDER:
              </div>
              <div className="text-[#F3F6F5]">
                [TODO(owner): Specify governing law jurisdiction and venue, e.g., State of Delaware / Canton of Zurich / New Delhi]
              </div>
            </div>
          </section>
        </article>
      </main>

      {/* Technical Footer */}
      <footer className="w-full bg-[#06090B] border-t border-white/[0.08] no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 px-4 sm:px-6 max-w-[1160px] mx-auto w-full">
          <div className="text-xs text-[#66726E] text-center md:text-left">
            © {new Date().getFullYear()} AuraPass Security Systems. Zero-Knowledge Biometric Infrastructure.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9AA7A3]">
            <Link to="/" className="hover:text-[#F3F6F5] transition-colors">Home</Link>
            <Link to="/docs" className="hover:text-[#F3F6F5] transition-colors">Documentation Hub</Link>
            <Link to="/privacy-policy" className="hover:text-[#F3F6F5] transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-[#F3F6F5] transition-colors">Support & Runbooks</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
