import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Clock, LogIn } from 'lucide-react'

// Mock Live Data Generator
const generateLiveMockData = () => {
  const names = ["Alice_Smith", "Bob_Jones", "Charlie_Brown", "Diana_Prince"]
  
  // Randomly select 2 to 4 people currently on site
  const onSiteCount = Math.floor(Math.random() * 3) + 2
  const shuffledNames = names.sort(() => 0.5 - Math.random()).slice(0, onSiteCount)
  
  return shuffledNames.map((name, i) => {
    const checkIn = new Date()
    // Checked in anywhere from 1 minute to 4 hours ago
    checkIn.setMinutes(checkIn.getMinutes() - (Math.random() * 240 + 1))
    
    return {
      id: i,
      employeeName: name,
      gateId: "Main_Gate",
      checkIn: checkIn.toISOString(),
      checkOut: null,
      hoursWorked: 0,
      status: "On Site"
    }
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
}

const getInitials = (nameStr) => {
  return nameStr.split('_').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

const formatDuration = (checkInStr, now) => {
  const checkIn = new Date(checkInStr)
  const diffMs = now - checkIn
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffMins = Math.floor((diffMs % 3600000) / 60000)
  return `${diffHrs}h ${diffMins}m`
}

export default function LiveAttendancePage() {
  const [liveData, setLiveData] = useState([])
  const [now, setNow] = useState(new Date())

  // Poll mock data every 15 seconds to simulate someone checking in/out
  useEffect(() => {
    setLiveData(generateLiveMockData())
    
    const dataInterval = setInterval(() => {
      setLiveData(generateLiveMockData())
    }, 15000)
    
    return () => clearInterval(dataInterval)
  }, [])

  // Update current time every minute for duration formatting
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(timerInterval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: '4rem' }}>
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            Live Site <span className="animate-pulse" style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Real-time dashboard of personnel currently on premises.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => { setLiveData(generateLiveMockData()); setNow(new Date()); }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Radio size={16} /> Force Refresh
        </button>
      </motion.div>

      {liveData.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No personnel currently on site.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="card-grid">
          {liveData.map((person) => (
            <div key={person.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: 'var(--radius-full)', 
                  background: 'var(--gradient-primary)', border: '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'white', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: 'var(--shadow-cyan)'
                }}>
                  {getInitials(person.employeeName)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {person.employeeName.replace(/_/g, ' ')}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                    • On Site
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <LogIn size={14} /> Entry Time
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {new Date(person.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Clock size={14} /> Duration
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {formatDuration(person.checkIn, now)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
