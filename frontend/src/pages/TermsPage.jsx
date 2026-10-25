import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, Scale, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-[#0B0E17]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy-policy" className="text-zinc-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 pb-8 border-b border-zinc-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Terms & Conditions of Service
          </h1>
          <p className="text-sm text-zinc-400">
            Last Updated: October 2026 | Enterprise Software License & Usage Agreement
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">01.</span>
              Acceptance of Agreement
            </h2>
            <p>
              By accessing, deploying, installing, or operating the RMS Facial Recognition & Attendance System (&quot;the Software&quot;), your organization (&quot;Customer&quot;, &quot;Licensee&quot;, or &quot;User&quot;) agrees to be bound by these Terms & Conditions. If you do not accept these terms, you must discontinue use and decommission all installed instances.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">02.</span>
              License Grant & Deployment Scope
            </h2>
            <p>
              Subject to these terms, the Customer is granted a non-exclusive, non-transferable license to deploy and operate the Software within internal enterprise boundaries for the purposes of physical access control, employee check-in verification, and attendance record management.
            </p>
            <p>
              The Software may be deployed on dedicated on-premise server appliances, virtual machines, or private virtual clouds under the direct operational administration of the Customer.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">03.</span>
              Customer Biometric Compliance Responsibilities
            </h2>
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <div className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mandatory Legal Notice & Employee Consent
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                The Customer acknowledges that local, national, and international laws regulate the collection and retention of biometric identifiers (including the Illinois Biometric Information Privacy Act [BIPA], Texas Capture or Use of Biometric Identifier Act, and European Union GDPR Article 9). The Customer is solely responsible for providing required written disclosures and obtaining lawful employee consent prior to capturing and enrolling biometric portraits into the system.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">04.</span>
              Authorized Administrative Accounts
            </h2>
            <p>
              Customer administrators are responsible for maintaining the confidentiality of administrative credentials, JWT authentication tokens, and user permission roles. All activities conducted through administrative sessions are the sole responsibility of the Customer. The Customer agrees to notify the technical support team immediately upon discovering any unauthorized system access.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">05.</span>
              Acceptable Use & Prohibited Operations
            </h2>
            <p>The Customer agrees not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Use the Software for unlawful public mass surveillance or non-consensual tracking.</li>
              <li>Reverse engineer, decompile, or disassemble proprietary neural model weights or embedding libraries.</li>
              <li>Attempt to bypass or manipulate anti-spoof liveness detection mechanisms.</li>
              <li>Redistribute, lease, or sub-license the platform to unauthorized third parties without written authorization.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">06.</span>
              System Performance & Environmental Factors
            </h2>
            <p>
              Facial recognition accuracy depends on environmental conditions, including ambient illumination, camera sensor resolution, optical distortion, and enrollment image variety. While the multi-model engine provides high-precision matching and liveness verification, the Customer is advised to configure secondary verification mechanisms for mission-critical access points.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">07.</span>
              Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, the Software is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. In no event shall RMS developers, licensors, or distributors be held liable for indirect, incidental, punitive, or consequential damages resulting from unauthorized physical entries, hardware failures, or network disruptions.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">08.</span>
              Amendments & Technical Support
            </h2>
            <p>
              We reserve the right to revise these Terms to reflect technical updates, security enhancements, or statutory requirements. For enterprise support, custom integration assistance, or licensing inquiries, please contact your account representative or consult the built-in system documentation.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0B0E17] py-8 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>&copy; 2026 RMS Platform. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/support" className="hover:text-zinc-300 transition-colors">
              Documentation & Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
