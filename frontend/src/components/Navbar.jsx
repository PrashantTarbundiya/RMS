import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Camera, Activity, Box, Video } from 'lucide-react'

export function Navbar() {
  const location = useLocation()

  return (
    <nav className="glass-nav">
      <div className="nav-container">
        <div className="brand">
          <div className="brand-logo"></div>
          <h1>RMS Face AI</h1>
        </div>
        <div className="nav-links">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>
          <Camera size={18} /> Upload
        </NavLink>
        <NavLink to="/test" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Video size={18} /> Test Inference
        </NavLink>
        <NavLink to="/training" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Activity size={18} /> Training
        </NavLink>
        <NavLink to="/models" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Box size={18} /> Models
        </NavLink>
      </div>
      </div>
    </nav>
  )
}
