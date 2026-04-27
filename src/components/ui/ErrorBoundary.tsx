import * as React from 'react';
import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import {
  ErrorFallbackInline,
  ErrorFallbackPage,
  ErrorFallbackSilent,
  type FallbackRenderProps,
} from './error-boundary-fallbacks';

export { ErrorFallbackInline, ErrorFallbackPage, ErrorFallbackSilent, type FallbackRenderProps };

declare global {
  interface Window {
    Sentry?: { captureException: (error: unknown, context?: unknown) => void };
  }
}

export type ErrorBoundaryVariant = 'inline' | 'page' | 'silent';

export type ErrorBoundaryProps = {
  children: ReactNode;
  /** Custom UI when an error is caught; receives reset that re-mounts children */
  fallback?: ReactNode | ((props: FallbackRenderProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Logical section name for logs and monitoring */
  section: string;
  /** When this value changes, the boundary clears and children render again */
  resetKey?: string | number;
  /** Default fallback when `fallback` is not provided */
  variant?: ErrorBoundaryVariant;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown error');
  }
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { hasError: true, error: toError(error) };
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const err = toError(error);
    const { section, onError } = this.props;
    const stack = errorInfo?.componentStack ?? '';

    console.error(`[ATLAS ErrorBoundary:${section}]`, err, stack.trim());

    this.setState({ errorInfo });

    onError?.(err, errorInfo);

    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      window.Sentry.captureException(err, { tags: { section }, extra: { componentStack: stack } });
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKey } = this.props;
    if (resetKey !== undefined && prevProps.resetKey !== resetKey && this.state.hasError) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private renderDefaultFallback(): ReactNode {
    const { section, variant = 'inline' } = this.props;
    const { error, errorInfo } = this.state;
    const props: FallbackRenderProps = {
      error,
      reset: this.reset,
      section,
      componentStack: errorInfo?.componentStack ?? null,
    };

    if (variant === 'silent') {
      return <ErrorFallbackSilent />;
    }
    if (variant === 'page') {
      return <ErrorFallbackPage {...props} />;
    }
    return <ErrorFallbackInline {...props} />;
  }

  override render(): ReactNode {
    const { children, fallback, section } = this.props;

    if (this.state.hasError) {
      if (fallback !== undefined && fallback !== null) {
        if (typeof fallback === 'function') {
          return fallback({
            error: this.state.error ?? new Error('Render error'),
            reset: this.reset,
            section,
            componentStack: this.state.errorInfo?.componentStack ?? null,
          });
        }
        return fallback;
      }
      return this.renderDefaultFallback();
    }

    return children;
  }
}

export type WithErrorBoundaryOptions = {
  section: string;
  variant?: ErrorBoundaryVariant;
  /** Prop name on wrapped component whose value is passed as boundary `resetKey` */
  resetKeyProp?: string;
};

/**
 * Wraps a component in {@link ErrorBoundary}. Example:
 * `const SafeWidget = withErrorBoundary(MyWidget, { section: 'bookings', variant: 'inline', resetKeyProp: 'id' });`
 */
export function withErrorBoundary<P extends object>(
  Wrapped: ComponentType<P>,
  options: WithErrorBoundaryOptions,
): ComponentType<P> {
  const { section, variant = 'inline', resetKeyProp } = options;

  const displayName = Wrapped.displayName || Wrapped.name || 'Component';

  function ComponentWithBoundary(props: P) {
    const resetKey =
      resetKeyProp !== undefined && resetKeyProp in (props as object)
        ? String((props as Record<string, unknown>)[resetKeyProp] ?? '')
        : undefined;

    return (
      <ErrorBoundary section={section} variant={variant} resetKey={resetKey}>
        <Wrapped {...props} />
      </ErrorBoundary>
    );
  }

  ComponentWithBoundary.displayName = `WithErrorBoundary(${displayName})`;
  return ComponentWithBoundary;
}
