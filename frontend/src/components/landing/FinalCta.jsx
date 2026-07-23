import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FinalCta() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="landing-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="final-cta-container"
      >
        {/* Ambient glow */}
        <div className="final-cta-glow" aria-hidden="true" />

        <p className="text-eyebrow text-[#828FFF] mb-4">Get Started</p>
        <h2 className="text-display-md text-ink font-display mb-4 max-w-2xl mx-auto">
          Your building already knows who belongs.
          <br />
          <span className="text-ink-subtle">Now your systems do too.</span>
        </h2>
        <p className="text-body-lg text-ink-subtle mb-10 max-w-lg mx-auto">
          Deploy locally. Enroll your roster. Experience sub-100ms recognition
          that never phones home.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          {isAuthenticated ? (
            <Link to="/dashboard" className="button-primary text-white flex items-center gap-2 h-12 px-8 text-button">
              Enter Console <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="button-primary text-white flex items-center gap-2 h-12 px-8 text-button">
                Start Building <ArrowRight className="w-4 h-4 text-white" />
              </Link>
              <Link to="/login" className="button-secondary flex items-center gap-2 h-12 px-8 text-button">
                Sign In
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
