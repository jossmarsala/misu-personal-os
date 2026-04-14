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
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#333', height: '100vh', fontFamily: 'monospace' }}>
          <h2>Misu OS - Fatal Error ⚠️</h2>
          <p>Algo salió mal al cargar la aplicación. (Error Boundary)</p>
          <pre style={{ background: '#000', padding: '15px', color: 'red', overflow: 'auto' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px' }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
