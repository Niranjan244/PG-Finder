import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/search';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-theme-bg text-theme-primary">
          <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-8 text-center shadow-lg transition-colors">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-theme-primary">Something went wrong</h2>
            <p className="mt-1.5 text-xs text-theme-muted leading-relaxed">
              An unexpected error occurred while displaying this view. Please try reloading or returning to search.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 rounded-lg bg-theme-surface-hover p-3 text-[11px] font-mono text-theme-secondary text-left overflow-x-auto border border-theme-border/70">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Explore PGs</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
