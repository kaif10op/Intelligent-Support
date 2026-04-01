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
        <div className="error-boundary-container">
          <div className="error-boundary-content glass">
            <div className="error-icon">
              <AlertTriangle size={48} color="#ff6464" />
            </div>
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <div className="error-details">
              <code>{this.state.error?.stack?.split('\n').slice(0, 3).join('\n')}</code>
            </div>
            <div className="error-actions">
              <button onClick={this.handleReset} className="btn-primary">
                <RotateCcw size={16} />
                <span>Try Again</span>
              </button>
              <button onClick={() => window.location.href = '/'} className="btn-secondary">
                Return to Dashboard
              </button>
            </div>
            <p className="error-note">
              If this problem persists, please contact support or refresh the page.
            </p>
          </div>

          <style>{`
            .error-boundary-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 60vh;
              padding: 24px;
            }

            .error-boundary-content {
              max-width: 500px;
              width: 100%;
              padding: 48px 32px;
              border-radius: 20px;
              border: 1px solid rgba(255, 100, 100, 0.2);
              text-align: center;
              display: flex;
              flex-direction: column;
              gap: 24px;
            }

            .error-icon {
              display: flex;
              justify-content: center;
            }

            .error-boundary-content h2 {
              color: #fff;
              font-size: 1.5rem;
              margin: 0;
            }

            .error-message {
              color: var(--text-muted);
              font-size: 1rem;
              margin: 0;
            }

            .error-details {
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 100, 100, 0.1);
              border-radius: 12px;
              padding: 16px;
              overflow-x: auto;
              max-height: 150px;
              overflow-y: auto;
            }

            .error-details code {
              color: #ff8888;
              font-family: 'Monaco', 'Courier New', monospace;
              font-size: 0.8rem;
              line-height: 1.4;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            }

            .btn-primary, .btn-secondary {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 12px 24px;
              border-radius: 10px;
              font-weight: 600;
              font-size: 0.95rem;
              cursor: pointer;
              transition: 0.2s;
              border: none;
            }

            .btn-primary {
              background: var(--accent-primary);
              color: #fff;
            }

            .btn-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
            }

            .btn-secondary {
              background: rgba(255, 255, 255, 0.05);
              color: #fff;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .btn-secondary:hover {
              background: rgba(255, 255, 255, 0.1);
            }

            .error-note {
              font-size: 0.8rem;
              color: var(--text-muted);
              margin: 0;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
