import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Lazily loads GSAP + ScrollTrigger.
 * Returns { gsapRef, scrollTriggerRef, ready, prefersReducedMotion }
 * 
 * gsapRef.current / scrollTriggerRef.current hold the loaded modules.
 * `ready` flips to true once loaded. 
 * If prefersReducedMotion is true, animations should show instant end-states.
 */
export function useGsap() {
  const gsapRef = useRef(null);
  const scrollTriggerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const gsapModule = await import('gsap');
        const stModule = await import('gsap/ScrollTrigger');

        if (cancelled) return;

        const gsap = gsapModule.default || gsapModule.gsap || gsapModule;
        const ScrollTrigger = stModule.default || stModule.ScrollTrigger || stModule;

        gsap.registerPlugin(ScrollTrigger);

        gsapRef.current = gsap;
        scrollTriggerRef.current = ScrollTrigger;
        setReady(true);
      } catch (err) {
        console.warn('[useGsap] Failed to load GSAP:', err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { gsapRef, scrollTriggerRef, ready, prefersReducedMotion };
}
