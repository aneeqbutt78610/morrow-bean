import { useEffect, useState } from 'react';

let cached: boolean | undefined;

function probe(): boolean {
  // jsdom and very old browsers have no WebGL constructor at all — bail before
  // touching getContext (jsdom logs a "not implemented" error for it).
  if (typeof document === 'undefined' || typeof WebGLRenderingContext === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    // Release the probe context right away; browsers cap live contexts.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Synchronous, cached WebGL capability check. */
export function detectWebGL(): boolean {
  if (cached === undefined) cached = probe();
  return cached;
}

/** Test seam: forget the cached probe result. */
export function resetWebGLSupportCache(): void {
  cached = undefined;
}

/**
 * Whether WebGL is available. `null` until probed — the probe runs in an effect
 * (never during render), and only while `enabled`, so it costs nothing on first
 * paint or when heavy media is already ruled out.
 */
export function useWebGLSupport(enabled = true): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(() => cached ?? null);
  useEffect(() => {
    if (enabled && supported === null) setSupported(detectWebGL());
  }, [enabled, supported]);
  return supported;
}
