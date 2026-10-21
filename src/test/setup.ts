import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  // Unmount rendered components so the DOM doesn't leak between tests
  // (otherwise repeated renders create duplicate elements and queries throw).
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
