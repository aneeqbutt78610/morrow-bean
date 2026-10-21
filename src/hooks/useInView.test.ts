import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInView } from './useInView';
import { mockIntersectionObserver } from '../test/mediaMocks';

const ref = () => ({ current: document.createElement('div') });

describe('useInView', () => {
  it('tracks intersection with the given options and disconnects on unmount', () => {
    const Observer = mockIntersectionObserver();
    const { result, unmount } = renderHook(() => useInView(ref(), { rootMargin: '200px' }));
    const observer = Observer.instances[0];
    expect(result.current).toBe(false);
    expect(observer.options?.rootMargin).toBe('200px');
    act(() => observer.trigger(true));
    expect(result.current).toBe(true);
    act(() => observer.trigger(false));
    expect(result.current).toBe(false);
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('stops observing after first entry with once', () => {
    const Observer = mockIntersectionObserver();
    renderHook(() => useInView(ref(), { once: true }));
    act(() => Observer.instances[0].trigger(true));
    expect(Observer.instances[0].disconnect).toHaveBeenCalled();
  });

  it('assumes visible without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    expect(renderHook(() => useInView(ref())).result.current).toBe(true);
  });
});
