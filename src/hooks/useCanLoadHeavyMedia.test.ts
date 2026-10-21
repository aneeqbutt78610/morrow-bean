import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { isConstrainedConnection, useCanLoadHeavyMedia } from './useCanLoadHeavyMedia';
import { clearConnection, mockConnection, mockMatchMedia, mockWebGL } from '../test/mediaMocks';

afterEach(clearConnection);

describe('useCanLoadHeavyMedia', () => {
  it('allows heavy media with motion, a normal connection, and WebGL', () => {
    mockMatchMedia(false);
    mockWebGL(true);
    mockConnection({ effectiveType: '4g', saveData: false });
    expect(renderHook(() => useCanLoadHeavyMedia()).result.current).toBe(true);
  });

  it('is false with reduced motion, and skips the WebGL probe', () => {
    mockMatchMedia(true);
    const { getContext } = mockWebGL(true);
    expect(renderHook(() => useCanLoadHeavyMedia()).result.current).toBe(false);
    expect(getContext).not.toHaveBeenCalled();
  });

  it.each([
    ['data saver', { saveData: true }],
    ['2g', { effectiveType: '2g' }],
    ['slow-2g', { effectiveType: 'slow-2g' }],
  ])('is false on %s', (_label, connection) => {
    mockMatchMedia(false);
    mockWebGL(true);
    mockConnection(connection);
    expect(renderHook(() => useCanLoadHeavyMedia()).result.current).toBe(false);
  });

  it('is false without WebGL', () => {
    mockMatchMedia(false);
    mockWebGL(false);
    expect(renderHook(() => useCanLoadHeavyMedia()).result.current).toBe(false);
  });
});

describe('isConstrainedConnection', () => {
  it('only flags data saver and 2g-class links', () => {
    expect(isConstrainedConnection(undefined)).toBe(false);
    expect(isConstrainedConnection({ effectiveType: '3g' })).toBe(false);
    expect(isConstrainedConnection({ saveData: true })).toBe(true);
    expect(isConstrainedConnection({ effectiveType: 'slow-2g' })).toBe(true);
  });
});
