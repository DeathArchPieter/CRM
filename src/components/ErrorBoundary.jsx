import React from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.toString()}\n\nStack:\n${error?.stack || ''}\n\nComponent Stack:\n${errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, copied } = this.state;
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#090d16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: '#f8fafc'
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1)',
            padding: '32px',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  Something went wrong in the application
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  An unexpected runtime error occurred. You can reload the app or report this error message.
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#020617',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              padding: '16px',
              marginBottom: '24px',
              maxHeight: '260px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#f87171', marginBottom: '8px', fontFamily: 'monospace' }}>
                {error?.name || 'Error'}: {error?.message || 'Unknown error'}
              </div>
              {error?.stack && (
                <pre style={{
                  fontSize: '11px',
                  color: '#64748b',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  lineHeight: '1.5'
                }}>
                  {error.stack}
                </pre>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <RefreshCw size={15} />
                Reload Application
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              >
                <Home size={15} />
                Reset View
              </button>

              <button
                onClick={this.handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: copied ? '#4ade80' : '#94a3b8',
                  border: copied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  transition: 'all 0.15s ease'
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied Details' : 'Copy Error Details'}
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
