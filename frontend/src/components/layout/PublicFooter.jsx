import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowUpRight, Terminal, Lock, CheckCircle2 } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        {/* ── Top 4-Column Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-border">
          
          {/* Col 1 & 2: Brand & Trust Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Shield className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">AuraPass™ Enterprise</span>
            </Link>
            
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm prose-readable">
              Sovereign on-premise facial biometric attendance and physical access control. Turn standard IP cameras into sub-300ms verification gates with zero cloud data egress.
            </p>

            {/* Live Operational Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground font-medium">All Systems Operational</span>
              <span className="text-muted-foreground">• v2026.2 LTS</span>
            </div>

            {/* Business Contact & NAP info */}
            <div className="text-[11px] text-muted-foreground space-y-1 font-mono pt-2 border-t border-border/50">
              <div>📍 Ahmedabad & Gandhinagar, Gujarat, India (382421)</div>
              <div>✉️ <a href="mailto:support@aurapass.in" className="text-foreground hover:underline">support@aurapass.in</a> • Mon–Fri, 09:00–18:00 IST</div>
            </div>
          </div>

          {/* Col 3: Product Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Product & Proof</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="/#features" className="hover:text-foreground transition-colors">Features & Capabilities</a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing & Plans (INR)</a>
              </li>
              <li>
                <a href="/#case-studies" className="hover:text-foreground transition-colors">Enterprise Case Studies</a>
              </li>
              <li>
                <a href="/#competitors" className="hover:text-foreground transition-colors">Competitor Comparison</a>
              </li>
              <li>
                <Link to="/kiosk" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <span>Kiosk Gate Interface</span>
                  <ArrowUpRight size={11} className="opacity-70" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Developers & Documentation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Developers & IT</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/docs" className="hover:text-foreground transition-colors">Architecture Overview</Link>
              </li>
              <li>
                <a href="/#research" className="hover:text-foreground transition-colors">Biometric AI Research</a>
              </li>
              <li>
                <Link to="/docs?page=requirements" className="hover:text-foreground transition-colors">Hardware Requirements</Link>
              </li>
              <li>
                <Link to="/docs?page=rtsp-onvif" className="hover:text-foreground transition-colors">RTSP & PoE Switches</Link>
              </li>
              <li>
                <Link to="/docs?page=turnstile-relays" className="hover:text-foreground transition-colors">24V GPIO Relay Wiring</Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">Engineering Support</Link>
              </li>
              <li>
                <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono text-[11px]">
                  <span>llms.txt (AI Manifest)</span>
                  <ArrowUpRight size={11} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Sovereignty & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Compliance & Trust</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy (DPDP Act)</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/docs?page=sovereignty-spec" className="hover:text-foreground transition-colors">Zero-Egress Data Spec</Link>
              </li>
              <li>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-1 pt-1">
                  <Lock size={12} />
                  <span>512-D Non-Invertible</span>
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar ── */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AuraPass Enterprise. Sovereign On-Premise Biometric Infrastructure.</p>
          
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>

          </div>
        </div>

      </div>
    </footer>
  );
}

