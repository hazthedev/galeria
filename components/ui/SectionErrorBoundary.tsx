'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  title: string;
  message?: string;
  className?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SECTION_ERROR_BOUNDARY]', error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className={`rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 ${this.props.className || ''}`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-sm font-semibold">{this.props.title}</h3>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  {this.props.message || 'This section crashed. You can retry it without reloading the whole page.'}
                </p>
              </div>
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry section
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
