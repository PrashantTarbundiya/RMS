import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Camera, Activity, Box, Video, Menu, X, Home, HelpCircle, Upload } from 'lucide-react'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  const linkClass = ({isActive}) => isActive ? "nav-link active" : "nav-link"

  return (
    <nav className="glass-nav">
      <div className="nav-container">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-logo"></div>
          <h1>RMS Face AI</h1>
          <span className="brand-badge">v2.0</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <NavLink to="/" className={linkClass} end onClick={closeMobile}>
            <Home size={16} /> Home
          </NavLink>
          <NavLink to="/dashboard" className={linkClass} onClick={closeMobile}>
            <Activity size={16} style={{ transform: 'rotate(90deg)' }} /> Dashboard
          </NavLink>
          <NavLink to="/upload" className={linkClass} onClick={closeMobile}>
            <Upload size={16} /> Upload
          </NavLink>
          <NavLink to="/test" className={linkClass} onClick={closeMobile}>
            <Video size={16} /> Test
          </NavLink>
          <NavLink to="/training" className={linkClass} onClick={closeMobile}>
            <Activity size={16} /> Training
          </NavLink>
          <NavLink to="/models" className={linkClass} onClick={closeMobile}>
            <Box size={16} /> Models
          </NavLink>
          <NavLink to="/support" className={linkClass} onClick={closeMobile}>
            <HelpCircle size={16} /> Help
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
