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
  Terminal,
} from 'lucide-react';
import { API_BASE } from '../config';

const DOC_TABS = [
  { id: 'quickstart', label: 'Setup & Requirements', icon: Server },
  { id: 'camera', label: 'Connecting Cameras', icon: Camera },
  { id: 'employees', label: 'Adding Employees', icon: Users },
  { id: 'api', label: 'API & Developer Access', icon: Code },
  { id: 'faq', label: 'FAQ & Help', icon: HelpCircle },
];

const FAQ_ITEMS = [
  {
    category: 'Photos & Enrollment',
    q: 'How many photos do I need to enroll an employee?',
    a: 'You only need 3 clear photos: one looking straight ahead, one slightly turned to the left, and one slightly turned to the right. Good lighting helps the system recognize workers even faster.',
  },
  {
    category: 'Photos & Enrollment',
    q: 'Does it recognize people wearing glasses, hats, or masks?',
    a: 'Yes. Normal prescription glasses and headwear work without issue. For best results during initial enrollment, have the employee take at least one photo with their normal daily glasses on.',
  },
  {
    category: 'Cameras & Hardware',
    q: 'Do I need a special GPU or an expensive gaming computer?',
    a: 'No. Any modern standard PC with a 4-core processor (like an Intel Core i5 or AMD Ryzen 5) and 8 GB of RAM can easily handle face recognition in under 300 milliseconds. A dedicated graphics card is only needed if you are running more than 10 camera lanes simultaneously.',
  },
  {
    category: 'Cameras & Hardware',
    q: 'What cameras work with AuraPass?',
    a: 'Any security camera that supports standard RTSP or ONVIF video streams works directly (Hikvision, Dahua, Axis, Bosch, Hanwha). Standard USB webcams also work when plugged directly into your computer.',
  },
  {
    category: 'Privacy & Security',
    q: 'Does employee face data ever leave our company building?',
    a: 'Never. AuraPass runs 100% on your own computer. All face matching and attendance logs stay inside your local network. No data is sent over the internet.',
  },
  {
    category: 'Privacy & Security',
    q: 'How can I back up or export attendance records?',
    a: 'From the Dashboard, you can download all attendance logs as Excel (CSV) or printable PDF reports with one click.',
  },
];

