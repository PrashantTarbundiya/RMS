import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Clock, Users, TrendingDown, Calendar, Download, RefreshCw, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';

const COLORS = ['#5E6AD2', '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#34d399', '#f472b6'];

function StatCard({ label, value, sub, icon: Icon, color = '#5E6AD2' }) {
  return (
    <div className="card-linear p-4 flex items-center gap-4 bg-[#0F1011] border-[#23252A]">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold text-ink">{value}</div>
        <div className="text-[11px] text-ink-subtle">{label}</div>
        {sub && <div className="text-[10px] text-ink-tertiary mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function HeatmapGrid({ data }) {
  if (!data?.heatmap) return null;
  const days = data.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...data.heatmap.flat(), 1);

  return (
    <div className="card-linear p-5 bg-[#0F1011] border-[#23252A]">
      <h3 className="text-body font-medium text-ink mb-4 flex items-center gap-2">
        <Calendar size={16} className="text-[#5E6AD2]" />
        Attendance Heatmap
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-16 mb-1">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-ink-tertiary">
                {i % 3 === 0 ? `${i}h` : ''}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {data.heatmap.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center mb-0.5">
              <div className="w-16 text-[11px] text-ink-subtle pr-2 text-right">{days[dayIdx]?.slice(0, 3)}</div>
              <div className="flex flex-1 gap-0.5">
                {row.map((val, hourIdx) => {
                  const intensity = val / maxVal;
                  return (
                    <div
                      key={hourIdx}
                      className="flex-1 rounded-sm"
                      style={{
                        height: '18px',
                        background: val === 0
                          ? '#1a1a1f'
                          : `rgba(94, 106, 210, ${0.15 + intensity * 0.85})`,
                      }}
                      title={`${days[dayIdx]} ${hourIdx}:00 — ${val} check-ins`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-ink-tertiary">
        <span>Less</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(94, 106, 210, ${opacity})` }} />
        ))}
        <span>More</span>
        {data.peak_hour !== undefined && (
          <span className="ml-4">Peak: {days[data.heatmap.findIndex((_, i) => data.days[i] === data.peak_day)]?.slice(0,3) || data.peak_day} {data.peak_hour}:00 ({data.peak_count})</span>
        )}
      </div>
    </div>
  );
}

function DepartmentTable({ data }) {
  if (!data?.departments?.length && !data?.unassigned) return null;
  const all = [...(data.departments || []), ...(data.unassigned ? [data.unassigned] : [])];

  return (
    <div className="card-linear p-5 bg-[#0F1011] border-[#23252A]">
      <h3 className="text-body font-medium text-ink mb-4 flex items-center gap-2">
        <Building2 size={16} className="text-[#60a5fa]" />
        Department Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-caption">
          <thead>
            <tr className="border-b border-[#23252A] text-ink-subtle">
              <th className="text-left py-2 pr-4 font-medium">Department</th>
              <th className="text-right py-2 px-3 font-medium">Employees</th>
              <th className="text-right py-2 px-3 font-medium">Check-ins</th>
              <th className="text-right py-2 px-3 font-medium">Attendance %</th>
              <th className="text-right py-2 pl-3 font-medium">Avg Confidence</th>
            </tr>
          </thead>
          <tbody>
            {all.map((dept, i) => (
              <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#23252A]/20">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-ink font-medium">{dept.name}</span>
                  </div>
                </td>
                <td className="text-right py-2.5 px-3 text-ink-subtle">{dept.total_employees}</td>
                <td className="text-right py-2.5 px-3 text-ink-subtle">{dept.total_checkins}</td>
                <td className="text-right py-2.5 px-3">
                  <span className={dept.avg_attendance_rate >= 80 ? 'text-[#4ade80]' : dept.avg_attendance_rate >= 50 ? 'text-[#fbbf24]' : 'text-[#f87171]'}>
                    {dept.avg_attendance_rate}%
                  </span>
                </td>
                <td className="text-right py-2.5 pl-3 text-ink-subtle">{(dept.avg_confidence * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LateArrivalsPanel({ data }) {
  if (!data || data.error) return null;

  return (
    <div className="card-linear p-5 bg-[#0F1011] border-[#23252A]">
      <h3 className="text-body font-medium text-ink mb-4 flex items-center gap-2">
        <Clock size={16} className="text-[#fbbf24]" />
        Late Arrival Analysis
        <span className="text-[10px] text-ink-tertiary ml-2">(Start: {data.work_start || '09:00'})</span>
      </h3>

      {/* Day of week breakdown */}
      {data.by_day_of_week?.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] text-ink-subtle mb-2 uppercase tracking-wider">By Day of Week</div>
          <div className="flex gap-1.5">
            {data.by_day_of_week.map((d, i) => {
              const maxLate = Math.max(...data.by_day_of_week.map(x => x.late_rate), 1);
              const barHeight = Math.max(8, (d.late_rate / maxLate) * 60);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-ink-tertiary">{d.late_rate}%</div>
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${barHeight}px`, background: d.late_rate > 15 ? '#f87171' : d.late_rate > 8 ? '#fbbf24' : '#4ade80' }}
                  />
                  <div className="text-[10px] text-ink-subtle">{d.day.slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top late employees */}
      {data.top_late_employees?.length > 0 && (
        <div>
          <div className="text-[11px] text-ink-subtle mb-2 uppercase tracking-wider">Top Late Arrivals</div>
          <div className="space-y-1.5">
            {data.top_late_employees.slice(0, 5).map((emp, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-[#010102]/40 rounded-md">
                <span className="text-caption text-ink">{emp.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#fbbf24]">{emp.late_count} times</span>
                  <span className="text-[10px] text-ink-tertiary">avg +{emp.avg_minutes_late}min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default function AnalyticsPage() {
  const { apiClient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState(null);
  const [lateArrivals, setLateArrivals] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [workStart, setWorkStart] = useState('09:00');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange.start) params.set('start_date', dateRange.start);
    if (dateRange.end) params.set('end_date', dateRange.end);
    const [h, m] = workStart.split(':').map(Number);
    params.set('work_start_hour', h || 9);
    params.set('work_start_minute', m || 0);

    try {
      const [deptRes, lateRes, heatRes] = await Promise.all([
        apiClient.get(`${API_BASE}/analytics/departments?${params}`),
        apiClient.get(`${API_BASE}/analytics/late-arrivals?${params}`),
        apiClient.get(`${API_BASE}/analytics/heatmap?${params}`),
      ]);
      setDepartments(deptRes.data);
      setLateArrivals(lateRes.data);
      setHeatmap(heatRes.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, dateRange, workStart]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.set('start_date', dateRange.start);
      if (dateRange.end) params.set('end_date', dateRange.end);
      const res = await apiClient.get(`${API_BASE}/analytics/report?${params}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rms_report_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report export error:', err);
    }
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.set('start_date', dateRange.start);
      if (dateRange.end) params.set('end_date', dateRange.end);
      const res = await apiClient.get(`${API_BASE}/analytics/export/pdf?${params}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `rms_analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-7xl mx-auto space-y-6 page-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline font-semibold text-ink flex items-center gap-2">
            <BarChart3 size={24} className="text-[#5E6AD2]" />
            Analytics & Reports
          </h1>
          <p className="mt-1 text-caption text-ink-subtle">Department-level insights, trends, and exportable reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="button-secondary flex items-center gap-1.5 text-caption h-8 px-3">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportReport} className="button-secondary flex items-center gap-1.5 text-caption h-8 px-3">
            <Download size={13} /> Export JSON
          </button>
          <button onClick={exportPDF} className="button-primary flex items-center gap-1.5 text-caption h-8 px-3">
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-linear p-4 bg-[#0F1011] border-[#23252A] flex flex-wrap items-end gap-4">
        <div>
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
            className="h-8 px-3 rounded-md bg-[#010102] border border-[#23252A] text-caption text-ink"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
            className="h-8 px-3 rounded-md bg-[#010102] border border-[#23252A] text-caption text-ink"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">Work Start</label>
          <input
            type="time"
            value={workStart}
            onChange={e => setWorkStart(e.target.value)}
            className="h-8 px-3 rounded-md bg-[#010102] border border-[#23252A] text-caption text-ink"
          />
        </div>
        <button onClick={fetchAll} className="button-secondary h-8 px-4 text-caption">Apply</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-ink-subtle" />
          <span className="ml-3 text-ink-subtle text-caption">Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Departments"
              value={departments?.total_departments || 0}
              icon={Building2}
              color="#60a5fa"
            />
            <StatCard
              label="Total Check-ins"
              value={lateArrivals?.total_checkins || 0}
              icon={Users}
              color="#4ade80"
            />
            <StatCard
              label="Late Arrivals"
              value={lateArrivals?.late_count || 0}
              sub={lateArrivals?.late_rate ? `${lateArrivals.late_rate}% of all` : undefined}
              icon={TrendingDown}
              color="#fbbf24"
            />
            <StatCard
              label="Peak Activity"
              value={heatmap?.peak_hour !== undefined ? `${heatmap.peak_hour}:00` : '-'}
              sub={heatmap?.peak_day}
              icon={Clock}
              color="#5E6AD2"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentTable data={departments} />
            <LateArrivalsPanel data={lateArrivals} />
          </div>

          {/* Heatmap (full width) */}
          <HeatmapGrid data={heatmap} />
        </>
      )}
    </motion.div>
  );
}
