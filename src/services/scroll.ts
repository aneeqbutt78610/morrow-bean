import type Lenis from 'lenis';

// Shared handle to the active Lenis instance (set by <SmoothScroll/>), so other
// code — like route-change scroll-to-top — can drive the smooth scroller instead
// of fighting it with native window.scrollTo. Falls back to native when Lenis is
// not running (reduced motion, or before mount).
let instance: Lenis | null = null;

export function setLenis(next: Lenis | null): void {
  instance = next;
}

export function scrollToTop(immediate = true): void {
  if (instance) {
    instance.scrollTo(0, { immediate });
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
  }
}
