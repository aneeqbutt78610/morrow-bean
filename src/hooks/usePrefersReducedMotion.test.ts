import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { mockMatchMedia } from '../test/mediaMocks';

describe('usePrefersReducedMotion', () => {
  it('is false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });

  it('reflects the media query and follows changes', () => {
    const media = mockMatchMedia(true);
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
    act(() => media.set(false));
    expect(result.current).toBe(false);
    unmount();
    expect(media.mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
