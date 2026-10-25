import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

/**
 * OnboardingPage - Landing page for /onboarding route.
 * Resets onboarding state and redirects to profile page where
 * the OnboardingWizard spotlight tour will auto-start.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { apiClient } = useAuth();

  useEffect(() => {
    (async () => {
      // Reset onboarding state so the wizard starts from the beginning
      sessionStorage.removeItem('onboarding_paused');
      sessionStorage.removeItem('welcome_shown');
      localStorage.removeItem('onboarding_dismissed');
      try {
        await apiClient.post(`${API_BASE}/onboarding/state`, {
          onboarding_state: { step: 0, completed: false }
        });
      } catch (err) {}
      // Hard navigate to /profile to trigger the wizard fresh
      window.location.href = '/profile';
    })();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#737780' }}>
      Starting Setup Guide...
    </div>
  );
}
