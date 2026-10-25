import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, X, 
  Camera, Users, Scan, Shield, Loader2,
  MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_ROLES = ['org_admin', 'platform_owner'];

// ─── Sub-Step Based Steps ───────────────────────────────────────────
const STEPS = [
  {
    title: 'Confirm Organization',
    icon: Shield,
    color: '#2563EB',
    path: '/profile',
    gateCheck: async () => true,
    gateMsg: '',
    subSteps: [
      {
        target: '[data-tour="org-settings"]',
        title: 'Review Organization Settings',
        desc: 'Confirm your organization name, deployment mode (Local/Cloud), and access level. Local mode keeps everything on this machine - no data leaves your network.',
        actionHint: 'Review the settings below, then click Next Step',
        placement: 'bottom',
      },
    ],
  },
  {
    title: 'Add Your First Camera',
    icon: Camera,
    color: '#2563EB',
    path: '/cameras',
    gateCheck: async (api) => {
      if (sessionStorage.getItem('onboarding_camera_added') === 'true') return true;
      try { 
        const r = await api.get(`${API_BASE}/cameras`); 
        return (r.data.cameras || []).length > 0; 
      } catch { 
        return false; 
      }
    },
    gateMsg: 'Add at least one camera to continue',
    subSteps: [
      {
        target: '[data-tour="add-camera-btn"]',
        title: 'Create a Camera API Key',
        desc: 'Click the "Add Camera" button to generate a secure API key. This key lets a physical camera or kiosk authenticate with RMS without a user login.',
        actionHint: 'Click the highlighted button to add a camera',
        placement: 'bottom',
      },
    ],
  },
  {
    title: 'Enroll Your First Subject',
    icon: Users,
    color: '#2563EB',
    path: '/upload',
    gateCheck: async (api) => {
      if (sessionStorage.getItem('onboarding_subject_enrolled') === 'true') return true;
      try { 
        const r = await api.get(`${API_BASE}/dashboard`); 
        return (r.data.total_people || 0) > 0; 
      } catch { 
        return false; 
      }
    },
    gateMsg: 'Enroll at least one subject to continue',
    subSteps: [
      {
        target: '[data-tour="subject-name-input"]',
        title: 'Step 1: Enter Subject Name',
        desc: 'Type a unique name for the person you want to enroll (e.g. "John_Doe"). Use underscores instead of spaces.',
        actionHint: 'Type a name in the highlighted field',
        placement: 'right',
      },
      {
        target: '[data-tour="asset-allocation"]',
        title: 'Step 2: Upload Face Photos',
        desc: 'Drag & drop or click to browse photos into the angle slots below. Adding front, left, and right angles gives the best recognition accuracy from different camera positions.',
        actionHint: 'Upload at least one photo to the highlighted area',
        placement: 'bottom',
      },
      {
        target: '[data-tour="enroll-submit-btn"]',
        title: 'Step 3: Submit Enrollment',
        desc: 'Click "Enroll & Train Person" to save the photos and generate face embeddings. This happens instantly.',
        actionHint: 'Click the highlighted button to enroll',
        placement: 'top',
      },
    ],
  },
  {
    title: 'Run Your First Scan',
    icon: Scan,
    color: '#2563EB',
    path: '/test',
    gateCheck: async (api) => {
      if (sessionStorage.getItem('onboarding_test_scanned') === 'true') return true;
      if (document.querySelector('.confirmed-flash, .error-flash') || document.body.innerText.includes('GhostFaceNet')) {
        sessionStorage.setItem('onboarding_test_scanned', 'true');
        return true;
      }
      try { 
        const r = await api.get(`${API_BASE}/dashboard`); 
        return (r.data.history_stats?.total_predictions || 0) > 0; 
      } catch { 
        return false; 
      }
    },
    gateMsg: 'Run a test scan to verify recognition',
    subSteps: [
      {
        target: '[data-tour="test-upload-area"]',
        title: 'Step 1: Upload a Test Photo',
        desc: 'Drag & drop an image into the highlighted area, or click "Browse Files" to select a photo of someone you just enrolled.',
        actionHint: 'Upload or browse for a test image',
        placement: 'right',
      },
      {
        target: '[data-tour="test-run-btn"]',
        title: 'Step 2: Execute Inference',
        desc: 'Click "Execute Inference" to run face recognition on your uploaded photo. The system will identify the person and show a confidence score.',
        actionHint: 'Click the highlighted button to run recognition',
        placement: 'top',
      },
    ],
  },
  {
    title: 'Your Daily Command Center',
    icon: Sparkles,
    color: '#2563EB',
    path: '/dashboard',
    gateCheck: async () => true,
    gateMsg: '',
    subSteps: [
      {
        target: '[data-tour="today-summary"]',
        title: 'Dashboard Overview',
        desc: 'This is what you will check every day: live attendance counts, match accuracy, system health, and recognition history at a glance.',
        actionHint: 'You are all set! Click Finish to complete setup',
        placement: 'bottom',
      },
    ],
  },
];

