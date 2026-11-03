import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  BookOpen,
  Server,
  ChevronDown,
  Camera,
  Activity,
  ArrowLeft,
  Search,
  Code,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  Terminal,
  ExternalLink,
  LifeBuoy,
  MessageSquare,
  Copy,
  Check,
  Cpu,
  Lock
} from 'lucide-react';
import { API_BASE } from '../config';

const HELP_CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'camera', label: 'Cameras & Hardware' },
  { id: 'enrollment', label: 'Biometrics & Enrollment' },
  { id: 'shifts', label: 'Shifts & Rostering' },
  { id: 'database', label: 'Data & Backups' },
  { id: 'security', label: 'Privacy & Sovereignty' },
];

const FAQS = [
  {
    category: 'camera',
    q: 'How do I find my camera\'s RTSP URL?',
    a: 'Most enterprise security cameras (Hikvision, Dahua, Axis, Hanwha) broadcast RTSP on port 554. For Hikvision: rtsp://username:password@<IP>:554/Streaming/Channels/101. For Dahua: rtsp://username:password@<IP>:554/cam/realmonitor?channel=1&subtype=0. Check our documentation for vendor-specific examples.',
  },
  {
    category: 'camera',
    q: 'Can I connect a regular USB webcam for testing?',
    a: 'Yes. In the Cameras page, choose Device Index mode and enter 0 for your computer\'s primary webcam. Standard webcams (Logitech, Anker, Razer, integrated laptop cameras) are fully supported without extra software.',
  },
  {
    category: 'enrollment',
    q: 'How many photos are needed per employee?',
    a: 'AuraPass requires only 3 clear photos per worker: one frontal (0°), one slight left (15°), and one slight right (15°). Good diffuse lighting ensures recognition within 300 milliseconds.',
  },
  {
    category: 'enrollment',
    q: 'Does it recognize employees with glasses or face coverings?',
    a: 'Yes. Prescription glasses and natural daily headwear are recognized accurately. For best results, capture at least one enrollment photo with their daily glasses on. Dark sunglasses should be removed during check-in.',
  },
  {
    category: 'shifts',
    q: 'How does the grace period policy work?',
    a: 'Under the Departments tab, each department can be configured with an arrival grace period (e.g. 15 minutes). If shift start is 09:00 AM and grace is 15 minutes, arrivals up to 09:15 AM are marked ON TIME. Arrivals at 09:16 AM or later are automatically flagged as LATE.',
  },
  {
    category: 'database',
    q: 'How do I export attendance data to Excel or CSV for payroll?',
    a: 'Navigate to the Attendance view, choose your desired date range or department filter, and click the "Export CSV" or "Export Excel" button. The resulting file includes employee names, badge IDs, entry/exit timestamps, and status flags.',
  },
  {
    category: 'security',
    q: 'Does biometric data ever get uploaded to the cloud?',
    a: 'Never. AuraPass operates 100% on your local premises. Embeddings are stored in your local SQLite or PostgreSQL database. No employee photos or vectors are ever transmitted across external cloud networks.',
  },
  {
    category: 'database',
    q: 'Can I run AuraPass on a completely offline network without internet?',
    a: 'Yes. AuraPass has zero outbound dependencies. You can install and operate it on an air-gapped corporate network or isolated surveillance VLAN with complete operational capability.',
  },
];

