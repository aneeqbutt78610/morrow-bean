import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Intentionally avoid sending user data or stack traces to an external service by default.
    if (import.meta.env.DEV) console.error('UI rendering error:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <section className="container error-screen" role="alert"><p className="eyebrow">A SMALL PAUSE</p><h1>Something didn’t quite brew.</h1><p>Please refresh the page and try again.</p><button className="button" onClick={() => window.location.reload()}>Refresh page</button></section>;
    }
    return this.props.children;
  }
}
