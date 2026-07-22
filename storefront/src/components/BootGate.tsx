import type { ReactNode } from 'react';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';
import { useAuth } from '@/auth/AuthContext';

/**
 * Holds a branded splash until the storefront config (theme + identity) and the
 * customer session have resolved — so the app never flashes default tokens before
 * the admin theme from /settings/public is applied.
 */
export function BootGate({ children }: { children: ReactNode }) {
  const { loading: configLoading, config } = useStorefrontConfig();
  const { loading: authLoading } = useAuth();

  if (configLoading || authLoading) {
    return <BootSplash storeName={config?.storeName} />;
  }
  return <>{children}</>;
}

function BootSplash({ storeName }: { storeName?: string }) {
  const name = storeName || 'Vogue Vesture';
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg animate-fadeIn">
      {/* Branded Text Logo */}
      <div className="text-center space-y-2">
        <h1
          className="text-4xl font-black uppercase tracking-[0.2em] text-text"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {name}
        </h1>
        <p className="text-xs tracking-[0.4em] text-text-secondary uppercase">Loading Experience</p>
      </div>

      {/* Unique Premium Loader */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-md border border-danger/30 opacity-75" />
        {/* Inner spinning segmented ring */}
        <div className="h-12 w-12 animate-spin rounded-md border-2 border-t-danger border-r-transparent border-b-danger/20 border-l-transparent" />
      </div>
    </div>
  );
}
