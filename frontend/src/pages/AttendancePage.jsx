import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Download, Calendar, Search, RefreshCw, ClipboardList, Users } from 'lucide-react';
import { API_BASE } from '../config';
import { SkeletonTable, SkeletonStatCards } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';


export default function AttendancePage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
  }, [fetchHistory]);

  // Filter by date and search
  const filteredData = data.filter(record => {
    const matchDate = !dateFilter || (record.timestamp && record.timestamp.startsWith(dateFilter));
    const matchSearch = !searchTerm || (record.label && record.label.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchDate && matchSearch;
  });

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

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFilter) {
        params.set('start_date', `${dateFilter}T00:00:00`);
        params.set('end_date', `${dateFilter}T23:59:59`);
      }
      const res = await apiClient.get(`${API_BASE}/analytics/export/pdf?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${dateFilter || 'all'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF report downloaded.');
    } catch (err) {
      toast.error('Failed to export PDF report.');
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
        <button className="button-secondary flex items-center gap-2 h-9 text-caption" onClick={() => { setIsLoading(true); fetchHistory(); }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* Summary Stats */}
      {!isLoading && !error && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-lg flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5E6AD2]/10"><ClipboardList size={18} className="text-[#828FFF]" /></div>
            <div>
              <div className="text-lg font-bold text-ink">{filteredData.length}</div>
              <div className="text-[11px] text-ink-subtle">Total Scans</div>
            </div>
          </div>
          <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-lg flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#27A644]/10"><Users size={18} className="text-[#4ade80]" /></div>
            <div>
              <div className="text-lg font-bold text-ink">{uniquePersons.size}</div>
              <div className="text-[11px] text-ink-subtle">Unique People Seen</div>
            </div>
          </div>
          <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-lg flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FBBF24]/10"><ClipboardList size={18} className="text-[#fde68a]" /></div>
            <div>
              <div className="text-lg font-bold text-ink">{confirmedCount} <span className="text-sm font-normal text-ink-subtle">/ {unknownCount} unknown</span></div>
              <div className="text-[11px] text-ink-subtle">Matched / Unmatched</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 input-linear min-w-[200px] h-10 py-0 px-3">
            <Calendar className="w-4 h-4 text-ink-tertiary shrink-0" />
            <input
              type="date"
              className="bg-transparent border-none text-ink text-caption font-mono w-full focus:outline-none p-0 accent-[#5E6AD2]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="flex items-center gap-2 input-linear min-w-[180px] h-10 py-0 px-3">
            <Search className="w-4 h-4 text-ink-tertiary shrink-0" />
            <input
              type="text"
              placeholder="Search by name..."
              className="bg-transparent border-none text-ink text-caption w-full focus:outline-none p-0 placeholder:text-ink-tertiary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(dateFilter || searchTerm) && (
            <button onClick={() => { setDateFilter(''); setSearchTerm(''); }} className="button-secondary text-caption py-1.5 px-3 h-10">
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="button-secondary flex items-center gap-2 h-9 text-caption py-1.5 px-3">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF} className="button-primary text-white flex items-center gap-2 h-9 text-caption py-1.5 px-4">
            <Download className="w-4 h-4 text-white" /> PDF
          </button>
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
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
              <table className="w-full text-left text-caption whitespace-nowrap">
                <thead className="sticky top-0 bg-[#0F1011] border-b border-[#23252A] z-10">
                  <tr>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Time</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Person</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Confidence</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252A]/50">
                  {filteredData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-[#141516]/60 transition-colors group">
                      <td className="px-6 py-3.5 text-ink-muted font-mono text-[12px]">
                        {record.timestamp ? new Date(record.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-ink group-hover:text-[#828FFF] transition-colors">
                        {(record.label || 'Unknown').replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-3.5 text-ink-muted font-mono">
                        {record.confidence !== undefined ? `${(record.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${getStatusStyle(record)}`}>
                          {getStatusLabel(record)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-[#23252A] bg-[#0F1011] text-[11px] text-ink-tertiary">
              Showing {filteredData.length} of {data.length} records
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
