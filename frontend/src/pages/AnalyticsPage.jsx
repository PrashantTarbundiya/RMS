import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

import {

  BarChart3,

  Clock,

  Users,

  TrendingDown,

  Calendar,

  Download,

  RefreshCw,

  Building2,

  Settings,

  Search,

  Check,

  X,

  UserCheck,

  ArrowRight,

  ShieldCheck,

  Save,

  Filter

} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';

import { SkeletonStatCards } from '../components/ui/Skeleton';
import ExportModal from '../components/ui/ExportModal';



const COLORS = ['#10B981', '#34D399', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#38bdf8', '#fb7185'];



const STANDARD_DEPARTMENTS = [

  'Engineering',

  'AI Research',

  'Product Design',

  'Operations',

  'Quality Assurance',

  'General'

];



function StatCard({ label, value, sub, icon: Icon, color = '#10B981' }) {

  return (

    <div className="card-linear p-4 flex items-center gap-4 bg-[#111111] border-[#262626]">

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

    <div className="card-linear p-5 bg-[#111111] border-[#262626]">

      <h3 className="text-body font-medium text-ink mb-4 flex items-center gap-2">

        <Calendar size={16} className="text-emerald-400" />

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

                          : `rgba(37, 99, 235, ${0.15 + intensity * 0.85})`,

                      }}

                      title={`${days[dayIdx]} ${hourIdx}:00 - ${val} check-ins`}

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

          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(37, 99, 235, ${opacity})` }} />

        ))}

        <span>More</span>

        {data.peak_hour !== undefined && (

          <span className="ml-4">Peak: {days[data.heatmap.findIndex((_, i) => data.days[i] === data.peak_day)]?.slice(0, 3) || data.peak_day} {data.peak_hour}:00 ({data.peak_count} entries)</span>

        )}

      </div>

    </div>

  );

}



function DepartmentTable({ data, deptConfigs }) {

  const hasRows = (data?.departments?.length > 0) || Boolean(data?.unassigned);

  const all = [...(data?.departments || []), ...(data?.unassigned ? [data.unassigned] : [])];



  const configMap = (deptConfigs || []).reduce((acc, c) => {

    acc[c.name] = c;

    return acc;

  }, {});



  return (

    <div className="card-linear p-5 bg-[#111111] border-[#262626]">

      <div className="flex items-center justify-between mb-4">

        <h3 className="text-body font-medium text-ink flex items-center gap-2">

          <Building2 size={16} className="text-emerald-400" />

          Department Breakdown

        </h3>

        <Link

          to="/departments?tab=schedules"

          className="button-secondary text-caption h-7 px-2.5 flex items-center gap-1.5 border-[#262626] hover:border-emerald-500/50"

        >

          <Settings size={12} className="text-emerald-400" />

          Manage Schedules

        </Link>

      </div>



      {!hasRows ? (

        <div className="py-8 text-center text-ink-subtle text-caption border border-dashed border-[#262626] rounded-lg">

          No department attendance activity recorded yet.

        </div>

      ) : (

      <div className="overflow-x-auto">

        <table className="w-full text-caption">

          <thead>

            <tr className="border-b border-[#262626] text-ink-subtle">

              <th className="text-left py-2 pr-3 font-medium">Department</th>

              <th className="text-left py-2 px-3 font-medium">Shift Schedule</th>

              <th className="text-right py-2 px-3 font-medium">Employees</th>

              <th className="text-right py-2 px-3 font-medium">Check-ins</th>

              <th className="text-right py-2 px-3 font-medium">Attendance %</th>

              <th className="text-right py-2 pl-3 font-medium">Action</th>

            </tr>

          </thead>

          <tbody>

            {all.map((dept, i) => {

              const cfg = configMap[dept.name] || {};

              const workStart = cfg.work_start || '09:00';

              const workEnd = cfg.work_end || '17:00';

              const grace = cfg.grace_period_mins !== undefined ? cfg.grace_period_mins : 15;



              return (

                <tr key={i} className="border-b border-[#262626]/50 hover:bg-[#171717]">

                  <td className="py-2.5 pr-3">

                    <div className="flex items-center gap-2">

                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />

                      <span className="text-ink font-medium">{dept.name}</span>

                    </div>

                  </td>

                  <td className="py-2.5 px-3 text-ink-subtle">

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">

                      <span>{workStart} - {workEnd}</span>

                      <span className="text-[10px] text-ink-tertiary">({grace}m grace)</span>

                    </div>

                  </td>

                  <td className="text-right py-2.5 px-3 text-ink-subtle">{dept.total_employees}</td>

                  <td className="text-right py-2.5 px-3 text-ink-subtle">{dept.total_checkins}</td>

                  <td className="text-right py-2.5 px-3">

                    <span className={dept.avg_attendance_rate >= 80 ? 'text-emerald-500 dark:text-emerald-400 font-semibold' : dept.avg_attendance_rate >= 50 ? 'text-amber-500 dark:text-amber-400 font-semibold' : 'text-red-500 dark:text-red-400 font-semibold'}>

                      {Math.min(100, Math.max(0, dept.avg_attendance_rate || 0))}%

                    </span>

                  </td>

                  <td className="text-right py-2.5 pl-3">

                    <Link

                      to="/departments?tab=schedules"

                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline"

                    >

                      Shift & Hours →

                    </Link>

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

      )}

    </div>

  );

}



function LateArrivalsPanel({ data }) {

  if (!data || data.error) return null;



  const hasDayData = data.by_day_of_week && data.by_day_of_week.length > 0;

  const hasLateEmps = data.top_late_employees && data.top_late_employees.length > 0;



  return (

    <div className="card-linear p-5 bg-[#111111] border-[#262626]">

      <h3 className="text-body font-medium text-ink mb-4 flex items-center gap-2">

        <Clock size={16} className="text-[#fbbf24]" />

        Late Arrival Analysis

        <span className="text-[10px] text-ink-tertiary ml-2">(Start: {data.work_start || '09:00'})</span>

      </h3>



      {(!hasLateEmps && (!data.late_count || data.late_count === 0)) ? (

        <div className="py-8 px-4 text-center border border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-2">

          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">

            <ShieldCheck size={16} />

          </div>

          <div className="text-xs font-semibold text-white">100% On-Time Punctuality</div>

          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">

            All personnel arrived on schedule within authorized department grace periods.

          </p>

        </div>

      ) : (

        <>

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

                    style={{ height: `${barHeight}px`, background: d.late_rate > 15 ? '#f87171' : d.late_rate > 8 ? '#fbbf24' : '#34d399' }}

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

              <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-[#171717] rounded-md">

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

      </>

      )}

    </div>

  );

}



export default function AnalyticsPage() {

  const { apiClient } = useAuth();

  const toast = useToast();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [departments, setDepartments] = useState(null);

  const [deptConfigs, setDeptConfigs] = useState([]);

  const [lateArrivals, setLateArrivals] = useState(null);

  const [heatmap, setHeatmap] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [dateRange, setDateRange] = useState({
    start: searchParams.get('start') || '',
    end: searchParams.get('end') || '',
  });

  const [workStart, setWorkStart] = useState(searchParams.get('work_start') || '09:00');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const updateFilters = (newStart, newEnd, newWorkStart) => {
    if (newStart && newEnd && newStart > newEnd) {
      toast.warning('Start date cannot be after end date.');
    }
    setDateRange({ start: newStart, end: newEnd });
    setWorkStart(newWorkStart);
    const p = new URLSearchParams(searchParams);
    if (newStart) p.set('start', newStart); else p.delete('start');
    if (newEnd) p.set('end', newEnd); else p.delete('end');
    if (newWorkStart && newWorkStart !== '09:00') p.set('work_start', newWorkStart); else p.delete('work_start');
    setSearchParams(p, { replace: true });
  };





  const fetchAll = useCallback(async () => {

    setLoading(true);

    const params = new URLSearchParams();

    if (dateRange.start) params.set('start_date', dateRange.start);

    if (dateRange.end) params.set('end_date', dateRange.end);

    const [h, m] = workStart.split(':').map(Number);

    params.set('work_start_hour', h || 9);

    params.set('work_start_minute', m || 0);



    try {

      const [deptRes, lateRes, heatRes, cfgRes] = await Promise.all([

        apiClient.get(`${API_BASE}/analytics/departments?${params}`),

        apiClient.get(`${API_BASE}/analytics/late-arrivals?${params}`),

        apiClient.get(`${API_BASE}/analytics/heatmap?${params}`),

        apiClient.get(`${API_BASE}/departments`).catch(() => ({ data: { departments: [] } })),

      ]);

      setDepartments(deptRes.data);

      setLateArrivals(lateRes.data);

      setHeatmap(heatRes.data);

      setDeptConfigs(cfgRes.data?.departments || []);

      setError(null);

    } catch (err) {

      console.error('Analytics fetch error:', err);

      setError('Failed to load analytics data.');

    } finally {

      setLoading(false);

    }

  }, [apiClient, dateRange, workStart]);



  useEffect(() => { fetchAll(); }, [fetchAll]);







  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      params.set('format', 'json');
      if (dateRange.start) params.set('start_date', dateRange.start);
      if (dateRange.end) params.set('end_date', dateRange.end);
      const [h, m] = workStart.split(':').map(Number);
      params.set('work_start_hour', h || 9);
      params.set('work_start_minute', m || 0);

      const res = await apiClient.get(`${API_BASE}/reports/analytics/export?${params}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurapass_analytics_report_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Canonical JSON report exported.');
    } catch (err) {
      toast.error('Failed to export JSON report.');
    }
  };

  const exportPDF = async (period = null) => {
    try {
      const params = new URLSearchParams();
      params.set('format', 'pdf');
      if (period) {
        params.set('period', period);
      } else {
        if (dateRange.start) params.set('start_date', dateRange.start);
        if (dateRange.end) params.set('end_date', dateRange.end);
      }
      const [h, m] = workStart.split(':').map(Number);
      params.set('work_start_hour', h || 9);
      params.set('work_start_minute', m || 0);

      const res = await apiClient.get(`${API_BASE}/reports/analytics/export?${params}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurapass_analytics_report_${period || 'custom'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Executive PDF report downloaded.');
    } catch (err) {
      toast.error('Failed to export PDF report.');
    }
  };



  return (

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-7xl mx-auto space-y-6 page-container">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-headline font-semibold text-ink flex items-center gap-2">

            <BarChart3 size={24} className="text-emerald-400" />

            Analytics & Reports

          </h1>

          <p className="mt-1 text-caption text-ink-subtle">Department-level insights, attendance trends, and schedule management.</p>

        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link to="/departments?tab=schedules" className="button-secondary flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-caption h-8 px-3 border-[#262626] hover:border-emerald-500/50">
            <Building2 size={13} className="text-emerald-400" /> Departments
          </Link>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="button-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 text-caption h-8 px-3.5 shadow-sm font-medium"
            title="Open Unified Export & Reporting Dialog"
          >
            <Download size={13} className="text-white" /> Export Reports
          </button>

          <div className="flex items-center gap-1">
            <button onClick={() => exportPDF('daily')} className="button-secondary flex items-center justify-center gap-1 text-[11px] h-8 px-2" title="Download Today's Daily Attendance Report">
              <Download size={11} /> Daily
            </button>
            <button onClick={() => exportPDF('monthly')} className="button-secondary flex items-center justify-center gap-1 text-[11px] h-8 px-2" title="Download Current Month Summary Report">
              <Download size={11} /> Monthly
            </button>
            <button onClick={exportReport} className="button-secondary flex items-center justify-center gap-1 text-[11px] h-8 px-2" title="Download Canonical JSON Report">
              <Download size={11} /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-linear p-3.5 sm:p-4 bg-[#111111] border-[#262626] grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">Start Date</label>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={dateRange.start}
            onChange={e => {
              const today = new Date().toISOString().split('T')[0];
              const val = e.target.value > today ? today : e.target.value;
              updateFilters(val, dateRange.end, workStart);
            }}
            className="h-8 px-3 rounded-md bg-[#171717] border border-[#262626] text-caption text-ink focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none accent-emerald-500 w-full"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">End Date</label>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={dateRange.end}
            onChange={e => {
              const today = new Date().toISOString().split('T')[0];
              const val = e.target.value > today ? today : e.target.value;
              updateFilters(dateRange.start, val, workStart);
            }}
            className="h-8 px-3 rounded-md bg-[#171717] border border-[#262626] text-caption text-ink focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none accent-emerald-500 w-full"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">Default Work Start</label>
          <input
            type="time"
            value={workStart}
            onChange={e => updateFilters(dateRange.start, dateRange.end, e.target.value)}
            className="h-8 px-3 rounded-md bg-[#171717] border border-[#262626] text-caption text-ink focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none accent-emerald-500 w-full"
          />
        </div>

        <button onClick={fetchAll} className="button-secondary h-8 px-4 text-caption w-full sm:w-auto">Apply</button>
      </div>



      {loading ? (

        <div className="space-y-6">

          <SkeletonStatCards count={4} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="card-linear p-6 bg-[#111111] border-[#262626] h-[200px] shimmer rounded-lg" />

            <div className="card-linear p-6 bg-[#111111] border-[#262626] h-[200px] shimmer rounded-lg" />

          </div>

        </div>

      ) : error ? (

        <div className="card-linear p-8 text-center border-[#F87171]/20 bg-[#F87171]/5">

          <p className="text-[#F87171] text-sm mb-3">{error}</p>

          <button onClick={() => { setLoading(true); fetchAll(); }} className="button-secondary text-caption">Retry</button>

        </div>

      ) : (

        <>

          {/* Overview Cards */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <StatCard

              label="Departments"

              value={departments?.total_departments || 0}

              icon={Building2}

              color="#10B981"

            />

            <StatCard

              label="Total Check-ins"

              value={lateArrivals?.total_checkins || 0}

              icon={Users}

              color="#34d399"

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

              color="#10B981"

            />

          </div>



          {/* Main Grid */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

            <div className="min-w-0 w-full">

              <DepartmentTable

                data={departments}

                deptConfigs={deptConfigs}

                

              />

            </div>

            <div className="min-w-0 w-full">

              <LateArrivalsPanel data={lateArrivals} />

            </div>

          </div>



          {/* Heatmap (full width) */}
          <HeatmapGrid data={heatmap} />
        </>
      )}

      {/* Unified Enterprise Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        category="analytics"
        title="Export Analytics & Executive Reports"
        appliedFilters={{
          startDate: dateRange.start,
          endDate: dateRange.end,
          workStart: {
            hour: parseInt((workStart || '09:00').split(':')[0] || '9', 10),
            minute: parseInt((workStart || '09:00').split(':')[1] || '0', 10)
          }
        }}
        departments={deptConfigs}
      />
    </motion.div>

  );

}

