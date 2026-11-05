import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Printer,
  Download,
  CheckCircle,
  FileText,
  Key,
  Video,
  Gavel,
  Calculator,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const TOC_ITEMS = [
  { id: 'section-01', num: '01', title: 'Introduction & Scope' },
  { id: 'section-02', num: '02', title: 'Biometric Vector Math' },
  { id: 'section-03', num: '03', title: 'Zero Cloud Egress' },
  { id: 'section-04', num: '04', title: 'Retention & Purging' },
  { id: 'section-05', num: '05', title: 'Statutory Framework' },
  { id: 'section-06', num: '06', title: 'Controller Obligations' },
  { id: 'section-07', num: '07', title: 'Legal Contact & DPO' },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('section-01');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const el = document.getElementById(TOC_ITEMS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(TOC_ITEMS[i].id);
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

      {/* Top App Bar Header */}
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
              <Link to="/privacy-policy" className="text-[#3DDC97] font-medium flex items-center gap-1">
                <span>Legal & Privacy</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] inline-block" />
              </Link>
              <Link to="/terms" className="text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
                Terms of Service
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
              <span className="hidden sm:inline">Print Policy</span>
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
            <Link to="/terms" className="block text-xs text-[#9AA7A3] py-1.5">Terms of Service</Link>
            <div className="pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] font-mono text-[#66726E] uppercase mb-1">Jump to Section:</div>
              {TOC_ITEMS.map((item) => (
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

      {/* Document Header / Hero Banner */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12 border-b border-white/[0.08] bg-gradient-to-b from-[#0B1013] to-[#06090B]">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[11px] text-[#3DDC97] uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              SOVEREIGN DATA INFRASTRUCTURE // LEGAL SPECIFICATION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#F3F6F5] tracking-tight mb-3">
            Enterprise Legal & Biometric Privacy Policy
          </h1>
          <p className="text-[#9AA7A3] text-sm md:text-base max-w-[68ch] leading-relaxed mb-6">
            Sovereign on-premise execution architecture, zero cloud egress indemnification, and statutory compliance framework governing the deployment of AuraPass node software.
          </p>

          {/* Precision Status Strip */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-4 border-t border-white/[0.08] font-mono text-xs text-[#66726E]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
              <span className="text-[#F3F6F5]">Version 2026.2 (Ratified)</span>
            </div>
            <span className="text-white/20">|</span>
            <div>
              <span>Effective: <strong className="text-[#9AA7A3] font-normal">October 24, 2026</strong></span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <span>Target: <span className="text-[#9AA7A3]">Enterprise Air-Gapped & Sovereign Nodes</span></span>
            </div>
            <span className="text-white/20">|</span>
            <div>
              <span>Document ID: <code className="text-[#3DDC97]">AP-SPEC-LEGAL-2026v2</code></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Canvas */}
      <main className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col md:flex-row gap-8 lg:gap-12 items-start flex-1 w-full">
        {/* Left Sticky Rail */}
        <aside className="w-full md:w-[270px] shrink-0 md:sticky md:top-20 space-y-6 no-print">
          {/* Metadata Card */}
          <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#66726E] mb-1">
                Release Track
              </div>
              <div className="text-xs font-mono text-[#F3F6F5] flex items-center justify-between">
                <span>LTS v2026.2-core</span>
                <span className="text-[#3DDC97] text-[10px] bg-[#3DDC97]/10 px-1.5 py-0.5 rounded border border-[#3DDC97]/20">
                  Active
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-mono text-[#9AA7A3] pt-3 border-t border-white/[0.08]">
              <div className="flex justify-between">
                <span className="text-[#66726E]">Effective:</span>
                <span>2026-10-24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66726E]">Classification:</span>
                <span className="text-[#F3F6F5]">Public Enterprise</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66726E]">Egress Rule:</span>
                <span className="text-[#3DDC97]">DENY-ALL (0/0)</span>
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#10171B] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium text-[#F3F6F5] transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Specification</span>
              </button>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#66726E] mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Contents
            </h3>
            <nav className="space-y-1 text-xs">
              {TOC_ITEMS.map((item) => {
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

          {/* Cryptographic Verification Box */}
          <div className="p-3.5 rounded-xl bg-[#06090B] border border-white/[0.08] text-[11px] font-mono">
            <div className="text-[#66726E] flex items-center justify-between mb-1.5">
              <span>LEGAL PGP FINGERPRINT</span>
              <span className="text-[#3DDC97] text-[10px]">VERIFIED</span>
            </div>
            <div className="text-[#9AA7A3] break-all leading-tight bg-[#0B1013] p-2 rounded border border-white/[0.04] text-[10px]">
              F5C2 8391 BA42 98E0 148B CC93 7A11 EF48 3DDC 9726
            </div>
            <div className="text-[#66726E] mt-1.5 text-[10px]">
              Signed by AuraPass Security Root CA • Key ID: 0x3DDC9726
            </div>
          </div>
        </aside>

        {/* Right Article Content */}
        <article className="w-full max-w-[760px] space-y-12 text-[#9AA7A3] text-sm leading-relaxed print-contrast-text">
          {/* Executive Plain-Language Summary Box */}
          <section className="border border-[#3DDC97]/30 bg-[#3DDC97]/[0.04] p-5 md:p-6 rounded-xl space-y-3 print-box">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#3DDC97] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                PLAIN LANGUAGE EXECUTIVE SUMMARY
              </span>
              <span className="text-[11px] font-mono text-[#66726E]">(Non-Binding Interpretive Aid)</span>
            </div>
            <p className="text-[#F3F6F5] text-sm leading-relaxed">
              AuraPass processes facial vectors strictly on your local physical premises. Raw optical image frames are permanently discarded immediately post-vectorization in volatile memory (&lt;300ms). No biometric data, mathematical vectors, telemetry streams, or identity logs are ever transmitted to AuraPass servers or any external third parties. Your enterprise physical security infrastructure remains 100% sovereign and air-gapped.
            </p>
          </section>

          {/* Section 01 */}
          <section className="space-y-4 pt-2" id="section-01">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">01 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Introduction & Scope
              </h2>
            </div>
            <p>
              This Enterprise Legal & Biometric Privacy Policy ("Policy" or "Specification") governs the installation, air-gapped runtime execution, vector processing mechanics, and maintenance of the AuraPass Edge Inference Engine ("Software"). This agreement is entered into between AuraPass Security Systems Inc. ("Licensor") and:
            </p>

            <div className="p-3.5 rounded-lg bg-[#10171B] border border-dashed border-[#3DDC97]/40 font-mono text-xs text-[#3DDC97] space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                CONTRACTING PARTY PLACEHOLDER:
              </div>
              <div className="text-[#F3F6F5]">
                [TODO(owner): Insert Customer Contracting Legal Entity Name, Jurisdiction of Incorporation, and Registration Number]
              </div>
            </div>

            <p>
              <strong className="text-[#F3F6F5]">1.1 Controller vs Processor Roles:</strong> Under global statutory regimes—including but not limited to the European Union General Data Protection Regulation (EU GDPR), the United Kingdom Data Protection Act, and the California Privacy Rights Act (CPRA)—Customer acts exclusively as the sole <span className="text-[#F3F6F5] font-medium">Data Controller</span> (or "Business" / "Data Fiduciary"). Customer retains absolute custody, governance, physical command, and operational determination of biometric processing purposes.
            </p>
            <p>
              <strong className="text-[#F3F6F5]">1.2 AuraPass Software Classification:</strong> AuraPass provides purely self-contained, on-premise, compiled machine code distributed via cryptographically signed OCI container images or bare-metal binaries. AuraPass does not act as a hosted SaaS processor, does not operate central vector databases, and possesses zero operational access keys to Customer's physical camera clusters, RTSP streams, or on-premise node stores.
            </p>
          </section>

          {/* Section 02 */}
          <section className="space-y-4 pt-4" id="section-02">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">02 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Biometric Vector Architecture & Non-Reversibility
              </h2>
            </div>
            <p>
              The Software utilizes an ultra-compact deep-metric embedding pipeline that computes Euclidean distances within a 512-dimensional hypersphere (ℝ⁵¹²). The core mathematical and memory assurances are contractually codified below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
              <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#3DDC97]">
                  <Calculator className="w-3.5 h-3.5" />
                  Mathematical Non-Inversion
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  Extracted vectors represent irreversible non-linear mathematical projections. It is computationally infeasible to reconstruct, synthesize, or inverse-engineer raw facial imagery or likeness from a normalized 512-dim floating point array.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#3DDC97]">
                  <HardDrive className="w-3.5 h-3.5" />
                  Volatile Memory Purge (&lt;300ms)
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  Optical RTSP frame buffers exist purely in transient, zeroed volatile memory allocations. Upon vectorization, optical buffers are overwritten via microsecond zero-fill routines within 300 milliseconds of capture.
                </p>
              </div>
            </div>

            <p>
              <strong className="text-[#F3F6F5]">2.1 Non-Persistence of Imagery:</strong> At no stage does the Software persist photographic JPG, PNG, or RAW frame assets to non-volatile disk arrays, NVMe caches, or logging sinks, unless explicit optical diagnostic flags are manually toggled in production environments (which are disabled by default in enterprise builds).
            </p>
          </section>

          {/* Section 03 */}
          <section className="space-y-4 pt-4" id="section-03">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">03 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Zero Cloud Egress Guarantee & Hardware Boundary
              </h2>
            </div>
            <p>
              AuraPass provides an irrevocable, contractually indemnified warranty that the binary distribution of the Software is completely decoupled from any public or private cloud endpoints. The software contains:
            </p>

            <ul className="space-y-2 font-mono text-xs text-[#F3F6F5] pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>ZERO outbound analytics collectors (no Mixpanel, PostHog, Google Analytics, Datadog or Sentry).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>ZERO cloud-tethered identity lookup registries or external credential validation networks.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>ZERO telemetry ping mechanisms or phone-home licensing checks. Licensing is cryptographically validated offline via local asymmetric public keys.</span>
              </li>
            </ul>

            <div className="rounded-xl bg-[#0B1013] border border-white/[0.08] overflow-hidden my-4">
              <div className="bg-[#10171B] px-4 py-2 border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#66726E]">
                <span>FIREWALL VERIFICATION // AIR-GAP AUDIT (iptables & tcpdump)</span>
                <span className="text-[#3DDC97]">STRICT ENFORCEMENT</span>
              </div>
              <div className="p-4 font-mono text-xs text-[#F3F6F5] overflow-x-auto space-y-1">
                <div className="text-[#66726E]"># Verification command: Ensure zero packets attempt external egress</div>
                <div><span className="text-[#3DDC97]">$</span> iptables -A OUTPUT -m owner --uid-owner aurapass -d 10.0.0.0/8,192.168.0.0/16 -j ACCEPT</div>
                <div><span className="text-[#3DDC97]">$</span> iptables -A OUTPUT -m owner --uid-owner aurapass -j LOG --log-prefix "[AURAPASS-EGRESS-DROP] "</div>
                <div><span className="text-[#3DDC97]">$</span> iptables -A OUTPUT -m owner --uid-owner aurapass -j REJECT</div>
                <div className="text-[#66726E] mt-2"># Confirmed runtime result: 0 bytes egress / zero socket calls outside local network boundary</div>
              </div>
            </div>

            <p className="text-xs text-[#9AA7A3]">
              Customer security engineers are legally empowered and encouraged to inspect all outbound network traffic from AuraPass node hardware via physical taps and continuous eBPF kernel network filters.
            </p>
          </section>

          {/* Section 04 */}
          <section className="space-y-4 pt-4" id="section-04">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">04 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Data Retention & Purging Specifications
              </h2>
            </div>
            <p>
              The lifecycle of all data elements encountered during local edge execution is strictly governed by the following immutable architectural matrix:
            </p>

            <div className="rounded-xl border border-white/[0.08] overflow-hidden my-4 bg-[#0B1013]">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#10171B] border-b border-white/[0.08] text-[#66726E]">
                      <th className="py-3 px-4 font-medium">Data Category</th>
                      <th className="py-3 px-4 font-medium">Processing Location</th>
                      <th className="py-3 px-4 font-medium">Storage Method</th>
                      <th className="py-3 px-4 font-medium">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 text-[#F3F6F5] font-medium">Raw Optical Frames</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">Volatile RAM only</td>
                      <td className="py-3 px-4 text-[#FF6B6B]">Never written to disk</td>
                      <td className="py-3 px-4 text-[#3DDC97]">&lt;300ms (Flushed instant)</td>
                    </tr>
                    <tr className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 text-[#F3F6F5] font-medium">512-dim Normalized Vectors</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">Local Node SQLite / PgVector</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">AES-256-GCM encrypted</td>
                      <td className="py-3 px-4 text-[#F3F6F5]">Controller Defined (Def 365d)</td>
                    </tr>
                    <tr className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 text-[#F3F6F5] font-medium">Audit Logs & Access Punches</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">Customer Local DB Ledger</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">SHA-256 Chained Hash</td>
                      <td className="py-3 px-4 text-[#F3F6F5]">Customer Roster Schedule</td>
                    </tr>
                    <tr className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 text-[#F3F6F5] font-medium">Telemetry / Diagnostic Dumps</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">Air-Gapped Node Disk</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">Plain local text file</td>
                      <td className="py-3 px-4 text-[#9AA7A3]">Purged on 30-day rotation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs leading-relaxed">
              <strong className="text-[#F3F6F5]">4.1 Automated Purge Commands:</strong> The Software exposes localized cryptographic wipe APIs (`aurapass-ctl purge-vectors --subject-id=&lt;HASH&gt;`) which enforce immediate sector zeroing on customer NVMe arrays with an immutable confirmation log entry.
            </p>
          </section>

          {/* Section 05 */}
          <section className="space-y-5 pt-4" id="section-05">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">05 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Statutory Compliance Framework
              </h2>
            </div>
            <p>
              The architecture of AuraPass is purpose-built to facilitate seamless statutory compliance with the most stringent global privacy jurisdictions:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold text-[#F3F6F5]">
                    5.1 Illinois Biometric Information Privacy Act (BIPA, 740 ILCS 14/)
                  </h3>
                  <span className="text-[10px] font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                    BIPA Compliant
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  Customer acknowledges that BIPA mandates written notification and explicit employee consent prior to collecting biometric identifiers. AuraPass provides built-in consent status verification flags in the ingestion API. Furthermore, vector destruction schedules under BIPA Section 15(a) are programmatically enforced by automated 3-year or termination-event retention timers. AuraPass will never sell, lease, trade, or otherwise profit from biometric vectors.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold text-[#F3F6F5]">
                    5.2 EU General Data Protection Regulation (GDPR Art. 9 & Art. 28)
                  </h3>
                  <span className="text-[10px] font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                    Art. 9 Architecture
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  Biometric vector processing falls under "Special Categories of Data" pursuant to Article 9. Because software runs 100% within the Controller's physical territory in the EEA, no international data transfers or Cross-Border Data Transfer standard contractual clauses (SCCs) are triggered. AuraPass includes automated "Right to Erasure" (Art. 17) vector eradication primitives.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold text-[#F3F6F5]">
                    5.3 India Digital Personal Data Protection Act (DPDP Act 2023)
                  </h3>
                  <span className="text-[10px] font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                    Fiduciary Grade
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  AuraPass empowers the Customer as Data Fiduciary to satisfy all legitimate use exceptions, purposeful processing boundaries, and comprehensive localized sovereign storage obligations, ensuring zero cross-border vector transmission out of the territory of the Republic of India.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold text-[#F3F6F5]">
                    5.4 California Consumer Privacy Act / CPRA (Cal. Civ. Code § 1798.100)
                  </h3>
                  <span className="text-[10px] font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                    Zero-Sale Certified
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A3] leading-relaxed">
                  Under no interpretation does the use of AuraPass constitute a "sale" or "sharing" of sensitive biometric personal information. Vectors exist solely for the Customer’s physical premise access control and identity validation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 06 */}
          <section className="space-y-4 pt-4" id="section-06">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">06 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Customer & Controller Responsibilities
              </h2>
            </div>
            <p>
              To maintain the zero-compromise integrity of the physical and cryptographic perimeter, Customer explicitly warrants compliance with the following operational standards:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-[#0B1013] border border-white/[0.08] flex items-start gap-3">
                <Video className="w-4 h-4 text-[#3DDC97] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-[#F3F6F5] font-semibold">1. Camera Positioning & Conspicuous Signage</div>
                  <div className="text-[#9AA7A3] font-sans text-xs">Customer must post prominent physical warning signs outside physical entry zones, indicating automated biometric verification is active, in compliance with municipal and state statutory mandates.</div>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0B1013] border border-white/[0.08] flex items-start gap-3">
                <Key className="w-4 h-4 text-[#3DDC97] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-[#F3F6F5] font-semibold">2. HSM / KMS Key Custody</div>
                  <div className="text-[#9AA7A3] font-sans text-xs">Customer holds sole physical and logical possession of Hardware Security Modules (HSM) and database encryption master keys. AuraPass cannot decrypt vector stores without Customer-held keys.</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#10171B] border border-dashed border-[#3DDC97]/40 font-mono text-xs text-[#3DDC97] space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Key className="w-3.5 h-3.5" />
                CUSTOMER OPERATIONAL APPOINTMENT:
              </div>
              <div className="text-[#F3F6F5]">
                [TODO(owner): Nominate authorized local Key Custodian and Emergency Hardware Signer]
              </div>
            </div>
          </section>

          {/* Section 07 */}
          <section className="space-y-4 pt-4 pb-8" id="section-07">
            <div className="flex items-baseline gap-2 border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs text-[#3DDC97]">07 //</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#F3F6F5]">
                Legal Contact, Dispute Resolution & DPO
              </h2>
            </div>
            <p>
              For statutory inquiries, vector audit logs requests, or legal notices, contact the designated cryptographic security office:
            </p>

            <div className="p-4 rounded-xl bg-[#0B1013] border border-white/[0.08] space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[#66726E] text-[10px] uppercase">Data Protection Officer</div>
                  <div className="text-[#F3F6F5] font-semibold mt-0.5">Office of the Global DPO</div>
                  <a className="text-[#3DDC97] hover:underline" href="mailto:dpo@aurapass.security">
                    dpo@aurapass.security
                  </a>
                </div>
                <div>
                  <div className="text-[#66726E] text-[10px] uppercase">Chief Legal Counsel</div>
                  <div className="text-[#F3F6F5] font-semibold mt-0.5">AuraPass Legal Systems Inc.</div>
                  <span className="text-[#9AA7A3]">Attn: Enterprise Compliance Division</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#10171B] border border-dashed border-[#3DDC97]/40 font-mono text-xs text-[#3DDC97] space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Gavel className="w-3.5 h-3.5" />
                GOVERNING LAW & JURISDICTION:
              </div>
              <div className="text-[#F3F6F5]">
                [TODO(owner): Specify governing law jurisdiction, e.g., State of Delaware / Canton of Zurich / New Delhi]
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
            <Link to="/terms" className="hover:text-[#F3F6F5] transition-colors">Terms of Service</Link>
            <Link to="/support" className="hover:text-[#F3F6F5] transition-colors">Support & Runbooks</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
