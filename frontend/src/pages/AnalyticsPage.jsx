import React, { useState, useEffect, useCallback } from 'react';
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

const COLORS = ['#2563EB', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#38bdf8', '#fb7185'];

const STANDARD_DEPARTMENTS = [
  'Engineering',
  'AI Research',
  'Product Design',
  'Operations',
  'Quality Assurance',
  'General'
];

function StatCard({ label, value, sub, icon: Icon, color = '#2563EB' }) {
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
        <Calendar size={16} className="text-[#2563EB]" />
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

function DepartmentTable({ data, deptConfigs, onOpenManage }) {
  if (!data?.departments?.length && !data?.unassigned) return null;
  const all = [...(data.departments || []), ...(data.unassigned ? [data.unassigned] : [])];

  const configMap = (deptConfigs || []).reduce((acc, c) => {
    acc[c.name] = c;
    return acc;
  }, {});

  return (
    <div className="card-linear p-5 bg-[#0F1011] border-[#23252A]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body font-medium text-ink flex items-center gap-2">
          <Building2 size={16} className="text-[#60a5fa]" />
          Department Breakdown
        </h3>
        <button
          onClick={() => onOpenManage('schedules')}
          className="button-secondary text-caption h-7 px-2.5 flex items-center gap-1.5 border-[#23252A] hover:border-[#2563EB]/50"
        >
          <Settings size={12} className="text-[#60a5fa]" />
          Manage & Schedules
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-caption">
          <thead>
            <tr className="border-b border-[#23252A] text-ink-subtle">
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
                <tr key={i} className="border-b border-[#23252A]/50 hover:bg-[#23252A]/20">
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
                    <span className={dept.avg_attendance_rate >= 80 ? 'text-[#34d399]' : dept.avg_attendance_rate >= 50 ? 'text-[#fbbf24]' : 'text-[#f87171]'}>
                      {dept.avg_attendance_rate}%
                    </span>
                  </td>
                  <td className="text-right py-2.5 pl-3">
                    <button
                      onClick={() => onOpenManage('schedules', dept.name)}
                      className="text-[11px] text-[#60a5fa] hover:underline"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              );
            })}
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

