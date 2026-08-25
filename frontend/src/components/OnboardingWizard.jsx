import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, X, 
  Camera, Users, Scan, Shield, Play, Loader2,
  MousePointerClick, Upload, UserPlus, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_ROLES = ['org_admin', 'platform_owner'];

// ─── Sub-Step Based Steps ───────────────────────────────────────────
// Each high-level step now contains an array of sub-steps.
// Each sub-step has its own spotlight target, title, and description.
const STEPS = [
  {
    title: 'Confirm Organization',
    icon: Shield,
    color: '#5E6AD2',
    path: '/profile',
    gateCheck: async () => true,
    gateMsg: '',
    subSteps: [
      {
        target: '[data-tour="org-settings"]',
        title: 'Review Organization Settings',
        desc: 'Confirm your organization name, deployment mode (Local/Cloud), and access level. Local mode keeps everything on this machine — no data leaves your network.',
        actionHint: 'Review the settings below, then click Next →',
      },
    ],
  },
  {
    title: 'Add Your First Camera',
    icon: Camera,
    color: '#27A644',
    path: '/cameras',
    gateCheck: async (api) => {
      if (sessionStorage.getItem('onboarding_camera_added') === 'true') return true;
      try { const r = await api.get(`${API_BASE}/cameras`); return (r.data.cameras || []).length > 0; } catch { return false; }
    },
    gateMsg: 'Add at least one camera to continue',
    subSteps: [
      {
        target: '[data-tour="add-camera-btn"]',
        title: 'Create a Camera API Key',
        desc: 'Click the "Add Camera" button to generate a secure API key. This key lets a physical camera or kiosk authenticate with RMS without a user login.',
        actionHint: 'Click the highlighted button to add a camera',
      },
    ],
  },
  {
    title: 'Enroll Your First Subject',
    icon: Users,
    color: '#828FFF',
    path: '/upload',
    gateCheck: async (api) => {
      if (sessionStorage.getItem('onboarding_subject_enrolled') === 'true') return true;
      try { const r = await api.get(`${API_BASE}/dashboard`); return (r.data.total_people || 0) > 0; } catch { return false; }
    },
    gateMsg: 'Enroll at least one subject to continue',
    subSteps: [
      {
        target: '[data-tour="subject-name-input"]',
        title: 'Step 1: Enter Subject Name',
        desc: 'Type a unique name for the person you want to enroll (e.g. "John_Doe"). Use underscores instead of spaces.',
        actionHint: 'Type a name in the highlighted field',
      },
      {
        target: '[data-tour="asset-allocation"]',
        title: 'Step 2: Upload Face Photos',
        desc: 'Drag & drop or click to browse photos into the angle slots below. Adding front, left, and right angles gives the best recognition accuracy from different camera positions.',
        actionHint: 'Upload at least one photo to the highlighted area',
      },
      {
        target: '[data-tour="enroll-submit-btn"]',
        title: 'Step 3: Submit Enrollment',
        desc: 'Click "Enroll & Train" to save the photos and generate face embeddings. This happens instantly — no lengthy training needed.',
        actionHint: 'Click the highlighted button to enroll',
      },
    ],
  },
  {
    title: 'Run Your First Scan',
    icon: Scan,
    color: '#FBBF24',
    path: '/test',
    gateCheck: async (api) => {
      if (sessionStorage.getItem('onboarding_test_scanned') === 'true') return true;
      if (document.querySelector('.confirmed-flash, .error-flash') || document.body.innerText.includes('GhostFaceNet')) {
        sessionStorage.setItem('onboarding_test_scanned', 'true');
        return true;
      }
      try { const r = await api.get(`${API_BASE}/dashboard`); return (r.data.history_stats?.total_predictions || 0) > 0; } catch { return false; }
    },
    gateMsg: 'Run a test scan to verify recognition',
    subSteps: [
      {
        target: '[data-tour="test-upload-area"]',
        title: 'Step 1: Upload a Test Photo',
        desc: 'Drag & drop an image into the highlighted area, or click "Browse Files" to select a photo of someone you just enrolled.',
        actionHint: 'Upload or browse for a test image',
      },
      {
        target: '[data-tour="test-run-btn"]',
        title: 'Step 2: Execute Inference',
        desc: 'Click "Execute Inference" to run face recognition on your uploaded photo. The system will identify the person and show a confidence score.',
        actionHint: 'Click the highlighted button to run recognition',
      },
    ],
  },
  {
    title: 'Your Daily Command Center',
    icon: Sparkles,
    color: '#5E6AD2',
    path: '/dashboard',
    gateCheck: async () => true,
    gateMsg: '',
    subSteps: [
      {
        target: '[data-tour="today-summary"]',
        title: 'Dashboard Overview',
        desc: 'This is what you\'ll check every day — live attendance counts, match accuracy, system health, and recognition history at a glance.',
        actionHint: 'You\'re all set! Click Finish to complete setup',
      },
    ],
  },
];

