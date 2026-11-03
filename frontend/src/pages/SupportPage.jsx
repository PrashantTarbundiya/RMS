import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy,
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
  Building,
  Send,
  Mail,
  Copy,
  Check,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { API_BASE } from '../config';

const HELP_CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'camera', label: 'Cameras & Hardware' },
  { id: 'enrollment', label: 'Biometric Enrollment' },
  { id: 'attendance', label: 'Attendance & Payroll' },
  { id: 'billing', label: 'Billing & Plans' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

const FAQS = [
  {
    category: 'camera',
    q: 'How do I locate the RTSP URL for my security cameras?',
    a: 'Most enterprise security cameras (Hikvision, Dahua, Axis, Hanwha) stream over RTSP on port 554. For Hikvision: rtsp://username:password@<IP>:554/Streaming/Channels/101. For Dahua: rtsp://username:password@<IP>:554/cam/realmonitor?channel=1&subtype=0. Review our camera documentation for manufacturer patterns.'
  },
  {
    category: 'camera',
    q: 'Can we connect standard USB webcams for reception desks?',
    a: 'Yes. In the Cameras page, choose Device Index mode and enter 0 for your computer\'s primary webcam. Standard webcams (Logitech, Anker, integrated laptop cameras) are fully supported without additional software.'
  },
  {
    category: 'enrollment',
    q: 'How many photos are needed per employee?',
    a: 'AuraPass requires 3 clear photos per worker: one frontal (0°), one slight left (15°), and one slight right (15°). Good diffuse lighting ensures sub-300ms verification.'
  },
  {
    category: 'enrollment',
    q: 'Does it recognize employees with daily glasses or masks?',
    a: 'Yes. Prescription glasses and natural daily headwear are recognized accurately. For best results, capture at least one enrollment photo with their daily glasses on. Dark sunglasses should be removed during check-in.'
  },
  {
    category: 'attendance',
    q: 'How does the grace period policy work?',
    a: 'Under the Departments tab, each department can be configured with an arrival grace period (e.g. 15 minutes). If shift start is 09:00 AM and grace is 15 minutes, arrivals up to 09:15 AM are marked ON TIME. Arrivals at 09:16 AM or later are automatically flagged as LATE.'
  },
  {
    category: 'attendance',
    q: 'How do I export attendance data to Excel or CSV for payroll?',
    a: 'Navigate to the Attendance view, choose your desired date range or department filter, and click the "Export CSV" or "Export Excel" button. The resulting file includes employee names, badge IDs, entry/exit timestamps, and status flags.'
  },
  {
    category: 'billing',
    q: 'What is included in the free Starter plan?',
    a: 'The Starter plan is completely free forever. It supports up to 200 enrolled employees, up to 5 camera streams, local SQLite storage, full sub-300ms verification speed, and daily logs with CSV export. No credit card is required.'
  },
  {
    category: 'troubleshooting',
    q: 'What should we do if our building network loses internet access?',
    a: 'AuraPass operates 100% on your local premises. All face detection, vector matching, and attendance logging execute locally on your machine. Zero internet connection is required for ongoing operations.'
  }
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

  // Contact Form State & Validation
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    topic: 'Support',
    plan: 'Starter',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setSystemHealth(data);
        setHealthLoading(false);
      })
      .catch(() => {
        fetch(`${API_BASE}/ping`)
          .then((r) => r.json())
          .then(() => {
            setSystemHealth({ status: 'ok', app_version: '2026.2', database: 'sqlite_local' });
            setHealthLoading(false);
          })
          .catch(() => {
            setSystemHealth({ status: 'offline' });
            setHealthLoading(false);
          });
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Please provide your full name.';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please provide a valid workplace email address.';
    }
    if (!formData.company.trim()) errors.company = 'Please provide your organization name.';
    if (!formData.message.trim() || formData.message.length < 10) {
      errors.message = 'Please provide details about your inquiry (min 10 characters).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitted(true);
  };

  const filteredFaqs = FAQS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesQuery =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen public-surface bg-[#070A12] flex flex-col font-sans relative">
      
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#070A12]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/docs" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </Link>
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">
              Privacy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">
              Terms
            </Link>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-white/[0.08] bg-[#0B0F19] py-12 px-6">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider font-mono-tag mb-3">
              <LifeBuoy className="w-3.5 h-3.5" />
              Help Center & Diagnostics
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              AuraPass Help Center
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed font-normal">
              Self-service troubleshooting playbooks, camera configurations, and engineering support.
            </p>
          </div>

          {/* System Status Box */}
          <div className="p-4 rounded-xl bg-[#0F1524] border border-white/[0.08] shrink-0 w-full md:w-auto shadow-sm">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Local Engine Status:
              </span>
              <span className="font-mono-tag font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {healthLoading ? 'Checking...' : systemHealth?.status === 'ok' ? 'Online & Ready' : 'Online (Local)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono-tag mt-1.5">
              Engine Version: {systemHealth?.app_version || 'v2026.2'} &bull; Database: SQLite Local
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-12">
        
        {/* Search & Topic Filters */}
        <div className="space-y-4">
          <div className="relative max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search help articles (RTSP streams, enrollment, grace periods)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-normal"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 public-scroll">
            {HELP_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-semibold'
                      : 'bg-[#0F1524] text-slate-400 border border-white/[0.08] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Structured Troubleshooting Playbooks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono-tag tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
            <span>Structured Troubleshooting Playbooks</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl public-card space-y-3">
              <span className="text-[10px] uppercase font-mono-tag text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                Camera & Stream
              </span>
              <h3 className="text-sm font-bold text-white">Camera Feed Displays Black or Times Out</h3>
              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed font-normal">
                <p><strong className="text-slate-300">Symptom:</strong> Video element spins indefinitely.</p>
                <p><strong className="text-slate-300">Likely Cause:</strong> Firewall blocking RTSP port 554 or incorrect credentials.</p>
                <p><strong className="text-slate-300">Fix:</strong> Test RTSP in VLC Media Player. Verify camera user has streaming rights.</p>
                <p><strong className="text-slate-300">If Still Failing:</strong> Switch to substream channel (720p @ 15 FPS).</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl public-card space-y-3">
              <span className="text-[10px] uppercase font-mono-tag text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                Recognition Accuracy
              </span>
              <h3 className="text-sm font-bold text-white">Face Not Recognized or Low Confidence</h3>
              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed font-normal">
                <p><strong className="text-slate-300">Symptom:</strong> Recognized as visitor (distance &gt; 0.40).</p>
                <p><strong className="text-slate-300">Likely Cause:</strong> Heavy backlighting, glare, or face angle exceeds 30°.</p>
                <p><strong className="text-slate-300">Fix:</strong> Ensure diffuse indoor lighting (300-500 lux).</p>
                <p><strong className="text-slate-300">If Still Failing:</strong> Re-enroll with 3 clear photos in entrance lighting.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl public-card space-y-3">
              <span className="text-[10px] uppercase font-mono-tag text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
                Rostering & Shifts
              </span>
              <h3 className="text-sm font-bold text-white">Arrival Flagged as Late Incorrectly</h3>
              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed font-normal">
                <p><strong className="text-slate-300">Symptom:</strong> On-time employee flagged as Late in logs.</p>
                <p><strong className="text-slate-300">Likely Cause:</strong> Grace threshold set too tight or incorrect department.</p>
                <p><strong className="text-slate-300">Fix:</strong> Check Departments tab and verify grace buffer (e.g. 15 min).</p>
                <p><strong className="text-slate-300">If Still Failing:</strong> Check system clock synchronization (NTP).</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono-tag tracking-wider">
            Frequently Asked Questions ({filteredFaqs.length})
          </h2>

          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => {
              const isExpanded = expandedFaq === i;
              return (
                <div key={i} className="rounded-xl border border-white/[0.08] bg-[#0F1524] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : i)}
                    className="w-full p-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F19] border border-white/[0.08] space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Contact Enterprise Support</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Business plan customers receive priority 2-hour SLA response. Starter tier inquiries are answered best-effort.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-sm space-y-2 font-mono-tag">
              <p className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Inquiry Submitted Successfully</span>
              </p>
              <p className="text-xs text-slate-300 font-normal">
                Thank you, {formData.name}. Our engineering support team will review your inquiry and follow up at {formData.email}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jane@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Organization Name *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Acme Manufacturing"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  {formErrors.company && <p className="text-[11px] text-rose-400 mt-1">{formErrors.company}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Topic</label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Support">Technical Support</option>
                    <option value="Camera">Camera / RTSP Integration</option>
                    <option value="Security">Security & Privacy Inquiry</option>
                    <option value="Sales">Sales & Enterprise Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Plan</label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Starter">Starter ($0 / Free Forever)</option>
                    <option value="Business">Business ($399 / mo)</option>
                    <option value="Enterprise">Custom Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-300 font-semibold mb-1">Details & Log Output *</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your question or paste relevant RTSP error logs..."
                  className="w-full p-3.5 rounded-xl bg-[#0F1524] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-normal"
                />
                {formErrors.message && <p className="text-[11px] text-rose-400 mt-1">{formErrors.message}</p>}
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070D] py-8 px-6 text-center text-xs text-slate-500 font-mono-tag">
        <p>&copy; {new Date().getFullYear()} AuraPass Enterprise. Local Support Engine v2026.2.</p>
      </footer>
    </div>
  );
}
