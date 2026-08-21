import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, LogIn, User, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';


const getInitials = (nameStr) => {
  if (!nameStr) return '??';
  return nameStr.split('_').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="m-0 text-headline font-semibold text-ink font-display flex items-center gap-3">
            Live Operations <span className="w-2.5 h-2.5 rounded-full bg-[#27A644] animate-pulse" />
          </h1>
          <p className="mt-1 text-caption text-ink-subtle">
            People recognized in the last 8 hours. Auto-refreshes every 15s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-ink-tertiary font-mono">
            {countdown}s
          </span>
          <button
            onClick={() => { setIsLoading(true); fetchLiveData(); }}
            className="button-secondary text-caption flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {!isLoading && !error && (
        <div className="flex items-center gap-6 p-4 bg-[#0F1011] border border-[#23252A] rounded-lg text-caption text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="text-ink-subtle">On Site:</span>
            <span className="font-bold text-ink text-lg">{liveData.length}</span>
          </div>
          {lastRefresh && (
            <div className="flex items-center gap-2">
              <span className="text-ink-subtle">Last sync:</span>
              <span className="font-mono text-ink-tertiary">{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}
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
        <div className="card-linear p-8 text-center border-[#F87171]/20 bg-[#F87171]/5">
          <p className="text-[#F87171] text-sm mb-3">{error}</p>
          <button onClick={() => { setIsLoading(true); fetchLiveData(); }} className="button-secondary text-caption">
            Retry
          </button>
        </div>
      ) : liveData.length === 0 ? (
        <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
          <EmptyState
            icon={User}
            title="No personnel detected"
            description="No confirmed face recognitions in the last 8 hours. Records will appear here as people are recognized."
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
                  <div className={`relative overflow-hidden card-linear p-5 hover:bg-[#141516]/60 transition-colors ${isRecent ? 'ring-1 ring-[#27A644]/50' : ''}`}>
                    {isRecent && (
                      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#27A644] to-transparent opacity-50" />
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#141516] flex items-center justify-center font-mono font-medium text-ink-subtle border border-[#23252A] shadow-sm">
                          {getInitials(person.label)}
                        </div>
                        <div>
                          <div className="font-mono font-medium text-ink text-sm">
                            {(person.label || 'Unknown').replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-ink-tertiary flex items-center gap-1 mt-0.5">
                            <LogIn className="w-3 h-3 text-ink-tertiary" /> {new Date(person.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20">
                        ACTIVE
                      </span>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#23252A]/50 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-ink-tertiary mb-0.5 uppercase tracking-wider text-[10px]">Confidence</div>
                        <div className="text-ink-subtle font-mono">
                          {person.confidence !== undefined ? `${(person.confidence * 100).toFixed(1)}%` : '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-ink-tertiary mb-0.5 uppercase tracking-wider text-[10px]">Since</div>
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
