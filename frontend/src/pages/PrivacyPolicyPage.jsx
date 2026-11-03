import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Lock,
  Database,
  Trash2,
  Server,
  FileCheck,
  CheckCircle2,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const SECTIONS = [
  { id: 'controller', title: '1. Data Controller & Deployment Model' },
  { id: 'collected-data', title: '2. Information Processed by AuraPass' },
  { id: 'biometric-architecture', title: '3. Biometric Vector Protection & Irreversibility' },
  { id: 'zero-cloud', title: '4. Zero Third-Party Cloud Transmission' },
  { id: 'employee-rights', title: '5. Employee Rights & Regulatory Mandates' },
  { id: 'retention-deletion', title: '6. Data Retention & 1-Click Purging' },
  { id: 'audit-logging', title: '7. Access Controls & Cryptographic Audit Trails' },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('controller');

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
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
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
              Table of Contents
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
                <Shield className="w-4 h-4" />
                <span>On-Premise Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Biometric data never leaves your workplace hardware. No external cloud processing.
              </p>
            </div>
          </div>
        </aside>

        {/* Legal Text Document */}
        <div className="flex-1 min-w-0 max-w-3xl space-y-10">
          
          {/* Header Card */}
          <div className="pb-8 border-b border-[#1A2234] space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5" />
              Biometric Sovereignty & Privacy Policy
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AuraPass Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
              Version 2026.2 &bull; Effective Date: November 3, 2026 &bull; Strict On-Premise Air-Gap Architecture
            </p>
          </div>

          {/* 3 Core Architecture Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
              <Server className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-bold text-white mb-1">Local Host Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All photos and employee records stay on your company hardware. Never transmitted to external cloud servers.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
              <Lock className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-bold text-white mb-1">Irreversible Vectors</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Faces are transformed into 512-d mathematical coordinates that cannot be reverse-engineered into photographs.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638]">
              <Trash2 className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className="text-xs font-bold text-white mb-1">1-Click Erasure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Administrators can delete any employee record and permanently erase all associated vectors in one click.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section id="controller" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">01.</span>
              Data Controller & Deployment Model
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              In the AuraPass software ecosystem, **your organization is the sole Data Controller**. AuraPass is deployed as an on-premise application running on your internal computer infrastructure, private local network, or authorized private server.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              AuraPass creators, maintainers, and cloud providers have **zero access** to your database, your cameras, your employee facial photographs, or your biometric mathematical templates.
            </p>
          </section>

          {/* Section 2 */}
          <section id="collected-data" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">02.</span>
              Information Processed by AuraPass
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              To deliver high-speed attendance verification, AuraPass processes the minimum necessary data points:
            </p>
            <ul className="text-xs sm:text-sm text-slate-400 space-y-2 list-disc pl-5 leading-relaxed">
              <li>
                <strong className="text-white">Employee Profile Metadata:</strong> Employee full name, unique alphanumeric badge ID, and assigned organizational department.
              </li>
              <li>
                <strong className="text-white">Biometric Facial Vectors:</strong> Mathematical unit vectors (512 float32 coordinates) generated by deep feature extractors (Facenet512).
              </li>
              <li>
                <strong className="text-white">Attendance Timestamp Records:</strong> Date, local clock time (e.g. 09:02 AM), verification confidence percentage, camera stream identifier, and status flags (On Time, Late, Early Exit).
              </li>
              <li>
                <strong className="text-white">Session Credentials:</strong> Cryptographically hashed administrator passwords (bcrypt, work factor 12) and ephemeral local JWT tokens.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="biometric-architecture" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">03.</span>
              Biometric Vector Protection & Irreversibility
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              AuraPass does not perform recognition by comparing raw pixel images. Upon enrollment, facial landmarks are detected, cropped, normalized, and mapped onto a 512-dimensional hypersphere:
            </p>
            <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638] font-mono text-xs text-emerald-300">
              Embedding Dimension: 512 &bull; Metric: Cosine Similarity &bull; Type: Irreversible Float32
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Because deep neural network embeddings represent a lossy, high-dimensional abstraction of geometric contours, **it is mathematically and technically impossible to reconstruct or reverse-engineer the original face photograph from stored embedding vectors**.
            </p>
          </section>

          {/* Section 4 */}
          <section id="zero-cloud" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">04.</span>
              Zero Third-Party Cloud Transmission
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              AuraPass guarantees complete network air-gap capability:
            </p>
            <ul className="text-xs sm:text-sm text-slate-400 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>No video streams, frames, or crops are ever sent to external cloud APIs (e.g. AWS Rekognition, Azure Face, Google Vision).</li>
              <li>No third-party analytics trackers, advertising pixels, or telemetry beacons exist in the software.</li>
              <li>All database operations execute against local SQLite or private PostgreSQL instances hosted on your network.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="employee-rights" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">05.</span>
              Employee Rights & Regulatory Mandates
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              AuraPass provides enterprise features designed to comply with global biometric privacy legislation:
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-slate-400">
              <p><strong className="text-white">GDPR Article 9 (EU):</strong> Provides tools for documented employee consent tracking and local processing restriction.</p>
              <p><strong className="text-white">Illinois BIPA (USA):</strong> Complies with biometric storage limitation schedules and written disclosure requirements.</p>
              <p><strong className="text-white">California CCPA/CPRA:</strong> Employees have the right to request a complete copy of their attendance logs and demand permanent vector deletion.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="retention-deletion" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">06.</span>
              Data Retention & 1-Click Purging
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Administrators maintain absolute control over data lifecycles:
            </p>
            <ul className="text-xs sm:text-sm text-slate-400 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>When an employee leaves the company, an administrator can click **Delete** to immediately and permanently remove their name, badge ID, and 512-d vector from the active embedding index.</li>
              <li>Attendance logs can be retained according to your internal compliance retention schedule (e.g. 1 year, 3 years, or 7 years) or purged via database maintenance scripts.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="audit-logging" className="space-y-3 scroll-mt-28">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">07.</span>
              Access Controls & Cryptographic Audit Trails
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              AuraPass enforces role-based access control (RBAC). Only authenticated administrators with verified JWT sessions can view raw attendance histories, enroll staff members, or alter department shift rules. Every administrative change is logged to an immutable audit table.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A2234] bg-[#06080E] py-8 px-4 sm:px-6 text-center text-xs text-slate-500 font-mono">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Local Biometric Sovereignty Policy.</p>
      </footer>
    </div>
  );
}
