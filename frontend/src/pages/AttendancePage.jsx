import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Calendar, Users, Filter } from 'lucide-react'

// Mock Data Generator
const generateMockData = () => {
  const names = ["Alice_Smith", "Bob_Jones", "Charlie_Brown", "Diana_Prince", "Eve_Adams"]
  const gates = ["Main_Gate", "Back_Entrance", "Loading_Dock"]
  const statuses = ["On Time", "Late", "Incomplete"]
  
  return Array.from({ length: 15 }).map((_, i) => {
    const checkInHour = 8 + Math.floor(Math.random() * 3) // 8 AM to 10 AM
    const checkOutHour = 16 + Math.floor(Math.random() * 3) // 4 PM to 6 PM
    const isComplete = Math.random() > 0.2 // 80% complete

    const checkIn = new Date()
    checkIn.setHours(checkInHour, Math.floor(Math.random() * 60), 0, 0)
    
    let checkOut = null
    let hoursWorked = 0
    let status = "Incomplete"

    if (isComplete) {
      checkOut = new Date()
      checkOut.setHours(checkOutHour, Math.floor(Math.random() * 60), 0, 0)
      hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(1)
      status = checkInHour <= 8 ? "On Time" : "Late"
    }

    return {
      id: i,
      employeeName: names[Math.floor(Math.random() * names.length)],
      gateId: gates[Math.floor(Math.random() * gates.length)],
      checkIn: checkIn.toISOString(),
      checkOut: checkOut ? checkOut.toISOString() : null,
      hoursWorked: hoursWorked,
      status: status
    }
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
}

export default function AttendancePage() {
  const [data, setData] = useState([])
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    // In production, this would fetch from /api/attendance
    setData(generateMockData())
  }, [])

  const filteredData = data.filter(record => {
    if (!dateFilter) return true
    const recordDate = new Date(record.checkIn).toISOString().split('T')[0]
    return recordDate === dateFilter
  })

  const exportCSV = () => {
    if (filteredData.length === 0) return
    const headers = ['Employee Name', 'Gate/Device', 'Check-In', 'Check-Out', 'Hours Worked', 'Status']
    const rows = filteredData.map(r => [
      r.employeeName, 
      r.gateId, 
      new Date(r.checkIn).toLocaleTimeString(), 
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : 'N/A', 
      r.hoursWorked || '0', 
      r.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_export_${dateFilter || 'all'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  const getStatusBadge = (status) => {
    if (status === 'On Time') {
      return { bg: 'var(--success-bg)', border: 'rgba(34,197,94,0.3)', color: 'var(--success)' }
    } else if (status === 'Late') {
      return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: 'var(--warning)' }
    }
    // Incomplete
    return { bg: 'var(--error-bg)', border: 'rgba(239,68,68,0.3)', color: 'var(--error)' }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: '4rem' }}>
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Attendance Log</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Detailed employee entry and exit records.</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
            <input 
              type="date" 
              className="text-input" 
              style={{ paddingLeft: '2.5rem', margin: 0, width: 'auto' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }} onClick={() => setDateFilter('')}>
              Clear Filter
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={exportCSV} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
          <Download size={16} /> Export CSV
        </button>
      </motion.div>

      {/* Data Table */}
      <motion.section variants={itemVariants} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} style={{ color: 'var(--primary-light)' }} /> Historical Records
          </h3>
        </div>

        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No attendance records found for the selected date.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Employee Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gate/Device</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Check-In Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Check-Out Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Hours Worked</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => {
                  const badge = getStatusBadge(row.status)
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {row.employeeName.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{row.gateId.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {row.hoursWorked > 0 ? `${row.hoursWorked} hrs` : '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600',
                          background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}
