import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Box, Video, Home, Upload, ClipboardList, Radio, Settings, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  
  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: Activity },
    { to: '/attendance', label: 'Attendance', icon: ClipboardList, end: true },
    { to: '/attendance/live', label: 'Live Site', icon: Radio },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/test', label: 'Test Camera', icon: Video },
    { to: '/models', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="ui-sidebar">
      {/* Desktop Header */}
      <div className="sidebar-header">
        <Link to="/" className="brand">
          <Reticle className="brand-logo-reticle">
            <div className="brand-mark"></div>
          </Reticle>
          <div className="brand-text">
            <h1>RMS Console</h1>
            {user && (
              <div className="user-org">
                <span className="org-name">{user.org_name || 'System Admin'}</span>
                <span className="role-badge">{user.role || 'Admin'}</span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} className="link-icon" />
            <span className="link-label">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="sidebar-footer">
        {user && (
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <style>{`
        .ui-sidebar {
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          width: 100%;
          z-index: 100;
        }

        .sidebar-header {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--border-subtle);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
        }

        .brand-mark {
          width: 24px;
          height: 24px;
          background: var(--text-primary);
        }

        .brand-text h1 {
          font-size: var(--text-sm);
          margin: 0;
          color: var(--text-primary);
        }

        .user-org {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: 4px;
        }

        .org-name {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .role-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(91, 95, 239, 0.1);
          color: var(--accent-indigo);
          border-radius: 4px;
          text-transform: uppercase;
          font-family: var(--font-mono);
          font-weight: 500;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: var(--space-4) 0;
          overflow-y: auto;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-5);
          color: var(--text-muted);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: 500;
          position: relative;
          transition: color var(--duration) var(--ease), background var(--duration) var(--ease);
        }

        .sidebar-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.02);
        }

        .sidebar-link.active {
          color: var(--text-primary);
          background: var(--bg-elevated);
        }

        /* Left border accent bar (indigo) grows in from top */
        .sidebar-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--accent-indigo);
          transform: scaleY(0);
          transform-origin: top;
          transition: transform var(--duration) var(--ease);
        }

        .sidebar-link.active::before {
          transform: scaleY(1);
        }

        .link-icon {
          opacity: 0.7;
        }
        .sidebar-link.active .link-icon {
          opacity: 1;
          color: var(--accent-indigo);
        }

        .sidebar-footer {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--border-subtle);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          text-align: left;
          padding: var(--space-2) 0;
          transition: color var(--duration) var(--ease);
        }
        .logout-btn:hover {
          color: var(--text-primary);
        }

        /* Mobile overrides (bottom tabs) */
        @media (max-width: 767px) {
          .ui-sidebar {
            flex-direction: row;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            border-right: none;
            border-top: 1px solid var(--border-subtle);
            padding: 0;
          }
          .sidebar-header, .sidebar-footer {
            display: none;
          }
          .sidebar-nav {
            flex-direction: row;
            padding: 0;
            overflow-x: auto;
            align-items: center;
            justify-content: space-around;
            width: 100%;
          }
          .sidebar-link {
            flex-direction: column;
            gap: 4px;
            padding: var(--space-2);
            justify-content: center;
            flex: 1;
          }
          .link-label {
            font-size: 10px;
          }
          .sidebar-link::before {
            left: 0;
            top: 0;
            right: 0;
            bottom: auto;
            width: 100%;
            height: 2px;
            transform: scaleX(0);
            transform-origin: left;
          }
          .sidebar-link.active::before {
            transform: scaleX(1);
          }
        }

        /* Desktop specific */
        @media (min-width: 768px) {
          .ui-sidebar {
            width: 260px;
            height: 100vh;
            position: sticky;
            top: 0;
          }
        }
      `}</style>
    </nav>
  );
}
