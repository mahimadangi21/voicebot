import React from 'react'
import VoiceBot from './VoiceBot'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', color: '#EF4444', backgroundColor: '#070B1A', minHeight: '100vh', fontFamily: 'monospace', overflowY: 'auto' }}>
          <h2 style={{ color: '#F8FAFC', fontSize: '20px', marginBottom: '10px' }}>⚠️ React Application Crashed</h2>
          <p style={{ color: '#F5A623', fontSize: '15px', marginBottom: '20px' }}>
            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
          </p>
          <h3 style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>Stack Trace:</h3>
          <pre style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #1E2940', fontSize: '12px', color: '#E2E8F0', leadingHeight: '1.5' }}>
            {this.state.error && this.state.error.stack}
          </pre>
          {this.state.errorInfo && (
            <>
              <h3 style={{ color: '#94A3B8', fontSize: '14px', marginTop: '20px', marginBottom: '5px' }}>Component Stack:</h3>
              <pre style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #1E2940', fontSize: '12px', color: '#E2E8F0' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <VoiceBot />
    </ErrorBoundary>
  )
}

export default App
