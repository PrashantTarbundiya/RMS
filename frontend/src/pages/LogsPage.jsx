import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Terminal as TerminalIcon, ClipboardList, CheckCircle, XCircle, Play, Clock, RefreshCw, Search, Copy, Trash2, Check, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import EmptyState from '../components/ui/EmptyState';
import { formatPersonName } from '../utils/format';

export default function LogsPage() {
  const { apiClient } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [liveLogs, setLiveLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all'); // all, error, success, warning
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalContainerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Fetch training queue history
  const fetchQueue = async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/train/queue`);
      setJobs(res.data.reverse()); // Show newest jobs first
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch training queue', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000); // Polling queue list every 3s
    return () => clearInterval(interval);
  }, []);

  // Connect to SSE stream for live training logs
  useEffect(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    const source = new EventSource(`${API_BASE}/train/status`);
    eventSourceRef.current = source;

    source.onmessage = (e) => {
      if (e.data !== '[DONE]' && e.data !== 'close') {
        setLiveLogs(prev => [...prev, e.data]);
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Auto-scroll logs: scrolls strictly inside terminal container, NEVER scrolls the page
  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [liveLogs.length, selectedJobId, autoScroll]);

  // Find the selected job
  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Success</span>;
      case 'Running':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse">Running</span>;
      case 'Pending':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-[#141516] text-ink-muted border-[#23252A]">Pending</span>;
      case 'Failed':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-rose-500/10 text-rose-400 border-rose-500/20">Failed</span>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success': return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'Running': return <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />;
      case 'Failed': return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default: return <Clock className="w-5 h-5 text-ink-muted shrink-0" />;
    }
  };

  // Determine which logs to show in the terminal window
  const renderLogs = () => {
    if (selectedJobId) {
      const targetJob = jobs.find(j => j.id === selectedJobId);
      return targetJob?.logs || [];
    }
    // Default to displaying live stream logs if a job is currently running
    const activeJob = jobs.find(j => j.status === 'Running');
    if (activeJob) {
      return liveLogs.length > 0 ? liveLogs : activeJob.logs;
    }
    // Otherwise show logs of the latest job
    return selectedJob?.logs || [];
  };

  const displayedLogs = renderLogs();

  // Filter and search logs
  const filteredLogs = displayedLogs.filter(log => {
    const matchSearch = !logSearch || log.toLowerCase().includes(logSearch.toLowerCase());
    if (!matchSearch) return false;
    if (logFilter === 'all') return true;
    if (logFilter === 'error') return log.includes('[ERROR]') || log.includes('failed') || log.includes('Error');
    if (logFilter === 'success') return log.includes('[SUCCESS]') || log.includes('[OK]');
    if (logFilter === 'warning') return log.includes('[Warning]') || log.includes('[WARNING]');
    return true;
  });

  const copyLogs = () => {
    navigator.clipboard.writeText(filteredLogs.join('\n')).then(() => {
      setCopied(true);
      toast.success(`Copied ${filteredLogs.length} log lines to clipboard.`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clearLiveLogs = () => {
    setLiveLogs([]);
    toast.info('Live terminal buffer cleared.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-6xl mx-auto space-y-6 page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline font-semibold text-ink font-display flex items-center gap-3">
            Live Telemetry & Logs
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="mt-1 text-caption text-ink-subtle">
            Real-time inference telemetry, asynchronous model refinement queue, and training execution logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            className="button-secondary text-caption flex items-center gap-2 h-9 px-3.5 hover:border-[#60A5FA]/40 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Queue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Job Queue List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-[#23252A] pb-3">
            <h3 className="m-0 text-body font-semibold text-ink flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-ink-tertiary" /> Job History
              <span className="text-[11px] font-mono text-ink-muted bg-[#141516] px-2 py-0.5 rounded-full border border-[#23252A]">
                {jobs.length}
              </span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-caption text-ink-muted text-center py-8">Loading queue telemetry...</div>
            ) : jobs.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No training jobs" description="Jobs will appear here as models are refined or trained." />
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    (selectedJobId === job.id || (!selectedJobId && selectedJob?.id === job.id))
                      ? 'bg-[#141516] border-[#60A5FA]/50 shadow-lg shadow-[#60A5FA]/5'
                      : 'bg-[#0F1011] border-[#23252A] hover:bg-[#141516]/60 hover:border-[#2E3138]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(job.status)}
                    <div className="min-w-0">
                      <h4 className="m-0 font-medium text-xs text-ink font-display truncate">
                        {formatPersonName(job.person_name)}
                      </h4>
                      <p className="m-0 text-[10px] text-ink-muted font-mono mt-0.5">
                        ID: {job.id} • {job.timestamp}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Terminal Log Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#23252A] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="m-0 text-body font-semibold text-ink flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-ink-tertiary" /> Terminal Console
              </h3>
              {selectedJob && (
                <span className="text-[11px] font-mono text-ink-muted bg-black/60 px-2.5 py-0.5 rounded-md border border-[#23252A]">
                  Target: <strong className="text-ink">{formatPersonName(selectedJob.person_name)}</strong> ({selectedJob.id})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedJob && getStatusBadge(selectedJob.status)}
            </div>
          </div>

          {/* Premium Search & Action Toolbar */}
          <div className="p-2.5 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 bg-[#010102] border border-[#23252A] rounded-lg h-9 px-3 w-full focus-within:border-[#60A5FA]/50 transition-colors">
                <Search className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword..."
                  className="bg-transparent border-none text-ink text-[12px] w-full focus:outline-none p-0 placeholder:text-ink-tertiary font-mono"
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="h-9 pl-3 pr-8 text-[12px] font-mono text-ink bg-[#010102] border border-[#23252A] rounded-lg focus:outline-none focus:border-[#60A5FA]/50 cursor-pointer appearance-none"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Errors Only</option>
                  <option value="warning">Warnings</option>
                  <option value="success">Success / OK</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-ink-tertiary">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAutoScroll(prev => !prev)}
                className={`h-9 px-3 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                  autoScroll
                    ? 'bg-[#60A5FA]/10 border-[#60A5FA]/30 text-[#60A5FA]'
                    : 'bg-[#010102] border-[#23252A] text-ink-muted hover:text-ink'
                }`}
                title="Toggle automated scrolling to bottom"
              >
                <ArrowDown size={13} className={autoScroll ? 'text-[#60A5FA]' : 'text-ink-tertiary'} />
                <span>Auto-scroll</span>
              </button>

              <button
                type="button"
                onClick={copyLogs}
                disabled={filteredLogs.length === 0}
                className="button-secondary h-9 px-3.5 text-[12px] flex items-center gap-1.5 disabled:opacity-40 hover:border-[#60A5FA]/40 hover:text-ink transition-colors"
                title="Copy current filtered logs to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={clearLiveLogs}
                disabled={liveLogs.length === 0}
                className="h-9 px-3 rounded-lg border border-[#23252A] bg-[#010102] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-ink-muted text-[12px] flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Clear current stream buffer"
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div ref={terminalContainerRef} className="bg-black/60 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-ink-subtle h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner">
            {filteredLogs.length === 0 ? (
              <EmptyState
                icon={TerminalIcon}
                title={displayedLogs.length === 0 ? 'No log output' : 'No logs match your filter'}
                description={displayedLogs.length === 0 ? 'Waiting for log telemetry...' : 'Try adjusting the search or filter.'}
              />
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="py-0.5 border-b border-white/[0.02] flex">
                  <span className="text-ink-muted mr-4 w-9 shrink-0 select-none text-right font-normal">
                    {String(i + 1).padStart(4, '0')}
                  </span>
                  <span className={`break-all font-mono ${
                    log.includes('[ERROR]') || log.includes('failed') ? 'text-[#E5484D]' :
                    log.includes('[SUCCESS]') || log.includes('[OK]') ? 'text-[#27A644]' :
                    log.includes('[Warning]') || log.includes('[WARNING]') ? 'text-[#FFC53D]' : 'text-ink'
                  }`}>
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
