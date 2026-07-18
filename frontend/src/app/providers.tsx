import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/** Global providers wrapper (theme, auth, toasts, error boundary). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
