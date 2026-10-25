import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, LogIn, User, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../config';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { formatPersonName } from '../utils/format';

const getInitials = (nameStr) => {
  if (!nameStr) return '??';
  const clean = formatPersonName(nameStr);
  return clean.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const formatDuration = (checkInStr, now) => {
  const checkIn = new Date(checkInStr);
  const diffMs = now - checkIn;
  if (diffMs < 0) return '0m';
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
};

export default function LiveAttendancePage() {
  const { apiClient } = useAuth();
  const [liveData, setLiveData] = useState([]);
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(15);

  const fetchLiveData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get(`${API_BASE}/history`);
      const history = Array.isArray(res.data) ? res.data : [];

      // Get records from the last 8 hours that are confirmed matches
      const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);
      const recentRecords = history.filter(r => {
        if (!r.timestamp || !r.label || r.label === 'Unknown') return false;
        if (r.status === 'error') return false;
        return new Date(r.timestamp) >= cutoff;
      });

      // Group by person, keep most recent record per person
      const personMap = {};
      recentRecords.forEach(r => {
        const key = r.label;
        if (!personMap[key] || new Date(r.timestamp) > new Date(personMap[key].timestamp)) {
          personMap[key] = r;
        }
      });

      // Convert to array sorted by most recent first
      const onSite = Object.values(personMap)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setLiveData(onSite);
      setLastRefresh(new Date());
      setCountdown(15);
    } catch (err) {
      console.error('Failed to fetch live data', err);
      setError('Failed to load live data.');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  // Poll data every 15 seconds
  useEffect(() => {
    fetchLiveData();
    const dataInterval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(dataInterval);
  }, [fetchLiveData]);

  // Update clock every 30 seconds
  useEffect(() => {
    const timerInterval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timerInterval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const cdInterval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(cdInterval);
  }, [lastRefresh]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { y: -15, opacity: 0, scale: 1.03 },
    visible: {
      y: 0, opacity: 1, scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 space-y-6 page-container">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="m-0 text-headline font-semibold text-ink font-display flex items-center gap-3">
            Live Site Presence
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="mt-1 text-caption text-ink-subtle">
            Active verified personnel on premise. Auto-synchronizes every 15s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0F1011] border border-[#23252A] rounded-lg px-3 py-1 text-[11px] font-mono text-ink-tertiary">
            <Clock size={12} className="text-ink-subtle" />
            <span>Next sync in: <strong className="text-ink font-semibold">{countdown}s</strong></span>
          </div>
          <button
            onClick={() => { setIsLoading(true); fetchLiveData(); }}
            className="button-secondary text-caption flex items-center gap-2 h-9 px-4 hover:border-[#60A5FA]/40 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex items-center justify-between">
            <div>
              <div className="text-caption text-ink-muted">Personnel On-Site</div>
              <div className="text-2xl font-bold font-display text-ink mt-0.5">{liveData.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User size={20} />
            </div>
          </div>

          <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex items-center justify-between">
            <div>
              <div className="text-caption text-ink-muted">Security Status</div>
              <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5 font-mono">
                <ShieldCheck size={16} /> All Verified
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA]">
              <Activity size={20} />
            </div>
          </div>

          <div className="p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex items-center justify-between">
            <div>
              <div className="text-caption text-ink-muted">Telemetry Heartbeat</div>
              <div className="text-xs font-mono text-ink-subtle mt-1">
                {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Synchronizing...'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Radio size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} height="140px" />
          ))}
        </div>
      ) : error ? (
        <div className="card-linear p-8 text-center border-rose-500/20 bg-rose-500/5 rounded-xl">
          <p className="text-rose-400 text-sm mb-3">{error}</p>
          <button onClick={() => { setIsLoading(true); fetchLiveData(); }} className="button-secondary text-caption">
            Retry Connection
          </button>
        </div>
      ) : liveData.length === 0 ? (
        <div className="card-linear p-0 bg-[#0F1011] border-[#23252A] rounded-xl">
          <EmptyState
            icon={User}
            title="No personnel currently on site"
            description="No confirmed face recognitions recorded in the last 8 hours. Scanned attendees will populate this live roster in real time."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {liveData.map((person) => {
              const isRecent = (now - new Date(person.timestamp)) < 120000; // last 2 min

              return (
                <motion.div
                  key={person.label}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className={`relative overflow-hidden card-linear p-5 rounded-xl hover:bg-[#141516]/80 transition-all ${isRecent ? 'ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/5' : ''}`}>
                    {isRecent && (
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#141516] flex items-center justify-center font-mono font-semibold text-ink-subtle border border-[#23252A] shadow-md">
                          {getInitials(person.label)}
                        </div>
                        <div>
                          <div className="font-semibold text-ink text-sm font-display tracking-tight">
                            {formatPersonName(person.label)}
                          </div>
                          <div className="text-xs text-ink-tertiary flex items-center gap-1.5 mt-0.5 font-mono">
                            <LogIn className="w-3 h-3 text-ink-tertiary" /> {new Date(person.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#23252A]/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-ink-tertiary mb-0.5 uppercase tracking-wider text-[10px] font-mono">Confidence</div>
                        <div className="text-emerald-400 font-mono font-medium">
                          {person.confidence !== undefined ? `${(person.confidence * 100).toFixed(1)}%` : '-'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-ink-tertiary mb-0.5 uppercase tracking-wider text-[10px] font-mono">Duration</div>
                        <div className="text-ink-subtle font-mono flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-ink-tertiary" />
                          {formatDuration(person.timestamp, now)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
