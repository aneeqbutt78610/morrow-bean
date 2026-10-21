import { vi } from 'vitest';
import type { NetworkInformationLike } from '../hooks/useCanLoadHeavyMedia';
import { resetWebGLSupportCache } from '../hooks/useWebGLSupport';

// Browser APIs jsdom lacks (or fakes poorly) for the heavy-media / hero tests.
// Globals stubbed here are restored by setup.ts (unstubAllGlobals/restoreAllMocks);
// navigator.connection is not a global stub, so call clearConnection() after use.

export function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_type: string, listener: () => void) => { listeners.add(listener); }),
    removeEventListener: vi.fn((_type: string, listener: () => void) => { listeners.delete(listener); }),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
  return {
    mql,
    set(next: boolean) {
      mql.matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

export class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn(() => []);

  constructor(readonly callback: IntersectionObserverCallback, readonly options?: IntersectionObserverInit) {
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

export function mockIntersectionObserver(): typeof MockIntersectionObserver {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  return MockIntersectionObserver;
}

export function mockIdleCallback() {
  const pending = new Map<number, IdleRequestCallback>();
  let nextId = 0;
  const request = vi.fn((callback: IdleRequestCallback) => {
    nextId += 1;
    pending.set(nextId, callback);
    return nextId;
  });
  const cancel = vi.fn((id: number) => { pending.delete(id); });
  vi.stubGlobal('requestIdleCallback', request);
  vi.stubGlobal('cancelIdleCallback', cancel);
  return {
    request,
    cancel,
    flush() {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback({ didTimeout: false, timeRemaining: () => 50 }));
    },
  };
}

export function mockConnection(connection: NetworkInformationLike): void {
  Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
}

export function clearConnection(): void {
  Reflect.deleteProperty(navigator, 'connection');
}

/** Pretend WebGL is (or isn't) available, and reset the cached probe. */
export function mockWebGL(available: boolean) {
  resetWebGLSupportCache();
  vi.stubGlobal('WebGLRenderingContext', function WebGLRenderingContext() {});
  const loseContext = vi.fn();
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation((() => (available ? { getExtension: () => ({ loseContext }) } : null)) as unknown as HTMLCanvasElement['getContext']);
  return { getContext, loseContext };
}
