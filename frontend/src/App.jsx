import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import NetworkBanner from './components/ui/NetworkBanner'
import ErrorBoundary from './components/ErrorBoundary'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ManagePersonPage from './pages/ManagePersonPage'
import UploadPage from './pages/UploadPage'
import TrainingPage from './pages/TrainingPage'
import ModelsPage from './pages/ModelsPage'
import TestPage from './pages/TestPage'
import SupportPage from './pages/SupportPage'
import AttendancePage from './pages/AttendancePage'
import LiveAttendancePage from './pages/LiveAttendancePage'
import ProfilePage from './pages/ProfilePage'
import LogsPage from './pages/LogsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import MosaicPage from './pages/MosaicPage'
import AnalyticsPage from './pages/AnalyticsPage'
import OnboardingPage from './pages/OnboardingPage'
import CamerasPage from './pages/CamerasPage'
import OnboardingWizard from './components/OnboardingWizard'
import KioskPage from './pages/KioskPage'
import { AnimatePresence, motion } from 'framer-motion'
import { PwaProvider } from './context/PwaContext'
import PwaBanner from './components/ui/PwaBanner'

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * In single-tenant mode (isMultiTenant=false), all users are auto-authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, isMultiTenant } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010102] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-xl border border-[#23252A] flex items-center justify-center bg-[#0F1011]">
          <span className="font-mono text-[#5E6AD2] font-bold text-sm">R</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] animate-pulse" />
          <span className="text-xs text-ink-subtle tracking-wider">Loading console...</span>
        </div>
      </div>
    );
  }

  if (isMultiTenant === false) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * GuestRoute — redirects authenticated users to /dashboard.
 * Only used for login/register pages.
 */
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Create an inner component to use useLocation
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth/Public routes */}
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/login" element={<GuestRoute><PageWrapper><LoginPage /></PageWrapper></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><PageWrapper><RegisterPage /></PageWrapper></GuestRoute>} />

        {/* Protected routes */}
        <Route path="/onboarding" element={<ProtectedRoute><PageWrapper><OnboardingPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><DashboardPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/cameras" element={<ProtectedRoute><PageWrapper><CamerasPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><PageWrapper><AttendancePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/attendance/live" element={<ProtectedRoute><PageWrapper><LiveAttendancePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/persons/edit/:name" element={<ProtectedRoute><PageWrapper><ManagePersonPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><PageWrapper><UploadPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute><PageWrapper><TestPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><PageWrapper><TrainingPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/models" element={<ProtectedRoute><PageWrapper><ModelsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><PageWrapper><LogsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><PageWrapper><AuditLogsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/mosaic" element={<ProtectedRoute><PageWrapper><MosaicPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><PageWrapper><AnalyticsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><PageWrapper><SupportPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><ProfilePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/kiosk" element={<ProtectedRoute><KioskPage /></ProtectedRoute>} />
        <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AppContent — the inner app that has access to AuthContext.
 * Controls whether the Navbar is shown (hidden on login/register pages).
 */
function AppContent() {
  const location = useLocation();
  const { isAuthenticated, isMultiTenant } = useAuth();
  const isOuterPage = ['/login', '/register', '/', '/kiosk'].includes(location.pathname);
  const showNavbar = !isOuterPage && (isAuthenticated || isMultiTenant === false);

  return (
    <div className="app-container">
      {showNavbar && <Navbar />}
      {showNavbar && <OnboardingWizard />}
      <PwaBanner />
      <main className={showNavbar ? "main-content" : "main-content-fullscreen"} style={{ display: 'flex', flexDirection: 'column' }}>
        {showNavbar && <NetworkBanner />}
        <div style={{ flex: 1 }}>
          <AnimatedRoutes />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <PwaProvider>
              <AppContent />
            </PwaProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
