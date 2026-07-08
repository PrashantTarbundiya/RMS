import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ManagePersonPage from './pages/ManagePersonPage'
import UploadPage from './pages/UploadPage'
import TrainingPage from './pages/TrainingPage'
import ModelsPage from './pages/ModelsPage'
import TestPage from './pages/TestPage'
import SupportPage from './pages/SupportPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/persons/edit/:name" element={<ManagePersonPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
