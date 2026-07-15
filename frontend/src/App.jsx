import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ManagePersonPage from './pages/ManagePersonPage'
import UploadPage from './pages/UploadPage'
import TrainingPage from './pages/TrainingPage'
import ModelsPage from './pages/ModelsPage'
import TestPage from './pages/TestPage'
import SupportPage from './pages/SupportPage'
import { AnimatePresence, motion } from 'framer-motion'

// Create an inner component to use useLocation
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
        <Route path="/persons/edit/:name" element={<PageWrapper><ManagePersonPage /></PageWrapper>} />
        <Route path="/upload" element={<PageWrapper><UploadPage /></PageWrapper>} />
        <Route path="/test" element={<PageWrapper><TestPage /></PageWrapper>} />
        <Route path="/training" element={<PageWrapper><TrainingPage /></PageWrapper>} />
        <Route path="/models" element={<PageWrapper><ModelsPage /></PageWrapper>} />
        <Route path="/support" element={<PageWrapper><SupportPage /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
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

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
