import { Outlet } from 'react-router-dom';
import { storeConfig } from '@/config/store.config';

/** Split auth shell: a branded SVG panel (left) + the form card (right). No shadows. */
export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      {/* Brand panel — hidden on mobile */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-indigo-600 p-10 text-white lg:flex">
        {/* Decorative SVG pattern + shapes (identity, not UI chrome) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]" aria-hidden>
          <defs>
            <pattern id="auth-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-white/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full border border-white/10"
          aria-hidden
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-md bg-white text-sm font-black text-indigo-600">
            {storeConfig.logoMark}
          </div>
          <span className="text-sm font-bold tracking-tight">{storeConfig.name}</span>
        </div>

        {/* Headline */}
        <div className="relative max-w-sm">
          <h2 className="text-2xl font-bold leading-snug">Run your store with clarity.</h2>
          <p className="mt-2 text-sm text-white/70">
            Products, orders, customers and insights — one calm, fast admin.
          </p>
        </div>

        <p className="relative text-xs text-white/60">© {storeConfig.name}. Admin access only.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="grid size-8 place-items-center rounded-md bg-indigo-600 text-sm font-black text-white">
              {storeConfig.logoMark}
            </div>
            <span className="text-sm font-bold text-text">{storeConfig.name}</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
