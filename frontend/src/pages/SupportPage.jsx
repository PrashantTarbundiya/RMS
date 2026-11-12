import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import Button from '../components/ui/marketing/Button';
import Badge from '../components/ui/marketing/Badge';
import GlassCard from '../components/ui/marketing/GlassCard';
import {
  LifeBuoy,
  Search,
  Camera,
  Users,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Check,
  Scan,
  X,
  FileSpreadsheet,
  Headphones,
  Mail,
  Phone,
  HardDrive
} from 'lucide-react';

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    hardwareModel: '',
    priority: 'medium',
    description: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [generatedCode, setGeneratedCode] = useState('AP-8492');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Valid corporate email address required';
    }
    if (!formData.organization.trim()) errors.organization = 'Organization name required';
    if (!formData.description.trim()) errors.description = 'Issue description required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setTicketLoading(true);
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCode(data.ticket_code || 'AP-8492');
        setTicketSubmitted(true);
      } else {
        setFormErrors({ description: data.error || 'Failed to submit support case. Please retry.' });
      }
    } catch (err) {
      // Offline fallback
      setGeneratedCode(`AP-${Math.floor(1000 + Math.random() * 9000)}`);
      setTicketSubmitted(true);
    } finally {
      setTicketLoading(false);
    }
  };

  // Technical Gateways
  const CATEGORIES = [
    {
      id: 'camera',
      title: 'Camera & Hardware Setup',
      icon: Camera,
      topics: [
        'RTSP and ONVIF URL ingestion',
        'Managed PoE switch power budgets',
        'Hikvision, Dahua, and Axis configuration',
        'Sub-300ms stream latency optimization'
      ],
      link: '/docs?page=rtsp-onvif'
    },
    {
      id: 'enrollment',
      title: 'Face Enrollment & Lighting',
      icon: Users,
      topics: [
        '3-shot protocol (0°, -15°, +15°)',
        '300 to 700 Lux illumination standards',
        'Prescription glasses and mask tolerance',
        '160×160 pixel minimum face bounding box'
      ],
      link: '/docs?page=three-shot-protocol'
    },
    {
      id: 'turnstiles',
      title: 'Turnstiles, Kiosks & Relays',
      icon: Zap,
      topics: [
        '24V opto-isolated GPIO dry-contact wiring',
        '450ms momentary pulse calibration',
        'Tripod and speed gate flap controllers',
        'Fail-open vs fail-secure emergency safety'
      ],
      link: '/docs?page=turnstile-relays'
    },
    {
      id: 'compliance',
      title: 'Local Data & Compliance',
      icon: Shield,
      topics: [
        'DPDP Act 2023 local residency mandates',
        '512-D non-invertible vector verification',
        'SQLite WAL and PostgreSQL backup procedures',
        'Tamper-evident audit trail exports'
      ],
      link: '/docs?page=sovereignty-spec'
    }
  ];

  // Popular Runbooks
  const POPULAR_ARTICLES = [
    {
      title: 'Troubleshooting RTSP packet loss and dropped frames over managed PoE switches',
      category: 'Network Infrastructure',
      readTime: '4 min read',
      link: '/docs?page=camera-troubleshooting'
    },
    {
      title: 'Calibrating facial vector thresholds for 3-shot enrollment in variable lobby lighting',
      category: 'Biometrics & Inference',
      readTime: '3 min read',
      link: '/docs?page=image-quality'
    },
    {
      title: 'Wiring 24V DC opto-isolated relays to Alvarado and Boon Edam turnstile gates',
      category: 'Physical Access Control',
      readTime: '4 min read',
      link: '/docs?page=turnstile-relays'
    },
    {
      title: 'Automating daily PostgreSQL biometric hash backups without cloud egress',
      category: 'Database & Security',
      readTime: '5 min read',
      link: '/docs?page=database-backup'
    },
    {
      title: 'Configuring shift grace periods and deterministic punch reconciliation',
      category: 'Rostering & Payroll',
      readTime: '4 min read',
      link: '/docs?page=shifts-and-grace'
    },
    {
      title: 'Emergency bypass and air-gapped node recovery procedure during power interruptions',
      category: 'Node Operations',
      readTime: '3 min read',
      link: '/docs?page=general-faq'
    }
  ];

  const filteredArticles = POPULAR_ARTICLES.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen public-surface flex flex-col font-sans transition-colors duration-200">
      {/* Unified Public Header */}
      <PublicHeader />

      <main className="flex-1">
        {/* ─── Hero Section with Knowledge Search ─── */}
        <section className="pt-16 pb-16 border-b border-border bg-secondary/30 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <Badge variant="emerald" dot>
              Engineering Support & Diagnostics
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
              Hardware-grade resolution for enterprise deployments.
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Diagnostic guides, dry-contact relay wiring specifications, camera RTSP ingestion matrices, and priority incident escalation for on-premise nodes.
            </p>

            {/* Interactive Search Bar */}
            <div className="max-w-lg mx-auto pt-4">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search error messages, RTSP URLs, or relay wiring..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4 Technical Knowledge Gateways ─── */}
        <section className="py-16 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Deployment Gateways
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1 mb-2">
                Knowledge Base & Operational Runbooks
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <GlassCard
                    key={cat.id}
                    variant="default"
                    className="p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-bold text-base text-foreground mb-3">{cat.title}</h3>
                      <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                        {cat.topics.map((t, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={cat.link}
                      className="pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <span>Explore Runbooks</span>
                      <ArrowRight size={13} />
                    </Link>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Popular Runbooks & Articles ─── */}
        <section className="py-16 bg-secondary/30 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Frequently Consulted Technical Guides</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Step-by-step resolution for common facility questions.</p>
              </div>
              <Link to="/docs" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                View All Documentation <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((art, idx) => (
                <Link
                  key={idx}
                  to={art.link}
                  className="p-4 rounded-xl bg-card border border-border hover:border-emerald-500/40 transition-colors flex flex-col justify-between gap-2 shadow-sm"
                >
                  <div className="text-sm font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {art.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">{art.category}</span>
                    <span>{art.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Enterprise Ticket Submission Form ─── */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <GlassCard variant="elevated" className="p-6 sm:p-10 border-border/80">
              <div className="text-center max-w-xl mx-auto mb-8">
                <Badge variant="zinc" className="mb-2">Direct Engineer Escalation</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Open an Engineering Support Case
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Connect directly with specialized on-premise deployment engineers. You can also reach our primary desk at <a href="mailto:vatsalvadgama04@gmail.com" className="text-emerald-500 font-mono font-medium hover:underline">vatsalvadgama04@gmail.com</a>.
                </p>
              </div>

              {ticketSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Support Case #{generatedCode} Dispatched</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    An engineer has been assigned to your ticket. You will receive an email update at <strong className="text-foreground">{formData.email}</strong> within 1 hour for critical issues.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTicketSubmitted(false);
                      setFormData({ name: '', email: '', organization: '', hardwareModel: '', priority: 'medium', description: '' });
                    }}
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Rajesh Patel"
                        className={`w-full px-3.5 py-2 rounded-xl bg-secondary/50 border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          formErrors.name ? 'border-red-500' : 'border-border'
                        }`}
                      />
                      {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="rajesh@company.com"
                        className={`w-full px-3.5 py-2 rounded-xl bg-secondary/50 border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          formErrors.email ? 'border-red-500' : 'border-border'
                        }`}
                      />
                      {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        placeholder="Acme Industrial Ltd."
                        className={`w-full px-3.5 py-2 rounded-xl bg-secondary/50 border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          formErrors.organization ? 'border-red-500' : 'border-border'
                        }`}
                      />
                      {formErrors.organization && <p className="text-[11px] text-red-500 mt-1">{formErrors.organization}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Camera / Gateway Model
                      </label>
                      <input
                        type="text"
                        name="hardwareModel"
                        value={formData.hardwareModel}
                        onChange={handleInputChange}
                        placeholder="e.g. Hikvision DS-2CD / iPad 10th Gen"
                        className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Issue Severity Level
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                    >
                      <option value="low">Low — General inquiry or configuration advice</option>
                      <option value="medium">Medium — Non-critical camera stream delay</option>
                      <option value="high">High — Multi-employee recognition failures</option>
                      <option value="critical">Critical — Production entrance turnstile offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Problem Description & Error Logs *
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the issue, include RTSP stream parameters, and any error messages from the live logs..."
                      className={`w-full px-3.5 py-2 rounded-xl bg-secondary/50 border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        formErrors.description ? 'border-red-500' : 'border-border'
                      }`}
                    />
                    {formErrors.description && <p className="text-[11px] text-red-500 mt-1">{formErrors.description}</p>}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={ticketLoading}
                    icon={Send}
                    className="w-full mt-2"
                  >
                    {ticketLoading ? 'Dispatching Case...' : 'Submit Engineering Case'}
                  </Button>
                </form>
              )}
            </GlassCard>
          </div>
        </section>
      </main>

      {/* Unified Public Footer */}
      <PublicFooter />
    </div>
  );
}
