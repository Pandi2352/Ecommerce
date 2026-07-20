import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/features/auth/AuthContext';
import { CartProvider } from '@/features/cart/CartContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/** Global providers wrapper (theme, auth, cart, toasts, error boundary). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

