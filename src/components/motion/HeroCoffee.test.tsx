import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { HeroCoffee3DProps } from './HeroCoffee3D';
import {
  clearConnection,
  mockConnection,
  mockIdleCallback,
  mockIntersectionObserver,
  mockMatchMedia,
  mockWebGL,
} from '../../test/mediaMocks';

// jsdom has no WebGL, so the lazy 3D module is replaced by a stand-in that
// records when it was imported and reports its first frame like the real one.
const scene = { imports: 0, fail: false };
function fakeSceneModule() {
  scene.imports += 1;
  return {
    default: function FakeHeroCoffee3D({ active, onFirstFrame }: HeroCoffee3DProps) {
      if (scene.fail) throw new Error('WebGL init failed');
      useEffect(() => onFirstFrame(), [onFirstFrame]);
      return <div data-testid="hero-3d" data-active={String(active)} />;
    },
  };
}

async function loadHeroCoffee() {
  // Fresh module graph per test, and the mock re-registered with it, so React.lazy
  // has no cached import and `scene.imports` counts this test's imports only.
  vi.resetModules();
  vi.doMock('./HeroCoffee3D', fakeSceneModule);
  const { HeroCoffee } = await import('./HeroCoffee');
  return HeroCoffee;
}

let idle: ReturnType<typeof mockIdleCallback>;
let Observer: ReturnType<typeof mockIntersectionObserver>;

beforeEach(() => {
  scene.imports = 0;
  scene.fail = false;
  mockMatchMedia(false);
  mockWebGL(true);
  idle = mockIdleCallback();
  Observer = mockIntersectionObserver();
});
afterEach(clearConnection);

const poster = () => screen.getByRole('img', { name: /latte-art cappuccino/i });
const enterView = () => act(() => Observer.instances[0].trigger(true));

describe('HeroCoffee', () => {
  it('paints the poster immediately and does not import the 3D chunk before it is in view', async () => {
    const HeroCoffee = await loadHeroCoffee();
    render(<HeroCoffee />);
    expect(poster()).toHaveAttribute('fetchpriority', 'high');
    expect(poster()).toHaveAttribute('width', '1200');
    expect(poster()).toHaveAttribute('height', '1450');
    act(() => idle.flush());
    expect(scene.imports).toBe(0);
    expect(screen.queryByTestId('hero-3d')).toBeNull();
  });

  it('mounts the scene only once it is both in view and idle, then reveals it', async () => {
    const HeroCoffee = await loadHeroCoffee();
    const { container } = render(<HeroCoffee />);
    expect(Observer.instances[0].options?.rootMargin).toBe('200px');
    enterView();
    expect(scene.imports).toBe(0); // in view, but not idle yet
    act(() => idle.flush());
    expect(await screen.findByTestId('hero-3d')).toHaveAttribute('data-active', 'true');
    expect(scene.imports).toBe(1);
    expect(container.querySelector('.hero-coffee')).toHaveClass('is-ready');
  });

  it.each([
    ['reduced motion', () => mockMatchMedia(true)],
    ['data saver', () => mockConnection({ saveData: true })],
    ['a 2g connection', () => mockConnection({ effectiveType: '2g' })],
    ['a slow-2g connection', () => mockConnection({ effectiveType: 'slow-2g' })],
    ['no WebGL', () => mockWebGL(false)],
  ])('stays poster-only with %s', async (_label, arrange) => {
    arrange();
    const HeroCoffee = await loadHeroCoffee();
    render(<HeroCoffee />);
    enterView();
    act(() => idle.flush());
    await act(async () => {});
    expect(scene.imports).toBe(0);
    expect(screen.queryByTestId('hero-3d')).toBeNull();
    expect(poster()).toBeVisible();
  });

  it('falls back to the poster when the 3D module errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    scene.fail = true;
    const HeroCoffee = await loadHeroCoffee();
    const { container } = render(<HeroCoffee />);
    enterView();
    act(() => idle.flush());
    await waitFor(() => expect(scene.imports).toBe(1));
    await act(async () => {});
    expect(screen.queryByTestId('hero-3d')).toBeNull();
    expect(poster()).toBeInTheDocument();
    expect(container.querySelector('.hero-coffee')).not.toHaveClass('is-ready');
  });

  it('cleans up the observer, idle callback, and listeners on unmount', async () => {
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const HeroCoffee = await loadHeroCoffee();
    const { unmount } = render(<HeroCoffee />);
    const observer = Observer.instances[0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
    expect(idle.cancel).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
