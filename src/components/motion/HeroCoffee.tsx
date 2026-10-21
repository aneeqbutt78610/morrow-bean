import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useAfterIdle } from '../../hooks/useAfterIdle';
import { useCanLoadHeavyMedia } from '../../hooks/useCanLoadHeavyMedia';
import { useInView } from '../../hooks/useInView';

// The hero's centrepiece, as a gate around the lazy 3D cappuccino.
//
// The poster still always renders first: it is the instant paint and the LCP
// element. The 3D chunk (three + R3F + drei) is only *imported* once all hold:
//   - the page has loaded and the main thread is idle,
//   - the hero is within 200px of the viewport,
//   - heavy media is appropriate: motion allowed, no data-saver / 2g, WebGL works.
// Otherwise — or if the chunk or WebGL fails — the poster simply stays.
// The canvas fades in over the poster only after its first frame has rendered;
// the poster is a render of that same first frame, so there's no visible jump.

const POSTER = '/hero-coffee-poster.jpg';
const POSTER_WIDTH = 1200;
const POSTER_HEIGHT = 1450;

const HeroCoffee3D = lazy(() => import('./HeroCoffee3D'));

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}
const getVisible = (): boolean => !document.hidden;
const getServerVisible = (): boolean => true;

interface SilentBoundaryProps {
  onError: () => void;
  children: ReactNode;
}

/** Swallows 3D failures (chunk load, WebGL init, shader) so the poster stays. */
class SilentBoundary extends Component<SilentBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

export function HeroCoffee() {
  const frame = useRef<HTMLDivElement>(null);
  const canLoad = useCanLoadHeavyMedia();
  const idle = useAfterIdle(canLoad);
  const near = useInView(frame, { rootMargin: '200px' });
  const pageVisible = useSyncExternalStore(subscribeVisibility, getVisible, getServerVisible);

  // Latch: once the scene is requested it stays mounted (just paused off-screen).
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (canLoad && idle && near) setArmed(true);
  }, [canLoad, idle, near]);

  const reveal = useCallback(() => setShown(true), []);
  const fail = useCallback(() => setShown(false), []);

  return (
    <div ref={frame} className={`hero-coffee${shown ? ' is-ready' : ''}`}>
      <img
        className="hero-coffee__poster"
        src={POSTER}
        alt="A latte-art cappuccino resting on a bed of roasted coffee beans"
        width={POSTER_WIDTH}
        height={POSTER_HEIGHT}
        loading="eager"
        decoding="async"
        // React 18 doesn't know the camelCase prop yet; pass the DOM attribute.
        {...{ fetchpriority: 'high' }}
      />
      {armed && (
        <SilentBoundary onError={fail}>
          <Suspense fallback={null}>
            <HeroCoffee3D active={near && pageVisible && canLoad} onFirstFrame={reveal} />
          </Suspense>
        </SilentBoundary>
      )}
    </div>
  );
}
