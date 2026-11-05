import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../config';
import {
  Building2,
  Clock,
  Users,
  Save,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Sparkles,
  BarChart3,
  Edit2,
  Camera,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STANDARD_DEPARTMENTS = [
  'Engineering',
  'AI Research',
  'Product Design',
  'Operations',
  'Quality Assurance',
  'General',
];

export default function DepartmentsPage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven dynamic state
  const activeTab = searchParams.get('tab') || 'schedules';
  const searchQuery = searchParams.get('q') || '';
  const deptFilter = searchParams.get('dept') || 'all';

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDept, setSavingDept] = useState(null);
  const [reassigningId, setReassigningId] = useState(null);

  // Edit Employee Modal State
  const [editingEmp, setEditingEmp] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDept, setEditDept] = useState('General');
  const [editStatus, setEditStatus] = useState('active');
  const [isSavingEmp, setIsSavingEmp] = useState(false);

  // Update URL search params cleanly
  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '' || (key === 'dept' && val === 'all') || (key === 'tab' && val === 'schedules')) {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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
    fetchData();
  }, [fetchData]);

  const handleUpdateSchedule = async (deptName, work_start, work_end, grace_period_mins) => {
    setSavingDept(deptName);
    try {
      await apiClient.put(`${API_BASE}/departments/${encodeURIComponent(deptName)}`, {
        work_start,
        work_end,
        grace_period_mins: parseInt(grace_period_mins, 10) || 0,
      });
      toast.success(`Schedule saved for ${deptName}.`);
      setDepartments((prev) =>
        prev.map((d) =>
          d.name === deptName
            ? { ...d, work_start, work_end, grace_period_mins: parseInt(grace_period_mins, 10) }
            : d
        )
      );
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
        department: newDept,
      });
      toast.success(`Reassigned ${empName} to ${newDept}.`);
      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? { ...e, department: newDept } : e))
      );
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to reassign ${empName}.`);
    } finally {
      setReassigningId(null);
    }
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    setEditName(emp.name || '');
    setEditCode(emp.employee_code || '');
    setEditDept(emp.department || 'General');
    setEditStatus(emp.status || 'active');
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    if (!editName.trim()) {
      toast.error('Employee name cannot be empty.');
      return;
    }
    setIsSavingEmp(true);
    try {
      const res = await apiClient.put(`${API_BASE}/employees/${editingEmp.id}`, {
        name: editName.trim(),
        employee_code: editCode.trim() || null,
        department: editDept,
        status: editStatus,
      });
      toast.success(res.data?.message || 'Employee updated successfully.');
      setEditingEmp(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update employee details.');
    } finally {
      setIsSavingEmp(false);
    }
  };

  // Filtered employees for Staff Rostering
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchQuery ||
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employee_code && emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, deptFilter]);

  // Summary stats
  const totalEmployeesCount = employees.length;
  const configuredDeptsCount = departments.filter((d) => d.work_start && d.work_end).length;
  const graceVals = departments.map((d) => (typeof d.grace_period_mins === 'number' ? d.grace_period_mins : 15));
  const avgGrace = graceVals.length > 0 ? Math.round(graceVals.reduce((a, b) => a + b, 0) / graceVals.length) : 15;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
            {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-ink-subtle mb-1">
            <Link to="/dashboard" className="hover:text-ink transition-colors">Console</Link>
            <span className="text-ink-tertiary">/</span>
            <span className="text-ink font-medium">Departments</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-ink flex items-center gap-2">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            <span>Department Management & Rostering</span>
          </h1>
          <p className="mt-0.5 text-xs text-ink-subtle hidden sm:block">
            Configure department working hours, grace periods, and employee assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="button-secondary flex items-center gap-1.5 text-xs h-8 px-2.5"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link
            to="/analytics"
            className="button-secondary flex items-center gap-1.5 text-xs h-8 px-2.5"
          >
            <BarChart3 size={12} className="text-emerald-400" />
            <span className="hidden sm:inline">View Attendance </span><span>Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards - High Density on Mobile (ISO 9241-110) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-linear p-2.5 sm:p-3.5 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium truncate">Total Depts</div>
            <div className="stat-number text-base sm:text-xl text-ink mt-0.5">{departments.length}</div>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        <div className="card-linear p-2.5 sm:p-3.5 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium truncate">Active Staff</div>
            <div className="stat-number text-base sm:text-xl text-ink mt-0.5">{totalEmployeesCount}</div>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        <div className="card-linear p-2.5 sm:p-3.5 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium">
              <span className="sm:hidden">Shifts</span>
              <span className="hidden sm:inline">Configured Shifts</span>
            </div>
            <div className="stat-number text-base sm:text-xl text-ink mt-0.5">{configuredDeptsCount} / {departments.length}</div>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        <div className="card-linear p-2.5 sm:p-3.5 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-ink-subtle uppercase tracking-wider font-medium">
              <span className="sm:hidden">Grace</span>
              <span className="hidden sm:inline">Avg Grace Buffer</span>
            </div>
            <div className="text-base sm:text-xl font-bold font-mono text-emerald-400 mt-0.5 flex items-baseline gap-1.5">
              <span>{avgGrace}</span>
              <span className="text-[11px] sm:text-xs font-sans font-medium text-slate-500 dark:text-ink-subtle">min buffer</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Harmonized Liquid Glass Segmented Nav */}
      <div className="segmented-nav w-full">
        <button
          onClick={() => updateParams({ tab: 'schedules' })}
          className={`segment-item ${activeTab === 'schedules' ? 'active' : ''}`}
        >
          <Clock size={14} className="shrink-0" />
          <span className="sm:hidden">Schedules</span>
          <span className="hidden sm:inline">Department Schedules & Grace Periods</span>
        </button>
        <button
          onClick={() => updateParams({ tab: 'roster' })}
          className={`segment-item ${activeTab === 'roster' ? 'active' : ''}`}
        >
          <Users size={14} className="shrink-0" />
          <span className="sm:hidden">Roster ({totalEmployeesCount})</span>
          <span className="hidden sm:inline">Staff Department Rostering ({totalEmployeesCount})</span>
        </button>
      </div>

      {/* Tab 1: Department Schedules */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {/* Subheader Toolbar: Synchronized height and padding to eliminate layout shift */}
          <div className="card-linear px-4 py-3 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex flex-wrap items-center justify-between gap-3 min-h-[50px] shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-ink-subtle">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span><strong>Shift Policy:</strong> Grace period minutes are added to start time before tardiness is flagged. Individual departments can customize below.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {configuredDeptsCount}/{departments.length} Shifts Configured
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {departments.length === 0 && !loading && (
              <div className="card-linear p-8 text-center text-ink-subtle">
                No department records found.
              </div>
            )}

            {departments.map((dept) => (
              <DepartmentScheduleCard
                key={dept.name}
                dept={dept}
                onSave={handleUpdateSchedule}
                isSaving={savingDept === dept.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Staff Department Rostering */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Subheader Toolbar: Synchronized height and padding to eliminate layout shift */}
          <div className="card-linear px-4 py-3 bg-card border-border shadow-sm rounded-xl flex flex-wrap items-center justify-between gap-3 min-h-[50px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-ink-tertiary" />
              <input
                type="text"
                placeholder="Search staff by name or code..."
                value={searchQuery}
                onChange={(e) => updateParams({ q: e.target.value })}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-[#010102] border border-[#23252A] text-ink focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={13} className="text-ink-tertiary" />
              <span className="text-xs text-ink-subtle">Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => updateParams({ dept: e.target.value })}
                className="h-8 px-2.5 text-xs rounded-md bg-[#010102] border border-[#23252A] text-ink focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Departments ({employees.length})</option>
                {STANDARD_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Table */}
          <div className="border border-[#23252A] rounded-xl overflow-hidden bg-[#0A0B0D]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#23252A] bg-[#141517] text-ink-subtle">
                  <th className="text-left py-3 px-4 font-medium">Employee Name</th>
                  <th className="text-left py-3 px-3 font-medium">Current Department</th>
                  <th className="text-left py-3 px-3 font-medium">Reassign Department</th>
                  <th className="text-center py-3 px-3 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252A]/50">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-ink-tertiary">
                      No employees match your search or department filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#16181D]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink">{emp.name}</div>
                        {emp.employee_code && (
                          <div className="text-[10px] text-ink-tertiary font-mono">{emp.employee_code}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded text-[11px] bg-[#23252A] text-ink border border-[#2e3138]">
                          {emp.department || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={emp.department || 'General'}
                          disabled={reassigningId === emp.id}
                          onChange={(e) => handleReassignEmployee(emp.id, emp.name, e.target.value)}
                          className="h-7 px-2 text-xs rounded bg-[#101012] border border-[#23252A] text-ink focus:border-emerald-500 focus:outline-none"
                        >
                          {STANDARD_DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          emp.status === 'active' || !emp.status
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {emp.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="button-secondary h-7 px-2.5 text-[11px] flex items-center gap-1 hover:border-emerald-500/50 hover:text-emerald-400"
                            title="Edit Employee Information"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <Link
                            to={`/persons/edit/${encodeURIComponent(emp.name)}`}
                            className="button-secondary h-7 px-2.5 text-[11px] flex items-center gap-1 hover:border-emerald-500/50 hover:text-emerald-400"
                            title="Manage Biometric Photos"
                          >
                            <Camera size={12} className="text-emerald-400" />
                            <span>Photos</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      <AnimatePresence>
        {editingEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F1011]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#23252A]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Edit Employee Details</h3>
                    <p className="text-[11px] text-ink-subtle">Update name, badge ID, department, or status</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingEmp(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-[#1C1D21] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-ink-subtle block mb-1.5 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-[#090A0C] border border-[#23252A] rounded-lg text-ink focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="text-xs text-ink-subtle block mb-1.5 font-medium">Employee / Badge ID</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-[#090A0C] border border-[#23252A] rounded-lg text-ink font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="e.g. EMP-1042"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-ink-subtle block mb-1.5 font-medium">Department</label>
                    <select
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-[#090A0C] border border-[#23252A] rounded-lg text-ink focus:border-emerald-500 focus:outline-none transition-colors"
                    >
                      {STANDARD_DEPARTMENTS.map((d) => (
                        <option key={d} value={d} className="bg-[#141516] text-white">{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-ink-subtle block mb-1.5 font-medium">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-[#090A0C] border border-[#23252A] rounded-lg text-ink focus:border-emerald-500 focus:outline-none transition-colors"
                    >
                      <option value="active" className="bg-[#141516] text-white">Active</option>
                      <option value="inactive" className="bg-[#141516] text-white">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#23252A] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Link
                    to={`/persons/edit/${encodeURIComponent(editingEmp.name)}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition-colors py-1"
                  >
                    <span>Manage Biometrics & Photos</span>
                    <ArrowRight size={13} />
                  </Link>

                  <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setEditingEmp(null)}
                      className="button-secondary flex-1 sm:flex-none h-9 px-4 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEmp}
                      className="button-primary flex-1 sm:flex-none h-9 px-5 text-xs font-medium whitespace-nowrap"
                    >
                      {isSavingEmp ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DepartmentScheduleCard({ dept, onSave, isSaving }) {
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
    <div className="p-4 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-[#30333C] transition-colors shadow-sm">
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 dark:text-ink text-sm flex items-center gap-2">
          <span>{dept.name}</span>
          <span className="text-[11px] text-slate-500 dark:text-ink-tertiary font-mono">({dept.total_employees || 0} employees)</span>
        </div>
        <div className="text-caption text-slate-500 dark:text-ink-subtle mt-0.5">
          Today's Attendance: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{dept.present_today || 0} present</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 text-xs w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-ink-subtle w-9 sm:w-auto shrink-0">Start</span>
          <input
            type="time"
            value={start}
            onChange={(e) => handleChange('start', e.target.value)}
            className="h-10 px-3.5 py-2 w-36 rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-300 dark:border-[#2B2F38] text-slate-900 dark:text-zinc-100 font-mono text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-ink-subtle w-9 sm:w-auto shrink-0">End</span>
          <input
            type="time"
            value={end}
            onChange={(e) => handleChange('end', e.target.value)}
            className="h-10 px-3.5 py-2 w-36 rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-300 dark:border-[#2B2F38] text-slate-900 dark:text-zinc-100 font-mono text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-ink-subtle w-9 sm:w-auto shrink-0">Grace</span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="number"
              min="0"
              max="120"
              value={grace}
              onChange={(e) => handleChange('grace', e.target.value)}
              className="h-10 w-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-300 dark:border-[#2B2F38] text-slate-900 dark:text-zinc-100 font-mono text-xs text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
            />
            <span className="text-xs text-slate-500 dark:text-ink-tertiary font-mono">min</span>
          </div>
        </div>

        <button
          onClick={() => onSave(dept.name, start, end, grace)}
          disabled={isSaving}
          className={`h-10 min-w-[96px] px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1 shrink-0 font-medium ${
            changed
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 font-bold shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
              : 'bg-slate-100 dark:bg-[#181A1F] border border-slate-200 dark:border-[#2B2F38] text-slate-600 dark:text-ink-subtle hover:text-slate-900 dark:hover:text-ink hover:border-slate-300 dark:hover:border-[#3E434F]'
          }`}
        >
          {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