export default function SupportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'quickstart';
  const searchQuery = searchParams.get('q') || '';

  const updateTab = (newTab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newTab === 'quickstart') next.delete('tab'); else next.set('tab', newTab);
      return next;
    }, { replace: true });
  };

  const updateSearch = (newQ) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!newQ) next.delete('q'); else next.set('q', newQ);
      return next;
    }, { replace: true });
  };
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setSystemHealth(data);
        setHealthLoading(false);
      })
      .catch((err) => {
        console.warn('Could not reach backend health endpoint', err);
        setHealthLoading(false);
      });
  }, []);

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans">
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
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-[#1A2234] bg-[#0A0D15] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                Help & Documentation
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                AuraPass Help Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Simple guides to connect your cameras, enroll workers, and check daily attendance logs.
              </p>
            </div>

            {/* Quick System Health Box */}
            <div className="p-3.5 rounded-xl bg-[#0D121D] border border-[#1E2638] shrink-0 w-full md:w-auto">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Local System:
                </span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {healthLoading ? 'Checking...' : systemHealth?.status === 'ok' ? 'Online & Ready' : 'Running Locally'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Version: {systemHealth?.app_version || '1.0.0'} &bull; Database: SQLite (Local)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Documentation Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-[#1A2234]">
          {DOC_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm'
                    : 'bg-[#0D121D] border border-[#1B2336] text-slate-400 hover:text-white hover:bg-[#121929]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SETUP & REQUIREMENTS */}
        {activeTab === 'quickstart' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                Computer Requirements & Getting Started
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                AuraPass runs on standard Windows or Linux computers. No special cloud setup is required.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                  <p className="text-xs font-semibold text-emerald-400 mb-1">Recommended Office Setup</p>
                  <p className="text-sm font-bold text-white mb-2">Standard Desktop PC or Laptop</p>
                  <ul className="text-xs text-slate-400 space-y-1.5">
                    <li>&bull; <strong className="text-white">Processor:</strong> 4 cores (Intel Core i5, AMD Ryzen 5, or newer)</li>
                    <li>&bull; <strong className="text-white">Memory:</strong> 8 GB RAM</li>
                    <li>&bull; <strong className="text-white">Storage:</strong> 20 GB free disk space</li>
                    <li>&bull; <strong className="text-white">Operating System:</strong> Windows 10/11 or Ubuntu Linux 22.04</li>
                    <li>&bull; <strong className="text-white">Speed:</strong> Under 300ms per check-in</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                  <p className="text-xs font-semibold text-emerald-400 mb-1">Heavy Industrial Setup</p>
                  <p className="text-sm font-bold text-white mb-2">Multi-Lane Factory Gate (5+ Cameras)</p>
                  <ul className="text-xs text-slate-400 space-y-1.5">
                    <li>&bull; <strong className="text-white">Processor:</strong> 8 cores (Intel Core i7 / AMD Ryzen 7)</li>
                    <li>&bull; <strong className="text-white">Memory:</strong> 16 GB RAM</li>
                    <li>&bull; <strong className="text-white">Network:</strong> Gigabit Ethernet switch for camera feeds</li>
                    <li>&bull; <strong className="text-white">Optional:</strong> NVIDIA GPU for sub-100ms multi-camera speed</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 border-t border-[#1C2538] pt-5">
                <h3 className="text-sm font-bold text-white">3 Steps to Start:</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong className="text-emerald-400">Step 1:</strong> Create your free account or sign in to the console.</p>
                  <p><strong className="text-emerald-400">Step 2:</strong> Go to the "Cameras" tab and enter your camera's local RTSP stream address or choose your USB webcam.</p>
                  <p><strong className="text-emerald-400">Step 3:</strong> Click "Upload" to add employee photos and start marking attendance automatically.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONNECTING CAMERAS */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                Connecting Your Cameras
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                Connect standard IP security cameras or plug-in USB webcams in under two minutes.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                  <h3 className="text-xs font-bold text-white mb-1">Option A: Standard IP Cameras (RTSP URL)</h3>
                  <p className="text-xs text-slate-400 mb-2">Most security cameras provide an RTSP stream format like this:</p>
                  <div className="p-2.5 rounded-lg bg-[#05070B] border border-[#161D2B] font-mono text-xs text-emerald-400">
                    rtsp://admin:password@192.168.1.100:554/h264Preview_01_main
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Tip: Set the camera resolution to 1080p and frame rate to 15-25 FPS for smooth face detection.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                  <h3 className="text-xs font-bold text-white mb-1">Option B: USB Webcam</h3>
                  <p className="text-xs text-slate-400">
                    Plug your webcam into any USB port on your computer. In the AuraPass dashboard under "Test Camera", select "Camera Index 0" to view the live video feed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADDING EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Adding Employees & Photos
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                Best practices for getting high recognition accuracy from day one.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234] text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 font-bold text-xs">1</div>
                  <p className="text-xs font-bold text-white">Front View</p>
                  <p className="text-[11px] text-slate-400 mt-1">One clear photo looking straight into the camera with good room lighting.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234] text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 font-bold text-xs">2</div>
                  <p className="text-xs font-bold text-white">Slight Left Turn</p>
                  <p className="text-[11px] text-slate-400 mt-1">Head turned about 15-20 degrees to the left so side angles are recognized.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234] text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 font-bold text-xs">3</div>
                  <p className="text-xs font-bold text-white">Slight Right Turn</p>
                  <p className="text-[11px] text-slate-400 mt-1">Head turned about 15-20 degrees to the right to complete the profile.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                <p className="text-xs font-semibold text-emerald-400 mb-1">Quick Tip for Best Results</p>
                <p className="text-xs text-slate-300">
                  Avoid extreme dark shadows, hats covering the eyebrows, or very blurry phone pictures. 3 clear well-lit photos allow AuraPass to achieve over 99% accuracy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: API & INTEGRATIONS */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                REST API & Webhook Notifications
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                Connect AuraPass directly to your payroll, HR software, or door-unlocking relays.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">GET /api/history</span>
                    <span className="text-[10px] text-slate-500">Fetch recent attendance</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">Returns recent check-in events in clean JSON format:</p>
                  <pre className="p-3 rounded-lg bg-[#05070B] border border-[#161D2B] font-mono text-[11px] text-slate-300 overflow-x-auto">
{`{
  "status": "success",
  "history": [
    {
      "name": "Rajesh Patel",
      "timestamp": "2026-11-03T09:02:14Z",
      "camera": "Gate 1",
      "status": "present"
    }
  ]
}`}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2234]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">POST /api/attendance/mark</span>
                    <span className="text-[10px] text-slate-500">Manual Check-In</span>
                  </div>
                  <p className="text-xs text-slate-400">Allows security guards or managers to manually mark attendance for visitors or special shifts.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FAQ & TROUBLESHOOTING */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D121D] border border-[#1E2638]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-400" />
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Quick answers to common questions.</p>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => updateSearch(e.target.value)}
                    placeholder="Search help topics..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#080B11] border border-[#1E2638] text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-[#1E2638] bg-[#080B11] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#0D121D] transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-0.5">
                          {faq.category}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          expandedFaq === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-[#161D2B]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
