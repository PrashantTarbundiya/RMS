import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuraPassBrand from '../ui/AuraPassBrand';
import {
  Shield,
  ArrowRight,
  Menu,
  X,
  FileText,
  LifeBuoy,
  Zap,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicHeader() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Features', href: '/#features', isAnchor: true },
    { label: 'How It Works', href: '/#how-it-works', isAnchor: true },
    { label: 'Pricing', href: '/#pricing', isAnchor: true },
    { label: 'Case Studies', href: '/#case-studies', isAnchor: true },
    { label: 'Compare', href: '/#competitors', isAnchor: true },
    { label: 'Docs', href: '/docs', isAnchor: false },
    { label: 'Support', href: '/support', isAnchor: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-nav transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* ── Brand Logo ── */}
          <Link to="/" className="flex items-center group cursor-pointer" aria-label="AuraPass Home">
            <AuraPassBrand size={28} showBadge={true} badgeText="ENTERPRISE" />
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium" role="navigation" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = !link.isAnchor && location.pathname === link.href;
              return link.isAnchor ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Action Cluster ── */}
          <div className="flex items-center gap-3">


            {/* Contextual Desktop CTA */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex btn-tactile btn-primary-emerald h-9 px-4 text-xs font-semibold shadow-sm items-center gap-1.5 rounded-lg"
              >
                <span>Open Console</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn-tactile h-9 px-3.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-tactile btn-primary-emerald h-9 px-4 text-xs font-semibold shadow-sm rounded-lg"
                >
                  Start Free
                </Link>
              </div>
            )}

            {/* ── Mobile Hamburger Drawer Toggle (Apple HIG >= 44px touch target, strictly hidden on desktop) ── */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:!hidden flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-card/60 hover:bg-secondary text-foreground cursor-pointer active:scale-95 transition-transform"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-Over Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Scrim Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xs bg-background border-l border-border h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 safe-area-pt safe-area-pb"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
            >
              <div>
                {/* Header in Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-sm text-foreground">AuraPass</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center btn-tactile cursor-pointer"
                    aria-label="Close navigation"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Navigation Links (Apple HIG 48px touch targets) */}
                <nav className="space-y-1.5" role="navigation">
                  {navLinks.map((link) => (
                    link.isAnchor ? (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center h-12 px-3.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.label}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center h-12 px-3.5 rounded-xl text-sm font-medium transition-colors ${
                          location.pathname === link.href
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  ))}
                </nav>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="pt-4 border-t border-border space-y-3">


                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full h-11 rounded-xl btn-primary-emerald flex items-center justify-center gap-2 text-xs font-semibold btn-tactile"
                  >
                    <span>Open System Console</span>
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full h-11 rounded-xl btn-primary-emerald flex items-center justify-center text-xs font-semibold btn-tactile"
                    >
                      Start Free Trial
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 text-foreground flex items-center justify-center text-xs font-semibold btn-tactile"
                    >
                      Sign in to Console
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

