import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAfterIdle } from './useAfterIdle';
import { mockIdleCallback } from '../test/mediaMocks';

afterEach(() => {
  Reflect.deleteProperty(document, 'readyState');
  vi.useRealTimers();
});

describe('useAfterIdle', () => {
  it('turns true once the browser is idle', () => {
    const idle = mockIdleCallback();
    const { result } = renderHook(() => useAfterIdle());
    expect(result.current).toBe(false);
    act(() => idle.flush());
    expect(result.current).toBe(true);
  });

  it('schedules nothing while disabled', () => {
    const idle = mockIdleCallback();
    renderHook(() => useAfterIdle(false));
    expect(idle.request).not.toHaveBeenCalled();
  });

  it('waits for the load event before scheduling', () => {
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
    const idle = mockIdleCallback();
    renderHook(() => useAfterIdle());
    expect(idle.request).not.toHaveBeenCalled();
    act(() => { window.dispatchEvent(new Event('load')); });
    expect(idle.request).toHaveBeenCalledTimes(1);
  });

  it('falls back to setTimeout without requestIdleCallback', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const { result } = renderHook(() => useAfterIdle());
    act(() => { vi.advanceTimersByTime(250); });
    expect(result.current).toBe(true);
  });

  it('cancels the pending callback on unmount', () => {
    const idle = mockIdleCallback();
    const { unmount } = renderHook(() => useAfterIdle());
    unmount();
    expect(idle.cancel).toHaveBeenCalledWith(1);
  });
});
