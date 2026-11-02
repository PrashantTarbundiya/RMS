const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('e:/RMS/frontend/src/pages/AuditLogsPage.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update Page Header to be flex-col sm:flex-row
content = content.replace(
  '<div className="page-header">',
  '<div className="page-header flex-col sm:flex-row items-start sm:items-center gap-3">'
);

// 2. Responsive Filters Bar
const oldFiltersBar = `      {/* Filters Bar */}
      <div className="card-linear p-3 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#010102] border border-[#23252A] rounded-lg h-9 px-3 flex-1 min-w-[220px] focus-within:border-[#60A5FA]/50 transition-colors">
          <Search size={14} className="text-ink-tertiary shrink-0" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-transparent border-none text-ink text-caption w-full focus:outline-none p-0 placeholder:text-ink-tertiary"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-0.5 bg-[#0F1011] rounded-lg p-0.5">
          {filterTabs.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setLogType(opt.value); setPage(1); }}
              className={\`px-3 py-1.5 rounded-md text-caption font-medium transition-all cursor-pointer \${
                logType === opt.value 
                  ? 'bg-[#2563EB] text-white' 
                  : 'text-ink-subtle hover:text-ink'
              }\`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-ink-tertiary" />
          <input 
            type="date" 
            value={dateStart} 
            onChange={e => { setDateStart(e.target.value); setPage(1); }}
            className="input-linear py-1.5 px-2 text-caption"
            style={{ colorScheme: 'dark' }}
          />
          <span className="text-caption text-ink-tertiary">to</span>
          <input 
            type="date" 
            value={dateEnd} 
            onChange={e => { setDateEnd(e.target.value); setPage(1); }}
            className="input-linear py-1.5 px-2 text-caption"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Sort Toggle */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="button-secondary py-1.5 px-3 text-caption cursor-pointer"
        >
          {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          className="button-icon"
          aria-label="Refresh audit logs"
        >
          <RefreshCw size={15} />
        </button>
      </div>`;

const newFiltersBar = `      {/* Filters Bar */}
      <div className="card-linear p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-[#010102] border border-[#23252A] rounded-lg h-9 px-3 flex-1 min-w-0 focus-within:border-[#60A5FA]/50 transition-colors">
            <Search size={14} className="text-ink-tertiary shrink-0" />
            <input
              type="text"
              placeholder="Search employee, reason, message..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent border-none text-ink text-caption w-full focus:outline-none p-0 placeholder:text-ink-tertiary"
            />
          </div>

          {/* Type Filter Tabs - Scrollable on mobile, compact pills on desktop */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 bg-[#0F1011] rounded-lg p-0.5 border border-[#23252A] shrink-0 no-scrollbar">
            {filterTabs.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setLogType(opt.value); setPage(1); }}
                className={\`px-2.5 py-1.5 rounded-md text-[11px] sm:text-caption font-medium transition-all whitespace-nowrap cursor-pointer min-h-[36px] sm:min-h-0 \${
                  logType === opt.value 
                    ? 'bg-[#2563EB] text-white shadow-sm' 
                    : 'text-ink-subtle hover:text-ink'
                }\`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-[#23252A]/60">
          {/* Date Range */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
            <Calendar size={13} className="text-ink-tertiary shrink-0 hidden sm:block" />
            <input 
              type="date" 
              value={dateStart} 
              onChange={e => { setDateStart(e.target.value); setPage(1); }}
              className="input-linear py-1 px-2 text-[11px] flex-1 sm:w-32"
              style={{ colorScheme: 'dark' }}
              aria-label="Start date"
            />
            <span className="text-[11px] text-ink-tertiary shrink-0">to</span>
            <input 
              type="date" 
              value={dateEnd} 
              onChange={e => { setDateEnd(e.target.value); setPage(1); }}
              className="input-linear py-1 px-2 text-[11px] flex-1 sm:w-32"
              style={{ colorScheme: 'dark' }}
              aria-label="End date"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="button-secondary py-1 px-2.5 text-[11px] h-8 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchLogs}
              className="button-icon h-8 w-8 shrink-0"
              aria-label="Refresh audit logs"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>`;

// Replace filters bar
if (content.includes('placeholder="Search logs..."')) {
  content = content.replace(oldFiltersBar, newFiltersBar);
}

// 3. Replace Table with Dual-Mode Rendering (Desktop Table + Mobile Cards)
const oldTableBlock = `      {/* Logs Table */}
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
                      <span className={\`badge \${
                        log.type === 'access'
                          ? (log.event_type === 'check_out' ? 'badge-info' : 'badge-success')
                          : log.type === 'consent'
                            ? 'badge-info'
                            : 'badge-warning'
                      }\`}>
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
                        <span className={\`text-[11px] font-medium px-2 py-0.5 rounded border \${
                          log.status === 'late'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }\`}>
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
        )}
      </div>`;

const newTableBlock = `      {/* Logs Container - Dual-mode (Mobile Cards + Desktop Table) */}
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
                      <span className={\`badge text-[10px] \${
                        log.type === 'access'
                          ? (log.event_type === 'check_out' ? 'badge-info' : 'badge-success')
                          : log.type === 'consent'
                            ? 'badge-info'
                            : 'badge-warning'
                      }\`}>
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
                              <span className="text-ink-subtle"> → Corrected: <strong className="text-[#60A5FA]">{log.correct_name}</strong></span>
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
                          <span className={\`text-[10px] font-medium px-2 py-0.5 rounded border \${
                            log.status === 'late'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }\`}>
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
                          <span className={\`badge \${
                            log.type === 'access'
                              ? (log.event_type === 'check_out' ? 'badge-info' : 'badge-success')
                              : log.type === 'consent'
                                ? 'badge-info'
                                : 'badge-warning'
                          }\`}>
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
                            <span className={\`text-[11px] font-medium px-2 py-0.5 rounded border \${
                              log.status === 'late'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }\`}>
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
      </div>`;

// Replace table block
// Normalize CRLF to LF for matching
const normContent = content.replace(/\r\n/g, '\n');
const normOldTable = oldTableBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOldTable)) {
  content = normContent.replace(normOldTable, newTableBlock);
  console.log('Successfully replaced table block');
} else {
  console.log('Warning: Exact table block match failed, checking index');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated AuditLogsPage.jsx successfully');

