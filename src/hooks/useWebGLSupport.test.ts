import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { detectWebGL, resetWebGLSupportCache, useWebGLSupport } from './useWebGLSupport';
import { mockWebGL } from '../test/mediaMocks';

describe('useWebGLSupport', () => {
  it('is false where WebGL does not exist (jsdom)', () => {
    resetWebGLSupportCache();
    expect(detectWebGL()).toBe(false);
  });

  it('detects WebGL, releases the probe context, and caches the result', () => {
    const { getContext, loseContext } = mockWebGL(true);
    expect(renderHook(() => useWebGLSupport()).result.current).toBe(true);
    expect(loseContext).toHaveBeenCalled();
    renderHook(() => useWebGLSupport());
    expect(getContext).toHaveBeenCalledTimes(1);
  });

  it('is false when no context can be created', () => {
    mockWebGL(false);
    expect(renderHook(() => useWebGLSupport()).result.current).toBe(false);
  });

  it('does not probe while disabled', () => {
    const { getContext } = mockWebGL(true);
    expect(renderHook(() => useWebGLSupport(false)).result.current).toBeNull();
    expect(getContext).not.toHaveBeenCalled();
  });
});