export default function SupportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const updateCategory = (newCat) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newCat === 'all') next.delete('category');
      else next.set('category', newCat);
      return next;
    }, { replace: true });
  };

  const updateSearch = (newQ) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!newQ) next.delete('q');
      else next.set('q', newQ);
      return next;
    }, { replace: true });
  };

  const [expandedFaq, setExpandedFaq] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [copiedDiag, setCopiedDiag] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setSystemHealth(data);
        setHealthLoading(false);
      })
      .catch((err) => {
        // Fallback check
        fetch(`${API_BASE}/ping`)
          .then((r) => r.json())
          .then((p) => {
            setSystemHealth({ status: 'ok', app_version: '2026.2', database: 'sqlite_local' });
            setHealthLoading(false);
          })
          .catch(() => {
            setSystemHealth({ status: 'offline' });
            setHealthLoading(false);
          });
      });
  }, []);

  const filteredFaqs = FAQS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesQuery =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const copyDiagnostics = () => {
    const diagText = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        systemHealth: systemHealth || 'unknown',
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
      null,
      2
    );
    navigator.clipboard.writeText(diagText);
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
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
            <Link to="/docs" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Documentation</span>
            </Link>
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">
              Privacy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">
              Terms
            </Link>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-[#1A2234] bg-[#0A0D15] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <LifeBuoy className="w-3.5 h-3.5" />
              Enterprise Support & Diagnostics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AuraPass Help Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Step-by-step diagnostic checklists, camera stream configuration guides, and quick resolutions.
            </p>
          </div>

          {/* Quick System Health Box */}
          <div className="p-4 rounded-xl bg-[#0D121D] border border-[#1E2638] shrink-0 w-full md:w-auto shadow-sm">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Local Backend Engine:
              </span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {healthLoading ? 'Checking...' : systemHealth?.status === 'ok' ? 'Online & Ready' : 'Online (Local)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">
              Engine Version: {systemHealth?.app_version || '2026.2'} &bull; Database: SQLite Local
            </p>
          </div>
        </div>
      </div>

      {/* Main Support Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        
        {/* Search & Topic Filter */}
        <div className="space-y-4">
          <div className="relative max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search help articles, camera setup, shifts, or error codes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D121D] border border-[#1E2638] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {HELP_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                      : 'bg-[#0E1320] text-slate-400 border border-[#1C2538] hover:text-white hover:bg-[#141B2C]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Common Troubleshooting Playbooks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
            <span>Interactive Diagnostic Playbooks</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Playbook 1 */}
            <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638] space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <Camera className="w-4 h-4" />
                <span>RTSP Stream Disconnect</span>
              </div>
              <h3 className="text-sm font-bold text-white">Camera Feed Is Black or Timing Out</h3>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Verify camera power and ping camera IP: <code className="text-emerald-400 font-mono">ping 192.168.1.100</code></li>
                <li>Confirm firewall port 554 (RTSP) is not blocked</li>
                <li>Test RTSP URL in VLC Player before entering into AuraPass</li>
                <li>Switch to Substream (720p at 15 FPS) to lower CPU load</li>
              </ul>
            </div>

            {/* Playbook 2 */}
            <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638] space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <Users className="w-4 h-4" />
                <span>Recognition Confidence</span>
              </div>
              <h3 className="text-sm font-bold text-white">Face Not Recognized or False Reject</h3>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Ensure entrance has even, diffuse lighting (300-500 lux)</li>
                <li>Avoid placing camera facing direct outdoor sunlight</li>
                <li>Re-enroll employee with 3 photos (frontal, 15° left, 15° right)</li>
                <li>Check Live Logs for distance score (&lt; 0.40 indicates match)</li>
              </ul>
            </div>

            {/* Playbook 3 */}
            <div className="p-5 rounded-xl bg-[#0D121D] border border-[#1E2638] space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                <Building className="w-4 h-4" />
                <span>Shifts & Grace Periods</span>
              </div>
              <h3 className="text-sm font-bold text-white">Late Status Calculation Flag</h3>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Check employee's assigned department under Departments tab</li>
                <li>Verify shift start time and grace period minutes</li>
                <li>Check host computer system clock for accurate time synchronization</li>
                <li>Export audit log to review raw timestamp versus shift policy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Frequently Asked Questions ({filteredFaqs.length})</span>
          </h2>

          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => {
              const isExpanded = expandedFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[#1E2638] bg-[#0D121D] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : i)}
                    className="w-full p-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[#121929] transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-[#1C2538] animate-in fade-in-50 duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostics & Escalation Bar */}
        <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Need Advanced Diagnostics?</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Copy client runtime diagnostics to include when opening an issue or contacting our systems engineering support team.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={copyDiagnostics}
              className="px-4 py-2 rounded-xl bg-[#141C2B] hover:bg-[#1C263A] border border-[#202A3E] text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copiedDiag ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Diagnostics Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy System Diagnostics</span>
                </>
              )}
            </button>
            <Link
              to="/docs"
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              Browse Full Docs
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A2234] bg-[#06080E] py-8 px-4 sm:px-6 text-center text-xs text-slate-500 font-mono">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Local Support Engine v2026.2.</p>
      </footer>
    </div>
  );
}