export default function OnboardingWizard() {
  const { user, apiClient, updateOnboardingState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stepIndex, setStepIndex] = useState(0);
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [gatePassed, setGatePassed] = useState(true);
  const [gateChecking, setGateChecking] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowDir: 'top' });
  const tooltipRef = useRef(null);

  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);
  const onbState = user?.onboarding_state || {};
  const isCompleted = onbState.completed === true;

  const currentStep = STEPS[stepIndex];
  const currentSubSteps = currentStep?.subSteps || [];
  const currentSubStep = currentSubSteps[subStepIndex];
  const totalSubSteps = currentSubSteps.length;
  const isLastSubStep = subStepIndex >= totalSubSteps - 1;
  const isLastStep = stepIndex >= STEPS.length - 1;
  const StepIcon = currentStep?.icon || Sparkles;

  // ─── Initialize ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin || isCompleted) { setIsActive(false); return; }
    const paused = sessionStorage.getItem('onboarding_paused') === 'true';
    const dismissed = localStorage.getItem('onboarding_dismissed') === 'true';
    const currentSavedStep = onbState.step ?? 0;
    if (paused || dismissed) {
      setIsActive(false);
    } else if (currentSavedStep === 0 && !sessionStorage.getItem('welcome_shown')) {
      setShowWelcome(true);
    } else {
      setStepIndex(Math.min(currentSavedStep, STEPS.length - 1));
      setSubStepIndex(0);
      setIsActive(true);
    }
  }, [isAdmin, isCompleted, user?.onboarding_state]);

  // ─── Navigate to step's page ─────────────────────────────────
  useEffect(() => {
    if (!isActive || showWelcome || showComplete) return;
    const targetPath = STEPS[stepIndex]?.path;
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [stepIndex, isActive, showWelcome, showComplete]);

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
    if (!isActive || showWelcome || showComplete) { setSpotlightRect(null); cleanupTarget(); return; }
    const sub = currentSubStep;
    if (!sub?.target) { setSpotlightRect(null); cleanupTarget(); return; }
    
    const el = document.querySelector(sub.target);
    if (!el) { setSpotlightRect(null); return; }
    
    // Elevate the target element above the overlay so it's clickable
    cleanupTarget();
    el.style.position = 'relative';
    el.style.zIndex = '99991';
    el.style.pointerEvents = 'all';
    el.classList.add('onb-target-elevated');
    prevTargetRef.current = el;
    
    // Scroll into view if offscreen (account for 52px stepper bar)
    const rect = el.getBoundingClientRect();
    if (rect.top < 60 || rect.bottom > window.innerHeight - 20) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => positionSpotlight(), 500);
      return;
    }

    const pad = 10;
    setSpotlightRect({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });

    // Position tooltip near the element
    requestAnimationFrame(() => {
      const ttEl = tooltipRef.current;
      if (!ttEl) return;
      const ttRect = ttEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      let top, left, arrowDir = 'top';
      
      // Prefer below the element
      if (rect.bottom + ttRect.height + 24 < vh) {
        top = rect.bottom + 14;
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - ttRect.width / 2, vw - ttRect.width - 16));
        arrowDir = 'top';
      }
      // Above
      else if (rect.top - ttRect.height - 24 > 60) {
        top = rect.top - ttRect.height - 14;
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - ttRect.width / 2, vw - ttRect.width - 16));
        arrowDir = 'bottom';
      }
      // Right side
      else {
        top = Math.max(70, rect.top);
        left = Math.min(rect.right + 16, vw - ttRect.width - 16);
        arrowDir = 'left';
      }
      
      setTooltipPos({ top, left, arrowDir });
    });
  }, [isActive, stepIndex, subStepIndex, showWelcome, showComplete, cleanupTarget, currentSubStep]);

  useEffect(() => {
    if (!isActive) { cleanupTarget(); return; }
    // Wait for page to render then position
    const timer = setTimeout(positionSpotlight, 400);
    const timer2 = setTimeout(positionSpotlight, 1000);
    window.addEventListener('resize', positionSpotlight);
    window.addEventListener('scroll', positionSpotlight, true);
    
    // Watch for DOM changes (e.g., modals opening after clicking the highlighted button)
    const observer = new MutationObserver(() => setTimeout(positionSpotlight, 200));
    observer.observe(document.body, { childList: true, subtree: true, attributes: false });
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', positionSpotlight);
      window.removeEventListener('scroll', positionSpotlight, true);
      observer.disconnect();
    };
  }, [positionSpotlight, isActive, location.pathname, cleanupTarget]);

  // ─── Gate checking (only on last sub-step of each step) ──────
  const checkGate = useCallback(async () => {
    if (!isActive || !STEPS[stepIndex]) return;
    if (!isLastSubStep) {
      // Sub-steps before the last one don't need gate checks
      setGatePassed(true);
      return;
    }
    setGateChecking(true);
    const passed = await STEPS[stepIndex].gateCheck(apiClient);
    setGatePassed(passed);
    setGateChecking(false);
  }, [isActive, stepIndex, subStepIndex, isLastSubStep, apiClient]);

  useEffect(() => {
    checkGate();
    const iv = setInterval(checkGate, 4000);
    return () => clearInterval(iv);
  }, [checkGate]);

  // ─── Persistence ─────────────────────────────────────────────
  const saveState = async (newStep, completed = false) => {
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

  // ─── Handlers ────────────────────────────────────────────────
  const startSetup = () => {
    setShowWelcome(false);
    sessionStorage.setItem('welcome_shown', 'true');
    sessionStorage.removeItem('onboarding_paused');
    setStepIndex(0);
    setSubStepIndex(0);
    setIsActive(true);
    saveState(0, false);
  };

  const doLater = () => {
    setShowWelcome(false);
    setShowComplete(false);
    setIsActive(false);
    cleanupTarget();
    sessionStorage.setItem('onboarding_paused', 'true');
    saveState(stepIndex, false); // Keep current step so user can resume from this step
  };

  const nextStep = () => {
    // If gate not passed, we still allow them to proceed if they explicitly click next (no blocking).
    if (!isLastSubStep) {
      // Advance to next sub-step within the same step
      setSubStepIndex(prev => prev + 1);
    } else if (!isLastStep) {
      // Advance to next major step
      const next = stepIndex + 1;
      setStepIndex(next);
      setSubStepIndex(0);
      saveState(next, false);
    } else {
      // Finished all steps
      setIsActive(false);
      setShowComplete(true);
    }
  };

  const prevStep = () => {
    if (subStepIndex > 0) {
      // Go back within sub-steps
      setSubStepIndex(prev => prev - 1);
    } else if (stepIndex > 0) {
      // Go back to previous step's last sub-step
      const prev = stepIndex - 1;
      setStepIndex(prev);
      setSubStepIndex(STEPS[prev].subSteps.length - 1);
      saveState(prev, false);
    }
  };

  const completeSetup = async () => {
    setShowComplete(false);
    setIsActive(false);
    cleanupTarget();
    sessionStorage.removeItem('onboarding_paused');
    localStorage.removeItem('onboarding_dismissed');
    await saveState(STEPS.length, true);
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="onb-welcome-modal"
            >
              <div className="onb-welcome-icon">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="onb-welcome-title">Welcome to RMS Face AI</h2>
              <p className="onb-welcome-desc">
                Let's get your system set up — this takes about 5 minutes. We'll walk you through each page step-by-step and highlight exactly what to click.
              </p>
              <div className="onb-welcome-steps">
                {STEPS.map((s, i) => (
                  <div key={i} className="onb-welcome-step-item">
                    <div className="onb-ws-dot" style={{ background: s.color + '20', borderColor: s.color + '50', color: s.color }}>
                      <s.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>{s.title}</span>
                      <span style={{ color: '#737780', fontSize: '11px', marginLeft: '6px' }}>
                        ({s.subSteps.length} {s.subSteps.length === 1 ? 'step' : 'steps'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={startSetup} className="onb-btn-primary">
                Start Guided Setup <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={doLater} className="onb-btn-ghost">I'll do this later</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Completion Modal ═══ */}
      <AnimatePresence>
        {showComplete && (
          <div className="onb-overlay-bg">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="onb-welcome-modal"
              style={{ borderColor: 'rgba(39, 166, 68, 0.40)' }}
            >
              <div className="onb-welcome-icon" style={{ background: 'rgba(39,166,68,0.12)', borderColor: 'rgba(39,166,68,0.30)', color: '#27A644' }}>
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="onb-welcome-title">You're All Set!</h2>
              <p className="onb-welcome-desc">
                Your organization is live with real hardware, enrolled subjects, and confirmed face recognition.
              </p>
              <div className="onb-complete-checklist">
                {['Organization reviewed', 'Camera key provisioned', 'Subject enrolled & trained', 'Recognition scan verified', 'Dashboard orientation'].map((label, i) => (
                  <div key={i} className="onb-complete-item">
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#27A644' }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <button onClick={completeSetup} className="onb-btn-primary" style={{ background: '#27A644' }}>
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
                <span className="onb-step-badge" style={{ color: currentStep.color, background: currentStep.color + '18', borderColor: currentStep.color + '40' }}>
                  <StepIcon className="w-3.5 h-3.5" />
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
                  <div key={i} className={`onb-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
                    style={i === stepIndex ? { background: currentStep.color } : {}}
                  />
                ))}
              </div>

              <div className="onb-stepper-right">
                <button onClick={prevStep} disabled={stepIndex === 0 && subStepIndex === 0} className="onb-bar-btn">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={nextStep}
                  className={`onb-bar-btn primary`}
                  style={{ background: currentStep.color }}
                >
                  {isLastStep && isLastSubStep ? 'Finish' : (isLastSubStep ? 'Next Step' : 'Next')} <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={doLater} className="onb-bar-skip" title="Skip Setup entirely">
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
            <div className="onb-tooltip-arrow" data-dir={tooltipPos.arrowDir} style={{ borderColor: currentStep.color + '60' }} />
            <div className="onb-tooltip-header">
              <div className="onb-tooltip-icon" style={{ background: currentStep.color + '18', borderColor: currentStep.color + '40', color: currentStep.color }}>
                <StepIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="onb-tooltip-title">{currentSubStep?.title || currentStep.title}</h4>
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
                      style={i <= subStepIndex ? { background: currentStep.color } : {}}
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
              <div className="onb-action-hint" style={{ borderColor: currentStep.color + '30', background: currentStep.color + '08' }}>
                <MousePointerClick className="w-3.5 h-3.5" style={{ color: currentStep.color, flexShrink: 0 }} />
                <span style={{ color: currentStep.color }}>{currentSubStep.actionHint}</span>
              </div>
            )}

            {/* Gate messages (only on last sub-step) */}
            {isLastSubStep && !gatePassed && currentStep.gateMsg && (
              <div className="onb-gate-msg">
                <span className="onb-gate-dot" />
                {currentStep.gateMsg}
                {gateChecking && <Loader2 className="w-3 h-3 animate-spin" style={{ marginLeft: 'auto' }} />}
              </div>
            )}

            {isLastSubStep && gatePassed && currentStep.gateMsg && (
              <div className="onb-gate-pass">
                <CheckCircle2 className="w-4 h-4" /> Done! You can proceed.
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        /* ═══ Overlay & Backdrop ═══ */
        .onb-overlay-bg {
          position: fixed; inset: 0; z-index: 99998;
          background: rgba(0,0,0,0.80); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .onb-backdrop-solid {
          position: fixed; inset: 0; z-index: 99990;
          background: rgba(0,0,0,0.65);
          pointer-events: none;
        }
        .onb-spotlight-hole {
          position: fixed; z-index: 99990;
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
          border: 2px solid rgba(94, 106, 210, 0.50);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: onb-pulse 2s ease-in-out infinite;
        }
        @keyframes onb-pulse {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 20px rgba(94,106,210,0.25); }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 35px rgba(94,106,210,0.40); }
        }
        /* Target element elevated above the overlay — CLICKABLE */
        .onb-target-elevated {
          cursor: pointer !important;
          filter: brightness(1.08);
          outline: none;
        }

        /* ═══ Welcome / Completion Modal ═══ */
        .onb-welcome-modal {
          background: #141516; border: 1px solid rgba(94,106,210,0.30);
          border-radius: 20px; max-width: 440px; width: 100%;
          padding: 36px; text-align: center;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .onb-welcome-icon {
          width: 56px; height: 56px; border-radius: 18px;
          background: rgba(94,106,210,0.12); border: 1px solid rgba(94,106,210,0.30);
          display: flex; align-items: center; justify-content: center; color: #828FFF;
        }
        .onb-welcome-title { color: #FFF; font-size: 22px; font-weight: 700; margin: 0; }
        .onb-welcome-desc { color: #A0A3AB; font-size: 13px; line-height: 1.6; margin: 0; }
        .onb-welcome-steps {
          display: flex; flex-direction: column; gap: 8px;
          width: 100%; text-align: left; padding: 0 8px;
        }
        .onb-welcome-step-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #E0E0E0; font-weight: 500;
        }
        .onb-ws-dot {
          width: 28px; height: 28px; border-radius: 8px;
          border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .onb-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px; border-radius: 12px;
          background: #5E6AD2; color: #FFF; border: none;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: background 0.2s; margin-top: 4px;
        }
        .onb-btn-primary:hover { background: #4A54AB; }
        .onb-btn-ghost {
          background: none; border: none; color: #737780;
          font-size: 13px; cursor: pointer; padding: 8px;
        }
        .onb-btn-ghost:hover { color: #A0A3AB; }
        .onb-complete-checklist {
          display: flex; flex-direction: column; gap: 8px;
          width: 100%; padding: 16px; border-radius: 12px;
          background: #0F1011; border: 1px solid rgba(255,255,255,0.08); text-align: left;
        }
        .onb-complete-item {
          display: flex; align-items: center; gap: 8px;
          color: #E0E0E0; font-size: 13px;
        }

        /* ═══ Stepper Bar ═══ */
        .onb-stepper-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 99995;
          background: rgba(15, 16, 17, 0.92); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(94, 106, 210, 0.25);
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
          padding: 4px 10px; border-radius: 8px;
          font-size: 11px; font-weight: 700; font-family: 'SF Mono', monospace;
          border: 1px solid; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .onb-step-title { font-size: 13px; font-weight: 700; color: #FFF; }
        .onb-substep-badge {
          font-size: 10px; font-weight: 600; color: #737780;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
          padding: 2px 8px; border-radius: 6px; font-family: 'SF Mono', monospace;
        }
        .onb-stepper-dots { display: flex; align-items: center; gap: 5px; }
        .onb-dot {
          width: 24px; height: 4px; border-radius: 2px;
          background: rgba(255,255,255,0.10); transition: all 0.3s;
        }
        .onb-dot.active { width: 32px; }
        .onb-dot.done { background: #27A644; }
        .onb-stepper-right { display: flex; align-items: center; gap: 6px; }
        .onb-bar-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          background: rgba(255,255,255,0.08); color: #E0E0E0;
          border: 1px solid rgba(255,255,255,0.12); transition: all 0.2s;
        }
        .onb-bar-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .onb-bar-btn.primary { color: #FFF; border: none; }
        .onb-bar-btn.primary:hover:not(.disabled) { filter: brightness(1.1); }
        .onb-bar-btn.disabled { opacity: 0.4; cursor: not-allowed; }
        .onb-bar-skip {
          background: rgba(229, 72, 77, 0.1); border: 1px solid rgba(229, 72, 77, 0.3);
          color: #E5484D; border-radius: 8px;
          font-size: 11px; font-weight: 600; cursor: pointer; padding: 6px 12px;
          margin-left: 8px; transition: all 0.2s;
        }
        .onb-bar-skip:hover { background: rgba(229, 72, 77, 0.2); }

        /* ═══ Tooltip ═══ */
        .onb-tooltip {
          position: fixed; z-index: 99996;
          background: #141516; border: 1px solid rgba(94,106,210,0.35);
          border-radius: 14px; padding: 18px;
          max-width: 380px; width: max-content;
          box-shadow: 0 16px 60px rgba(0,0,0,0.50);
          pointer-events: all;
          transition: top 0.3s ease, left 0.3s ease;
        }
        .onb-tooltip-arrow {
          position: absolute; width: 12px; height: 12px;
          background: #141516; border: 1px solid;
          transform: rotate(45deg);
        }
        .onb-tooltip-arrow[data-dir="top"] {
          top: -7px; left: 24px;
          border-right: none; border-bottom: none;
        }
        .onb-tooltip-arrow[data-dir="bottom"] {
          bottom: -7px; left: 24px;
          border-left: none; border-top: none;
        }
        .onb-tooltip-arrow[data-dir="left"] {
          left: -7px; top: 24px;
          border-right: none; border-top: none;
        }
        .onb-tooltip-header { display: flex; gap: 12px; align-items: flex-start; }
        .onb-tooltip-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid; flex-shrink: 0;
        }
        .onb-tooltip-title { color: #FFF; font-size: 14px; font-weight: 700; margin: 0 0 4px; }
        .onb-tooltip-desc { color: #A0A3AB; font-size: 12px; line-height: 1.5; margin: 0; }

        /* ═══ Sub-step Progress ═══ */
        .onb-substep-progress {
          display: flex; align-items: center; gap: 10px;
          margin-top: 14px; padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .onb-substep-track {
          display: flex; gap: 3px; flex: 1;
        }
        .onb-substep-segment {
          height: 4px; flex: 1; border-radius: 2px;
          background: rgba(255,255,255,0.10);
          transition: background 0.3s, transform 0.2s;
        }
        .onb-substep-segment.done { opacity: 0.7; }
        .onb-substep-segment.active { 
          transform: scaleY(1.3);
          animation: onb-seg-pulse 1.5s ease-in-out infinite;
        }
        @keyframes onb-seg-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .onb-substep-label {
          font-size: 10px; font-weight: 600; color: #737780;
          white-space: nowrap; font-family: 'SF Mono', monospace;
        }

        /* ═══ Action Hint ═══ */
        .onb-action-hint {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 8px 12px; border-radius: 8px;
          border: 1px solid; font-size: 11px; font-weight: 600;
        }

        /* ═══ Gate Messages ═══ */
        .onb-gate-msg {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 10px 12px; border-radius: 8px;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.20);
          color: #F87171; font-size: 11px; font-weight: 600;
        }
        .onb-gate-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #F87171; animation: onb-pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes onb-pulse-dot {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .onb-gate-pass {
          display: flex; align-items: center; gap: 8px;
          margin-top: 12px; padding: 10px 12px; border-radius: 8px;
          background: rgba(39,166,68,0.08); border: 1px solid rgba(39,166,68,0.20);
          color: #27A644; font-size: 11px; font-weight: 600;
        }

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
