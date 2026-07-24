import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Search, Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserX, FileText, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

export default function AuditLogsPage() {
  const { apiClient, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(25);
  const [logType, setLogType] = useState('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: logType,
        page: page.toString(),
        per_page: perPage.toString(),
        sort: sortOrder,
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await apiClient.get(`${API_BASE}/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied. Audit logs are restricted to administrators.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch audit logs.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, logType, page, perPage, search, sortOrder]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const typeColors = {
    feedback: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa' },
    consent: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' },
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Shield size={28} style={{ color: 'var(--primary)' }} />
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Feedback corrections and consent records — compliance audit trail
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap',
        padding: '1rem', borderRadius: '12px',
        background: 'var(--card-bg, #181A1F)', border: '1px solid var(--border, #23252A)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '8px', border: '1px solid var(--border)',
              background: 'var(--bg-primary, #0F1011)', color: 'var(--text-primary)',
              fontSize: '0.85rem', outline: 'none',
            }}
          />
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-primary, #0F1011)', borderRadius: '8px', padding: '2px' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'feedback', label: 'Feedback' },
            { value: 'consent', label: 'Consent' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setLogType(opt.value); setPage(1); }}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                background: logType === opt.value ? 'var(--primary)' : 'transparent',
                color: logType === opt.value ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort Toggle */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          style={{
            padding: '0.4rem 0.75rem', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
          }}
        >
          {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          style={{
            padding: '0.4rem 0.6rem', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '1rem', borderRadius: '8px', marginBottom: '1rem',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171', fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      {/* Stats Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)',
      }}>
        <span>{total} record{total !== 1 ? 's' : ''} found</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Logs Table */}
      <div style={{
        borderRadius: '12px', overflow: 'hidden',
        border: '1px solid var(--border)', background: 'var(--card-bg)',
      }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>No audit logs found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Type', 'Timestamp', 'Details', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left',
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {logs.map((log, idx) => {
                  const colors = typeColors[log.type] || typeColors.feedback;
                  return (
                    <motion.tr
                      key={log.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Type Badge */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem',
                          borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                          background: colors.bg, border: `1px solid ${colors.border}`,
                          color: colors.text, textTransform: 'uppercase',
                        }}>
                          {log.type}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>

                      {/* Details */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {log.type === 'feedback' ? (
                          <div>
                            <div>
                              Predicted: <strong>{log.predicted_name || '—'}</strong>
                              {log.correct_name && (
                                <span> → Corrected: <strong>{log.correct_name}</strong></span>
                              )}
                            </div>
                            {log.message && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {log.message}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div>
                              Employee: <strong>{log.employee_name || '—'}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {log.consent_type?.replace(/_/g, ' ')}
                              {log.revoked_at && (
                                <span style={{ color: '#f87171' }}> — Revoked {new Date(log.revoked_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {log.type === 'feedback' ? (
                          log.is_correct ? (
                            <CheckCircle size={16} style={{ color: '#4ade80' }} />
                          ) : (
                            <XCircle size={16} style={{ color: '#f87171' }} />
                          )
                        ) : (
                          log.revoked_at ? (
                            <UserX size={16} style={{ color: '#f87171' }} />
                          ) : (
                            <CheckCircle size={16} style={{ color: '#4ade80' }} />
                          )
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '0.5rem',
          marginTop: '1.5rem',
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--card-bg)',
              color: page <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
              cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '8px', minWidth: '36px',
                  border: '1px solid var(--border)',
                  background: p === page ? 'var(--primary)' : 'var(--card-bg)',
                  color: p === page ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: '0.85rem',
                }}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--card-bg)',
              color: page >= totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
