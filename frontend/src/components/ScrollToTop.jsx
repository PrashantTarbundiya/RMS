import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - Automatically resets scroll position to the top
 * on every route change across window, document body, and any .main-content containers.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      const mainContainers = document.querySelectorAll(
        '.main-content, .main-content-fullscreen, .app-container, main, [data-scroll-container]'
      );
      mainContainers.forEach(el => {
        if (el) el.scrollTop = 0;
      });
    };

    // 1. Reset immediately
    resetScroll();

    // 2. Reset on next animation frame after Framer Motion starts
    const rafId = requestAnimationFrame(resetScroll);

    // 3. Reset after brief delay when children DOM nodes have resolved
    const timerId = setTimeout(resetScroll, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [pathname]);

  return null;
}
