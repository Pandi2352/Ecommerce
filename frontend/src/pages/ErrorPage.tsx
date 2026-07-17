import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface ErrorStateProps {
  code: string | number;
  title: string;
  message: string;
  showRetry?: boolean;
  className?: string;
}

/** Presentational error panel — bordered, rounded-md, no shadow. Reused by every error page. */
export function ErrorState({ code, title, message, showRetry, className }: ErrorStateProps) {
  const navigate = useNavigate();
  return (
    <div className={cn('flex min-h-[60vh] w-full items-center justify-center p-6', className)}>
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-8 text-center">
        <div
          className="mx-auto mb-4 font-mono text-6xl font-extrabold leading-none text-text/15"
          aria-hidden
        >
          {code}
        </div>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button onClick={() => navigate('/')}>
            <Home className="size-4" /> Back to dashboard
          </Button>
          {showRetry && (
            <Button variant="secondary" onClick={() => navigate(0)}>
              <RefreshCw className="size-4" /> Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 404 — catch-all route. */
export function NotFound() {
  return (
    <ErrorState
      code={404}
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
    />
  );
}

/** 403 — no permission. */
export function Forbidden() {
  return (
    <ErrorState
      code={403}
      title="Access denied"
      message="You don't have permission to view this resource. Contact an admin if you think this is a mistake."
    />
  );
}

/** 400 — bad request. */
export function BadRequest() {
  return (
    <ErrorState
      code={400}
      title="Bad request"
      message="Something about that request wasn't valid. Please check your input and try again."
      showRetry
    />
  );
}

/** 500 — server error. */
export function ServerError() {
  return (
    <ErrorState
      code={500}
      title="Something went wrong"
      message="An unexpected error occurred on our end. Please try again in a moment."
      showRetry
    />
  );
}

/**
 * Router-level error boundary (errorElement). Renders a standalone error page for
 * thrown route errors — maps 404 responses to NotFound, everything else to 500.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFound />;
    if (error.status === 403) return <Forbidden />;
    if (error.status === 400) return <BadRequest />;
    return (
      <ErrorState
        code={error.status}
        title={error.statusText || 'Request failed'}
        message={(error.data as string) || 'The request could not be completed.'}
        showRetry
      />
    );
  }

  return <ServerError />;
}
