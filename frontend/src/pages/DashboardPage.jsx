import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Users, Image as ImageIcon, BarChart3, Clock, CheckCircle, 
  AlertTriangle, Trash2, Edit2, Check, X, RefreshCw, Eye
} from 'lucide-react'

const API_BASE = 'http://127.0.0.1:5000/api'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingPerson, setEditingPerson] = useState(null)
  const [newName, setNewName] = useState('')
  const [deletingPerson, setDeletingPerson] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' })

  const fetchDashboardData = async () => {
    try {
      setError('')
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard`),
        axios.get(`${API_BASE}/history`)
      ])
      setStats(statsRes.data)
      setHistory(historyRes.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch dashboard data from server. Ensure Flask API is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Poll stats every 10 seconds to keep dashboard alive
    const interval = setInterval(fetchDashboardData, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRename = async (oldName) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingPerson(null)
      return
    }
    setIsActionLoading(true)
    setActionStatus({ type: 'info', message: 'Renaming person...' })
    try {
      const res = await axios.put(`${API_BASE}/persons/${oldName}`, { new_name: newName.trim() })
      setActionStatus({ type: 'success', message: res.data.message })
      setEditingPerson(null)
      fetchDashboardData()
    } catch (err) {
      setActionStatus({ type: 'error', message: err.response?.data?.error || 'Failed to rename person' })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async (name) => {
    setIsActionLoading(true)
    setActionStatus({ type: 'info', message: 'Deleting person...' })
    try {
      const res = await axios.delete(`${API_BASE}/persons/${name}`)
      setActionStatus({ type: 'success', message: res.data.message })
      setDeletingPerson(null)
      fetchDashboardData()
    } catch (err) {
      setActionStatus({ type: 'error', message: err.response?.data?.error || 'Failed to delete person' })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all recognition history?')) return
    try {
      await axios.delete(`${API_BASE}/history`)
      setHistory([])
      fetchDashboardData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '1rem', color: 'var(--primary-light)' }} />
        <p>Loading Dashboard stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--error-bg)', color: 'var(--error)', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Failed to Load Dashboard</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchDashboardData(); }}>
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Derived dashboard variables
  const { total_people, total_photos, photos_per_person, requires_retrain, models_loaded, history_stats } = stats
  const { total_predictions, success_count, warning_count, error_count, agreement_counts } = history_stats

  // Success rate calculator
  const successRate = total_predictions > 0 ? Math.round((success_count / total_predictions) * 100) : 0

  // CSS for Inline Banner
  const statusColors = {
    error:   { bg: 'var(--error-bg)',   border: 'rgba(239, 68, 68, 0.3)',  color: 'var(--error)' },
    success: { bg: 'var(--success-bg)', border: 'rgba(34, 197, 94, 0.3)',  color: 'var(--success)' },
    info:    { bg: 'var(--info-bg)',    border: 'rgba(59, 130, 246, 0.3)', color: 'var(--info)' },
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Dashboard</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Analytics, person management, and recognition logs.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Retraining Warning Banner */}
      {requires_retrain && (
        <div className="glass-panel animate-pulse" style={{ 
          padding: '1.25rem 1.5rem', marginBottom: '2rem', 
          border: '1px solid rgba(245, 158, 11, 0.4)', 
          background: 'rgba(245, 158, 11, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <div>
              <h4 style={{ color: 'var(--warning)', margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>Model Out of Sync</h4>
              <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                A class was deleted or models were initialized with structural changes. Retraining is required to update Custom CNN & MobileNetV2.
              </p>
            </div>
          </div>
          <Link to="/training" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: 'var(--warning)', borderColor: 'var(--warning)', color: '#0F172A' }}>
            Train Models Now
          </Link>
        </div>
      )}

      {/* Action Notification Banner */}
      {actionStatus.message && (() => {
        const s = statusColors[actionStatus.type] || statusColors.info
        return (
          <div className="mb-2" style={{
            padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', 
            background: s.bg, border: `1px solid ${s.border}`, color: s.color,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}>
            <span>{actionStatus.message}</span>
            <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setActionStatus({ type: '', message: '' })}>
              <X size={16} />
            </button>
          </div>
        )
      })()}

      {/* ── KPI CARDS ── */}
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        
        <KpiCard 
          icon={<Users size={20} />} 
          label="Registered People" 
          value={total_people} 
          desc="Unique classes" 
          color="var(--primary-light)" 
        />
        
        <KpiCard 
          icon={<ImageIcon size={20} />} 
          label="Cleaned Photos" 
          value={total_photos} 
          desc={`${total_people > 0 ? Math.round(total_photos / total_people) : 0} avg per person`} 
          color="var(--secondary-light)" 
        />
        
        <KpiCard 
          icon={<Clock size={20} />} 
          label="Total Predictions" 
          value={total_predictions} 
          desc="Web and mobile log count" 
          color="var(--accent-cyan)" 
        />
        
        <KpiCard 
          icon={<CheckCircle size={20} />} 
          label="Success Rate" 
          value={`${successRate}%`} 
          desc={`${success_count} recognized / ${error_count} unknown`} 
          color="var(--success)" 
        />

      </div>

      {/* ── VISUAL ANALYTICS (SVG CHARTS) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Photos per Person Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-light)' }} /> Cleaned Images per Registered Person
          </h3>
          {total_people === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              No registered people. Go to the Upload page to add someone.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(photos_per_person).map(([name, count]) => {
                const maxVal = Math.max(...Object.values(photos_per_person), 1)
                const pct = (count / maxVal) * 100
                return (
                  <div key={name} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 40px', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>
                      {name.replace(/_/g, ' ')}
                    </span>
                    <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                        borderRadius: '999px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 600 }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Model Loaded Status Cards */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Model Load Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <ModelStatusIndicator label="DeepFace (Facenet512)" loaded={models_loaded.deepface} />
              <ModelStatusIndicator label="Custom CNN (Classifier)" loaded={models_loaded.custom_cnn} />
              <ModelStatusIndicator label="SOTA (MobileNetV2)" loaded={models_loaded.sota} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: '1.4', display: 'block' }}>
              Ensuring all 3 models are loaded guarantees high accuracy ensemble voting.
            </span>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Model Agreement Donut Chart (SVG) */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'left' }}>Model Agreement Levels</h3>
          {total_predictions === 0 ? (
            <div style={{ padding: '3rem 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              No prediction history yet. Perform some test scans to see statistics.
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <svg width="150" height="150" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
                {(() => {
                  const three = agreement_counts['3/3'] || 0
                  const two = agreement_counts['2/3'] || 0
                  const one = agreement_counts['1/3'] || 0
                  const zero = agreement_counts['0/3'] || 0
                  const na = agreement_counts['N/A'] || 0
                  const total = three + two + one + zero + na || 1
                  
                  const p3 = (three / total) * 100
                  const p2 = (two / total) * 100
                  const p1 = ((one + zero + na) / total) * 100

                  return (
                    <>
                      {/* Circle Background */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-input)" strokeWidth="4"></circle>
                      
                      {/* 3/3 Agreement (Success Green) */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--success)" strokeWidth="4"
                        strokeDasharray={`${p3} ${100 - p3}`} strokeDashoffset="0"></circle>
                      
                      {/* 2/3 Agreement (Warning Yellow) */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--warning)" strokeWidth="4"
                        strokeDasharray={`${p2} ${100 - p2}`} strokeDashoffset={-p3}></circle>
                        
                      {/* Low/No Agreement (Error Red) */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--error)" strokeWidth="4"
                        strokeDasharray={`${p1} ${100 - p1}`} strokeDashoffset={-(p3 + p2)}></circle>
                    </>
                  )
                })()}
                <g style={{ transform: 'rotate(90deg) translate(0px, -42px)' }}>
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="var(--text-primary)" fontSize="5" fontWeight="bold">
                    {Math.round(((agreement_counts['3/3'] || 0) + (agreement_counts['2/3'] || 0)) / (total_predictions || 1) * 100)}%
                  </text>
                  <text x="50%" y="70%" dominantBaseline="middle" textAnchor="middle" fill="var(--text-secondary)" fontSize="3">
                    Consensus
                  </text>
                </g>
              </svg>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <LegendItem color="var(--success)" label="3/3 Model Agreement" count={agreement_counts['3/3'] || 0} total={total_predictions} />
                <LegendItem color="var(--warning)" label="2/3 Model Agreement" count={agreement_counts['2/3'] || 0} total={total_predictions} />
                <LegendItem color="var(--error)" label="Low/No Agreement" count={(agreement_counts['1/3'] || 0) + (agreement_counts['0/3'] || 0) + (agreement_counts['N/A'] || 0)} total={total_predictions} />
              </div>
            </div>
          )}
        </div>

        {/* Success Rate Gauge */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'left' }}>Scans Accuracy Profile</h3>
          {total_predictions === 0 ? (
            <div style={{ padding: '3rem 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              No scans recorded yet. Try the webcam or test uploading photos.
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                <svg width="130" height="130" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-input)" strokeWidth="8" strokeDasharray="180 360" strokeLinecap="round" style={{ transform: 'rotate(180deg)', transformOrigin: '50px 50px' }}></circle>
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#successGrad)" strokeWidth="8" 
                    strokeDasharray={`${(successRate / 100) * 180} 360`} strokeLinecap="round"
                    style={{ transform: 'rotate(180deg)', transformOrigin: '50px 50px', transition: 'stroke-dasharray 0.8s ease' }}></circle>
                  <defs>
                    <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--success)" />
                    </linearGradient>
                  </defs>
                  <text x="50" y="45" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize="16" fontWeight="bold">
                    {successRate}%
                  </text>
                  <text x="50" y="60" textAnchor="middle" dominantBaseline="middle" fill="var(--text-secondary)" fontSize="8">
                    Accuracy Rate
                  </text>
                </svg>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem' }}>🟢 <strong style={{ color: 'var(--success)' }}>{success_count}</strong> Recognized</div>
                <div style={{ fontSize: '0.85rem' }}>🟡 <strong style={{ color: 'var(--warning)' }}>{warning_count}</strong> Medium Conf.</div>
                <div style={{ fontSize: '0.85rem' }}>🔴 <strong style={{ color: 'var(--error)' }}>{error_count}</strong> Unknown / Fails</div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── PERSON MANAGEMENT SECTION ── */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} style={{ color: 'var(--primary-light)' }} /> Person Management
        </h3>
        
        {total_people === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            No registered people. <Link to="/upload" style={{ color: 'var(--primary-light)' }}>Register your first person</Link> to start.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Person Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cleaned Photos</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(photos_per_person).map((name) => {
                  const isEditing = editingPerson === name
                  const isDeleting = deletingPerson === name
                  const count = photos_per_person[name] || 0
                  
                  return (
                    <tr key={name} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="text" 
                              className="text-input" 
                              value={newName} 
                              onChange={e => setNewName(e.target.value.replace(/\s+/g, '_'))}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '200px', margin: 0 }}
                              disabled={isActionLoading}
                            />
                            <button className="btn btn-primary" style={{ padding: '0.35rem', borderRadius: '4px' }} onClick={() => handleRename(name)} disabled={isActionLoading}>
                              <Check size={14} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '4px' }} onClick={() => setEditingPerson(null)} disabled={isActionLoading}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{name.replace(/_/g, ' ')}</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{count} file{count !== 1 ? 's' : ''}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {isDeleting ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginRight: '6px' }}>Are you sure?</span>
                            <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleDelete(name)} disabled={isActionLoading}>
                              Yes, Delete
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setDeletingPerson(null)} disabled={isActionLoading}>
                              No
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <Link 
                              to={`/persons/edit/${name}`}
                              className="btn btn-secondary hover-btn" 
                              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Edit Person & Photos"
                            >
                              <Edit2 size={14} />
                            </Link>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                              onClick={() => setDeletingPerson(name)}
                              disabled={isActionLoading || isEditing}
                              title="Delete Person"
                            >
                              <Trash2 size={14} style={{ color: 'var(--error)' }} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── RECOGNITION HISTORY TABLE ── */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={22} style={{ color: 'var(--primary-light)' }} /> Recent Recognition Logs
          </h3>
          {history.length > 0 && (
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)' }} onClick={handleClearHistory}>
              Clear History Logs
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            No scans recorded in history log yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ensemble Result</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Agreement</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Model Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, idx) => {
                  const dateStr = new Date(entry.timestamp).toLocaleTimeString()
                  const nameStr = entry.label.replace(/_/g, ' ')
                  const confVal = Math.round(entry.confidence * 100)
                  
                  let badgeBg = 'var(--success-bg)'
                  let badgeBorder = 'rgba(34,197,94,0.3)'
                  let badgeColor = 'var(--success)'
                  
                  if (entry.status === 'warning') {
                    badgeBg = 'rgba(245,158,11,0.1)'
                    badgeBorder = 'rgba(245,158,11,0.3)'
                    badgeColor = 'var(--warning)'
                  } else if (entry.status === 'error') {
                    badgeBg = 'var(--error-bg)'
                    badgeBorder = 'rgba(239,68,68,0.3)'
                    badgeColor = 'var(--error)'
                  }

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{dateStr}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600',
                          background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor
                        }}>
                          {nameStr}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{confVal}%</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{entry.agreement}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        DeepFace: {entry.predictions?.deepface?.label || 'N/A'} ({Math.round((entry.predictions?.deepface?.confidence || 0) * 100)}%) | 
                        CNN: {entry.predictions?.cnn?.label || 'N/A'} ({Math.round((entry.predictions?.cnn?.confidence || 0) * 100)}%) | 
                        SOTA: {entry.predictions?.sota?.label || 'N/A'} ({Math.round((entry.predictions?.sota?.confidence || 0) * 100)}%)
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
    </div>
  )
}

function KpiCard({ icon, label, value, desc, color }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ 
        width: '42px', height: '42px', borderRadius: 'var(--radius-md)', 
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '2px 0' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{desc}</div>
      </div>
    </div>
  )
}

function ModelStatusIndicator({ label, loaded }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ 
        fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
        background: loaded ? 'var(--success-bg)' : 'var(--error-bg)',
        border: `1px solid ${loaded ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: loaded ? 'var(--success)' : 'var(--error)'
      }}>
        {loaded ? 'LOADED' : 'NOT FOUND'}
      </span>
    </div>
  )
}

function LegendItem({ color, label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
      <span style={{ color: 'var(--text-secondary)', width: '140px' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
    </div>
  )
}
