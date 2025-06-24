import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Performance boundary for error handling without breaking optimization
export class PerformanceBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.warn('Performance boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Performance error details:', error, errorInfo);
    
    // Track performance impact
    if (performance.mark) {
      performance.mark('performance-error');
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">Loading optimized experience...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mt-2"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}