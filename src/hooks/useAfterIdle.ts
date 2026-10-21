import { useEffect, useState } from 'react';

/** Fallback delay where requestIdleCallback is missing (Safari). */
const FALLBACK_DELAY_MS = 200;

/**
 * Flips to true once the page has finished loading and the main thread is
 * idle, so heavy follow-up work never competes with first paint or the LCP
 * image. Uses requestIdleCallback, with a setTimeout fallback. Does nothing
 * while `enabled` is false.
 */
export function useAfterIdle(enabled = true, timeout = 2000): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled || idle) return;
    let idleId: number | undefined;
    let timerId: number | undefined;

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => setIdle(true), { timeout });
      } else {
        timerId = window.setTimeout(() => setIdle(true), FALLBACK_DELAY_MS);
      }
    };

    const loaded = document.readyState === 'complete';
    if (loaded) schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      window.removeEventListener('load', schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [enabled, idle, timeout]);

  return idle;
}
