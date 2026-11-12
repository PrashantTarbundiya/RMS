import React, { useState } from 'react';
import {
  FileText,
  Table,
  FileSpreadsheet,
  Code2,
  Calendar,
  Building2,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE } from '../../config';

export default function ExportModal({
  isOpen,
  onClose,
  category = 'analytics', // 'analytics' | 'attendance' | 'audit'
  title = 'Export Enterprise Report',
  appliedFilters = {},
  departments = [],
}) {
  const { apiClient } = useAuth();
  const toast = useToast();

  const [format, setFormat] = useState('pdf'); // 'pdf' | 'xlsx' | 'csv' | 'json'
  const [period, setPeriod] = useState(appliedFilters.period || 'past7days');
  const [startDate, setStartDate] = useState(appliedFilters.startDate || '');
  const [endDate, setEndDate] = useState(appliedFilters.endDate || '');
  const [department, setDepartment] = useState(appliedFilters.department || '');
  const [isExporting, setIsExporting] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setValidationError('');
    const now = new Date();
    const toYMD = (d) => d.toISOString().slice(0, 10);

    if (newPeriod === 'daily') {
      const today = toYMD(now);
      setStartDate(today);
      setEndDate(today);
    } else if (newPeriod === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (newPeriod === 'past7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setStartDate(toYMD(past));
      setEndDate(toYMD(now));
    } else if (newPeriod === 'monthly') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toYMD(first));
      setEndDate(toYMD(now));
    } else if (newPeriod === 'yearly') {
      const first = new Date(now.getFullYear(), 0, 1);
      setStartDate(toYMD(first));
      setEndDate(toYMD(now));
    } else if (newPeriod === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExport = async () => {
    setValidationError('');

    // Filter validation
    if (period === 'custom') {
      if (!startDate || !endDate) {
        setValidationError('Both start date and end date are required for a custom range.');
        return;
      }
      if (startDate > endDate) {
        setValidationError('Start date cannot be after end date.');
        return;
      }
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', format);

      if (period && period !== 'custom') {
        params.set('period', period);
      } else {
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
      }

      if (department) {
        params.set('department', department);
      }

      if (appliedFilters.workStart) {
        params.set('work_start_hour', appliedFilters.workStart.hour || 9);
        params.set('work_start_minute', appliedFilters.workStart.minute || 0);
      }

      if (appliedFilters.status) {
        params.set('status', appliedFilters.status);
      }

      if (appliedFilters.eventType) {
        params.set('event_type', appliedFilters.eventType);
      }

      let endpoint = `${API_BASE}/reports/analytics/export`;
      let defaultPrefix = 'aurapass_analytics';

      if (category === 'attendance') {
        endpoint = `${API_BASE}/reports/attendance/export`;
        defaultPrefix = 'aurapass_attendance';
      } else if (category === 'audit') {
        endpoint = `${API_BASE}/reports/audit/export`;
        defaultPrefix = 'aurapass_audit';
      }

      const res = await apiClient.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob'
      });

      // Derive mime and extension
      const formatMap = {
        pdf: { mime: 'application/pdf', ext: 'pdf' },
        xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
        csv: { mime: 'text/csv; charset=utf-8', ext: 'csv' },
        json: { mime: 'application/json; charset=utf-8', ext: 'json' }
      };

      const { mime, ext } = formatMap[format] || formatMap.pdf;
      const todayStr = new Date().toISOString().slice(0, 10);
      const filename = `${defaultPrefix}_${period || 'custom'}_${todayStr}.${ext}`;

      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Export ready: ${filename}`);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      let errorMsg = 'Failed to generate export file. Please try again.';
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) errorMsg = parsed.error;
        } catch (_) {}
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      id: 'pdf',
      name: 'PDF Document',
      ext: '.pdf',
      icon: FileText,
      desc: 'Executive report with print-ready tables, signatures & page counts',
      tag: 'Print Ready'
    },
    {
      id: 'xlsx',
      name: 'Excel Workbook',
      ext: '.xlsx',
      icon: FileSpreadsheet,
      desc: 'Multi-tab spreadsheet with auto-filters, summary KPIs & styling',
      tag: 'Multi-Tab'
    },
    {
      id: 'csv',
      name: 'CSV Data Stream',
      ext: '.csv',
      icon: Table,
      desc: 'UTF-8 BOM stream with formula injection sanitization (CWE-1236)',
      tag: 'Raw Tabular'
    },
    {
      id: 'json',
      name: 'Verifiable JSON',
      ext: '.json',
      icon: Code2,
      desc: 'Schema v2.0 dataset with deterministic SHA256 integrity hash',
      tag: 'API / Audit'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download size={16} />
            </div>
            <div>
              <h2 className="text-body font-semibold text-neutral-100">{title}</h2>
              <p className="text-caption text-neutral-400">Validated, canonical data export for compliance and auditing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-md hover:bg-neutral-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Format Selector */}
          <div>
            <label className="block text-caption font-medium text-neutral-300 mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formatOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex items-start gap-3 p-3 text-left rounded-lg border transition-all ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-800/30'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-md mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-caption font-semibold ${isSelected ? 'text-emerald-300' : 'text-neutral-200'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-400 font-mono">
                          {opt.ext}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period Presets */}
          <div>
            <label className="block text-caption font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-neutral-400" />
              Reporting Period
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'daily', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'past7days', label: 'Past 7d' },
                { id: 'monthly', label: 'Month' },
                { id: 'yearly', label: 'Year' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriodChange(p.id)}
                  className={`py-1.5 px-2 text-caption rounded-md border text-center transition-colors font-medium ${
                    period === p.id
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs if Custom Selected */}
          {period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950/30">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Start Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setValidationError('');
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-caption text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  End Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setValidationError('');
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-caption text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Department Filter (if applicable) */}
          {category !== 'audit' && (
            <div>
              <label className="block text-caption font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-neutral-400" />
                Department Filter
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-neutral-950/60 border border-neutral-800 rounded-md px-3 py-2 text-caption text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Departments (Entire Organization)</option>
                {departments.map((d) => {
                  const deptVal = typeof d === 'string' ? d : d.name;
                  return (
                    <option key={deptVal} value={deptVal}>
                      {deptVal}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 text-caption text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg">
              <AlertCircle size={15} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Audit & Compliance Disclaimer Strip */}
          <div className="p-3 bg-neutral-950/50 border border-neutral-800/80 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-400 leading-relaxed">
              <span className="text-neutral-200 font-medium">Enterprise Canonical Invariant:</span>{' '}
              All export formats are synthesized from the identical validated database model. Department attendance sums and individual records reconcile 100% with executive totals.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-950/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-caption font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 text-caption font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-md shadow-sm transition-all"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Compiling {format.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

