import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowRight, Zap, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGsap } from '../lib/useGsap';

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

/* ────────────────────────────────────────────────────────
   Section IDs for IntersectionObserver tracking
   ──────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  { id: 'hero', label: 'Home', href: '#' },
  { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'security', label: 'Security', href: '#security' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
];

/* ────────────────────────────────────────────────────────
   useActiveSection — IntersectionObserver for active state
   ──────────────────────────────────────────────────────── */
function useActiveSection() {
  const [activeId, setActiveId] = useState('hero');

  useEffect(() => {
    const sectionEls = NAV_SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
    if (!sectionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top of the viewport that is intersecting
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sectionEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return activeId;
}

/* ────────────────────────────────────────────────────────
   Floating Pill Navbar — centered, active state, morphs in
   ──────────────────────────────────────────────────────── */
function FloatingNav({ isAuthenticated }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const activeId = useActiveSection();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const direction = latest > lastScrollY.current ? 'down' : 'up';
    lastScrollY.current = latest;

    // Show after scrolling past hero (350px)
    if (latest < 350) {
      setVisible(false);
      return;
    }

    // Show on scroll up, hide on scroll down
    if (direction === 'up') {
      setVisible(true);
    } else if (direction === 'down' && latest > 500) {
      setVisible(false);
    }
  });

  const handleNavClick = (e, href) => {
    if (href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          className="floating-pill-nav"
          initial={{ y: -100, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          {/* Desktop pill */}
          <div className="floating-pill-inner floating-pill-desktop">
            {NAV_SECTIONS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`floating-pill-link ${activeId === item.id ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            ))}
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="floating-pill-cta">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/register')} className="floating-pill-cta">
                Get Started
              </button>
            )}
          </div>

          {/* Mobile pill — compact */}
          <div className="floating-pill-inner floating-pill-mobile">
            <a
              href="#"
              className={`floating-pill-link ${activeId === 'hero' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, '#')}
            >
              Home
            </a>
            <button
              className="floating-pill-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="floating-pill-cta">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/register')} className="floating-pill-cta">
                Get Started
              </button>
            )}
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="floating-pill-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {NAV_SECTIONS.slice(1).map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`floating-pill-dropdown-link ${activeId === item.id ? 'active' : ''}`}
                    onClick={(e) => handleNavClick(e, item.href)}
                  >
                    {item.label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────
   Hero animation variants
   ──────────────────────────────────────────────────────── */
const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.14, delayChildren: 0.3 } },
};

const heroItemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 180, damping: 20 } },
};

/* ────────────────────────────────────────────────────────
   Landing Page
   ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const heroTextRef = useRef(null);
  const { gsapRef, ready, prefersReducedMotion } = useGsap();

  // Subtle parallax on hero text
  useEffect(() => {
    if (!ready || prefersReducedMotion || !heroTextRef.current) return;
    const gsap = gsapRef.current;

    const ctx = gsap.context(() => {
      gsap.to(heroTextRef.current, {
        y: 50,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.3,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, [ready, prefersReducedMotion]);

  return (
    <div className="landing-page">
      {/* ═══ Floating Pill Nav (appears on scroll) ═══ */}
      <FloatingNav isAuthenticated={isAuthenticated} />

      {/* ═══ Top Header (visible in hero only) ═══ */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <button
            className="landing-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="landing-logo">
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>R</span>
            </div>
            <span className="landing-brand-text">RMS Console</span>
          </button>

          <nav className="landing-nav">
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Capabilities</a>
            <a href="#security">Security</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="landing-header-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="landing-hero-cta-primary" style={{ height: 38, fontSize: 13, padding: '0 20px' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-header-link">Sign In</Link>
                <Link to="/register" className="landing-hero-cta-primary" style={{ height: 38, fontSize: 13, padding: '0 20px' }}>
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ §1 — Hero: The Promise ═══ */}
      <section id="hero" ref={heroRef} className="landing-hero">
        <HeroReticleCanvas />
        <div className="landing-hero-overlay" aria-hidden="true" />

        <motion.div
          ref={heroTextRef}
          initial="hidden"
          animate="visible"
          variants={heroContainerVariants}
          className="landing-hero-content"
        >
          <motion.div variants={heroItemVariants} className="landing-hero-badge">
            <Zap className="w-3.5 h-3.5" style={{ color: '#828FFF' }} />
            Side-Profile Enabled Neural Inference
          </motion.div>

          <motion.h1 variants={heroItemVariants} className="landing-hero-title">
            Your building already knows
            <br />who belongs.{' '}
            <span className="landing-hero-title-accent">
              Now your systems do too.
            </span>
          </motion.h1>

          <motion.p variants={heroItemVariants} className="landing-hero-subtitle">
            On-premise face recognition for private edge operations —
            register personnel, run continuous multi-model recognition,
            and keep every byte of biometric data under your roof.
          </motion.p>

          <motion.div variants={heroItemVariants} className="landing-hero-cta-row">
            {isAuthenticated ? (
              <Link to="/dashboard" className="landing-hero-cta-primary">
                Enter Console <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/register" className="landing-hero-cta-primary">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a href="#how-it-works" className="landing-hero-cta-secondary">
              Learn How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="landing-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          aria-hidden="true"
        >
          <div className="scroll-indicator-track">
            <div className="scroll-indicator-dot" />
          </div>
        </motion.div>
      </section>

      {/* ═══ §2 — The Problem ═══ */}
      <ProblemSection />

      {/* ═══ §3 — How It Works (Pipeline) ═══ */}
      <PipelineSection />

      {/* ═══ §4 — Live Proof Widget ═══ */}
      <ProofWidget />

      {/* ═══ §5 — Capabilities (Bento Grid) ═══ */}
      <BentoGrid />

      {/* ═══ §6 — Security & Sovereignty ═══ */}
      <SovereigntySection />

      {/* ═══ §7 — Engineering Commitments ═══ */}
      <StatsSection />

      {/* ═══ §8 — FAQ ═══ */}
      <FaqSection />

      {/* ═══ §9 — Final CTA ═══ */}
      <FinalCta />

      {/* ═══ Footer ═══ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span>&copy; 2026 RMS Platform. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/support" style={{ transition: 'color 0.2s' }}>Documentation</Link>
            <Link to="/support" style={{ transition: 'color 0.2s' }}>Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