function DepartmentManagementModal({ isOpen, onClose, initialTab = 'schedules', onSaveSuccess }) {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDept, setSavingDept] = useState(null);
  const [reassigningId, setReassigningId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        apiClient.get(`${API_BASE}/departments`),
        apiClient.get(`${API_BASE}/employees`)
      ]);
      setDepartments(deptRes.data?.departments || []);
      setEmployees(empRes.data?.employees || []);
    } catch (err) {
      console.error('Failed to load department management data:', err);
      toast.error('Failed to load department settings.');
    } finally {
      setLoading(false);
    }
  }, [apiClient, toast]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchData();
    }
  }, [isOpen, initialTab, fetchData]);

  const handleUpdateSchedule = async (deptName, work_start, work_end, grace_period_mins) => {
    setSavingDept(deptName);
    try {
      await apiClient.put(`${API_BASE}/departments/${encodeURIComponent(deptName)}`, {
        work_start,
        work_end,
        grace_period_mins: parseInt(grace_period_mins, 10) || 0
      });
      toast.success(`Schedule saved for ${deptName}.`);
      setDepartments(prev =>
        prev.map(d => d.name === deptName ? { ...d, work_start, work_end, grace_period_mins: parseInt(grace_period_mins, 10) } : d)
      );
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to update schedule for ${deptName}.`);
    } finally {
      setSavingDept(null);
    }
  };

  const handleReassignEmployee = async (empId, empName, newDept) => {
    setReassigningId(empId);
    try {
      await apiClient.put(`${API_BASE}/employees/${empId}`, {
        department: newDept
      });
      toast.success(`Reassigned ${empName} to ${newDept}.`);
      setEmployees(prev =>
        prev.map(e => e.id === empId ? { ...e, department: newDept } : e)
      );
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to reassign ${empName}.`);
    } finally {
      setReassigningId(null);
    }
  };

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-[#0F1011] border border-[#23252A] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-[#23252A] flex items-center justify-between bg-[#141517]">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h2 className="text-base font-semibold text-ink">Department Management & Rostering</h2>
              <p className="text-xs text-ink-subtle">Configure department working hours, grace periods, and staff assignments.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-[#23252A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#23252A] px-6 bg-[#0F1011]">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'schedules'
                ? 'border-[#2563EB] text-[#60a5fa]'
                : 'border-transparent text-ink-subtle hover:text-ink'
            }`}
          >
            <Clock size={14} />
            Department Schedules & Grace Periods
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-[#2563EB] text-[#60a5fa]'
                : 'border-transparent text-ink-subtle hover:text-ink'
            }`}
          >
            <Users size={14} />
            Staff Department Rostering ({employees.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-ink-subtle">Loading department configuration...</p>
            </div>
          ) : activeTab === 'schedules' ? (
            /* TAB 1: Department Schedules */
            <div className="space-y-4">
              <div className="p-3 bg-[#16181D] border border-[#23252A] rounded-lg text-xs text-ink-subtle flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#34d399] shrink-0" />
                <span>
                  The Kiosk mode uses these department schedules to calculate real-time on-time vs. late arrival statuses.
                  Grace period is added to the start time before flagging an employee as late.
                </span>
              </div>

              <div className="space-y-3">
                {departments.map((dept) => (
                  <DepartmentScheduleRow
                    key={dept.name}
                    dept={dept}
                    onSave={(start, end, grace) => handleUpdateSchedule(dept.name, start, end, grace)}
                    isSaving={savingDept === dept.name}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* TAB 2: Staff Rostering */
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141517] p-3 rounded-lg border border-[#23252A]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={14} className="absolute left-3 top-2.5 text-ink-tertiary" />
                  <input
                    type="text"
                    placeholder="Search employee by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-[#010102] border border-[#23252A] text-ink focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-ink-tertiary" />
                  <span className="text-xs text-ink-subtle">Dept:</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="h-8 px-2.5 text-xs rounded-md bg-[#010102] border border-[#23252A] text-ink focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="all">All Departments ({employees.length})</option>
                    {STANDARD_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employees Table */}
              <div className="border border-[#23252A] rounded-lg overflow-hidden bg-[#0A0B0D]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#23252A] bg-[#141517] text-ink-subtle">
                      <th className="text-left py-2.5 px-4 font-medium">Employee Name</th>
                      <th className="text-left py-2.5 px-3 font-medium">Current Department</th>
                      <th className="text-left py-2.5 px-3 font-medium">Reassign Department</th>
                      <th className="text-right py-2.5 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23252A]/50">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-ink-tertiary">
                          No employees found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-[#16181D]/50 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-ink">{emp.name}</div>
                            {emp.employee_code && (
                              <div className="text-[10px] text-ink-tertiary font-mono">{emp.employee_code}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-[#23252A] text-ink border border-[#2e3138]">
                              {emp.department || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={emp.department || 'General'}
                              disabled={reassigningId === emp.id}
                              onChange={(e) => handleReassignEmployee(emp.id, emp.name, e.target.value)}
                              className="h-7 px-2 text-xs rounded bg-[#101012] border border-[#23252A] text-ink focus:border-[#2563EB] focus:outline-none"
                            >
                              {STANDARD_DEPARTMENTS.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                            }`}>
                              {emp.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[#23252A] bg-[#141517] flex justify-end">
          <button
            onClick={onClose}
            className="button-primary text-xs h-8 px-4"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DepartmentScheduleRow({ dept, onSave, isSaving }) {
  const [start, setStart] = useState(dept.work_start || '09:00');
  const [end, setEnd] = useState(dept.work_end || '17:00');
  const [grace, setGrace] = useState(dept.grace_period_mins !== undefined ? dept.grace_period_mins : 15);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    setStart(dept.work_start || '09:00');
    setEnd(dept.work_end || '17:00');
    setGrace(dept.grace_period_mins !== undefined ? dept.grace_period_mins : 15);
    setChanged(false);
  }, [dept]);

  const handleChange = (type, val) => {
    if (type === 'start') setStart(val);
    if (type === 'end') setEnd(val);
    if (type === 'grace') setGrace(val);
    setChanged(true);
  };

  return (
    <div className="p-3.5 bg-[#141517] border border-[#23252A] rounded-lg flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="font-semibold text-ink text-xs flex items-center gap-2">
          <span>{dept.name}</span>
          <span className="text-[10px] text-ink-tertiary">({dept.total_employees || 0} employees)</span>
        </div>
        <div className="text-[10px] text-ink-subtle mt-0.5">
          Today's Attendance: <span className="text-[#34d399]">{dept.checked_in_today || 0}</span> present
          {dept.late_today > 0 && <span className="text-[#fbbf24] ml-1">({dept.late_today} late)</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-ink-subtle">Work Start</label>
          <input
            type="time"
            value={start}
            onChange={(e) => handleChange('start', e.target.value)}
            className="h-7 px-2 text-xs rounded bg-[#0A0B0D] border border-[#23252A] text-ink focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-ink-subtle">Work End</label>
          <input
            type="time"
            value={end}
            onChange={(e) => handleChange('end', e.target.value)}
            className="h-7 px-2 text-xs rounded bg-[#0A0B0D] border border-[#23252A] text-ink focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-ink-subtle">Grace (min)</label>
          <input
            type="number"
            min="0"
            max="120"
            value={grace}
            onChange={(e) => handleChange('grace', e.target.value)}
            className="h-7 w-14 px-2 text-xs rounded bg-[#0A0B0D] border border-[#23252A] text-ink focus:border-[#2563EB] focus:outline-none text-center"
          />
        </div>

        <button
          onClick={() => {
            onSave(start, end, grace);
            setChanged(false);
          }}
          disabled={isSaving || !changed}
          className={`h-7 px-3 text-xs rounded flex items-center gap-1 font-medium transition-colors ${
            changed
              ? 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]'
              : 'bg-[#23252A] text-ink-tertiary cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Save
        </button>
      </div>
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
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [workStart, setWorkStart] = useState('09:00');
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageInitialTab, setManageInitialTab] = useState('schedules');

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

  const handleOpenManage = (tab = 'schedules') => {
    setManageInitialTab(tab);
    setIsManageOpen(true);
  };

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
      toast.success('JSON report exported.');
    } catch (err) {
      toast.error('Failed to export JSON report.');
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
      toast.success('PDF report downloaded.');
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
            <BarChart3 size={24} className="text-[#2563EB]" />
            Analytics & Reports
          </h1>
          <p className="mt-1 text-caption text-ink-subtle">Department-level insights, attendance trends, and schedule management.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenManage('schedules')}
            className="button-secondary flex items-center gap-1.5 text-caption h-8 px-3 border-[#23252A] hover:border-[#2563EB]/50"
          >
            <Settings size={13} className="text-[#60a5fa]" /> Manage Departments
          </button>
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
            className="h-8 px-3 rounded-md bg-[#010102] border border-[#23252A] text-caption text-ink focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none accent-[#2563EB]"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
            className="h-8 px-3 rounded-md bg-[#010102] border border-[#23252A] text-caption text-ink focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none accent-[#2563EB]"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-subtle uppercase tracking-wider block mb-1">Default Work Start</label>
          <input
            type="time"
            value={workStart}
            onChange={e => setWorkStart(e.target.value)}
            className="h-8 px-3 rounded-md bg-[#010102] border border-[#23252A] text-caption text-ink focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none accent-[#2563EB]"
          />
        </div>
        <button onClick={fetchAll} className="button-secondary h-8 px-4 text-caption">Apply</button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatCards count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-linear p-6 bg-[#0F1011] border-[#23252A] h-[200px] shimmer rounded-lg" />
            <div className="card-linear p-6 bg-[#0F1011] border-[#23252A] h-[200px] shimmer rounded-lg" />
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
              color="#60a5fa"
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
              color="#2563EB"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentTable
              data={departments}
              deptConfigs={deptConfigs}
              onOpenManage={handleOpenManage}
            />
            <LateArrivalsPanel data={lateArrivals} />
          </div>

          {/* Heatmap (full width) */}
          <HeatmapGrid data={heatmap} />
        </>
      )}

      {/* Department & Staff Management Modal */}
      <AnimatePresence>
        {isManageOpen && (
          <DepartmentManagementModal
            isOpen={isManageOpen}
            initialTab={manageInitialTab}
            onClose={() => setIsManageOpen(false)}
            onSaveSuccess={fetchAll}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
