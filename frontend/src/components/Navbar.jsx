import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Activity, Box, Video, Home, Upload, ClipboardList, Radio, Settings, LogOut, Users, User, Menu, X, Terminal, Shield, Monitor, BarChart3, Play, Camera, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { motion, AnimatePresence } from 'framer-motion';

// Role hierarchy: platform_owner > org_admin > manager > viewer > kiosk
const ROLE_HIERARCHY = ['platform_owner', 'org_admin', 'manager', 'viewer', 'kiosk'];

function hasRole(userRole, minRole) {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole);
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  if (userIdx === -1 || minIdx === -1) return false;
  return userIdx <= minIdx; // Lower index = higher privilege
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { isInstallable, isInstalled, installApp } = usePwa();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const userRole = user?.role || 'viewer';

  // Nav items with minimum required role
  const allNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Activity, minRole: 'viewer' },
    { to: '/attendance', label: 'Attendance', icon: ClipboardList, end: true, minRole: 'viewer' },
    { to: '/attendance/live', label: 'Live Site', icon: Radio, minRole: 'viewer' },
    { to: '/cameras', label: 'Cameras', icon: Camera, minRole: 'org_admin' },
    { to: '/upload', label: 'Upload', icon: Upload, minRole: 'org_admin' },
    { to: '/test', label: 'Test Camera', icon: Video, minRole: 'manager' },
    { to: '/mosaic', label: 'Camera Mosaic', icon: Monitor, minRole: 'manager' },
    { to: '/kiosk', label: 'Kiosk Mode', icon: Play, minRole: 'manager' },
    { to: '/logs', label: 'Live Logs', icon: Terminal, minRole: 'manager' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, minRole: 'org_admin' },
    { to: '/audit', label: 'Audit Logs', icon: Shield, minRole: 'org_admin' },
    { to: '/profile', label: 'Profile', icon: User, minRole: 'viewer' },
    { to: '/models', label: 'Settings', icon: Settings, minRole: 'org_admin' },
  ];

  const navItems = useMemo(
    () => allNavItems.filter(item => hasRole(userRole, item.minRole)),
    [userRole]
  );


  return (
    <>
      {/* Mobile Top Header (Visible only on mobile/small screens) */}
      <div className="mobile-header md:hidden">
        <div className="flex items-center justify-between w-full px-5 h-14 bg-[#0F1011] border-b border-[#23252A] fixed top-0 left-0 right-0 z-40">
          <Link to="/" className="brand flex items-center gap-2">
            <div className="w-7 h-7 rounded-md border border-border flex items-center justify-center bg-[#010102] shrink-0">
              <span className="font-mono text-primary font-bold text-xs">R</span>
            </div>
            <span className="text-ink font-semibold tracking-tight text-sm font-display">RMS Console</span>
          </Link>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="text-ink-subtle hover:text-ink p-1.5 rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </div>
        {/* Spacer to push page content down */}
        <div className="h-14 w-full" />
      </div>

      {/* Slide-over Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sliding Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-4/5 max-w-xs bg-[#0F1011] h-full border-r border-[#23252A] flex flex-col z-10 p-5 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#23252A] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center bg-[#010102]">
                    <span className="font-mono text-primary font-bold text-sm">R</span>
                  </div>
                  <div className="brand-text">
                    <span className="text-ink font-semibold tracking-tight text-xs font-display">RMS Console</span>
                    {user && <span className="block text-[10px] text-ink-subtle font-mono truncate max-w-[120px]">{user.org_name}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="text-ink-subtle hover:text-ink p-1.5 rounded-md hover:bg-surface-2 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.to} 
                    to={item.to} 
                    end={item.end}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={18} className="link-icon" />
                    <span className="link-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* Sign Out & PWA Action */}
              <div className="pt-4 border-t border-[#23252A] mt-auto flex flex-col gap-2">
                {isInstallable && !isInstalled && (
                  <button 
                    onClick={() => { installApp(); setIsMobileOpen(false); }} 
                    className="logout-btn" 
                    style={{ color: '#828FFF' }}
                  >
                    <Download size={18} />
                    <span>Install App (PWA)</span>
                  </button>
                )}
                {hasRole(userRole, 'org_admin') && (
                  <Link to="/onboarding" onClick={() => setIsMobileOpen(false)} className="logout-btn" style={{ color: 'var(--accent-primary)' }}>
                    <Play size={18} />
                    <span>Setup Guide</span>
                  </Link>
                )}
                {user && (
                  <button onClick={() => { logout(); setIsMobileOpen(false); }} className="logout-btn">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Hidden on mobile) */}
      <nav className={`ui-sidebar ${isCollapsed ? 'collapsed' : ''} hidden md:flex`}>
        {/* Desktop Header */}
        <div className="sidebar-header">
          <div className="flex items-center justify-between w-full gap-2">
            {!isCollapsed ? (
              <Link to="/" className="brand flex-1 min-w-0">
                <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center mr-2 bg-card shrink-0">
                  <span className="font-mono text-primary font-bold">R</span>
                </div>
                <div className="brand-text truncate">
                  <h1 className="truncate">RMS Console</h1>
                  {user && (
                    <div className="user-org">
                      <span className="org-name truncate max-w-[120px] block">{user.org_name || 'System Admin'}</span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <Link to="/" className="brand justify-center mx-auto">
                <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center bg-card shrink-0">
                  <span className="font-mono text-primary font-bold">R</span>
                </div>
              </Link>
            )}
            <button 
              onClick={toggleSidebar} 
              className="text-ink-subtle hover:text-ink p-1.5 rounded-md hover:bg-surface-2 transition-colors cursor-pointer hidden md:block shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed-link' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} className="link-icon" />
              {!isCollapsed && <span className="link-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isInstallable && !isInstalled && (
            <button 
              onClick={installApp} 
              className={`logout-btn ${isCollapsed ? 'justify-center' : ''}`} 
              style={{ color: '#828FFF' }}
              title={isCollapsed ? "Install App (PWA)" : undefined}
            >
              <Download size={18} />
              {!isCollapsed && <span>Install App</span>}
            </button>
          )}
          {hasRole(userRole, 'org_admin') && (
            <Link to="/onboarding" className={`logout-btn ${isCollapsed ? 'justify-center' : ''}`} style={{ color: 'var(--accent-primary)' }} title={isCollapsed ? "Setup Guide" : undefined}>
              <Play size={18} />
              {!isCollapsed && <span>Setup Guide</span>}
            </Link>
          )}
          {user && (
            <button onClick={logout} className={`logout-btn ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Sign Out" : undefined}>
              <LogOut size={18} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          )}
        </div>

        <style>{`
          .ui-sidebar {
            display: none !important;
          }

          @media (min-width: 768px) {
            .ui-sidebar {
              background: var(--surface-1);
              border-right: 1px solid var(--hairline);
              display: flex !important;
              flex-direction: column;
              width: ${isCollapsed ? '72px' : '260px'};
              height: 100vh;
              position: sticky;
              top: 0;
              z-index: 100;
              transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
          }

          .sidebar-header {
            padding: var(--space-md) var(--space-lg);
            border-bottom: 1px solid var(--hairline);
            display: flex;
            align-items: center;
          }

          .brand {
            display: flex;
            align-items: center;
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
            font-size: 15px;
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
            font-size: 15px;
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

          /* Desktop specific overrides */
          @media (min-width: 768px) {
            .ui-sidebar {
              width: ${isCollapsed ? '72px' : '260px'};
              height: 100vh;
              position: sticky;
              top: 0;
            }
            .sidebar-link.collapsed-link {
              padding: var(--space-sm) 0;
              justify-content: center;
              gap: 0;
            }
            .sidebar-header {
              padding: var(--space-md) ${isCollapsed ? '0' : 'var(--space-lg)'};
              justify-content: center;
            }
            .sidebar-footer {
              padding: var(--space-md) ${isCollapsed ? '0' : 'var(--space-lg)'};
            }
          }
        `}</style>
      </nav>

      {/* Mobile Bottom Navigation Bar (Mobile-First Thumb Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F1011]/95 backdrop-blur-md border-t border-[#23252A] z-40 flex items-center justify-around px-2 shadow-2xl">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${isActive ? 'text-[#828FFF]' : 'text-ink-subtle hover:text-ink'}`}
        >
          <Activity size={18} />
          <span className="text-[10px]">Dashboard</span>
        </NavLink>

        <NavLink 
          to="/attendance" 
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${isActive ? 'text-[#828FFF]' : 'text-ink-subtle hover:text-ink'}`}
        >
          <ClipboardList size={18} />
          <span className="text-[10px]">Attendance</span>
        </NavLink>

        <NavLink 
          to="/kiosk" 
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${isActive ? 'text-[#828FFF]' : 'text-ink-subtle hover:text-ink'}`}
        >
          <Play size={18} />
          <span className="text-[10px]">Kiosk</span>
        </NavLink>

        <NavLink 
          to="/cameras" 
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${isActive ? 'text-[#828FFF]' : 'text-ink-subtle hover:text-ink'}`}
        >
          <Camera size={18} />
          <span className="text-[10px]">Cameras</span>
        </NavLink>

        <button 
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium text-ink-subtle hover:text-ink transition-colors cursor-pointer"
        >
          <Menu size={18} />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </>
  );
}


