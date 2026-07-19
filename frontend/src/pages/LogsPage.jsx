import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal as TerminalIcon, ClipboardList, CheckCircle, XCircle, Play, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

export default function LogsPage() {
  const { apiClient } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [liveLogs, setLiveLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const logsEndRef = useRef(null);
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

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs, selectedJobId, jobs]);

  // Find the selected job
  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20">Success</span>;
      case 'Running':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-[#5E6AD2]/10 text-[#828FFF] border-[#5E6AD2]/20 animate-pulse">Running</span>;
      case 'Pending':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-[#141516] text-ink-muted border-[#23252A]">Pending</span>;
      case 'Failed':
        return <span className="inline-flex px-2 py-0.5 rounded font-mono text-[9px] font-semibold border uppercase tracking-wider bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/20">Failed</span>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success': return <CheckCircle className="w-5 h-5 text-[#27A644]" />;
      case 'Running': return <RefreshCw className="w-5 h-5 text-[#828FFF] animate-spin" />;
      case 'Failed': return <XCircle className="w-5 h-5 text-[#E5484D]" />;
      default: return <Clock className="w-5 h-5 text-ink-muted" />;
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 max-w-6xl mx-auto space-y-6 page-container">
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">Live Logs & Queue</h1>
        <p className="mt-1 text-caption text-ink-subtle">
          View background model refinement queue status, historical training jobs, and real-time execution logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Job Queue List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-[#23252A] pb-3">
            <h3 className="m-0 text-body font-semibold text-ink flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-ink-tertiary" /> Job History
            </h3>
            <button onClick={fetchQueue} className="p-1 rounded hover:bg-[#1C1D1F] text-ink-subtle hover:text-ink transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-caption text-ink-muted text-center py-8">Loading queue history...</div>
            ) : jobs.length === 0 ? (
              <div className="text-caption text-ink-muted text-center py-8 border border-dashed border-[#23252A] rounded-lg">
                No training jobs recorded.
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    (selectedJobId === job.id || (!selectedJobId && selectedJob?.id === job.id))
                      ? 'bg-[#141516] border-[#5E6AD2]/50 shadow-md'
                      : 'bg-[#0F1011] border-[#23252A] hover:bg-[#141516]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(job.status)}
                    <div className="min-w-0">
                      <h4 className="m-0 font-medium text-xs text-ink font-display truncate">
                        {job.person_name}
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
            <h3 className="m-0 text-body font-semibold text-ink flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-ink-tertiary" /> Terminal Logs
              {selectedJob && (
                <span className="text-[11px] font-mono text-ink-muted font-normal bg-black/40 px-2 py-0.5 rounded border border-[#23252A]">
                  Job: {selectedJob.person_name} ({selectedJob.id})
                </span>
              )}
            </h3>
            {selectedJob && getStatusBadge(selectedJob.status)}
          </div>

          <div className="bg-black/60 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-ink-subtle h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner">
            {displayedLogs.length === 0 ? (
              <div className="opacity-50 flex items-center justify-center h-full gap-2 text-caption">
                <RefreshCw className="w-4 h-4 animate-spin text-[#5E6AD2]" />
                Waiting for log telemetry...
              </div>
            ) : (
              displayedLogs.map((log, i) => (
                <div key={i} className="py-0.5 border-b border-white/[0.02] flex">
                  <span className="text-ink-muted mr-4 w-9 shrink-0 select-none text-right font-normal">
                    {String(i + 1).padStart(4, '0')}
                  </span>
                  <span className={`break-all font-mono ${
                    log.includes('[ERROR]') ? 'text-[#E5484D]' :
                    log.includes('[SUCCESS]') ? 'text-[#27A644]' :
                    log.includes('[Warning]') ? 'text-[#FFC53D]' : 'text-ink'
                  }`}>
                    {log}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
