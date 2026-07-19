import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Box, Video, Home, Upload, ClipboardList, Radio, Settings, LogOut, Users, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Activity },
    { to: '/attendance', label: 'Attendance', icon: ClipboardList, end: true },
    { to: '/attendance/live', label: 'Live Site', icon: Radio },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/test', label: 'Test Camera', icon: Video },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/models', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="ui-sidebar">
      {/* Desktop Header */}
      <div className="sidebar-header">
        <Link to="/" className="brand">
          <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center mr-3 bg-card">
            <span className="font-mono text-primary font-bold">R</span>
          </div>
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
          background: var(--surface-1);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          width: 100%;
          z-index: 100;
        }

        .sidebar-header {
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--hairline);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
        }

        .brand-text h1 {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.2px;
          margin: 0;
          color: var(--ink);
        }

        .user-org {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-top: 4px;
        }

        .org-name {
          font-size: 11px;
          color: var(--ink-subtle);
        }

        .role-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(94, 106, 210, 0.1);
          color: var(--accent-primary);
          border-radius: var(--radius-xs);
          text-transform: uppercase;
          font-family: var(--font-mono);
          font-weight: 500;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: var(--space-md) 0;
          overflow-y: auto;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-lg);
          color: var(--ink-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          position: relative;
          transition: all 0.2s ease;
        }

        .sidebar-link:hover {
          color: var(--ink);
          background: var(--surface-2);
        }

        .sidebar-link.active {
          color: var(--ink);
          background: var(--surface-2);
        }

        /* Left border accent bar (indigo) grows in from top */
        .sidebar-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--accent-primary);
          transform: scaleY(0);
          transform-origin: top;
          transition: transform 0.2s ease;
        }

        .sidebar-link.active::before {
          transform: scaleY(1);
        }

        .link-icon {
          opacity: 0.7;
          color: var(--ink-subtle);
        }
        .sidebar-link:hover .link-icon,
        .sidebar-link.active .link-icon {
          opacity: 1;
          color: var(--accent-primary);
        }

        .sidebar-footer {
          padding: var(--space-md) var(--space-lg);
          border-top: 1px solid var(--hairline);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: transparent;
          border: none;
          color: var(--ink-subtle);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          text-align: left;
          padding: var(--space-xs) 0;
          transition: color 0.2s ease;
        }
        .logout-btn:hover {
          color: var(--ink);
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
            border-top: 1px solid var(--hairline);
            padding: 0;
            background: var(--surface-1);
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
            padding: var(--space-xs);
            justify-content: center;
            flex: 1;
            font-size: 10px;
          }
          .link-label {
            font-size: 9px;
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
