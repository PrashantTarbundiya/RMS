with open('frontend/src/pages/DepartmentsPage.jsx', 'r', encoding='utf-8') as f:
    txt = f.read()

# 1. Update stat cards background and borders
txt = txt.replace(
    'card-linear p-2.5 sm:p-3.5 bg-[#0F1011] border-[#23252A] rounded-xl flex items-center justify-between gap-2',
    'card-linear p-2.5 sm:p-3.5 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex items-center justify-between gap-2 shadow-sm'
)

# 2. Update Grace Buffer stat label
txt = txt.replace(
    '<span className="text-[11px] sm:text-xs font-sans font-medium text-ink-subtle">min grace</span>',
    '<span className="text-[11px] sm:text-xs font-sans font-medium text-slate-500 dark:text-ink-subtle">min buffer</span>'
)

# 3. Update Shift Policy Banner
old_banner = '''          <div className="card-linear px-4 py-3 bg-[#0F1011] border-[#23252A] rounded-xl flex flex-wrap items-center justify-between gap-3 min-h-[50px]">
            <div className="flex items-center gap-2 text-xs text-ink-subtle">
              <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
              <span>Shift policy: Grace period minutes are added to start time before tardiness is flagged.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {configuredDeptsCount}/{departments.length} Shifts Configured
              </span>
            </div>
          </div>'''

new_banner = '''          <div className="card-linear px-4 py-3 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl flex flex-wrap items-center justify-between gap-3 min-h-[50px] shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-ink-subtle">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span><strong>Shift Policy:</strong> Grace period minutes are added to start time before tardiness is flagged. Individual departments can customize below.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {configuredDeptsCount}/{departments.length} Shifts Configured
              </span>
            </div>
          </div>'''

txt = txt.replace(old_banner, new_banner)

# 4. Update DepartmentScheduleCard inputs and styling
old_card = '''  return (
    <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#30333C] transition-colors">
      <div className="min-w-0">
        <div className="font-semibold text-ink text-sm flex items-center gap-2">
          <span>{dept.name}</span>
          <span className="text-[11px] text-ink-tertiary font-mono">({dept.total_employees || 0} employees)</span>
        </div>
        <div className="text-caption text-ink-subtle mt-0.5">
          Today's Attendance: <span className="font-mono text-emerald-400 font-semibold">{dept.present_today || 0} present</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 text-xs w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-subtle w-9 sm:w-auto shrink-0">Start</span>
          <input
            type="time"
            value={start}
            onChange={(e) => handleChange('start', e.target.value)}
            className="h-9.5 px-3.5 py-1.5 w-32 rounded-lg bg-[#141518] border border-[#2B2F38] text-ink font-mono text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-subtle w-9 sm:w-auto shrink-0">End</span>
          <input
            type="time"
            value={end}
            onChange={(e) => handleChange('end', e.target.value)}
            className="h-9.5 px-3.5 py-1.5 w-32 rounded-lg bg-[#141518] border border-[#2B2F38] text-ink font-mono text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-subtle w-9 sm:w-auto shrink-0">Grace</span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="number"
              min="0"
              max="120"
              value={grace}
              onChange={(e) => handleChange('grace', e.target.value)}
              className="h-9.5 w-18 px-3 py-1.5 rounded-lg bg-[#141518] border border-[#2B2F38] text-ink font-mono text-xs text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
            />
            <span className="text-xs text-ink-tertiary font-mono">min</span>
          </div>
        </div>

        <button
          onClick={() => onSave(dept.name, start, end, grace)}
          disabled={isSaving}
          className={`h-9.5 min-w-[92px] px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1 shrink-0 font-medium ${
            changed
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-sm shadow-emerald-500/25 ring-1 ring-emerald-400/40'
              : 'bg-[#181A1F] border border-[#2B2F38] text-ink-subtle hover:text-ink hover:border-[#3E434F]'
          }`}
        >
          {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          <span>Save</span>
        </button>
      </div>
    </div>
  );'''

new_card = '''  return (
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
  );'''

txt = txt.replace(old_card, new_card)

with open('frontend/src/pages/DepartmentsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(txt)

print("DepartmentsPage.jsx updated successfully!")

