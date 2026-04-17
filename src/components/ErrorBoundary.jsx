import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Misu ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '32px',
          fontFamily: 'Outfit, sans-serif',
          background: '#1c1b1a',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '2.5rem' }}>⚡</span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#f2ede9' }}>Something went wrong</h1>
          <p style={{ fontSize: '0.82rem', color: '#756f6b', margin: 0, maxWidth: '340px', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            style={{
              marginTop: '8px',
              padding: '8px 24px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#f2ede9',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'Outfit, sans-serif',
            }}
            onClick={() => window.location.reload()}
          >
            Reload Misu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
