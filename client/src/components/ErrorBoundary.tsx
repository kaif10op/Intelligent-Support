import React, { type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4 py-12">
          <div className="glass-elevated border border-destructive/20 rounded-lg p-12 max-w-md w-full space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Error Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h2>
              <p className="text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Error Stack */}
            <div className="bg-card/50 border border-border/30 rounded-lg p-4 max-h-40 overflow-y-auto">
              <code className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
              </code>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border/50 text-foreground font-medium hover:bg-card/50 transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Note */}
            <p className="text-xs text-muted-foreground/70 text-center">
              If this persists, try refreshing the page or clearing your cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
