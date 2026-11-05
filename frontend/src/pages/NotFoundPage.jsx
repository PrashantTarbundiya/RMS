import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Search,
  Terminal,
  ChevronDown,
  Home,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotFoundPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('search-404-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/docs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090B] text-[#F3F6F5] font-sans antialiased flex flex-col justify-between relative overflow-x-hidden selection:bg-[#3DDC97]/20 selection:text-[#3DDC97]">
      {/* Precision grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundSize: '32px 32px',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
        }}
      />
      {/* Ambient Vignette */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(61,220,151,0.035),transparent_70%)]" />

      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#06090B]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="flex justify-between items-center h-14 px-6 max-w-[1160px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-[#F3F6F5] hover:opacity-90 transition-opacity">
              <div className="w-6 h-6 rounded-md bg-[#3DDC97]/10 border border-[#3DDC97]/20 flex items-center justify-center text-[#3DDC97]">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs tracking-wider uppercase text-[#F3F6F5]">AuraPass</span>
            </Link>
            <span className="h-3 w-px bg-white/[0.12]" />
            <span className="font-mono text-[11px] text-[#9AA7A3] bg-[#10171B] px-2 py-0.5 rounded border border-white/[0.08]">
              LTS v2026.2
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/docs" className="text-xs text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Docs Hub
            </Link>
            <Link to="/support" className="text-xs text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Help Center
            </Link>
            <Link to="/privacy-policy" className="text-xs text-[#9AA7A3] hover:text-[#F3F6F5] transition-colors">
              Legal & Privacy
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0B1013] border border-white/[0.08]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDC97] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DDC97]" />
              </span>
              <span className="font-mono text-[11px] text-[#9AA7A3] tracking-tight">Nodes Active (Local)</span>
            </div>
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-[#3DDC97] hover:text-[#5FE8AD] px-2.5 py-1 rounded border border-[#3DDC97]/30 hover:border-[#3DDC97]/60 transition-colors"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-16 px-4 max-w-[1160px] mx-auto w-full relative z-10 flex flex-col items-center">
        {/* Classification Pill */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10171B] border border-[#3DDC97]/25 shadow-[0_0_15px_rgba(61,220,151,0.06)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
          <span className="font-mono text-xs text-[#3DDC97] tracking-wider uppercase">
            ERROR_CODE: 404 // NON_ROUTABLE_COORDINATE
          </span>
        </div>

        {/* Monolith Card */}
        <div className="w-full max-w-[760px] bg-[#0B1013] border border-white/[0.08] rounded-2xl relative overflow-hidden p-8 sm:p-12 mb-8 shadow-2xl">
          {/* Precision Crosshair Corner Accents */}
          <div className="absolute top-2.5 left-3 font-mono text-[9px] text-[#66726E] select-none">+ 0x00</div>
          <div className="absolute top-2.5 right-3 font-mono text-[9px] text-[#66726E] select-none">0x0F +</div>
          <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-[#66726E] select-none">+ 0xF0</div>
          <div className="absolute bottom-2.5 right-3 font-mono text-[9px] text-[#66726E] select-none">0xFF +</div>

          {/* Status Subhead */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-8">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#66726E]">
              <span className="w-2 h-2 rounded-sm bg-[#9AA7A3]/30" />
              <span>LAT: 0x0000 | ROUTE: UNMAPPED</span>
            </div>
            <div className="font-mono text-[11px] text-[#FF6B6B] tracking-wide flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
              <span>TCP_EGRESS_BLOCKED: ZERO_HOP_DROP</span>
            </div>
          </div>

          {/* Big Monolith 404 Graphic */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="font-mono text-7xl sm:text-8xl md:text-9xl font-semibold tracking-tighter text-[#F3F6F5] select-none relative">
              4<span className="text-[#3DDC97]">0</span>4
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#3DDC97] to-transparent" />
              </div>
            </div>
            <p className="font-mono text-xs text-[#9AA7A3] mt-2 tracking-widest uppercase">
              Null Vector Ingress Point
            </p>
          </div>

          {/* Editorial Headline & Copy */}
          <div className="text-center mt-6 max-w-[560px] mx-auto">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#F3F6F5] tracking-tight mb-2">
              This node does not exist in the routing table.
            </h1>
            <p className="text-xs sm:text-sm text-[#9AA7A3] leading-relaxed">
              The requested route or document could not be resolved on the local on-premise engine.
              Verify the target URI syntax or return to sovereign endpoints.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-[520px] mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#66726E] pointer-events-none" />
              <input
                id="search-404-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation, API endpoints, or runbooks..."
                className="w-full bg-[#10171B] border border-white/[0.12] rounded-xl py-2.5 pl-10 pr-14 text-xs font-mono text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97] focus:ring-1 focus:ring-[#3DDC97] transition-all"
              />
              <div className="absolute right-3 px-1.5 py-0.5 rounded bg-[#0B1013] border border-white/[0.08] text-[10px] font-mono text-[#9AA7A3] select-none">
                ⌘K
              </div>
            </div>
          </form>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#3DDC97] hover:bg-[#5FE8AD] text-[#06090B] text-xs font-semibold tracking-wide transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Homepage</span>
            </Link>
            <Link
              to="/docs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/[0.04] text-[#F3F6F5] border border-white/[0.12] hover:border-white/[0.2] text-xs font-medium tracking-wide transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#9AA7A3]" />
              <span>Open Documentation</span>
            </Link>
          </div>
        </div>

        {/* Bento Cards (3 Recovery Routes) */}
        <div className="w-full max-w-[760px] grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/"
            className="group bg-[#0B1013] hover:bg-[#10171B] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                  GET /
                </span>
                <Home className="w-4 h-4 text-[#66726E] group-hover:text-[#F3F6F5] transition-colors" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#F3F6F5] mb-1.5 group-hover:text-[#3DDC97] transition-colors">
                Product Story & Landing
              </h3>
              <p className="text-xs text-[#9AA7A3] leading-relaxed">
                Return to sovereign system overview, hardware architecture, and feature specs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center text-xs font-medium text-[#9AA7A3] group-hover:text-[#F3F6F5] transition-colors">
              <span>Go to Overview</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            to="/docs"
            className="group bg-[#0B1013] hover:bg-[#10171B] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                  GET /docs
                </span>
                <BookOpen className="w-4 h-4 text-[#66726E] group-hover:text-[#F3F6F5] transition-colors" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#F3F6F5] mb-1.5 group-hover:text-[#3DDC97] transition-colors">
                Documentation Hub
              </h3>
              <p className="text-xs text-[#9AA7A3] leading-relaxed">
                Browse 3-shot enrollment setup, RTSP ingestion, and worked grace policy tables.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center text-xs font-medium text-[#9AA7A3] group-hover:text-[#F3F6F5] transition-colors">
              <span>Browse Docs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            to="/support"
            className="group bg-[#0B1013] hover:bg-[#10171B] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded border border-[#3DDC97]/20">
                  GET /support
                </span>
                <HelpCircle className="w-4 h-4 text-[#66726E] group-hover:text-[#F3F6F5] transition-colors" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#F3F6F5] mb-1.5 group-hover:text-[#3DDC97] transition-colors">
                Help & Support Center
              </h3>
              <p className="text-xs text-[#9AA7A3] leading-relaxed">
                Search verified engineering runbooks or dispatch an on-premise priority ticket.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center text-xs font-medium text-[#9AA7A3] group-hover:text-[#F3F6F5] transition-colors">
              <span>Open Support</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Diagnostic Telemetry Terminal Drawer */}
        <div className="w-full max-w-[760px]">
          <div className="bg-[#0B1013] border border-white/[0.08] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="w-full px-4 py-3 bg-[#0B1013] hover:bg-[#10171B] flex items-center justify-between text-xs font-mono text-[#9AA7A3] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#3DDC97]" />
                <span className="text-[#F3F6F5] font-medium">Diagnostic Telemetry Output</span>
                <span className="text-[10px] text-[#66726E]">(Click to inspect route trace)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#66726E]">ISO-8601 UTC</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${drawerOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {drawerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 font-mono text-[11px] leading-relaxed text-[#9AA7A3] bg-[#06090B] border-t border-white/[0.06] space-y-1.5 overflow-x-auto"
                >
                  <div className="text-[#66726E]">$ aurapass-cli route-lookup --uri $REQUEST_URI --strict-resolution</div>
                  <div className="text-[#FF6B6B] flex items-center gap-2">
                    <span className="px-1 bg-[#FF6B6B]/10 rounded border border-[#FF6B6B]/20 text-[10px]">
                      ERR_ROUTE_TABLE_MISS
                    </span>
                    <span>Target node has no active binding in local ledger.</span>
                  </div>
                  <div className="text-[#3DDC97] flex items-center gap-2">
                    <span className="px-1 bg-[#3DDC97]/10 rounded border border-[#3DDC97]/20 text-[10px]">INFO</span>
                    <span>Ingress interface: eth0 (Air-gapped) | Status: 404 Dropped safely</span>
                  </div>
                  <div className="text-[#66726E] text-[10px]">
                    &gt; Vector cluster zero-hop integrity: PASS [38/38 nodes synced] | Hash: 0x9f4a...88e1
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Technical Footer */}
      <footer className="w-full bg-[#06090B] border-t border-white/[0.08] relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 px-6 max-w-[1160px] mx-auto w-full">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-[#66726E]">
              © {new Date().getFullYear()} AuraPass Security Systems. Zero-Knowledge Biometric Infrastructure.
            </p>
            <p className="font-mono text-[11px] text-[#66726E]">
              AuraPass On-Premise Engine v2026.2 (Air-gapped)
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9AA7A3]">
            <Link to="/docs" className="hover:text-[#F3F6F5] transition-colors">Documentation</Link>
            <Link to="/privacy-policy" className="hover:text-[#F3F6F5] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F3F6F5] transition-colors">Terms of Service</Link>
            <Link to="/support" className="hover:text-[#F3F6F5] transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
