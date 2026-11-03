import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, HelpCircle, Search, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * NotFoundPage - Clean 404 page with navigation links to Home, Docs, Console, and Support.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Subtle Hairline Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
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
          <span className="text-[120px] font-bold leading-none tracking-tighter text-white/90 select-none font-mono">
            404
          </span>
        </motion.div>

        {/* Search Icon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-6 w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
        >
          <Search className="w-6 h-6 text-emerald-400" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Page not found
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            The page you're looking for doesn't exist or has been relocated within the platform.
          </p>
        </motion.div>

        {/* Navigation Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/docs"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141B2E] hover:bg-[#1E293B] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Documentation</span>
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141B2E] hover:bg-[#1E293B] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            <span>Console</span>
          </Link>
          <Link
            to="/support"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141B2E] hover:bg-[#1E293B] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Support</span>
          </Link>
        </motion.div>

        {/* Branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-[10px] text-slate-500 tracking-wider uppercase font-mono"
        >
          AuraPass™ Enterprise • On-Premise Biometric Platform
        </motion.p>
      </motion.div>
    </div>
  );
}
