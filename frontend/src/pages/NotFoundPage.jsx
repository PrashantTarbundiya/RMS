import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import Button from '../components/ui/marketing/Button';
import Badge from '../components/ui/marketing/Badge';
import GlassCard from '../components/ui/marketing/GlassCard';
import {
  Shield,
  ArrowRight,
  BookOpen,
  Search,
  Home,
  HelpCircle,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';

export default function NotFoundPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/docs?page=architecture&q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen public-surface flex flex-col font-sans transition-colors duration-200">
      {/* Unified Public Header */}
      <PublicHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 md:py-24 text-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="hero-dot-grid absolute inset-0 pointer-events-none opacity-30" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

        <div className="max-w-xl mx-auto relative z-10 space-y-6">
          <Badge variant="zinc" className="font-mono">
            HTTP 404 • Resource Not Found
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            Lost in the perimeter.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The destination URL or endpoint you requested does not exist on this AuraPass node. It may have been moved, archived, or requires administrative credentials.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation or runbooks..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Destination Cards */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Link
              to="/"
              className="p-3.5 rounded-xl bg-card border border-border hover:border-emerald-500/40 transition-colors block group"
            >
              <div className="flex items-center justify-between text-foreground font-semibold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Home size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Homepage
                </span>
                <ArrowRight size={11} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[11px] text-muted-foreground">Return to system overview.</div>
            </Link>

            <Link
              to="/docs"
              className="p-3.5 rounded-xl bg-card border border-border hover:border-emerald-500/40 transition-colors block group"
            >
              <div className="flex items-center justify-between text-foreground font-semibold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Documentation
                </span>
                <ArrowRight size={11} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[11px] text-muted-foreground">Browse guides and runbooks.</div>
            </Link>

            <Link
              to="/support"
              className="p-3.5 rounded-xl bg-card border border-border hover:border-emerald-500/40 transition-colors block group"
            >
              <div className="flex items-center justify-between text-foreground font-semibold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Help Center
                </span>
                <ArrowRight size={11} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[11px] text-muted-foreground">Contact enterprise support.</div>
            </Link>
          </div>
        </div>
      </main>

      {/* Unified Public Footer */}
      <PublicFooter />
    </div>
  );
}
