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
    return <BootSplash storeName={config?.storeName} logoUrl={config?.logoUrl} />;
  }
  return <>{children}</>;
}

function BootSplash({ storeName, logoUrl }: { storeName?: string; logoUrl?: string }) {
  const name = storeName || 'MAXSHOP';
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-12 max-w-[220px] object-contain animate-pulse" />
      ) : (
        <div
          className="text-4xl font-black uppercase tracking-tight animate-pulse"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="text-text">{name.slice(0, 3)}</span>
          <span className="text-danger">{name.slice(3) || 'SHOP'}</span>
        </div>
      )}

      {/* Indeterminate progress bar */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-surface-2">
        <div
          className="boot-bar h-full w-1/2 rounded-full"
          style={{ background: 'var(--danger)' }}
        />
      </div>
    </div>
  );
}
