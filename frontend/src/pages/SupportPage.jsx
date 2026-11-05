import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import Button from '../components/ui/marketing/Button';
import Eyebrow from '../components/ui/marketing/Eyebrow';
import Container from '../components/ui/marketing/Container';
import Section from '../components/ui/marketing/Section';

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = (e) => {
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
    // Simulate enterprise ticket dispatch
    setTimeout(() => {
      setTicketLoading(false);
      setTicketSubmitted(true);
    }, 800);
  };

  // Category Cards
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

  // Popular Technical Runbooks
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
      link: '/docs?page=sovereignty-spec'
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

  return (
    <div className="min-h-screen bg-[#06090B] text-[#9AA7A3] font-sans selection:bg-[#3DDC97]/20 selection:text-[#3DDC97]">
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#06090B]/95 border-b border-white/[0.08] backdrop-blur-md">
        <Container className="py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#F3F6F5] font-semibold text-sm">
            <span className="w-6 h-6 rounded-md bg-[#0B1013] border border-white/10 flex items-center justify-center text-[#3DDC97]">
              <Scan className="w-3.5 h-3.5 stroke-[1.5]" />
            </span>
            <span>AuraPass</span>
            <span className="text-xs font-mono text-[#3DDC97] px-1.5 py-0.2 rounded bg-[#3DDC97]/10 border border-[#3DDC97]/20">
              SUPPORT
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/docs" className="text-[#9AA7A3] hover:text-white transition-colors">
              Documentation
            </Link>
            <Link to="/" className="text-[#3DDC97] hover:text-[#5FE8AD] transition-colors">
              ← System Overview
            </Link>
          </div>
        </Container>
      </header>

      {/* 2. HERO SEARCH SECTION */}
      <section className="pt-16 pb-14 border-b border-white/[0.08] relative overflow-hidden">
        <Container className="text-center max-w-3xl space-y-4">
          <Eyebrow variant="emerald">Help Center & Engineering Knowledge Base</Eyebrow>
          <h1 className="text-3xl sm:text-5xl font-semibold text-[#F3F6F5] tracking-tight leading-[1.1] text-balance">
            Hardware-grade resolution for enterprise deployments.
          </h1>
          <p className="text-sm sm:text-base text-[#9AA7A3] max-w-xl mx-auto leading-relaxed">
            Diagnostic guides, dry-contact relay wiring specifications, camera RTSP ingestion matrices, and priority escalation for on-premise nodes.
          </p>

          {/* Large Search Input */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#66726E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles, camera setup, or error codes..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#0B1013] border border-white/10 text-sm text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40 shadow-sm"
              />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] font-mono text-[#66726E]">
              <span>Quick filters:</span>
              <button
                type="button"
                onClick={() => setSearchQuery('RTSP stream drops')}
                className="hover:text-[#F3F6F5] underline underline-offset-2"
              >
                RTSP stream drops
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setSearchQuery('Turnstile relay wiring')}
                className="hover:text-[#F3F6F5] underline underline-offset-2"
              >
                Turnstile relay wiring
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setSearchQuery('3-shot enrollment')}
                className="hover:text-[#F3F6F5] underline underline-offset-2"
              >
                3-shot enrollment
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setSearchQuery('Grace period')}
                className="hover:text-[#F3F6F5] underline underline-offset-2"
              >
                Grace period
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. SUBSYSTEM CATEGORY CARDS */}
      <Section hairline={false}>
        <Container>
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <Eyebrow variant="neutral">Four System Pillars</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#F3F6F5] tracking-tight">
              Explore by Technical Subsystem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="p-6 sm:p-7 rounded-2xl border border-white/[0.08] bg-[#0B1013] flex flex-col justify-between space-y-5 hover:border-white/20 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#06090B] border border-white/10 flex items-center justify-center text-[#3DDC97]">
                      <Icon className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#F3F6F5] tracking-tight">
                        {cat.title}
                      </h3>
                      <ul className="mt-3 space-y-2 text-xs text-[#9AA7A3]">
                        {cat.topics.map((topic, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#3DDC97]" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    to={cat.link}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3DDC97] hover:text-[#5FE8AD] transition-colors pt-2 border-t border-white/[0.06]"
                  >
                    <span>Browse technical documentation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* 4. POPULAR TECHNICAL ARTICLES */}
      <Section className="border-t border-white/[0.08]">
        <Container>
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <Eyebrow variant="neutral">Verified Runbooks</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#F3F6F5] tracking-tight">
              Popular Engineering Articles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {POPULAR_ARTICLES.map((art, idx) => (
              <Link
                key={idx}
                to={art.link}
                className="p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#0B1013] hover:border-white/20 transition-colors flex items-start justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#66726E]">
                    <span>{art.category}</span>
                    <span>•</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#F3F6F5] group-hover:text-[#3DDC97] transition-colors">
                    {art.title}
                  </h4>
                </div>
                <ArrowRight className="w-4 h-4 text-[#66726E] group-hover:text-[#3DDC97] shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* 5. ENTERPRISE ENGINEERING SUPPORT TICKET FORM */}
      <Section className="border-t border-white/[0.08]">
        <Container size="narrow">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <Eyebrow variant="emerald">Priority Engineering Escalation</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#F3F6F5] tracking-tight">
              Open a Support Ticket
            </h2>
            <p className="text-xs text-[#9AA7A3] leading-relaxed">
              Air-gapped on-premise emergency SLA: 2 hours for Business and Enterprise tiers. Handled by systems engineers.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0B1013] shadow-xl">
            {ticketSubmitted ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#3DDC97]/10 border border-[#3DDC97]/30 text-[#3DDC97] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F3F6F5]">
                  Support Ticket Dispatched Successfully
                </h3>
                <p className="text-xs text-[#9AA7A3] max-w-md mx-auto leading-relaxed">
                  Ticket reference <span className="font-mono text-[#3DDC97]">#TKT-2026-0842</span> has been routed to our on-premise deployment engineering group. You will receive an encrypted acknowledgment at your corporate email address within the SLA window.
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setTicketSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        organization: '',
                        hardwareModel: '',
                        priority: 'medium',
                        description: '',
                      });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Submit another inquiry
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#F3F6F5] font-medium mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Vikram Singhania"
                      className="w-full h-10 px-3 rounded-lg bg-[#06090B] border border-white/10 text-xs text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40"
                    />
                    {formErrors.name && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#F3F6F5] font-medium mb-1.5">
                      Corporate Work Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="vikram@enterprise.com"
                      className="w-full h-10 px-3 rounded-lg bg-[#06090B] border border-white/10 text-xs text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40"
                    />
                    {formErrors.email && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#F3F6F5] font-medium mb-1.5">
                      Organization / Facility Name *
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Industrial Plant 02"
                      className="w-full h-10 px-3 rounded-lg bg-[#06090B] border border-white/10 text-xs text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40"
                    />
                    {formErrors.organization && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">{formErrors.organization}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#F3F6F5] font-medium mb-1.5">
                      Camera or Hardware Model
                    </label>
                    <input
                      type="text"
                      name="hardwareModel"
                      value={formData.hardwareModel}
                      onChange={handleInputChange}
                      placeholder="e.g. Hikvision DS-2CD / Logitech BRIO"
                      className="w-full h-10 px-3 rounded-lg bg-[#06090B] border border-white/10 text-xs text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#F3F6F5] font-medium mb-1.5">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-lg bg-[#06090B] border border-white/10 text-xs text-[#F3F6F5] focus:outline-none focus:border-[#3DDC97]/40"
                  >
                    <option value="low">Low — General inquiry or licensing question</option>
                    <option value="medium">Medium — Configuration assistance</option>
                    <option value="high">High — RTSP or biometric degradation</option>
                    <option value="urgent">Urgent — Turnstile relay or perimeter lockout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#F3F6F5] font-medium mb-1.5">
                    Issue Description & Diagnostic Logs *
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the incident, error messages, and network subnet topology..."
                    className="w-full p-3 rounded-lg bg-[#06090B] border border-white/10 text-xs text-[#F3F6F5] placeholder-[#66726E] focus:outline-none focus:border-[#3DDC97]/40 font-mono"
                  />
                  {formErrors.description && (
                    <p className="text-[#FF6B6B] text-[11px] mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-[11px] font-mono text-[#66726E]">
                    Zero raw imagery or video frames uploaded with inquiry.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={ticketLoading}
                  >
                    {ticketLoading ? 'Dispatching...' : 'Submit Support Ticket'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Container>
      </Section>

      {/* 6. MINIMAL FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#06090B] py-10 text-xs text-[#66726E]">
        <Container className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Scan className="w-4 h-4 text-[#3DDC97] stroke-[1.5]" />
            <span>AuraPass Enterprise Support</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Legal & Privacy</Link>
            <Link to="/" className="text-[#3DDC97] hover:underline">System Overview</Link>
          </div>
        </Container>
      </footer>

    </div>
  );
}
