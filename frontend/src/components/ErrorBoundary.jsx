import React from 'react';
import { AlertTriangle, Home, RotateCcw, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ErrorBoundary — Catches unhandled JavaScript errors in child components.
 * Displays a premium error screen with recovery options instead of a blank page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset} 
      />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, onReset }) {
  return (
    <div className="min-h-screen bg-[#010102] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-lg text-center"
      >
        {/* Error Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-[#F87171]/10 border border-[#F87171]/20 flex items-center justify-center">
          <AlertTriangle className="w-9 h-9 text-[#F87171]" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-ink-subtle text-sm leading-relaxed max-w-md mx-auto mb-8">
          An unexpected error occurred while rendering this page. 
          This has been logged for debugging. You can try reloading or navigate back to safety.
        </p>

        {/* Error Details (Collapsible) */}
        <details className="mb-8 text-left">
          <summary className="text-xs text-ink-tertiary cursor-pointer hover:text-ink-subtle transition-colors flex items-center gap-1.5 justify-center">
            <Bug className="w-3.5 h-3.5" />
            Technical Details
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-[#0F1011] border border-[#23252A] overflow-auto max-h-48">
            <pre className="text-[11px] font-mono text-[#F87171] whitespace-pre-wrap break-words">
              {error?.toString()}
            </pre>
            {errorInfo?.componentStack && (
              <pre className="text-[10px] font-mono text-ink-tertiary whitespace-pre-wrap break-words mt-2 pt-2 border-t border-[#23252A]">
                {errorInfo.componentStack.slice(0, 500)}
              </pre>
            )}
          </div>
        </details>

        {/* Recovery Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { onReset(); window.location.href = '/dashboard'; }}
            className="button-primary flex items-center gap-2 px-5 py-2.5"
          >
            <Home className="w-4 h-4" />
            <span className="text-button text-white">Go to Dashboard</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="button-secondary flex items-center gap-2 px-5 py-2.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-button">Reload Page</span>
          </button>
        </div>

        {/* Branding */}
        <p className="mt-10 text-[10px] text-ink-tertiary tracking-wider uppercase">
          RMS Face AI • Error Recovery
        </p>
      </motion.div>
    </div>
  );
}

export default ErrorBoundary;
