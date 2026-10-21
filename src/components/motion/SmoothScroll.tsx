import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis } from '../../services/scroll';

/**
 * Enables Lenis inertia/eased scrolling for that "premium" momentum feel.
 * Honors prefers-reduced-motion (falls back to native scroll), drives a single
 * rAF loop, and tears everything down on unmount.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      // Ease-out cubic — matches the site's reveal easing for a consistent feel.
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    setLenis(lenis);

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };
    frame = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frame);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
