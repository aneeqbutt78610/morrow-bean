import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getMediaQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
}

function subscribe(onChange: () => void): () => void {
  const mql = getMediaQuery();
  if (!mql) return () => {};
  // Safari < 14 only has the deprecated addListener API.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

const getSnapshot = (): boolean => getMediaQuery()?.matches ?? false;
const getServerSnapshot = (): boolean => false;

/** Live `prefers-reduced-motion: reduce`; false when matchMedia is unavailable. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
