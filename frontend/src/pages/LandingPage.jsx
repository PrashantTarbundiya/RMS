import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Menu, X, Server, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Section components
import HeroReticleCanvas from '../components/landing/HeroReticleCanvas';
import ProblemSection from '../components/landing/ProblemSection';
import PipelineSection from '../components/landing/PipelineSection';
import ProofWidget from '../components/landing/ProofWidget';
import BentoGrid from '../components/landing/BentoGrid';
import SovereigntySection from '../components/landing/SovereigntySection';
import StatsSection from '../components/landing/StatsSection';
import FaqSection from '../components/landing/FaqSection';
import FinalCta from '../components/landing/FinalCta';

const NAV_SECTIONS = [
  { id: 'hero', label: 'Overview', href: '#' },
  { id: 'how-it-works', label: 'Architecture', href: '#how-it-works' },
  { id: 'features', label: 'Capabilities', href: '#features' },
  { id: 'security', label: 'Sovereignty', href: '#security' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
];

function StickyEnterpriseNav({ isAuthenticated }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    if (href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#07090E]/95 border-b border-zinc-800/80 backdrop-blur-md shadow-lg shadow-black/40'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          className="flex items-center gap-2.5 text-left bg-transparent border-none cursor-pointer p-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center font-mono font-bold text-sm text-white">
            R
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-white leading-tight">
              RMS Face Recognition
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">Enterprise Console</div>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-300">
          {NAV_SECTIONS.slice(1).map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="hover:text-white transition-colors"
              onClick={(e) => handleNavClick(e, item.href)}
            >
              {item.label}
            </a>
          ))}
          <Link to="/privacy-policy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors shadow-sm"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors shadow-sm"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 rounded-md border border-zinc-800 text-zinc-300 hover:text-white bg-zinc-900/60"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#0B0E17] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm text-zinc-300">
            {NAV_SECTIONS.slice(1).map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="py-1.5 hover:text-white transition-colors"
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            ))}
            <Link to="/privacy-policy" className="py-1.5 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="py-1.5 hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </nav>
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 rounded-md bg-white text-black text-xs font-semibold text-center"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full py-2 rounded-md border border-zinc-700 bg-zinc-800 text-white text-xs font-medium text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 rounded-md bg-white text-black text-xs font-semibold text-center"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Sticky Top Enterprise Navigation */}
      <StickyEnterpriseNav isAuthenticated={isAuthenticated} />

      {/* Section 1: Hero */}
      <section id="hero" className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <HeroReticleCanvas />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Factual, specific badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>On-Premise Biometric Recognition & Attendance</span>
          </div>

          {/* Direct, professional headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.12]">
            Facial Recognition & Automated Attendance Management
          </h1>

          {/* Concise, factual subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy on-premise face recognition for physical access control, autonomous kiosk check-ins, and employee attendance. Operates entirely on your local infrastructure with zero external data transmission.
          </p>

          {/* Clean, rectangular CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-md bg-white hover:bg-zinc-200 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Enter Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-md bg-white hover:bg-zinc-200 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-sm font-medium transition-colors"
            >
              System Architecture
            </a>
          </div>
        </div>
      </section>

      {/* Section 2: Operational Problem */}
      <ProblemSection />

      {/* Section 3: Technical Pipeline */}
      <PipelineSection />

      {/* Section 4: Live Verification Telemetry */}
      <ProofWidget />

      {/* Section 5: System Capabilities */}
      <BentoGrid />

      {/* Section 6: Security & Data Sovereignty */}
      <SovereigntySection />

      {/* Section 7: Engineering Benchmarks */}
      <StatsSection />

      {/* Section 8: Frequently Asked Questions */}
      <FaqSection />

      {/* Section 9: Deployment Action */}
      <FinalCta />

      {/* Professional Footer with Legal Links */}
      <footer className="border-t border-zinc-800 bg-[#0B0E17] py-10 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center font-mono font-bold text-xs text-white">
              R
            </div>
            <span>&copy; 2026 RMS Platform. On-premise biometric access management.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/privacy-policy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/support" className="hover:text-zinc-300 transition-colors">
              Documentation
            </Link>
            <Link to="/login" className="hover:text-zinc-300 transition-colors">
              Console Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
