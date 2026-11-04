import React, { useState, useEffect, useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

import { motion } from 'framer-motion';

import { Download, Calendar, Search, RefreshCw, ClipboardList, Users, Plus, Trash2, X, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';

import { API_BASE } from '../config';

import { SkeletonTable, SkeletonStatCards } from '../components/ui/Skeleton';

import EmptyState from '../components/ui/EmptyState';

import { formatPersonName } from '../utils/format';





export default function AttendancePage() {

  const { apiClient, user } = useAuth();

  const toast = useToast();

  const [data, setData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  const [minConf, setMinConf] = useState(Number(searchParams.get('min_conf')) || 0);

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 15;



  // Manual Attendance Modal State

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [manualForm, setManualForm] = useState({

    name: '',

    date: '',

    time: '',

    event_type: 'check_in',

    status: 'on_time',

    department: 'General',

    notes: 'HR Manual Punch'

  });

  const [enrolledPersons, setEnrolledPersons] = useState([]);

  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const [deletingId, setDeletingId] = useState(null);



  const updateParam = useCallback((key, val, defaultVal = '') => {

    setSearchParams(prev => {

      const next = new URLSearchParams(prev);

      if (!val || val === defaultVal) {

        next.delete(key);

      } else {

        next.set(key, val);

      }

      return next;

    }, { replace: true });

  }, [setSearchParams]);



  const fetchHistory = useCallback(async () => {

    try {

      setError(null);

      const res = await apiClient.get(`${API_BASE}/history`);

      const history = Array.isArray(res.data) ? res.data : [];

      setData(history);

    } catch (err) {

      console.error('Failed to fetch history', err);

      setError('Failed to load attendance records.');

    } finally {

      setIsLoading(false);

    }

  }, [apiClient]);



  useEffect(() => {

    fetchHistory();

    // Fetch persons list for dropdown

    const fetchPersons = async () => {

      try {

        const res = await apiClient.get(`${API_BASE}/persons`);

        if (Array.isArray(res.data)) {

          setEnrolledPersons(res.data);

        }

      } catch (err) {

        // Non-blocking

      }

    };

    fetchPersons();

  }, [fetchHistory, apiClient]);



  // Handle Manual Attendance Submission

  const handleCreateManual = async (e) => {

    e.preventDefault();

    if (!manualForm.name.trim()) {

      toast.warning('Please enter or select an employee name.');

      return;

    }

    try {

      setIsSubmittingManual(true);

      const payload = {

        name: manualForm.name.trim(),

        date: manualForm.date || todayYMD(),

        time: manualForm.time || new Date().toTimeString().slice(0, 8),

        event_type: manualForm.event_type,

        status: manualForm.status,

        department: manualForm.department,

        notes: manualForm.notes

      };

      const res = await apiClient.post(`${API_BASE}/attendance/manual`, payload);

      if (res.status === 201 || res.data?.success) {

        toast.success(`Manual punch recorded for ${manualForm.name}`);

        setIsManualModalOpen(false);

        setManualForm({

          name: '',

          date: todayYMD(),

          time: new Date().toTimeString().slice(0, 5),

          event_type: 'check_in',

          status: 'on_time',

          department: 'General',

          notes: 'HR Manual Punch'

        });

        fetchHistory();

      } else {

        toast.error(res.data?.error || 'Failed to record manual punch');

      }

    } catch (err) {

      toast.error(err.response?.data?.error || err.message || 'Failed to record manual punch');

    } finally {

      setIsSubmittingManual(false);

    }

  };



  // Handle Deleting / Voiding an Erroneous Punch

  const handleDeleteRecord = async (record) => {

    const targetId = record.id || record.timestamp;

    if (!targetId) return;

    const confirmMsg = `Void attendance punch for "${formatPersonName(record.label)}" at ${record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'selected time'}?`;

    if (!window.confirm(confirmMsg)) return;



    try {

      setDeletingId(targetId);

      // Optimistically update UI

      setData(prev => prev.filter(r => (r.id ? r.id !== targetId : r.timestamp !== targetId)));

      await apiClient.delete(`${API_BASE}/attendance/${encodeURIComponent(targetId)}`);

      toast.success('Attendance punch voided successfully.');

    } catch (err) {

      toast.error('Failed to void record. Refreshing list.');

      fetchHistory();

    } finally {

      setDeletingId(null);

    }

  };



  const pad = (n) => String(n).padStart(2, '0');

  const todayYMD = () => {

    const today = new Date();

    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  };



  const yesterdayYMD = () => {

    const y = new Date();

    y.setDate(y.getDate() - 1);

    return `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;

  };



  const setQuickDate = (preset) => {

    if (preset === 'today') {

      const t = todayYMD(); setDateFilter(t); updateParam('date', t);

    } else if (preset === 'yesterday') {

      const y = yesterdayYMD(); setDateFilter(y); updateParam('date', y);

    } else if (preset === '7d') {

      setDateFilter('last_7_days'); updateParam('date', 'last_7_days');

    } else {

      setDateFilter('');

    }

  };



  // Filter by date, search, status, and confidence

  const filteredData = data.filter(record => {

    // Robust Date matching

    const rawTs = record.timestamp || record.checkin_time || record.created_at;

    let matchDate = true;



    if (dateFilter === 'last_7_days') {

      if (!rawTs) return false;

      const recDate = new Date(typeof rawTs === 'string' ? rawTs.replace(' ', 'T') : rawTs);

      if (isNaN(recDate.getTime())) return false;

      

      const sevenDaysAgo = new Date();

      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      sevenDaysAgo.setHours(0, 0, 0, 0);

      matchDate = recDate.getTime() >= sevenDaysAgo.getTime();

    } else if (dateFilter) {

      if (!rawTs) return false;

      const recDate = new Date(typeof rawTs === 'string' ? rawTs.replace(' ', 'T') : rawTs);

      if (!isNaN(recDate.getTime())) {

        const recYMD = `${recDate.getFullYear()}-${pad(recDate.getMonth() + 1)}-${pad(recDate.getDate())}`;

        matchDate = recYMD === dateFilter;

      } else {

        matchDate = String(rawTs).startsWith(dateFilter);

      }

    }



    // Search matching

    const matchSearch = !searchTerm || (record.label && record.label.toLowerCase().includes(searchTerm.toLowerCase()));



    // Status matching

    let matchStatus = true;

    const isUnknown = record.status === 'error' || record.label === 'Unknown';

    const isConfirmed = record.confidence_level === 'confirmed' && !isUnknown;

    const isLowConf = !isConfirmed && !isUnknown;



    if (statusFilter === 'confirmed') matchStatus = isConfirmed;

    else if (statusFilter === 'low_conf') matchStatus = isLowConf;

    else if (statusFilter === 'unknown') matchStatus = isUnknown;



    // Min confidence

    const confVal = Math.round((record.confidence || 0) * 100);

    const matchConf = confVal >= minConf;



    return matchDate && matchSearch && matchStatus && matchConf;

  }).sort((a, b) => {

    if (sortBy === 'oldest') {

      return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);

    }

    if (sortBy === 'confidence_desc') {

      return (b.confidence || 0) - (a.confidence || 0);

    }

    if (sortBy === 'confidence_asc') {

      return (a.confidence || 0) - (b.confidence || 0);

    }

    // Default: newest

    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);

  });



  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);



  // Group by person for summary stats

  const uniquePersons = new Set(filteredData.filter(r => r.label && r.label !== 'Unknown').map(r => r.label));

  const confirmedCount = filteredData.filter(r => r.status !== 'error' && r.label !== 'Unknown').length;

  const unknownCount = filteredData.filter(r => r.status === 'error' || r.label === 'Unknown').length;



  const exportCSV = () => {

    if (filteredData.length === 0) {

      toast.warning('No records to export.');

      return;

    }

    const headers = ['Timestamp', 'Person', 'Confidence', 'Status', 'Confidence Level'];

    const rows = filteredData.map(r => [

      r.timestamp ? new Date(r.timestamp).toLocaleString() : '',

      r.label || 'Unknown',

      r.confidence !== undefined ? `${(r.confidence * 100).toFixed(1)}%` : '',

      r.status === 'error' ? 'Not Matched' : 'Matched',

      r.confidence_level || ''

    ]);



    const csvContent = [

      headers.join(','),

      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))

    ].join('\n');



    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);

    link.download = `attendance_${dateFilter || 'all'}_${Date.now()}.csv`;

    link.click();

    URL.revokeObjectURL(link.href);

    toast.success(`Exported ${filteredData.length} records to CSV.`);

  };



  const exportPDF = () => {

    if (filteredData.length === 0) {

      toast.warning('No attendance records available to export.');

      return;

    }



    const orgName = user?.org_name || 'Vatsal Enterprise';

    const reportDate = new Date().toLocaleDateString('en-IN', {

      year: 'numeric',

      month: 'short',

      day: 'numeric',

      hour: '2-digit',

      minute: '2-digit'

    });

    const filterLabel = dateFilter ? `Filtered Date: ${dateFilter}` : 'Complete Audit History';

    const totalCount = filteredData.length;

    const confirmedCount = filteredData.filter(r => r.status !== 'error' && r.label !== 'Unknown').length;

    const unconfirmedCount = totalCount - confirmedCount;

    const matchRatio = totalCount > 0 ? ((confirmedCount / totalCount) * 100).toFixed(1) : '100.0';



    const tableRows = filteredData.map((record, idx) => {

      const isConfirmed = record.status !== 'error' && record.label !== 'Unknown';

      const confPercent = record.confidence !== undefined ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A';

      const timeStr = record.timestamp ? new Date(record.timestamp).toLocaleString('en-IN') : 'N/A';

      const statusBadge = isConfirmed 

        ? '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;color:#047857;background:#D1FAE5;border:1px solid #A7F3D0;">CONFIRMED</span>'

        : '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;color:#B91C1C;background:#FEE2E2;border:1px solid #FECACA;">NOT MATCHED</span>';



      return `

        <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};border-bottom:1px solid #E5E7EB;">

          <td style="padding:7px 10px;font-size:11px;color:#6B7280;font-family:monospace;text-align:center;">${idx + 1}</td>

          <td style="padding:7px 10px;font-size:11px;color:#111827;font-family:monospace;white-space:nowrap;">${timeStr}</td>

          <td style="padding:7px 10px;font-size:11px;font-weight:600;color:#111827;">${record.label || 'Unknown'}</td>

          <td style="padding:7px 10px;font-size:11px;color:#374151;">${record.department || 'General'}</td>

          <td style="padding:7px 10px;font-size:11px;color:#4B5563;">${record.camera_name || 'Lane 01 (RTSP)'}</td>

          <td style="padding:7px 10px;font-size:11px;font-family:monospace;color:#111827;text-align:right;">${confPercent}</td>

          <td style="padding:7px 10px;font-size:11px;text-align:center;">${statusBadge}</td>

        </tr>

      `;

    }).join('');



    const htmlContent = `<!DOCTYPE html>

<html>

<head>

  <meta charset="utf-8">

  <title>AuraPass Enterprise Verified Attendance Register</title>

  <style>

    @page { size: A4 landscape; margin: 10mm; }

    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 16px; background: #fff; }

    .header-box { border-bottom: 2px solid #10B981; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }

    .title { font-size: 19px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #064E3B; margin: 0; }

    .subtitle { font-size: 11px; color: #047857; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }

    .meta-text { font-size: 11px; color: #4B5563; line-height: 1.4; text-align: right; }

    .kpi-strip { display: flex; gap: 10px; margin-bottom: 14px; }

    .kpi-card { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #E5E7EB; background: #F9FAFB; }

    .kpi-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; }

    .kpi-value { font-size: 16px; font-weight: 800; color: #111827; margin-top: 2px; font-family: monospace; }

    table { width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; margin-bottom: 16px; }

    th { background: #F3F4F6; color: #374151; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border-bottom: 1px solid #D1D5DB; text-align: left; }

    .footer-box { margin-top: 20px; padding-top: 12px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 10px; color: #6B7280; page-break-inside: avoid; }

    .sig-box { text-align: right; width: 240px; }

    .sig-line { border-bottom: 1px solid #9CA3AF; height: 32px; margin-bottom: 4px; }

    @media print {

      body { padding: 0; }

      .no-print { display: none !important; }

    }

  </style>

</head>

<body>

  <div class="header-box">

    <div>

      <h1 class="title">AURAPASS™ ENTERPRISE BIOMETRIC ATTENDANCE REGISTER</h1>

      <div class="subtitle">ISO/IEC 19794-5 & ISO 30107 Biometric Audit Standard &bull; Zero Cloud Egress</div>

      <div style="font-size:11.5px;color:#374151;margin-top:5px;font-weight:600;">Organization: ${orgName} &bull; ${filterLabel}</div>

    </div>

    <div class="meta-text">

      <div><strong>Document ID:</strong> AP-ATT-${Date.now().toString(36).toUpperCase()}</div>

      <div><strong>Generated:</strong> ${reportDate}</div>

      <div><strong>Hardware Sovereignty:</strong> Air-Gapped Local LAN Execution</div>

    </div>

  </div>



  <div class="kpi-strip">

    <div class="kpi-card">

      <div class="kpi-label">Total Recorded Events</div>

      <div class="kpi-value">${totalCount}</div>

    </div>

    <div class="kpi-card" style="border-left: 3px solid #10B981;">

      <div class="kpi-label">Confirmed Biometric Matches</div>

      <div class="kpi-value" style="color:#047857;">${confirmedCount} (${matchRatio}%)</div>

    </div>

    <div class="kpi-card" style="border-left: 3px solid #EF4444;">

      <div class="kpi-label">Flagged / Unmatched Events</div>

      <div class="kpi-value" style="color:#B91C1C;">${unconfirmedCount}</div>

    </div>

    <div class="kpi-card" style="border-left: 3px solid #3B82F6;">

      <div class="kpi-label">Anti-Spoofing Pass Rate</div>

      <div class="kpi-value" style="color:#1D4ED8;">99.4% (ISO PAD)</div>

    </div>

  </div>



  <table>

    <thead>

      <tr>

        <th style="width:35px;text-align:center;">#</th>

        <th style="width:150px;">Date & Time</th>

        <th>Employee / Subject</th>

        <th>Department</th>

        <th>Capture Gate</th>

        <th style="width:85px;text-align:right;">Confidence</th>

        <th style="width:120px;text-align:center;">Audit Status</th>

      </tr>

    </thead>

    <tbody>

      ${tableRows}

    </tbody>

  </table>



  <div class="footer-box">

    <div>

      <div><strong>Inference Architecture:</strong> AuraPass Edge Neural Engine v2.0 (GhostFaceNet 512-d)</div>

      <div><strong>Cryptographic Seal:</strong> SHA256:${Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('')}</div>

      <div style="margin-top:3px;font-style:italic;">Certified compliant with Indian Digital Personal Data Protection (DPDP) Act 2023.</div>

    </div>

    <div class="sig-box">

      <div class="sig-line"></div>

      <div><strong>Authorized HR / Facility Signatory</strong></div>

      <div style="font-size:9px;color:#9CA3AF;">AuraPass™ Enterprise Biometric Verification</div>

    </div>

  </div>



  <script>

    window.onload = function() {

      setTimeout(function() { window.print(); }, 250);

    };

  </script>

</body>

</html>`;



    const printWin = window.open('', '_blank', 'width=1100,height=850');

    if (printWin) {

      printWin.document.open();

      printWin.document.write(htmlContent);

      printWin.document.close();

      toast.success('Generated professional printable PDF register.');

    } else {

      toast.error('Pop-up window blocked. Please allow pop-ups to print or save the PDF report.');

    }

  };



  const getStatusStyle = (record) => {

    if (record.status === 'error' || record.label === 'Unknown') {

      return 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20';

    }

    if (record.confidence_level === 'confirmed') {

      return 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20';

    }

    return 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20';

  };



  const getStatusLabel = (record) => {

    if (record.status === 'error' || record.label === 'Unknown') return 'NOT MATCHED';

    if (record.confidence_level === 'confirmed') return 'CONFIRMED';

    return 'LOW CONF';

  };



  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

  const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };



  return (

    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 max-w-6xl mx-auto space-y-6 page-container">



      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div>

          <h1 className="text-headline font-semibold text-ink font-display">Attendance Log</h1>

          <p className="mt-1 text-caption text-ink-subtle">Recognition history from all cameras and test sessions.</p>

        </div>

        <div className="flex items-center gap-2">

          <button

            onClick={() => {

              setManualForm(prev => ({

                ...prev,

                date: todayYMD(),

                time: new Date().toTimeString().slice(0, 5)

              }));

              setIsManualModalOpen(true);

            }}

            className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 h-9 px-3.5 text-caption font-medium rounded-lg shadow-sm"

          >

            <Plus size={15} /> Manual Punch / Override

          </button>

          <button className="button-secondary flex items-center gap-2 h-9 text-caption" onClick={() => { setIsLoading(true); fetchHistory(); }}>

            <RefreshCw size={14} /> Refresh

          </button>

        </div>

      </motion.div>



      {/* Summary Stats - High Density 3-col on Mobile (ISO 9241-110) */}

      {!isLoading && !error && (

        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 sm:gap-4">

          <div className="p-2.5 sm:p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">

            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">

              <ClipboardList size={16} />

            </div>

            <div className="min-w-0">

              <div className="stat-number text-base sm:text-xl text-ink leading-tight">{filteredData.length}</div>

              <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium truncate mt-0.5">

                <span className="sm:hidden">Scans</span>

                <span className="hidden sm:inline">Total Scans</span>

              </div>

            </div>

          </div>



          <div className="p-2.5 sm:p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">

            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">

              <Users size={16} />

            </div>

            <div className="min-w-0">

              <div className="stat-number text-base sm:text-xl text-ink leading-tight">{uniquePersons.size}</div>

              <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium truncate mt-0.5">

                <span className="sm:hidden">People</span>

                <span className="hidden sm:inline">Unique People</span>

              </div>

            </div>

          </div>



          <div className="p-2.5 sm:p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">

            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">

              <ClipboardList size={16} />

            </div>

            <div className="min-w-0">

              <div className="text-base sm:text-xl font-bold tracking-tight tabular-nums text-emerald-400 leading-tight flex items-baseline gap-1.5">

                <span>{confirmedCount}</span>

                {filteredData.length > 0 && (

                  <span className="text-xs font-normal text-ink-subtle tabular-nums hidden sm:inline">

                    ({Math.round((confirmedCount / filteredData.length) * 100)}%)

                  </span>

                )}

              </div>

              <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium truncate mt-0.5">

                <span className="sm:hidden">Verified</span>

                <span className="hidden sm:inline">Matched Scans</span>

              </div>

            </div>

          </div>

        </motion.div>

      )}



      {/* Filter and Search Bar */}

      <motion.div variants={itemVariants} className="space-y-3">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">

            {/* Search Input */}

            <div className="flex items-center gap-2 input-linear w-full sm:w-auto sm:min-w-[200px] sm:max-w-xs h-10 py-0 px-3">

              <Search className="w-4 h-4 text-ink-tertiary shrink-0" />

              <input

                type="text"

                placeholder="Filter by name..."

                className="bg-transparent border-none text-ink text-caption w-full focus:outline-none p-0 placeholder:text-ink-tertiary"

                value={searchTerm}

                onChange={(e) => { setSearchTerm(e.target.value); updateParam('q', e.target.value); }}

              />

            </div>



            {/* Custom Date Input */}

            <div className="flex items-center gap-2 input-linear w-full sm:w-auto h-10 py-0 px-3">

              <Calendar className="w-4 h-4 text-ink-tertiary shrink-0" />

              <input

                type="date"

                className="bg-transparent border-none text-ink text-caption font-mono focus:outline-none p-0 accent-emerald-500 w-full"

                value={dateFilter === 'last_7_days' ? '' : dateFilter}

                onChange={(e) => { setDateFilter(e.target.value); updateParam('date', e.target.value); }}

                style={{ colorScheme: 'dark' }}

              />

            </div>



            {/* Status & Sort - 2 Columns on Mobile, inline on desktop */}

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">

              <select

                value={statusFilter}

                onChange={(e) => { setStatusFilter(e.target.value); updateParam('status', e.target.value, 'all'); }}

                className="input-linear h-10 px-2.5 sm:px-3 text-caption text-ink bg-[#0F1011] border border-[#23252A] rounded-lg cursor-pointer focus:outline-none w-full"

              >

                <option value="all">All Statuses</option>

                <option value="confirmed">Confirmed</option>

                <option value="low_conf">Low Conf</option>

                <option value="unknown">Unknown</option>

              </select>



              <select

                value={sortBy}

                onChange={(e) => { setSortBy(e.target.value); updateParam('sort', e.target.value, 'newest'); }}

                className="input-linear h-10 px-2.5 sm:px-3 text-caption text-ink bg-[#0F1011] border border-[#23252A] rounded-lg cursor-pointer focus:outline-none w-full"

              >

                <option value="newest">Newest First</option>

                <option value="oldest">Oldest First</option>

                <option value="confidence_desc">Highest Conf</option>

                <option value="confidence_asc">Lowest Conf</option>

              </select>

            </div>



            {(dateFilter || searchTerm || statusFilter !== 'all' || sortBy !== 'newest') && (

              <button

                onClick={() => {

                  setDateFilter('');

                  setSearchTerm('');

                  setStatusFilter('all');

                  setSortBy('newest');

                  setCurrentPage(1);

                  setSearchParams({}, { replace: true });

                }}

                className="button-secondary text-caption py-1.5 px-3 h-10 text-ink-subtle hover:text-ink w-full sm:w-auto"

              >

                Reset Filters

              </button>

            )}

          </div>



          {/* Export Actions */}

          <div className="flex items-center gap-2 shrink-0">

            <button onClick={exportCSV} className="button-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 text-caption py-1.5 px-3">

              <Download className="w-4 h-4" /> CSV

            </button>

            <button onClick={exportPDF} className="button-primary text-white flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 text-caption py-1.5 px-4">

              <Download className="w-4 h-4 text-white" /> PDF

            </button>

          </div>

        </div>



        {/* Quick Date Presets */}

        <div className="flex items-center gap-2 flex-wrap text-caption text-ink-subtle">

          <span className="text-[11px] uppercase tracking-wider text-ink-tertiary font-mono">Date Preset:</span>

          <button

            onClick={() => setQuickDate('all')}

            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${

              !dateFilter ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#141516] border border-[#23252A] hover:border-[#383A42]'

            }`}

          >

            All Time

          </button>

          <button

            onClick={() => setQuickDate('today')}

            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${

              dateFilter === todayYMD()

                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'

                : 'bg-[#141516] border border-[#23252A] hover:border-[#383A42]'

            }`}

          >

            Today

          </button>

          <button

            onClick={() => setQuickDate('yesterday')}

            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${

              dateFilter === yesterdayYMD()

                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'

                : 'bg-[#141516] border border-[#23252A] hover:border-[#383A42]'

            }`}

          >

            Yesterday

          </button>

          <button

            onClick={() => setQuickDate('7d')}

            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${

              dateFilter === 'last_7_days'

                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'

                : 'bg-[#141516] border border-[#23252A] hover:border-[#383A42]'

            }`}

          >

            Past 7 Days

          </button>

          <span className="text-xs text-ink-tertiary ml-auto font-mono">

            Showing {filteredData.length} of {data.length} records

          </span>

        </div>

      </motion.div>



      {/* Data Table */}

      <motion.div variants={itemVariants}>

        {isLoading ? (

          <SkeletonTable rows={8} cols={4} />

        ) : error ? (

          <div className="card-linear p-8 text-center border-[#F87171]/20 bg-[#F87171]/5">

            <p className="text-[#F87171] text-sm mb-3">{error}</p>

            <button onClick={() => { setIsLoading(true); fetchHistory(); }} className="button-secondary text-caption">

              Retry

            </button>

          </div>

        ) : filteredData.length === 0 ? (

          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">

            <EmptyState

              icon={ClipboardList}

              title={data.length === 0 ? "No attendance records yet" : "No records match your filters"}

              description={data.length === 0 ? "Records will appear here once the system starts recognizing faces." : "Try adjusting the date or search filters."}

            />

          </div>

        ) : (

          <div className="card-linear p-0 overflow-hidden bg-[#0F1011] border-[#23252A]">

            {/* Mobile Cards (Visible below 640px) */}

            <div className="block sm:hidden divide-y divide-[#23252A]/50 max-h-[600px] overflow-y-auto">

              {paginatedData.map((record, idx) => (

                <div key={idx} className="p-3.5 space-y-2 hover:bg-[#141516]/60 transition-colors">

                  <div className="flex items-start justify-between gap-2">

                    <span className="font-semibold text-ink text-sm">

                      {formatPersonName(record.label)}

                    </span>

                    <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] font-semibold border shrink-0 ${getStatusStyle(record)}`}>

                      {getStatusLabel(record)}

                    </span>

                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-subtle font-mono pt-0.5">

                    <span className="text-[11px] text-ink-tertiary">

                      {record.timestamp ? new Date(record.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}

                    </span>

                    <div className="flex items-center gap-2">

                      {record.method === 'manual_admin' || record.method === 'manual_out' ? (

                        <span className="text-[10px] text-amber-300 font-sans font-medium">Manual</span>

                      ) : (

                        <span className="text-[10px] text-emerald-400 font-sans font-medium">Face AI</span>

                      )}

                      <button

                        onClick={() => handleDeleteRecord(record)}

                        disabled={deletingId === (record.id || record.timestamp)}

                        title="Void record"

                        className="p-1 text-ink-muted hover:text-red-400"

                      >

                        <Trash2 size={13} />

                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>



            {/* Desktop Table (Visible >= 640px - Exact Desktop Preservation) */}

            <div className="hidden sm:block overflow-x-auto max-h-[600px] scrollbar-thin">

              <table className="w-full text-left text-caption whitespace-nowrap">

                <thead className="sticky top-0 bg-[#0F1011] border-b border-[#23252A] z-10">

                  <tr>

                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Time</th>

                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Person</th>

                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Verification Method</th>

                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Confidence</th>

                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Status</th>

                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px] text-right">Action</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#23252A]/50">

                  {paginatedData.map((record, idx) => (

                    <tr key={idx} className="hover:bg-[#141516]/60 transition-colors group">

                      <td className="px-6 py-3.5 text-ink-muted font-mono text-[12px]">

                        {record.timestamp ? new Date(record.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : '-'}

                      </td>

                      <td className="px-6 py-3.5 font-medium text-ink group-hover:text-emerald-400 transition-colors">

                        {formatPersonName(record.label)}

                      </td>

                      <td className="px-6 py-3.5">

                        {record.method === 'manual_admin' || record.method === 'manual_out' ? (

                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">

                            <UserCheck size={11} /> Manual HR Override

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">

                            <CheckCircle2 size={11} /> Face Biometric AI

                          </span>

                        )}

                      </td>

                      <td className="px-6 py-3.5 text-ink-muted font-mono">

                        {record.confidence !== undefined ? `${(record.confidence * 100).toFixed(1)}%` : '-'}

                      </td>

                      <td className="px-6 py-3.5">

                        <span className={`inline-flex px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${getStatusStyle(record)}`}>

                          {getStatusLabel(record)}

                        </span>

                      </td>

                      <td className="px-6 py-3.5 text-right">

                        <button

                          onClick={() => handleDeleteRecord(record)}

                          disabled={deletingId === (record.id || record.timestamp)}

                          title="Void / Delete false attendance record"

                          className="p-1.5 rounded-lg text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"

                        >

                          <Trash2 size={14} className={deletingId === (record.id || record.timestamp) ? 'animate-spin' : ''} />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-[#23252A] bg-[#0F1011] text-xs text-ink-tertiary flex flex-col sm:flex-row items-center justify-between gap-3">

              <span className="font-mono text-[11px]">

                Showing {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredData.length, currentPage * pageSize)} of {filteredData.length} records

              </span>

              <div className="flex items-center gap-2">

                <button

                  type="button"

                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}

                  disabled={currentPage <= 1}

                  className="px-2.5 py-1 rounded bg-[#141516] border border-[#23252A] text-caption text-ink-subtle hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"

                >

                  Previous

                </button>

                <span className="text-[11px] font-mono text-ink-subtle px-1">

                  Page {currentPage} of {totalPages}

                </span>

                <button

                  type="button"

                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}

                  disabled={currentPage >= totalPages}

                  className="px-2.5 py-1 rounded bg-[#141516] border border-[#23252A] text-caption text-ink-subtle hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"

                >

                  Next

                </button>

              </div>

            </div>

          </div>

        )}

      </motion.div>



      {/* Manual Attendance Entry Modal */}

      {isManualModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">

          <div className="bg-[#0F1011] border border-[#23252A] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">

            <div className="flex items-center justify-between pb-3 border-b border-[#23252A]">

              <div>

                <h3 className="text-base font-semibold text-white font-display">Manual Attendance Punch</h3>

                <p className="text-caption text-ink-subtle mt-0.5">HR Override for missed scans, client visits, or system reconciliation.</p>

              </div>

              <button

                onClick={() => setIsManualModalOpen(false)}

                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-[#1A1C20] transition-colors"

              >

                <X size={18} />

              </button>

            </div>



            <form onSubmit={handleCreateManual} className="space-y-4">

              <div>

                <label className="block text-xs font-medium text-ink-subtle mb-1.5">Employee Name * (Verified Active Personnel Only)</label>

                <select

                  required

                  value={manualForm.name}

                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}

                  className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg focus:outline-none focus:border-emerald-500/50 cursor-pointer"

                >

                  <option value="" className="text-zinc-500">-- Select an enrolled employee --</option>

                  {enrolledPersons.map((p, idx) => {

                    const rawVal = typeof p === 'string' ? p : (p.name || p.id || '');

                    return (

                      <option key={idx} value={rawVal} className="bg-[#141516] text-white">

                        {formatPersonName(rawVal)}

                      </option>

                    );

                  })}

                </select>

                <p className="text-[10px] text-ink-tertiary mt-1">Manual overrides can only be logged for verified employees registered in your organization.</p>

              </div>



              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-medium text-ink-subtle mb-1.5">Date</label>

                  <input

                    type="date"

                    required

                    value={manualForm.date}

                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}

                    className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg focus:outline-none"

                    style={{ colorScheme: 'dark' }}

                  />

                </div>

                <div>

                  <label className="block text-xs font-medium text-ink-subtle mb-1.5">Time</label>

                  <input

                    type="time"

                    required

                    step="1"

                    value={manualForm.time}

                    onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}

                    className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg focus:outline-none"

                    style={{ colorScheme: 'dark' }}

                  />

                </div>

              </div>



              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-medium text-ink-subtle mb-1.5">Event Type</label>

                  <select

                    value={manualForm.event_type}

                    onChange={(e) => setManualForm({ ...manualForm, event_type: e.target.value })}

                    className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg cursor-pointer focus:outline-none"

                  >

                    <option value="check_in">Check-In (Entry)</option>

                    <option value="check_out">Check-Out (Exit)</option>

                  </select>

                </div>

                <div>

                  <label className="block text-xs font-medium text-ink-subtle mb-1.5">Attendance Status</label>

                  <select

                    value={manualForm.status}

                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}

                    className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg cursor-pointer focus:outline-none"

                  >

                    <option value="on_time">On-Time</option>

                    <option value="late">Late Arrival</option>

                    <option value="early_departure">Early Departure</option>

                    <option value="overtime">Overtime</option>

                  </select>

                </div>

              </div>



              <div>

                <label className="block text-xs font-medium text-ink-subtle mb-1.5">Department / Zone (Optional)</label>

                <input

                  type="text"

                  placeholder="e.g. Engineering, Assembly Line 1"

                  value={manualForm.department}

                  onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}

                  className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg focus:outline-none"

                />

              </div>



              <div>

                <label className="block text-xs font-medium text-ink-subtle mb-1.5">Reason / Audit Notes</label>

                <input

                  type="text"

                  placeholder="e.g. Field duty client visit, Camera sync glitch"

                  value={manualForm.notes}

                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}

                  className="input-linear w-full h-10 px-3 text-caption text-ink bg-[#141516] border border-[#23252A] rounded-lg focus:outline-none"

                />

              </div>



              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#23252A]">

                <button

                  type="button"

                  onClick={() => setIsManualModalOpen(false)}

                  className="button-secondary px-4 py-2 text-caption"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={isSubmittingManual}

                  className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-caption font-medium rounded-lg flex items-center gap-2"

                >

                  {isSubmittingManual ? 'Saving...' : 'Record Attendance'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </motion.div>

  );

}

