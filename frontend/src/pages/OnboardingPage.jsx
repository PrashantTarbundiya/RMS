import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

/**
 * OnboardingPage - Route handler for /onboarding.
 * Resets onboarding state and seamlessly redirects to profile page where
 * the OnboardingWizard spotlight tour activates immediately.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { apiClient, updateOnboardingState } = useAuth();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      sessionStorage.removeItem('onboarding_paused');
      sessionStorage.removeItem('welcome_shown');
      localStorage.removeItem('rms_onboarding_dismissed');
      localStorage.removeItem('rms_onboarding_completed');
      localStorage.setItem('rms_onboarding_step', '0');

      try {
        if (updateOnboardingState) {
          await updateOnboardingState({ step: 0, completed: false, reset: true });
        } else {
          await apiClient.post(`${API_BASE}/onboarding/state`, {
            onboarding_state: { step: 0, completed: false, reset: true }
          });
        }
      } catch (err) {
        console.warn('Failed to reset onboarding state:', err);
      }

      if (isMounted) {
        navigate('/profile');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('rms:start-onboarding', { detail: { step: 0, force: true } }));
        }, 120);
      }
    })();

    return () => { isMounted = false; };
  }, [navigate, apiClient, updateOnboardingState]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#737780' }}>
      Starting Setup Guide...
    </div>
  );
}
