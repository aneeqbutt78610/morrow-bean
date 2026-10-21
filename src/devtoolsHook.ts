// Imported before react-dom so its dev-only "Download the React DevTools" console banner
// is skipped. If the real DevTools extension is installed, its hook already exists and is kept.
declare global {
  interface Window { __REACT_DEVTOOLS_GLOBAL_HOOK__?: { isDisabled?: boolean } }
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ??= { isDisabled: true };
}

export {};
