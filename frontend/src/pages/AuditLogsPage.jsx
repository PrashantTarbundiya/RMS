import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserX, FileText, RefreshCw, Download, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';

export default function AuditLogsPage() {
  const { apiClient, user } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(25);
  const [logType, setLogType] = useState(() => searchParams.get('type') || 'all');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [sortOrder, setSortOrder] = useState(() => searchParams.get('sort') || 'desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateStart, setDateStart] = useState(() => searchParams.get('start') || '');
  const [dateEnd, setDateEnd] = useState(() => searchParams.get('end') || '');

  const updateParam = useCallback((key, val, defaultVal = '') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!val || val === defaultVal || (key === 'page' && val === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: logType,
        page: page.toString(),
        per_page: perPage.toString(),
        sort: sortOrder,
      });
      if (search.trim()) params.set('search', search.trim());
      if (dateStart) params.set('start_date', dateStart);
      if (dateEnd) params.set('end_date', dateEnd);

      const res = await apiClient.get(`${API_BASE}/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied. Audit logs are restricted to administrators.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch audit logs.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, logType, page, perPage, search, sortOrder, dateStart, dateEnd]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput); updateParam('q', searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const exportCSV = () => {
    const headers = ['Type', 'Timestamp', 'Details', 'Status'];
    const rows = logs.map(l => [
      l.type,
      l.timestamp ? new Date(l.timestamp).toLocaleString() : '',
      l.type === 'access' 
        ? `${l.employee_name || 'Unknown'} (${l.department || 'General'}) - ${l.event_type || 'check_in'}`
        : l.type === 'feedback' 
          ? `Predicted: ${l.predicted_name || ''}${l.correct_name ? ` → ${l.correct_name}` : ''}` 
          : `Employee: ${l.employee_name || ''}`,
      l.type === 'access'
        ? (l.status || 'confirmed')
        : l.type === 'feedback' 
          ? (l.is_correct ? 'Correct' : 'Incorrect') 
          : (l.revoked_at ? 'Revoked' : 'Active'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${logs.length} audit records.`);
  };

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'access', label: 'Kiosk & Access' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'consent', label: 'Consent' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-12 max-w-5xl mx-auto space-y-6 page-container"
    >
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="page-header-title">Audit Logs</h1>
            <p className="page-header-desc">
              Feedback corrections and consent records - compliance audit trail
            </p>
          </div>
        </div>
        {logs.length > 0 && (
          <button
            onClick={exportCSV}
            className="button-secondary flex items-center gap-1.5 text-caption h-9 px-3"
            aria-label="Export audit logs as CSV"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {/* Filters Bar - High Contrast Segmented Control */}
      <div className="card-linear p-3.5 flex flex-wrap items-center gap-3 bg-[#0F1011] border border-[#23252A] rounded-xl shadow-md">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#141518] border border-[#2B2F38] rounded-xl h-9.5 px-3 flex-1 min-w-[220px] focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or details..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-transparent border-none text-zinc-100 text-xs w-full focus:outline-none placeholder:text-zinc-500"
          />
        </div>

        {/* Type Filter Tabs - Distinct High-Contrast Pills */}
        <div className="flex items-center gap-1 bg-[#141518] border border-[#2B2F38] rounded-xl p-1 shadow-inner">
          {filterTabs.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setLogType(opt.value); setPage(1); updateParam('type', opt.value, 'all'); updateParam('page', 1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                logType === opt.value 
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-zinc-400 shrink-0" />
          <input 
            type="date" 
            value={dateStart} 
            onChange={e => { setDateStart(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg bg-[#141518] border border-[#2B2F38] text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            style={{ colorScheme: 'dark' }}
          />
          <span className="text-xs text-zinc-400 font-medium">to</span>
          <input 
            type="date" 
            value={dateEnd} 
            onChange={e => { setDateEnd(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg bg-[#141518] border border-[#2B2F38] text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Sort Toggle */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="h-9 px-3 rounded-lg bg-[#141518] border border-[#2B2F38] text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          className="h-9 w-9 rounded-lg bg-[#141518] border border-[#2B2F38] text-zinc-300 hover:text-white hover:border-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Refresh audit logs"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg p-4 bg-red-500/10 border border-red-500/20 text-[#f87171] text-caption flex items-center gap-2">
          <XCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button 
            onClick={fetchLogs} 
            className="ml-auto text-ink-subtle hover:text-ink text-caption underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex justify-between items-center text-[11px] text-ink-tertiary">
        <span>{total} record{total !== 1 ? 's' : ''} found</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Logs Container - Dual-mode (Mobile Cards + Desktop Table) */}
      <div className="rounded-xl overflow-hidden border border-[#23252A] bg-[#0F1011]">
        {isLoading ? (
          <SkeletonTable rows={6} cols={4} />
        ) : logs.length === 0 ? (
          <EmptyState 
            icon={FileText} 
            title="No audit logs found" 
            description="Adjust your filters or check back after some activity has been recorded."
            action={
              <button onClick={fetchLogs} className="button-secondary text-caption px-4 py-2 flex items-center gap-2 cursor-pointer">
                <RefreshCw size={14} /> Refresh
              </button>
            }
          />
        ) : (
          <>
            {/* Mobile Cards (<640px) */}
            <div className="sm:hidden divide-y divide-[#23252A]">
              <AnimatePresence>
                {logs.map((log, idx) => (
                  <motion.div
                    key={log.id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="p-3.5 space-y-2.5 hover:bg-[#161719] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`badge text-[10px] ${
                        log.type === 'access'
                          ? (log.event_type === 'check_out' ? 'badge-info' : 'badge-success')
                          : log.type === 'consent'
                            ? 'badge-info'
                            : 'badge-warning'
                      }`}>
                        {log.type === 'access' ? (log.event_type === 'check_out' ? 'kiosk exit' : 'kiosk entry') : log.type}
                      </span>
                      <span className="text-[11px] text-ink-subtle">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>

                    <div className="text-caption text-ink">
                      {log.type === 'access' ? (
                        <div>
                          <div className="font-semibold text-ink">
                            {log.employee_name || 'Unknown'}
                            <span className="text-ink-subtle ml-1 font-normal text-[11px]">({log.department || 'General'})</span>
                          </div>
                          <div className="text-[11px] text-ink-tertiary mt-0.5">
                            {log.event_type === 'check_out' ? 'Building Departure' : 'Building Arrival'} · {log.method || 'kiosk'} · Conf: {Math.round((log.confidence || 0.85) * 100)}%
                          </div>
                        </div>
                      ) : log.type === 'feedback' ? (
                        <div>
                          <div className="text-caption">
                            Predicted: <strong className="text-ink">{log.predicted_name || '-'}</strong>
                            {log.correct_name && (
                              <span className="text-ink-subtle"> → Corrected: <strong className="text-emerald-400">{log.correct_name}</strong></span>
                            )}
                          </div>
                          {log.message && (
                            <div className="text-[11px] text-ink-tertiary mt-0.5">{log.message}</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-caption">
                            Employee: <strong className="text-ink">{log.employee_name || '-'}</strong>
                          </div>
                          <div className="text-[11px] text-ink-tertiary mt-0.5">
                            {log.consent_type?.replace(/_/g, ' ')}
                            {log.revoked_at && (
                              <span className="text-[#f87171]"> - Revoked {new Date(log.revoked_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#23252A]/50 text-[11px]">
                      <span className="text-ink-tertiary">
                        {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ''}
                      </span>
                      <div>
                        {log.type === 'access' ? (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                            log.status === 'late'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {log.status === 'late' ? 'Late Arrival' : log.status === 'on_time' ? 'On Time' : (log.status || 'Verified')}
                          </span>
                        ) : log.type === 'feedback' ? (
                          log.is_correct ? (
                            <span className="inline-flex items-center gap-1 text-[#4ade80] text-[11px]">
                              <CheckCircle size={13} /> Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#f87171] text-[11px]">
                              <XCircle size={13} /> Corrected
                            </span>
                          )
                        ) : (
                          log.revoked_at ? (
                            <span className="inline-flex items-center gap-1 text-[#f87171] text-[11px]">
                              <UserX size={13} /> Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#4ade80] text-[11px]">
                              <CheckCircle size={13} /> Active
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop Table (>=640px) - 100% desktop fidelity */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#23252A]">
                    {['Type', 'Timestamp', 'Details', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {logs.map((log, idx) => (
                      <motion.tr
                        key={log.id || idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-[#23252A] table-row-hover"
                      >
                        {/* Type Badge */}
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            log.type === 'access'
                              ? (log.event_type === 'check_out' ? 'badge-info' : 'badge-success')
                              : log.type === 'consent'
                                ? 'badge-info'
                                : 'badge-warning'
                          }`}>
                            {log.type === 'access' ? (log.event_type === 'check_out' ? 'kiosk exit' : 'kiosk entry') : log.type}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-3 text-caption text-ink-subtle">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </td>

                        {/* Details */}
                        <td className="px-4 py-3 text-caption text-ink">
                          {log.type === 'access' ? (
                            <div>
                              <div>
                                <strong>{log.employee_name || 'Unknown'}</strong>
                                <span className="text-ink-subtle ml-1.5 font-normal">({log.department || 'General'})</span>
                              </div>
                              <div className="text-[11px] text-ink-tertiary mt-0.5">
                                {log.event_type === 'check_out' ? 'Building Departure' : 'Building Arrival'} · {log.method || 'kiosk'} · Conf: {Math.round((log.confidence || 0.85) * 100)}%
                              </div>
                            </div>
                          ) : log.type === 'feedback' ? (
                            <div>
                              <div>
                                Predicted: <strong>{log.predicted_name || '-'}</strong>
                                {log.correct_name && (
                                  <span className="text-ink-subtle"> → Corrected: <strong className="text-ink">{log.correct_name}</strong></span>
                                )}
                              </div>
                              {log.message && (
                                <div className="text-[11px] text-ink-tertiary mt-0.5">{log.message}</div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div>
                                Employee: <strong>{log.employee_name || '-'}</strong>
                              </div>
                              <div className="text-[11px] text-ink-tertiary">
                                {log.consent_type?.replace(/_/g, ' ')}
                                {log.revoked_at && (
                                  <span className="text-[#f87171]"> - Revoked {new Date(log.revoked_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {log.type === 'access' ? (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                              log.status === 'late'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {log.status === 'late' ? 'Late Arrival' : log.status === 'on_time' ? 'On Time' : (log.status || 'Verified')}
                            </span>
                          ) : log.type === 'feedback' ? (
                            log.is_correct ? (
                              <CheckCircle size={16} className="text-[#4ade80]" />
                            ) : (
                              <XCircle size={16} className="text-[#f87171]" />
                            )
                          ) : (
                            log.revoked_at ? (
                              <UserX size={16} className="text-[#f87171]" />
                            ) : (
                              <CheckCircle size={16} className="text-[#4ade80]" />
                            )
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="button-icon disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-[36px] h-9 rounded-lg text-caption font-medium transition-all cursor-pointer ${
                  p === page 
                    ? 'bg-emerald-600 text-white border border-emerald-500' 
                    : 'bg-[#0F1011] text-ink-subtle border border-[#23252A] hover:border-[#34343A]'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="button-icon disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
