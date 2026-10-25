import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Database, Eye, FileCheck, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <Link to="/terms" className="text-zinc-400 hover:text-white transition-colors">
              Terms & Conditions
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
            <Shield className="w-3.5 h-3.5" />
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Biometric Data Privacy Policy
          </h1>
          <p className="text-sm text-zinc-400">
            Last Updated: October 2026 | Effective for all Enterprise Deployments
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">01.</span>
              Introduction & On-Premise Architecture
            </h2>
            <p>
              RMS Platform (&quot;we&quot;, &quot;our&quot;, or &quot;the System&quot;) provides an on-premise facial recognition and automated attendance management solution designed for organization access control. This Privacy Policy outlines the standards and technical controls governing the collection, processing, storage, and deletion of facial biometric data.
            </p>
            <p>
              Unlike conventional cloud-hosted biometric vendors, RMS operates strictly on local on-premise hardware or customer-managed private infrastructure. Biometric vectors, photographic captures, and audit logs are retained under the exclusive physical and cryptographic custody of the operating organization.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">02.</span>
              Categories of Information Processed
            </h2>
            <p>During deployment and ongoing usage, the System handles the following data types:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li>
                <strong className="text-white">Reference Portrait Images:</strong> Photographic portraits provided during personnel enrollment to construct identification baseline templates.
              </li>
              <li>
                <strong className="text-white">Numerical Vector Embeddings:</strong> Mathematical representations (e.g., 512-dimensional vector arrays) derived from facial landmark geometry. These vectors cannot be reverse-engineered into photographic images.
              </li>
              <li>
                <strong className="text-white">Verification Metadata:</strong> Timestamps, camera identifier strings, operational confidence metrics, and check-in confirmation status records.
              </li>
              <li>
                <strong className="text-white">Administrative Account Data:</strong> Name, work email address, and role credentials necessary for console authentication.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">03.</span>
              Purpose of Processing
            </h2>
            <p>Biometric information is processed exclusively for the following operational objectives:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="font-medium text-white mb-1">Access Control & Security</div>
                <div className="text-xs text-zinc-400">Verifying authorization of staff members at physical turnstiles, doors, and facility perimeters.</div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="font-medium text-white mb-1">Automated Attendance Logging</div>
                <div className="text-xs text-zinc-400">Recording accurate employee arrival and departure times without physical contact or badge sharing.</div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="font-medium text-white mb-1">Anti-Spoofing & Liveness</div>
                <div className="text-xs text-zinc-400">Distinguishing live human subjects from printed photo replicas, screen playback, and physical masks.</div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="font-medium text-white mb-1">Compliance & Audit Trails</div>
                <div className="text-xs text-zinc-400">Maintaining tamper-resistant verification logs for workplace health, safety, and operational audits.</div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">04.</span>
              Zero External Data Transmission
            </h2>
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white text-sm">Strict Local Boundary Assurance</div>
                <p className="text-xs text-zinc-400 mt-1 leading-normal">
                  The System does not communicate with external advertising networks, third-party analytics trackers, or public AI APIs. All neural network inference (FaceNet, ArcFace, GhostFaceNet) executes locally on your host CPU/GPU runtime. No biometric template ever leaves your designated network perimeter.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">05.</span>
              Employee Consent & Retention Schedules
            </h2>
            <p>
              In accordance with international biometric privacy legislation (including Illinois BIPA, Texas CBOI, and GDPR Article 9):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Deploying organizations must obtain informed written consent from employees prior to biometric enrollment.</li>
              <li>Personnel retain the right to request deletion of their enrolled photos and mathematical templates at any time.</li>
              <li>Upon termination of employment or formal consent revocation, the administrator can permanently delete the individual&apos;s biometric vectors with immediate effect.</li>
              <li>Operational verification frame captures are temporarily buffered in volatile memory and purged following vector comparison.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">06.</span>
              Security & Storage Protection
            </h2>
            <p>
              The platform implements defense-in-depth safeguards to protect biometric assets:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Role-based access control (RBAC) restricting personnel management to verified administrators.</li>
              <li>Cryptographic token validation (HMAC SHA-256 JWT) on all API and WebSocket streaming endpoints.</li>
              <li>Mandatory TLS 1.3 / HTTPS encryption for all browser-to-server camera streams.</li>
              <li>Encrypted database storage options for personnel metadata and audit histories.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs">07.</span>
              Administrator & Compliance Contact
            </h2>
            <p>
              Organizations deploying the RMS platform are the legal Data Controllers for their employee records. Inquiries concerning internal biometric data processing, consent forms, or template removal requests should be directed to your organization&apos;s designated System Administrator or Data Protection Officer.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0B0E17] py-8 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>&copy; 2026 RMS Platform. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">
              Terms & Conditions
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
