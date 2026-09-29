import React, { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Emmanuel System ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-[#ba1a1a]/30 rounded-3xl p-8 max-w-lg shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-extrabold text-[#191c20]">System Runtime Exception Caught</h1>
            <p className="text-xs text-[#51606f] leading-relaxed">
              The application encountered a recoverable render error. The system's in-memory isolation safeguarded active state.
            </p>
            <div className="bg-[#f2f4fa] p-3 rounded-xl font-mono text-[11px] text-[#ba1a1a] text-left overflow-x-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-[#006494] hover:bg-[#004c73] text-white text-xs font-bold rounded-full transition cursor-pointer"
            >
              Restart Emmanuel Console
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
