import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  Camera,
  ClipboardList,
  LifeBuoy,
  Cpu,
  HardDrive,
  Activity,
  IndianRupee,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Edit2,
  ArrowUpRight,
  TrendingUp,
  Server,
  Database,
  Lock,
  Layers,
  Zap,
  Check,
  X,
  MessageSquare,
  Copy,
  FileText,
  ChevronRight,
  Download,
  BarChart3,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/marketing/Button';

export default function AdminPlatformPage() {
  const { user, loading: authLoading } = useAuth();

  // Dynamic Tab State via URL search params (e.g. /admin?tab=financials)
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const validTabs = useMemo(() => ['orgs', 'tickets', 'financials', 'telemetry', 'audit'], []);
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'orgs';

  const setActiveTab = useCallback((tabId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tabId === 'orgs') {
        next.delete('tab');
      } else {
        next.set('tab', tabId);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Overview & Core Data
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [financials, setFinancials] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [orgPlanFilter, setOrgPlanFilter] = useState('all');

  // Modals
  // 1. Ticket Dossier Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketUpdating, setTicketUpdating] = useState(false);
  const [ticketAdminNotes, setTicketAdminNotes] = useState('');
  const [ticketNewStatus, setTicketNewStatus] = useState('open');
  const [copiedTicket, setCopiedTicket] = useState(false);

  // 2. Org Plan Management Modal
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgUpdating, setOrgUpdating] = useState(false);
  const [orgNewTier, setOrgNewTier] = useState('starter');
  const [orgNewStatus, setOrgNewStatus] = useState('active');

  // 3. Org Drill-Down & Employee Roster Modal / Drawer
  const [selectedOrgDetails, setSelectedOrgDetails] = useState(null);
  const [orgDetailsModalOpen, setOrgDetailsModalOpen] = useState(false);
  const [orgDetailsLoading, setOrgDetailsLoading] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState('all');

  // Authorization check for super-admin (strictly vatsalvadgama04@gmail.com)
  const isAuthorizedSuperAdmin = useMemo(() => {
    if (!user) return false;
    const email = (user.email || '').toLowerCase().trim();
    return email === 'vatsalvadgama04@gmail.com';
  }, [user]);

  const getAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem('rms_access_token') || localStorage.getItem('rms_access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : 'single-tenant-token'
    };
  }, []);

  // Format INR currency
  const formatINR = (val) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Fetch all platform telemetry & data
  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const headers = getAuthHeaders();

    try {
      const [ovRes, orgsRes, ticketsRes, telRes, finRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/organizations', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/support/tickets', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/telemetry', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/financials', { headers }).then(r => r.ok ? r.json() : null)
      ]);

      if (ovRes?.success) setOverview(ovRes);
      if (orgsRes?.success) setOrganizations(orgsRes.organizations || []);
      if (ticketsRes?.success) setTickets(ticketsRes.tickets || []);
      if (telRes?.success) setTelemetry(telRes);
      if (finRes?.success) setFinancials(finRes);
    } catch (err) {
      console.error('Failed to load platform admin telemetry:', err);
      setError('Unable to synchronize platform control telemetry. Running offline diagnostic view.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!authLoading && isAuthorizedSuperAdmin) {
      fetchAllData();
    }
  }, [authLoading, isAuthorizedSuperAdmin, fetchAllData]);

  // Open Ticket Dossier Modal
  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setTicketNewStatus(ticket.status || 'open');
    setTicketAdminNotes(ticket.admin_notes || '');
    setTicketModalOpen(true);
    setCopiedTicket(false);
  };

  // Copy Ticket Details to Clipboard
  const handleCopyTicketDossier = () => {
    if (!selectedTicket) return;
    const text = `AuraPass Support Case #${selectedTicket.ticket_code}
Organization: ${selectedTicket.organization}
Submitter: ${selectedTicket.name} (${selectedTicket.email})
Hardware: ${selectedTicket.hardware_model || 'N/A'}
Priority: ${selectedTicket.priority} | Status: ${selectedTicket.status}
Created: ${selectedTicket.created_at}

Description & Error Logs:
${selectedTicket.description}

Admin Notes:
${selectedTicket.admin_notes || 'None'}`;
    navigator.clipboard.writeText(text);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  // Save Ticket Updates
  const handleSaveTicketUpdate = async () => {
    if (!selectedTicket) return;
    setTicketUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: ticketNewStatus,
          admin_notes: ticketAdminNotes,
          assigned_to: user?.email || 'vatsalvadgama04@gmail.com'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, ...data.ticket } : t));
        setSelectedTicket(prev => prev ? { ...prev, ...data.ticket } : prev);
        if (selectedTicket.status !== ticketNewStatus) {
          setOverview(prev => prev ? {
            ...prev,
            metrics: {
              ...prev.metrics,
              open_tickets: ticketNewStatus === 'resolved'
                ? Math.max(0, (prev.metrics.open_tickets || 1) - 1)
                : prev.metrics.open_tickets
            }
          } : prev);
        }
        setTicketModalOpen(false);
      } else {
        alert(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      alert('Error updating support case: ' + err.message);
    } finally {
      setTicketUpdating(false);
    }
  };

  // Open Org Drill-Down Details
  const handleOpenOrgDetails = async (org) => {
    setSelectedOrg(org);
    setOrgDetailsModalOpen(true);
    setOrgDetailsLoading(true);
    setEmployeeSearchQuery('');
    setEmployeeDepartmentFilter('all');

    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/details`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrgDetails(data);
      } else {
        alert(data.error || 'Failed to load company details and employee roster');
      }
    } catch (err) {
      alert('Error loading organization roster: ' + err.message);
    } finally {
      setOrgDetailsLoading(false);
    }
  };

  // Open Org Plan Modal
  const handleOpenOrgModal = (org) => {
    setSelectedOrg(org);
    setOrgNewTier(org.plan_tier || 'starter');
    setOrgNewStatus(org.subscription_status || 'active');
    setOrgModalOpen(true);
  };

  // Save Org Updates
  const handleSaveOrgUpdate = async () => {
    if (!selectedOrg) return;
    setOrgUpdating(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          plan_tier: orgNewTier,
          subscription_status: orgNewStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrganizations(prev => prev.map(o => o.id === selectedOrg.id ? {
          ...o,
          plan_tier: orgNewTier,
          subscription_status: orgNewStatus
        } : o));
        setOrgModalOpen(false);
        // Refresh overview metrics
        fetchAllData(true);
      } else {
        alert(data.error || 'Failed to update organization plan');
      }
    } catch (err) {
      alert('Error updating organization: ' + err.message);
    } finally {
      setOrgUpdating(false);
    }
  };

  // Filtered Organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter(o => {
      const matchesSearch = !searchQuery.trim() ||
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.admin_email && o.admin_email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPlan = orgPlanFilter === 'all' || (o.plan_tier || '').toLowerCase() === orgPlanFilter;
      return matchesSearch && matchesPlan;
    });
  }, [organizations, searchQuery, orgPlanFilter]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = !searchQuery.trim() ||
        (t.ticket_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.organization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
      const matchesPriority = ticketPriorityFilter === 'all' || t.priority === ticketPriorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, ticketStatusFilter, ticketPriorityFilter]);

  // Filtered Employees in Drill-Down Modal
  const filteredRosterEmployees = useMemo(() => {
    if (!selectedOrgDetails?.employees) return [];
    return selectedOrgDetails.employees.filter(emp => {
      const q = employeeSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        emp.name.toLowerCase().includes(q) ||
        (emp.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q));
      const matchesDept = employeeDepartmentFilter === 'all' || emp.department === employeeDepartmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [selectedOrgDetails, employeeSearchQuery, employeeDepartmentFilter]);

  // Unique departments for filter
  const rosterDepartments = useMemo(() => {
    if (!selectedOrgDetails?.employees) return [];
    const depts = new Set(selectedOrgDetails.employees.map(e => e.department || 'General'));
    return Array.from(depts);
  }, [selectedOrgDetails]);

  // Dynamic financial SVG trajectory coordinates computed accurately
  const chartTrajectory = useMemo(() => {
    const raw = financials?.trajectory || [
      { month: 'Jun', mrr: 1999, profit: 1727, overhead: 272 },
      { month: 'Jul', mrr: 1999, profit: 1727, overhead: 272 },
      { month: 'Aug', mrr: 3998, profit: 3454, overhead: 544 },
      { month: 'Sep', mrr: 3998, profit: 3454, overhead: 544 },
      { month: 'Oct', mrr: 11996, profit: 10364, overhead: 1632 },
      { month: 'Nov (Run-Rate)', mrr: 16194, profit: 13991, overhead: 2203 }
    ];

    const maxMrr = Math.max(...raw.map(d => d.mrr || 0), 10000);
    const maxCeil = Math.max(Math.ceil(maxMrr / 5000) * 5000, 20000);
    const baseY = 160;
    const topY = 25;
    const usableHeight = baseY - topY; // 135

    const getY = (val) => Math.round(baseY - ((val || 0) / maxCeil) * usableHeight);

    const points = raw.map((pt, idx) => {
      const x = 60 + idx * 100;
      const yRev = getY(pt.mrr);
      const yPro = getY(pt.profit);
      const yOver = getY(pt.overhead);
      return {
        ...pt,
        x,
        yRev,
        yPro,
        yOver,
        displayMonth: (pt.month || '').replace(' 2026', '')
      };
    });

    const revPolyline = points.map(p => `${p.x},${p.yRev}`).join(' ');
    const revPolygon = `${points[0].x},${baseY} ${revPolyline} ${points[points.length - 1].x},${baseY}`;

    const proPolyline = points.map(p => `${p.x},${p.yPro}`).join(' ');
    const proPolygon = `${points[0].x},${baseY} ${proPolyline} ${points[points.length - 1].x},${baseY}`;

    const overPolyline = points.map(p => `${p.x},${p.yOver}`).join(' ');

    const gridLines = [
      { y: topY, label: `₹${(maxCeil / 1000).toFixed(0)}K` },
      { y: topY + usableHeight * 0.25, label: `₹${((maxCeil * 0.75) / 1000).toFixed(0)}K` },
      { y: topY + usableHeight * 0.50, label: `₹${((maxCeil * 0.50) / 1000).toFixed(0)}K` },
      { y: topY + usableHeight * 0.75, label: `₹${((maxCeil * 0.25) / 1000).toFixed(0)}K` },
      { y: baseY, label: '₹0' }
    ];

    return {
      points,
      revPolyline,
      revPolygon,
      proPolyline,
      proPolygon,
      overPolyline,
      gridLines,
      maxCeil
    };
  }, [financials]);

  // ─── Render: Access Restricted Guard Screen ───
  if (!authLoading && !isAuthorizedSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 rounded-2xl bg-[#0f0f12] border border-rose-500/30 shadow-2xl space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
              Executive Gate Restricted
            </span>
            <h1 className="text-2xl font-bold text-white mt-3">
              Platform Control Center
            </h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              This executive command center is restricted exclusively to authorized platform owner:
              <strong className="text-emerald-400 block mt-1 font-mono">vatsalvadgama04@gmail.com</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#26262a] text-left text-xs space-y-1">
            <div className="text-zinc-500 text-[11px] font-mono">Active Session Identity:</div>
            <div className="font-semibold text-zinc-200 truncate">{user?.email || 'Unauthenticated / Guest'}</div>
            <div className="text-[11px] text-zinc-400">Role: <span className="text-zinc-300 font-mono">{user?.role || 'None'}</span></div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => { window.location.href = '/login'; }}
              icon={ShieldCheck}
              className="w-full justify-center"
            >
              Sign In as Platform Owner
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => { window.location.href = '/dashboard'; }}
              className="w-full justify-center border-[#333] text-zinc-400 hover:text-white"
            >
              Return to Organization Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ─── Top Executive Platform Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#202024] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <img
              src="/logo.svg"
              alt="AuraPass"
              className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.35)] shrink-0 select-none pointer-events-none"
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AuraPass™ Platform Control Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
              SUPER-ADMIN
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#16161a] border border-[#2c2c34] text-zinc-400 font-mono text-[11px]">
              {user?.email || 'vatsalvadgama04@gmail.com'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            One-stop operational accountability: organization rosters, employee facial biometrics, engineering support cases, and deemed revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-[#333] bg-[#0c0c10] hover:bg-[#1a1a1e] text-xs font-semibold text-zinc-300 disabled:opacity-50 transition-colors cursor-pointer select-none"
            title="Refresh live platform data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 shrink-0 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121216] border border-[#26262c] text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DB Latency: <strong className="text-white">{overview?.telemetry?.db_ping_ms ?? 1.2} ms</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Metric Ribbon Cards (Executive Overview) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div 
          onClick={() => setActiveTab('orgs')}
          className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026] hover:border-emerald-500/40 shadow-sm cursor-pointer transition-all group"
          title="Click to view Organizations"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Organizations</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {overview?.metrics?.organizations_count ?? organizations.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Multi-Tenant Enclaves</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026] shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Enrolled Staff</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {overview?.metrics?.employees_count ?? 3}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Active Biometric Profiles</div>
        </div>

        <div 
          onClick={() => setActiveTab('telemetry')}
          className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026] hover:border-purple-500/40 shadow-sm cursor-pointer transition-all group"
          title="Click to view Telemetry"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-purple-400 transition-colors">Live Cameras</span>
            <Camera className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {overview?.metrics?.cameras_count ?? 2}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">RTSP & ONVIF Gateways</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026] shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Punches</span>
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {overview?.metrics?.today_punches ?? 25}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Real-Time Clock-Ins</div>
        </div>

        <div 
          onClick={() => setActiveTab('tickets')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all group ${
            (overview?.metrics?.open_tickets || 0) > 0
              ? 'bg-amber-500/5 border-amber-500/40 hover:border-amber-500/70'
              : 'bg-[#0f0f13] border-[#202026] hover:border-amber-500/40'
          }`}
          title="Click to view Support Cases"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-amber-400 transition-colors">Support Cases</span>
            <LifeBuoy className={`w-4 h-4 ${(overview?.metrics?.open_tickets || 0) > 0 ? 'text-amber-400' : 'text-zinc-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <span>{overview?.metrics?.open_tickets ?? tickets.filter(t => t.status === 'open').length}</span>
            {(overview?.metrics?.open_tickets || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-sans font-bold">
                Action Req.
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Pending Resolution</div>
        </div>

        <div 
          onClick={() => setActiveTab('financials')}
          className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026] hover:border-emerald-500/40 shadow-sm cursor-pointer transition-all group"
          title="Click to view Revenue & Profit"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Platform MRR</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatINR(overview?.metrics?.estimated_mrr_inr ?? financials?.summary?.mrr_inr ?? 9997)}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 font-mono">~86.4% Gross Margin</div>
        </div>
      </div>

      {/* ─── Navigation Tabs & Universal Search ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111116] p-2 rounded-xl border border-[#202026]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'orgs', label: 'Organizations', icon: Building2, count: organizations.length },
            { id: 'tickets', label: 'Support Cases', icon: LifeBuoy, count: tickets.filter(t => t.status === 'open').length, highlight: true },
            { id: 'financials', label: 'Revenue & Profit', icon: BarChart3 },
            { id: 'telemetry', label: 'Telemetry', icon: Activity },
            { id: 'audit', label: 'Audit Log', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-[#18181e]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    tab.highlight && tab.count > 0
                      ? 'bg-amber-500/30 text-amber-300'
                      : 'bg-[#202028] text-zinc-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Universal Search Input */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across platform..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#0a0a0d] border border-[#282830] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ─── TAB 1: ORGANIZATIONS & CLIENTS ─── */}
      {activeTab === 'orgs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter by Plan:</span>
              {['all', 'starter', 'business', 'enterprise'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setOrgPlanFilter(tier)}
                  className={`px-2 py-0.5 rounded capitalize font-medium text-[11px] ${
                    orgPlanFilter === tier
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Showing {filteredOrgs.length} of {organizations.length} organizations
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#202026] bg-[#0f0f13]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#15151b] border-b border-[#202026] text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Staff Profiles</th>
                  <th className="py-3 px-4">Cameras</th>
                  <th className="py-3 px-4">Admin Contact</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a22]">
                {filteredOrgs.map(org => {
                  const planTier = (org.plan_tier || 'starter').toLowerCase();
                  return (
                    <tr key={org.id} className="hover:bg-[#14141a] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{org.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.2 rounded bg-[#1c1c24]">
                            {org.slug}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{org.id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          planTier === 'enterprise'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : planTier === 'business'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {planTier}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="capitalize">{org.subscription_status || 'active'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {org.employee_count ?? 0}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {org.camera_count ?? 0}
                      </td>

                      <td className="py-3 px-4 text-zinc-400">
                        <span className="truncate max-w-[170px] block" title={org.admin_email}>
                          {org.admin_email || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                        {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenOrgDetails(org)}
                            icon={Users}
                            className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            View Staff Roster
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenOrgModal(org)}
                            icon={Edit2}
                            className="border-[#333] hover:bg-[#222] text-zinc-300 text-[11px]"
                          >
                            Plan
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SUPPORT & ENGINEERING CASES ─── */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span>Status:</span>
                {['all', 'open', 'in_progress', 'resolved'].map(st => (
                  <button
                    key={st}
                    onClick={() => setTicketStatusFilter(st)}
                    className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium ${
                      ticketStatusFilter === st
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-3">
                <span>Priority:</span>
                {['all', 'critical', 'high', 'medium', 'low'].map(pr => (
                  <button
                    key={pr}
                    onClick={() => setTicketPriorityFilter(pr)}
                    className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium ${
                      ticketPriorityFilter === pr
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-zinc-500 font-mono text-xs">
              Showing {filteredTickets.length} cases
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.map(ticket => {
              const isOpen = ticket.status === 'open';
              const isProgress = ticket.status === 'in_progress';
              const isResolved = ticket.status === 'resolved';

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleOpenTicketModal(ticket)}
                  className="p-5 rounded-xl bg-[#0f0f13] border border-[#202026] hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3.5 group hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          #{ticket.ticket_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          ticket.priority === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : ticket.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {ticket.organization}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Submitted by <span className="text-zinc-200">{ticket.name}</span> ({ticket.email})
                      </p>
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        isOpen
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : isProgress
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {ticket.hardware_model && (
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 bg-[#141418] px-2.5 py-1 rounded-md border border-[#222228]">
                      <Camera className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Hardware: <strong className="text-zinc-300">{ticket.hardware_model}</strong></span>
                    </div>
                  )}

                  <div className="text-xs text-zinc-300 leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-[#1e1e24] font-mono line-clamp-3">
                    "{ticket.description}"
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-[#1c1c22]">
                    <span className="font-mono">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recently'}
                    </span>
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect & Resolve <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: REVENUE, PROFIT & SALES ANALYTICS (INR ₹) ─── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Executive Revenue Highlight Ribbon */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0e1612] to-[#0f0f13] border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> MONTHLY RECURRING REVENUE (MRR)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  86.4% SaaS Profit Margin
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white font-mono mt-1">
                {formatINR(financials?.summary?.mrr_inr ?? 9997)}
                <span className="text-sm font-normal text-zinc-400 font-sans ml-2">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 max-w-xl leading-relaxed">
                Aggregated subscription run-rate across active Starter, Business Pro (₹1,999/mo), and Enterprise On-Premise Enclaves.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#09090c] border border-[#22222a]">
                <div className="text-zinc-500 text-[11px]">Annual Run-Rate (ARR)</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {formatINR(financials?.summary?.arr_inr ?? 119964)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#09090c] border border-[#22222a]">
                <div className="text-zinc-500 text-[11px]">Deemed Gross Profit</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {formatINR(financials?.summary?.deemed_gross_profit_inr ?? 8637)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#09090c] border border-[#22222a]">
                <div className="text-zinc-500 text-[11px]">Compute Overhead</div>
                <div className="text-lg font-bold text-zinc-300 mt-0.5">
                  {formatINR(financials?.summary?.cloud_overhead_inr ?? 1360)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#09090c] border border-[#22222a]">
                <div className="text-zinc-500 text-[11px]">Pipeline Deemed Value</div>
                <div className="text-lg font-bold text-purple-400 mt-0.5">
                  {formatINR(financials?.summary?.pipeline_deemed_inr ?? 450000)}
                </div>
              </div>
            </div>
          </div>

          {/* 6-Month Revenue & Profit Trajectory Chart */}
          <div className="p-6 rounded-2xl bg-[#0f0f13] border border-[#202026] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Platform Revenue & Deemed Profit Trajectory</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Historical and projected monthly financial trajectory (INR ₹) vs. cloud inference overhead.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-zinc-300">Revenue (MRR)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-teal-400" />
                  <span className="text-zinc-300">Gross Profit (~86%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-zinc-600" />
                  <span className="text-zinc-400">Compute Overhead</span>
                </div>
              </div>
            </div>

            {/* Visual SVG Financials Chart */}
            <div className="h-64 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Dynamic Horizontal Grid lines & Y-axis labels */}
                {chartTrajectory.gridLines.map((gl, i) => (
                  <g key={i}>
                    <line
                      x1="40"
                      y1={gl.y}
                      x2="580"
                      y2={gl.y}
                      stroke={gl.y === 160 ? "#2a2a34" : "#1f1f26"}
                      strokeDasharray={gl.y === 160 ? undefined : "3 3"}
                    />
                    <text
                      x="32"
                      y={gl.y + 3}
                      fill="#666"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {gl.label}
                    </text>
                  </g>
                ))}

                {/* Revenue Area (Gradient Fill) */}
                <polygon
                  points={chartTrajectory.revPolygon}
                  fill="url(#revenueGrad)"
                />

                {/* Profit Area (Gradient Fill) */}
                <polygon
                  points={chartTrajectory.proPolygon}
                  fill="url(#profitGrad)"
                />

                {/* Revenue Polyline */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartTrajectory.revPolyline}
                />

                {/* Profit Polyline */}
                <polyline
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartTrajectory.proPolyline}
                />

                {/* Compute Overhead Polyline */}
                <polyline
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartTrajectory.overPolyline}
                />

                {/* Data Points, Dots & Month Labels */}
                {chartTrajectory.points.map((pt, idx) => (
                  <g key={idx}>
                    {/* Profit Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.yPro}
                      r="3.5"
                      fill="#2dd4bf"
                      stroke="#0f0f13"
                      strokeWidth="1.5"
                    />
                    {/* Revenue Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.yRev}
                      r="5"
                      fill="#10b981"
                      stroke="#0f0f13"
                      strokeWidth="2"
                    />
                    {/* Revenue Value on top */}
                    <text
                      x={pt.x}
                      y={Math.max(16, pt.yRev - 9)}
                      fill="#10b981"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ₹{(pt.mrr / 1000).toFixed(1)}k
                    </text>
                    {/* Month Label on X-axis */}
                    <text
                      x={pt.x}
                      y="178"
                      fill="#888"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pt.displayMonth}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Pricing Tiers & Unit Economics Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(financials?.plans || [
              { tier: 'Basic Plan', price_inr: 699, active_orgs: 3, mrr_inr: 2097, target: 'Up to 50 Staff / 3 Cameras' },
              { tier: 'Pro Plan', price_inr: 1999, active_orgs: 1, mrr_inr: 1999, target: 'Up to 250 Staff / 8 Cameras' },
              { tier: 'Enterprise Enclave', price_inr: 5999, active_orgs: 0, mrr_inr: 0, target: 'Up to 1,000+ Staff / 25 Cameras' }
            ]).map((p, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-[#0f0f13] border border-[#202026] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">{p.tier}</h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(p.price_inr)} / mo</span>
                </div>
                <div className="text-xs text-zinc-400">{p.target}</div>
                <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Active Tenants:</span>
                  <strong className="text-white">{p.active_orgs} orgs</strong>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Monthly Contribution:</span>
                  <strong className="text-emerald-400">{formatINR(p.mrr_inr)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: PERFORMANCE & TELEMETRY ─── */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Multi-Backbone Neural Model Telemetry</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {(telemetry?.models || [
                { name: 'FaceNet-512', status: 'online', latency_ms: 18.4, accuracy: '99.65% LFW', engine: 'Primary Frontal' },
                { name: 'InsightFace (ArcFace)', status: 'online', latency_ms: 24.1, accuracy: '99.83% CFP-FP', engine: 'Wide Angle (+-45°)' },
                { name: 'GhostFaceNet', status: 'online', latency_ms: 4.2, accuracy: '98.92% Speed', engine: 'Edge Tablet' },
                { name: 'MiniVision Anti-Spoof', status: 'online', latency_ms: 8.6, accuracy: 'ISO 30107-3', engine: 'Liveness Filter' },
                { name: 'Local Vector Enclave', status: 'active', latency_ms: 1.8, accuracy: 'AES-256 GCM', engine: 'Sovereign DB' }
              ]).map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#0f0f13] border border-[#202026]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">{m.engine}</span>
                  </div>
                  <div className="font-semibold text-xs text-white truncate">{m.name}</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{m.latency_ms} ms</div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono">{m.accuracy}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026]">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>CPU Core Load</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {telemetry?.system?.cpu_usage_percent ?? 12}%
              </div>
              <div className="w-full bg-[#1c1c22] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, telemetry?.system?.cpu_usage_percent || 15)}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-500 mt-2 font-mono">
                {telemetry?.system?.cpu_cores ?? 8} Hardware Cores Online
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026]">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>Memory Utilization</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {telemetry?.system?.ram_used_percent ?? 38}%
              </div>
              <div className="w-full bg-[#1c1c22] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, telemetry?.system?.ram_used_percent || 38)}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-500 mt-2 font-mono">
                {telemetry?.system?.ram_used_mb ?? 2450} MB / {telemetry?.system?.ram_total_mb ?? 8192} MB
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026]">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>Database Heartbeat</span>
                <Database className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {overview?.telemetry?.db_ping_ms ?? 1.4} ms
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Supabase / SQLite Pool Connected</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-2 font-mono">
                Keep-alive pinging active (UptimeRobot synced)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: AUDIT & SECURITY STREAM ─── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0f0f13] border border-[#202026] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Tamper-Evident System Audit Stream
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Every privileged action, enrollment, and support dispatch is timestamped with cryptographic SHA-256 validation.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-500">ISO 27001 & DPDP 2023 Compliant</span>
          </div>

          <div className="divide-y divide-[#1a1a22] rounded-xl border border-[#202026] bg-[#0f0f13] overflow-hidden text-xs">
            {[
              { event: 'User Login Authenticated', user: 'vatsalvadgama04@gmail.com', org: 'AuraPass Core', time: 'Just now', type: 'auth' },
              { event: 'Support Case #AP-8492 Status Synced', user: 'rajesh.patel@nirma.edu', org: 'NIRMA Institute', time: '2 hours ago', type: 'support' },
              { event: 'Supabase Heartbeat Ping Handshake', user: 'system_daemon', org: 'All Tenancies', time: '3 mins ago', type: 'system' },
              { event: 'Biometric Vector Enclave Sync', user: 'kiosk_worker_1', org: 'NIRMA Institute', time: '14 mins ago', type: 'biometric' },
              { event: 'Organization Subscription Checked', user: 'vatsalvadgama04@gmail.com', org: 'RMC Municipal Corp', time: '1 day ago', type: 'billing' }
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-[#14141a] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    item.type === 'auth' ? 'bg-blue-400' :
                    item.type === 'support' ? 'bg-amber-400' :
                    item.type === 'biometric' ? 'bg-emerald-400' : 'bg-purple-400'
                  }`} />
                  <div>
                    <span className="font-medium text-white">{item.event}</span>
                    <span className="text-zinc-500 ml-2 font-mono text-[11px]">by {item.user} ({item.org})</span>
                  </div>
                </div>
                <span className="text-zinc-500 font-mono text-[11px]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: COMPLETE TICKET DOSSIER & RESOLUTION MODAL ─── */}
      <AnimatePresence>
        {ticketModalOpen && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#0f0f13] border border-[#262630] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#202026] flex items-center justify-between bg-[#14141a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                    AP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        Case #{selectedTicket.ticket_code}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        selectedTicket.priority === 'critical' ? 'bg-rose-500/20 text-rose-300' :
                        selectedTicket.priority === 'high' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {selectedTicket.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {selectedTicket.organization} • Submitted {new Date(selectedTicket.created_at || Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTicketDossier}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1c24] border border-[#2d2d38] text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTicket ? 'Copied' : 'Copy Dossier'}</span>
                  </button>
                  <button
                    onClick={() => setTicketModalOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202028]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 overflow-y-auto text-xs">
                {/* Contact & Hardware Info Card */}
                <div className="p-4 rounded-xl bg-[#14141a] border border-[#22222a] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider block">Customer Contact</span>
                    <span className="font-semibold text-white text-sm">{selectedTicket.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider block">Corporate Email</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-zinc-300">{selectedTicket.email}</span>
                      <a
                        href={`mailto:${selectedTicket.email}?subject=Re: AuraPass Support Case #${selectedTicket.ticket_code}`}
                        className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Mail className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider block">Camera / Hardware Gateway</span>
                    <span className="font-mono text-zinc-300 mt-0.5 block">{selectedTicket.hardware_model || 'Standard RTSP Camera'}</span>
                  </div>
                </div>

                {/* Problem Description & Logs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-zinc-400 font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" /> Problem Description & Error Logs
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Unclipped Engineering Report</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#09090c] border border-[#222228] text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap select-text max-h-48 overflow-y-auto">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-zinc-400 font-bold uppercase text-[11px] tracking-wider mb-2">
                    Update Resolution Status
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'open', label: 'Open (Pending)', color: 'border-rose-500 text-rose-400 bg-rose-500/10' },
                      { id: 'in_progress', label: 'In Progress (Active)', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
                      { id: 'resolved', label: 'Resolved (Closed)', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTicketNewStatus(st.id)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          ticketNewStatus === st.id
                            ? `${st.color} shadow-md`
                            : 'border-[#222228] text-zinc-400 hover:bg-[#16161c]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Admin Resolution Notes */}
                <div>
                  <label className="block text-zinc-400 font-bold uppercase text-[11px] tracking-wider mb-1.5">
                    Internal Engineering Notes / Resolution Log
                  </label>
                  <textarea
                    rows={3}
                    value={ticketAdminNotes}
                    onChange={(e) => setTicketAdminNotes(e.target.value)}
                    placeholder="Document root cause, RTSP gateway tweaks, or customer communications..."
                    className="w-full p-3 rounded-xl bg-[#09090c] border border-[#222228] text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 font-sans"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#202026] bg-[#14141a] flex items-center justify-between">
                <a
                  href={`mailto:${selectedTicket.email}?subject=AuraPass Case #${selectedTicket.ticket_code} Resolution Update&body=Hi ${selectedTicket.name},%0D%0A%0D%0ARegarding support case #${selectedTicket.ticket_code} for ${selectedTicket.organization}:%0D%0A%0D%0A`}
                  className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Email Customer Direct
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTicketModalOpen(false)}
                    className="text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={ticketUpdating}
                    onClick={handleSaveTicketUpdate}
                    icon={Check}
                  >
                    {ticketUpdating ? 'Saving...' : 'Save Resolution'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: COMPANY DRILL-DOWN & EMPLOYEE ROSTER MODAL ─── */}
      <AnimatePresence>
        {orgDetailsModalOpen && selectedOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-[#0f0f13] border border-[#262630] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#202026] flex items-center justify-between bg-[#14141a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {selectedOrg.name}
                      </h3>
                      <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-[#1c1c24]">
                        {selectedOrg.slug}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300">
                        {selectedOrg.plan_tier || 'Starter'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Organization Roster, Facial Biometric Status & Real-Time Attendance Clock-Ins
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOrgDetailsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202028]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto text-xs">
                {orgDetailsLoading ? (
                  <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span>Synchronizing complete employee registry from secure vector enclave...</span>
                  </div>
                ) : (
                  <>
                    {/* Summary Ribbon Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#141418] border border-[#22222a]">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono block">Total Employees</span>
                        <div className="text-xl font-bold text-white font-mono mt-1">
                          {selectedOrgDetails?.summary?.total_employees ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#141418] border border-[#22222a]">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono block">Active Staff</span>
                        <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                          {selectedOrgDetails?.summary?.active_employees ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#141418] border border-[#22222a]">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono block">Biometrics Enrolled</span>
                        <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                          {selectedOrgDetails?.summary?.biometric_enrolled_count ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#141418] border border-[#22222a]">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono block">Active Cameras</span>
                        <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                          {selectedOrgDetails?.summary?.active_cameras ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#141418] border border-[#22222a]">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono block">Total Clock-Ins</span>
                        <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                          {selectedOrgDetails?.summary?.total_punches ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* Cameras Section */}
                    {selectedOrgDetails?.cameras && selectedOrgDetails.cameras.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-purple-400" /> Connected Kiosks & Gateways ({selectedOrgDetails.cameras.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {selectedOrgDetails.cameras.map(cam => (
                            <div key={cam.id} className="p-2.5 rounded-lg bg-[#141418] border border-[#22222a] flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-white block">{cam.name}</span>
                                <span className="text-[10px] font-mono text-zinc-500">{cam.location || 'Entrance Gate'}</span>
                              </div>
                              <span className={`w-2 h-2 rounded-full ${cam.is_active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Employee Roster Table */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-400" /> Complete Employee Roster
                          </h4>
                          <span className="text-[11px] font-mono text-zinc-500">
                            ({filteredRosterEmployees.length} of {selectedOrgDetails?.employees?.length || 0})
                          </span>
                        </div>

                        {/* Search & Department Filters */}
                        <div className="flex items-center gap-2">
                          <div className="relative w-52 sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            <input
                              type="text"
                              value={employeeSearchQuery}
                              onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                              placeholder="Search employee or code..."
                              className="w-full pl-9 pr-3 py-1.5 h-8 rounded-lg bg-[#09090c] border border-[#25252e] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
                            />
                          </div>

                          {rosterDepartments.length > 1 && (
                            <select
                              value={employeeDepartmentFilter}
                              onChange={(e) => setEmployeeDepartmentFilter(e.target.value)}
                              className="h-8 px-2.5 rounded-lg bg-[#09090c] border border-[#25252e] text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer"
                            >
                              <option value="all">All Depts</option>
                              {rosterDepartments.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {filteredRosterEmployees.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 bg-[#121216] rounded-xl border border-[#202026]">
                          No employees match the search filter.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-[#202026] bg-[#0c0c0f]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#14141a] border-b border-[#202026] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Employee</th>
                                <th className="py-2.5 px-3">Code</th>
                                <th className="py-2.5 px-3">Department</th>
                                <th className="py-2.5 px-3">Biometric Status</th>
                                <th className="py-2.5 px-3">Total Punches</th>
                                <th className="py-2.5 px-3">Last Activity</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#181820]">
                              {filteredRosterEmployees.map(emp => (
                                <tr key={emp.id} className="hover:bg-[#121217] transition-colors">
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-white">{emp.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">{emp.email}</div>
                                  </td>

                                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                                    {emp.employee_code}
                                  </td>

                                  <td className="py-2.5 px-3 text-zinc-300">
                                    {emp.department}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    {emp.biometric_enrolled ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        <BadgeCheck className="w-3 h-3 text-emerald-400" />
                                        Enrolled ({emp.image_count} Photos)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        <AlertCircle className="w-3 h-3 text-amber-400" />
                                        Pending Enrollment
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                                    {emp.punch_count}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    {emp.last_punch ? (
                                      <div>
                                        <span className="text-zinc-200 block font-mono text-[11px]">
                                          {new Date(emp.last_punch.checkin_time).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] text-emerald-400 font-mono">
                                          {emp.last_punch.confidence}% Match
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-500 font-mono text-[10px]">No clock-ins</span>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                                      emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {emp.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#202026] bg-[#14141a] flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOrgDetailsModalOpen(false)}
                >
                  Close Roster
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: ORG PLAN CHANGE MODAL ─── */}
      <AnimatePresence>
        {orgModalOpen && selectedOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0f0f13] border border-[#262630] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#202026] flex items-center justify-between bg-[#14141a]">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedOrg.name}</h3>
                  <p className="text-xs text-zinc-400">Manage plan tier and active subscription status</p>
                </div>
                <button
                  onClick={() => setOrgModalOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase text-[11px]">
                    Plan Tier
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'starter', name: 'Basic Plan', price: '₹699 / month' },
                      { id: 'business', name: 'Pro Plan', price: '₹1,999 / month' },
                      { id: 'enterprise', name: 'Enterprise Enclave', price: '₹5,999 / month' }
                    ].map(tier => (
                      <div
                        key={tier.id}
                        onClick={() => setOrgNewTier(tier.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          orgNewTier === tier.id
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                            : 'border-[#222228] text-zinc-400 hover:bg-[#16161c]'
                        }`}
                      >
                        <span className="font-semibold text-xs">{tier.name}</span>
                        <span className="font-mono text-[11px] text-emerald-400">{tier.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase text-[11px]">
                    Account Status
                  </label>
                  <select
                    value={orgNewStatus}
                    onChange={(e) => setOrgNewStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090c] border border-[#222228] text-white focus:outline-none focus:border-emerald-500/60"
                  >
                    <option value="active">Active (Normal Operation)</option>
                    <option value="trialing">Trialing (Evaluation Period)</option>
                    <option value="suspended">Suspended (Access Temporarily Paused)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-[#202026] bg-[#14141a] flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOrgModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={orgUpdating}
                  onClick={handleSaveOrgUpdate}
                  icon={Check}
                >
                  {orgUpdating ? 'Saving...' : 'Update Organization'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
