import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, HelpCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * NotFoundPage - Premium 404 page with animated illustration and navigation links.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#010102] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(94,106,210,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(94,106,210,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mb-6"
        >
          <span className="text-[120px] font-bold leading-none tracking-tighter bg-gradient-to-b from-[#5E6AD2] to-[#5E6AD2]/20 bg-clip-text text-transparent select-none">
            404
          </span>
        </motion.div>

        {/* Search Icon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center"
        >
          <Search className="w-7 h-7 text-[#828FFF]" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">
            Page not found
          </h1>
          <p className="text-ink-subtle text-sm leading-relaxed max-w-sm mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Check the URL or navigate back to a known page.
          </p>
        </motion.div>

        {/* Navigation Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/dashboard"
            className="button-primary flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            <span className="text-button text-white">Go to Dashboard</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="button-secondary flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-button">Go Back</span>
          </button>
          <Link
            to="/support"
            className="button-secondary flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-button">Help Center</span>
          </Link>
        </motion.div>

        {/* Branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-[10px] text-ink-tertiary tracking-wider uppercase"
        >
          RMS Face AI • Recognition Management System
        </motion.p>
      </motion.div>
    </div>
  );
}
