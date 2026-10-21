import { defineConfig, type UserConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `react()` is typed against the app's Vite 6, while `vitest/config` carries its
// own bundled Vite 5 types. They collide only at type-check time (both run fine),
// so cast the plugins to the type vitest expects until vitest is upgraded for Vite 6.
const plugins = [react()] as unknown as UserConfig['plugins'];

export default defineConfig({
  plugins,
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    clearMocks: true,
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
