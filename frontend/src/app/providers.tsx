import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/** Global providers wrapper (theme, toasts, error boundary). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