export default function OnboardingWizard() {
  const { user, apiClient, updateOnboardingState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stepIndex, setStepIndex] = useState(() => {
    const s = localStorage.getItem('rms_onboarding_step');
    return s !== null ? parseInt(s, 10) : 0;
  });
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [gatePassed, setGatePassed] = useState(true);
  const [gateChecking, setGateChecking] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowDir: 'top', arrowStyle: {} });
  const tooltipRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const isScrollingRef = useRef(false);

  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);
  const onbState = user?.onboarding_state || {};
  const isCompleted = localStorage.getItem('rms_onboarding_completed') === 'true' || onbState.completed === true;

  const currentStep = STEPS[stepIndex] || STEPS[0];
  const currentSubSteps = currentStep?.subSteps || [];
  const currentSubStep = currentSubSteps[subStepIndex] || currentSubSteps[0];
  const totalSubSteps = currentSubSteps.length;
  const isLastSubStep = subStepIndex >= totalSubSteps - 1;
  const isLastStep = stepIndex >= STEPS.length - 1;
  const StepIcon = currentStep?.icon || Sparkles;

  // ─── Initialize Once ─────────────────────────────────────────
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!isAdmin || isCompleted) { 
      setIsActive(false); 
      return; 
    }
    const paused = sessionStorage.getItem('onboarding_paused') === 'true';
    const dismissed = localStorage.getItem('rms_onboarding_dismissed') === 'true';
    const savedStep = parseInt(localStorage.getItem('rms_onboarding_step') ?? (onbState.step ?? 0), 10);
    
    if (paused || dismissed) {
      setIsActive(false);
    } else if (savedStep === 0 && !sessionStorage.getItem('welcome_shown')) {
      setShowWelcome(true);
    } else {
      const initialStep = Math.min(Math.max(savedStep, 0), STEPS.length - 1);
      setStepIndex(initialStep);
      setSubStepIndex(0);
      setIsActive(true);
    }
    hasInitializedRef.current = true;
  }, [isAdmin, isCompleted]);

  // ─── Listen for Resume Event ─────────────────────────────────
  useEffect(() => {
    const handleResume = (e) => {
      sessionStorage.removeItem('onboarding_paused');
      localStorage.removeItem('rms_onboarding_dismissed');
      localStorage.removeItem('rms_onboarding_completed');
      sessionStorage.setItem('welcome_shown', 'true');
      const targetStep = typeof e?.detail?.step === 'number' ? e.detail.step : 0;
      const validStep = Math.min(Math.max(targetStep, 0), STEPS.length - 1);
      setStepIndex(validStep);
      setSubStepIndex(0);
      localStorage.setItem('rms_onboarding_step', String(validStep));
      setShowWelcome(false);
      setShowComplete(false);
      setIsActive(true);
    };

    window.addEventListener('rms:start-onboarding', handleResume);
    return () => window.removeEventListener('rms:start-onboarding', handleResume);
  }, []);

  // ─── Navigate to step's page if route does not match ────────
  useEffect(() => {
    if (!isActive || showWelcome || showComplete) return;
    const targetPath = STEPS[stepIndex]?.path;
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [stepIndex, isActive, showWelcome, showComplete, location.pathname, navigate]);

  // ─── Elevate target element above overlay ─────────────────────
  const prevTargetRef = useRef(null);
  
  const cleanupTarget = useCallback(() => {
    if (prevTargetRef.current) {
      prevTargetRef.current.style.removeProperty('position');
      prevTargetRef.current.style.removeProperty('z-index');
      prevTargetRef.current.style.removeProperty('pointer-events');
      prevTargetRef.current.classList.remove('onb-target-elevated');
      prevTargetRef.current = null;
    }
  }, []);

  // ─── Add padding to main content when stepper is visible ─────
  useEffect(() => {
    const mainEl = document.querySelector('.main-content');
    if (isActive && !showWelcome && !showComplete && mainEl) {
      mainEl.style.paddingTop = '52px';
    }
    return () => {
      if (mainEl) mainEl.style.removeProperty('padding-top');
    };
  }, [isActive, showWelcome, showComplete]);

  // ─── Spotlight positioning ───────────────────────────────────
  const positionSpotlight = useCallback(() => {
    if (!isActive || showWelcome || showComplete) { 
      setSpotlightRect(null); 
      cleanupTarget(); 
      return; 
    }
    const sub = currentSubStep;
    if (!sub?.target) { 
      setSpotlightRect(null); 
      cleanupTarget(); 
      return; 
    }
    
    const el = document.querySelector(sub.target);
    if (!el) { 
      setSpotlightRect(null); 
      return; 
    }
    
    cleanupTarget();
    el.style.position = 'relative';
    el.style.zIndex = '99991';
    el.style.pointerEvents = 'all';
    el.classList.add('onb-target-elevated');
    prevTargetRef.current = el;
    
    const rect = el.getBoundingClientRect();
    if (rect.top < 64 || rect.bottom > window.innerHeight - 20) {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          isScrollingRef.current = false;
          positionSpotlight();
        }, 350);
      }
      return;
    }

    const pad = 10;
    setSpotlightRect({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });

    requestAnimationFrame(() => {
      const ttEl = tooltipRef.current;
      if (!ttEl) return;
      const ttRect = ttEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ttWidth = ttRect.width || 380;
      const ttHeight = ttRect.height || 220;
      
      const prefPlacement = sub.placement;
      const spaceRight = vw - rect.right - 24;
      const spaceBottom = vh - rect.bottom - 24;
      const spaceTop = rect.top - 64;
      const spaceLeft = rect.left - 24;

      let top, left, arrowDir = 'top', arrowStyle = {};

      if ((prefPlacement === 'right' || (!prefPlacement && spaceRight >= ttWidth + 30)) && spaceRight >= 300) {
        arrowDir = 'left';
        left = rect.right + 16;
        top = Math.max(64, Math.min(rect.top + rect.height / 2 - ttHeight / 2, vh - ttHeight - 16));
        const arrowTop = Math.max(16, Math.min(rect.top + rect.height / 2 - top, ttHeight - 24));
        arrowStyle = { top: `${arrowTop}px` };
      } else if ((prefPlacement === 'left' || (!prefPlacement && spaceLeft >= ttWidth + 30)) && spaceLeft >= 300) {
        arrowDir = 'right';
        left = rect.left - ttWidth - 16;
        top = Math.max(64, Math.min(rect.top + rect.height / 2 - ttHeight / 2, vh - ttHeight - 16));
        const arrowTop = Math.max(16, Math.min(rect.top + rect.height / 2 - top, ttHeight - 24));
        arrowStyle = { top: `${arrowTop}px` };
      } else if (prefPlacement === 'top' && spaceTop >= ttHeight) {
        arrowDir = 'bottom';
        top = rect.top - ttHeight - 14;
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - ttWidth / 2, vw - ttWidth - 16));
        const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, ttWidth - 24));
        arrowStyle = { left: `${arrowLeft}px` };
      } else if (spaceBottom >= ttHeight || spaceBottom >= spaceTop) {
        arrowDir = 'top';
        top = rect.bottom + 14;
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - ttWidth / 2, vw - ttWidth - 16));
        const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, ttWidth - 24));
        arrowStyle = { left: `${arrowLeft}px` };
      } else {
        arrowDir = 'bottom';
        top = Math.max(64, rect.top - ttHeight - 14);
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - ttWidth / 2, vw - ttWidth - 16));
        const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, ttWidth - 24));
        arrowStyle = { left: `${arrowLeft}px` };
      }
      
      setTooltipPos({ top, left, arrowDir, arrowStyle });
    });
  }, [isActive, showWelcome, showComplete, cleanupTarget, currentSubStep]);

  useEffect(() => {
    if (!isActive) { cleanupTarget(); return; }
    const timer = setTimeout(positionSpotlight, 200);
    const timer2 = setTimeout(positionSpotlight, 600);
    window.addEventListener('resize', positionSpotlight);
    
    let ticking = false;
    const handleScroll = () => {
      if (isScrollingRef.current || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        positionSpotlight();
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    const observer = new MutationObserver(() => setTimeout(positionSpotlight, 150));
    observer.observe(document.body, { childList: true, subtree: true, attributes: false });
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', positionSpotlight);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      observer.disconnect();
    };
  }, [positionSpotlight, isActive, location.pathname, cleanupTarget]);

  // ─── Gate checking ───────────────────────────────────────────
  const checkGate = useCallback(async () => {
    if (!isActive || !STEPS[stepIndex]) return;
    if (!isLastSubStep) {
      setGatePassed(true);
      return;
    }
    setGateChecking(true);
    try {
      const passed = await STEPS[stepIndex].gateCheck(apiClient);
      setGatePassed(passed);
    } catch {
      setGatePassed(true);
    } finally {
      setGateChecking(false);
    }
  }, [isActive, stepIndex, isLastSubStep, apiClient]);

  useEffect(() => {
    checkGate();
    const iv = setInterval(checkGate, 5000);
    return () => clearInterval(iv);
  }, [checkGate]);

  // ─── Persistence ─────────────────────────────────────────────
  const saveState = async (newStep, completed = false) => {
    localStorage.setItem('rms_onboarding_step', String(newStep));
    if (completed) {
      localStorage.setItem('rms_onboarding_completed', 'true');
    }
    try {
      if (updateOnboardingState) {
        await updateOnboardingState({ step: newStep, completed, updated_at: new Date().toISOString() });
      } else {
        await apiClient.post(`${API_BASE}/onboarding/state`, {
          onboarding_state: { step: newStep, completed, updated_at: new Date().toISOString() }
        });
      }
    } catch (err) {}
  };

  // ─── Step Actions ────────────────────────────────────────────
  const startSetup = () => {
    setShowWelcome(false);
    sessionStorage.setItem('welcome_shown', 'true');
    sessionStorage.removeItem('onboarding_paused');
    setStepIndex(0);
    setSubStepIndex(0);
    setIsActive(true);
    saveState(0, false);
    navigate('/profile');
  };

  const doLater = () => {
    setShowWelcome(false);
    setShowComplete(false);
    setIsActive(false);
    cleanupTarget();
    sessionStorage.setItem('onboarding_paused', 'true');
    localStorage.setItem('rms_onboarding_step', String(stepIndex));
    saveState(stepIndex, false);
  };

  const nextStep = () => {
    if (!isLastSubStep) {
      setSubStepIndex(prev => prev + 1);
    } else if (!isLastStep) {
      const next = stepIndex + 1;
      setStepIndex(next);
      setSubStepIndex(0);
      localStorage.setItem('rms_onboarding_step', String(next));
      saveState(next, false);
      const targetPath = STEPS[next]?.path;
      if (targetPath) {
        navigate(targetPath);
      }
    } else {
      setIsActive(false);
      setShowComplete(true);
    }
  };

  const prevStep = () => {
    if (subStepIndex > 0) {
      setSubStepIndex(prev => prev - 1);
    } else if (stepIndex > 0) {
      const prev = stepIndex - 1;
      setStepIndex(prev);
      const prevSubSteps = STEPS[prev].subSteps;
      setSubStepIndex(prevSubSteps.length - 1);
      localStorage.setItem('rms_onboarding_step', String(prev));
      saveState(prev, false);
      const targetPath = STEPS[prev]?.path;
      if (targetPath) {
        navigate(targetPath);
      }
    }
  };

  const completeSetup = async () => {
    setShowComplete(false);
    setIsActive(false);
    cleanupTarget();
    sessionStorage.removeItem('onboarding_paused');
    localStorage.removeItem('rms_onboarding_dismissed');
    localStorage.setItem('rms_onboarding_completed', 'true');
    localStorage.setItem('rms_onboarding_step', String(STEPS.length - 1));
    await saveState(STEPS.length - 1, true);
    navigate('/dashboard');
  };

  // Don't render if not admin or completed
  if (!isAdmin) return null;

  return (
    <>
      {/* ═══ Welcome Modal ═══ */}
      <AnimatePresence>
        {showWelcome && (
          <div className="onb-overlay-bg">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="onb-welcome-modal"
            >
              <div className="onb-welcome-icon">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="onb-welcome-title">Welcome to RMS Face AI</h2>
              <p className="onb-welcome-desc">
                Let us get your organization configured in about 5 minutes. We will walk you through each step and highlight the required actions.
              </p>
              <div className="onb-welcome-steps">
                {STEPS.map((s, i) => (
                  <div key={i} className="onb-welcome-step-item">
                    <div className="onb-ws-dot">
                      <s.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-ink">{s.title}</span>
                      <span className="text-ink-tertiary text-xs ml-1.5">
                        ({s.subSteps.length} {s.subSteps.length === 1 ? 'step' : 'steps'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={startSetup} className="onb-btn-primary">
                Start Guided Setup <ArrowRight className="w-4 h-4" />
              </button>
              <button type="button" onClick={doLater} className="onb-btn-ghost">
                Do this later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Completion Modal ═══ */}
      <AnimatePresence>
        {showComplete && (
          <div className="onb-overlay-bg">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="onb-welcome-modal"
              style={{ borderColor: 'rgba(16, 185, 129, 0.40)' }}
            >
              <div className="onb-welcome-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.30)', color: '#10B981' }}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="onb-welcome-title">Setup Complete</h2>
              <p className="onb-welcome-desc">
                Your organization is configured with hardware API access, registered subjects, and verified facial recognition.
              </p>
              <div className="onb-complete-checklist">
                {[
                  'Organization parameters reviewed',
                  'Camera API credentials provisioned',
                  'Biometric subject enrolled and trained',
                  'Inference verification confirmed',
                  'Operations command center active'
                ].map((label, i) => (
                  <div key={i} className="onb-complete-item">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={completeSetup} className="onb-btn-primary" style={{ background: '#10B981' }}>
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Active Tour: Overlay + Spotlight + Tooltip ═══ */}
      {isActive && !showWelcome && !showComplete && (
        <>
          {/* Dim overlay with spotlight cutout */}
          {spotlightRect && (
            <div className="onb-spotlight-hole" style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }} />
          )}
          {!spotlightRect && (
            <div className="onb-backdrop-solid" />
          )}

          {/* Floating Stepper Bar */}
          <div className="onb-stepper-bar">
            <div className="onb-stepper-inner">
              <div className="onb-stepper-left">
                <span className="onb-step-badge">
                  <StepIcon className="w-3.5 h-3.5 text-blue-500" />
                  Step {stepIndex + 1}/{STEPS.length}
                </span>
                <span className="onb-step-title">{currentStep.title}</span>
                {totalSubSteps > 1 && (
                  <span className="onb-substep-badge">
                    {subStepIndex + 1} of {totalSubSteps}
                  </span>
                )}
              </div>

              <div className="onb-stepper-dots">
                {STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`onb-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
                  />
                ))}
              </div>

              <div className="onb-stepper-right">
                <button type="button" onClick={doLater} className="onb-bar-skip" title="Exit guided setup">
                  Skip Setup
                </button>
              </div>
            </div>
          </div>

          {/* Tooltip near highlighted element */}
          <div
            ref={tooltipRef}
            className="onb-tooltip"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <div 
              className="onb-tooltip-arrow" 
              data-dir={tooltipPos.arrowDir} 
              style={tooltipPos.arrowStyle} 
            />
            <div className="onb-tooltip-header">
              <div className="onb-tooltip-icon">
                <StepIcon className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="onb-tooltip-title">{currentSubStep?.title || currentStep.title}</h4>
                  <button 
                    type="button" 
                    onClick={doLater} 
                    className="text-ink-subtle hover:text-ink p-1 rounded hover:bg-surface-2 transition-colors -mr-1 -mt-1 cursor-pointer"
                    title="Exit guided setup"
                  >
                    <X size={15} />
                  </button>
                </div>
                <p className="onb-tooltip-desc">{currentSubStep?.desc || ''}</p>
              </div>
            </div>

            {/* Sub-step progress bar */}
            {totalSubSteps > 1 && (
              <div className="onb-substep-progress">
                <div className="onb-substep-track">
                  {currentSubSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`onb-substep-segment ${i < subStepIndex ? 'done' : ''} ${i === subStepIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
                <span className="onb-substep-label">
                  Sub-step {subStepIndex + 1} of {totalSubSteps}
                </span>
              </div>
            )}

            {/* Action hint */}
            {currentSubStep?.actionHint && (
              <div className="onb-action-hint">
                <MousePointerClick className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-blue-400">{currentSubStep.actionHint}</span>
              </div>
            )}

            {/* Gate messages */}
            {isLastSubStep && !gatePassed && currentStep.gateMsg && (
              <div className="onb-gate-msg">
                <span className="onb-gate-dot" />
                <span>{currentStep.gateMsg}</span>
                {gateChecking && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
              </div>
            )}

            {isLastSubStep && gatePassed && currentStep.gateMsg && (
              <div className="onb-gate-pass">
                <CheckCircle2 className="w-4 h-4" /> Requirement satisfied. Ready to proceed.
              </div>
            )}

            {/* Tooltip Action Buttons */}
            <div className="onb-tooltip-footer">
              <button
                type="button"
                onClick={prevStep}
                disabled={stepIndex === 0 && subStepIndex === 0}
                className="onb-tt-btn secondary"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="onb-tt-btn primary"
              >
                {isLastStep && isLastSubStep ? 'Finish Setup' : (isLastSubStep ? 'Next Step' : 'Next')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        /* ═══ Overlay & Backdrop ═══ */
        .onb-overlay-bg {
          position: fixed; inset: 0; z-index: 99998;
          background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .onb-backdrop-solid {
          position: fixed; inset: 0; z-index: 99990;
          background: rgba(0, 0, 0, 0.65);
          pointer-events: none;
        }
        .onb-spotlight-hole {
          position: fixed; z-index: 99990;
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
          border: 2px solid rgba(37, 99, 235, 0.60);
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .onb-target-elevated {
          cursor: pointer !important;
          outline: none;
        }

        /* ═══ Welcome / Completion Modal ═══ */
        .onb-welcome-modal {
          background: #111214; border: 1px solid #23252A;
          border-radius: 12px; max-width: 440px; width: 100%;
          padding: 32px; text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .onb-welcome-icon {
          width: 52px; height: 52px; border-radius: 10px;
          background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(37, 99, 235, 0.30);
          display: flex; align-items: center; justify-content: center; color: #3B82F6;
        }
        .onb-welcome-title { color: #FFF; font-size: 20px; font-weight: 600; margin: 0; }
        .onb-welcome-desc { color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0; }
        .onb-welcome-steps {
          display: flex; flex-direction: column; gap: 8px;
          width: 100%; text-align: left; padding: 0;
        }
        .onb-welcome-step-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #E2E8F0; font-weight: 500;
          background: #16181B; border: 1px solid #23252A;
          padding: 8px 12px; border-radius: 8px;
        }
        .onb-ws-dot {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid rgba(37, 99, 235, 0.30); background: rgba(37, 99, 235, 0.10);
          color: #3B82F6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .onb-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 10px 16px; border-radius: 8px;
          background: #2563EB; color: #FFF; border: none;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s; margin-top: 4px;
        }
        .onb-btn-primary:hover { background: #1D4ED8; }
        .onb-btn-ghost {
          background: none; border: none; color: #64748B;
          font-size: 12px; cursor: pointer; padding: 6px;
        }
        .onb-btn-ghost:hover { color: #94A3B8; }
        .onb-complete-checklist {
          display: flex; flex-direction: column; gap: 8px;
          width: 100%; padding: 14px; border-radius: 8px;
          background: #16181B; border: 1px solid #23252A; text-align: left;
        }
        .onb-complete-item {
          display: flex; align-items: center; gap: 8px;
          color: #E2E8F0; font-size: 12px;
        }

        /* ═══ Stepper Bar ═══ */
        .onb-stepper-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 99995;
          background: #101113;
          border-bottom: 1px solid rgba(37, 99, 235, 0.25);
          padding: 0 20px;
          pointer-events: all;
        }
        .onb-stepper-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; gap: 16px;
        }
        .onb-stepper-left { display: flex; align-items: center; gap: 10px; }
        .onb-step-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; font-family: monospace;
          background: rgba(37, 99, 235, 0.10); color: #3B82F6;
          border: 1px solid rgba(37, 99, 235, 0.30);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .onb-step-title { font-size: 13px; font-weight: 600; color: #FFF; }
        .onb-substep-badge {
          font-size: 10px; font-weight: 600; color: #64748B;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.10);
          padding: 2px 8px; border-radius: 4px; font-family: monospace;
        }
        .onb-stepper-dots { display: flex; align-items: center; gap: 5px; }
        .onb-dot {
          width: 24px; height: 3px; border-radius: 2px;
          background: rgba(255, 255, 255, 0.12); transition: all 0.2s;
        }
        .onb-dot.active { width: 32px; background: #2563EB; }
        .onb-dot.done { background: #10B981; }
        .onb-stepper-right { display: flex; align-items: center; gap: 6px; }
        .onb-bar-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 6px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          background: rgba(255, 255, 255, 0.08); color: #E2E8F0;
          border: 1px solid rgba(255, 255, 255, 0.12); transition: all 0.15s;
        }
        .onb-bar-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.14); }
        .onb-bar-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .onb-bar-btn.primary { background: #2563EB; color: #FFF; border: 1px solid #1D4ED8; }
        .onb-bar-btn.primary:hover:not(:disabled) { background: #1D4ED8; }
        .onb-bar-skip {
          background: rgba(239, 68, 68, 0.10); border: 1px solid rgba(239, 68, 68, 0.25);
          color: #EF4444; border-radius: 6px;
          font-size: 11px; font-weight: 600; cursor: pointer; padding: 6px 12px;
          margin-left: 8px; transition: all 0.15s;
        }
        .onb-bar-skip:hover { background: rgba(239, 68, 68, 0.20); }

        /* ═══ Tooltip ═══ */
        .onb-tooltip {
          position: fixed; z-index: 99996;
          background: #111214; border: 1px solid rgba(37, 99, 235, 0.40);
          border-radius: 10px; padding: 18px;
          max-width: 400px; width: max-content;
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.60);
          pointer-events: all;
          transition: top 0.25s ease, left 0.25s ease;
        }
        .onb-tooltip-arrow {
          position: absolute; width: 10px; height: 10px;
          background: #111214; border: 1px solid rgba(37, 99, 235, 0.40);
          transform: rotate(45deg);
        }
        .onb-tooltip-arrow[data-dir="top"] {
          top: -6px; left: 24px;
          border-right: none; border-bottom: none;
        }
        .onb-tooltip-arrow[data-dir="bottom"] {
          bottom: -6px; left: 24px;
          border-left: none; border-top: none;
        }
        .onb-tooltip-arrow[data-dir="left"] {
          left: -6px; top: 24px;
          border-right: none; border-top: none;
        }
        .onb-tooltip-arrow[data-dir="right"] {
          right: -6px; top: 24px;
          border-left: none; border-bottom: none;
        }
        .onb-tooltip-header { display: flex; gap: 12px; align-items: flex-start; }
        .onb-tooltip-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(37, 99, 235, 0.30); background: rgba(37, 99, 235, 0.10);
          flex-shrink: 0;
        }
        .onb-tooltip-title { color: #FFF; font-size: 13px; font-weight: 600; margin: 0 0 4px; }
        .onb-tooltip-desc { color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 0; }

        /* ═══ Sub-step Progress ═══ */
        .onb-substep-progress {
          display: flex; align-items: center; gap: 10px;
          margin-top: 12px; padding-top: 10px;
          border-top: 1px solid #1E2024;
        }
        .onb-substep-track {
          display: flex; gap: 3px; flex: 1;
        }
        .onb-substep-segment {
          height: 3px; flex: 1; border-radius: 2px;
          background: rgba(255, 255, 255, 0.10);
          transition: background 0.2s;
        }
        .onb-substep-segment.active { background: #2563EB; }
        .onb-substep-segment.done { background: #10B981; }
        .onb-substep-label {
          font-size: 10px; font-weight: 600; color: #64748B;
          white-space: nowrap; font-family: monospace;
        }

        /* ═══ Action Hint ═══ */
        .onb-action-hint {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 8px 12px; border-radius: 6px;
          background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.25);
          font-size: 11px; font-weight: 500;
        }

        /* ═══ Gate Messages ═══ */
        .onb-gate-msg {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 8px 12px; border-radius: 6px;
          background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25);
          color: #EF4444; font-size: 11px; font-weight: 500;
        }
        .onb-gate-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #EF4444;
        }
        .onb-gate-pass {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 8px 12px; border-radius: 6px;
          background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);
          color: #10B981; font-size: 11px; font-weight: 500;
        }

        /* ═══ Tooltip Action Buttons ═══ */
        .onb-tooltip-footer {
          display: flex; align-items: center; justify-content: flex-end; gap: 8px;
          margin-top: 14px; padding-top: 10px; border-top: 1px solid #1E2024;
        }
        .onb-tt-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .onb-tt-btn.secondary {
          background: rgba(255, 255, 255, 0.06); color: #CBD5E1;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .onb-tt-btn.secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }
        .onb-tt-btn.secondary:disabled { opacity: 0.3; cursor: not-allowed; }
        .onb-tt-btn.primary {
          background: #2563EB; color: #FFF; border: 1px solid #1D4ED8;
        }
        .onb-tt-btn.primary:hover { background: #1D4ED8; }

        @media (max-width: 768px) {
          .onb-stepper-dots { display: none; }
          .onb-step-title { display: none; }
          .onb-substep-badge { display: none; }
          .onb-tooltip { max-width: 300px; }
        }
      `}</style>
    </>
  );
}
