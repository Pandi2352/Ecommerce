import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/cart/CartContext';

export function Layout() {
  const { count } = useCart();
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-base font-semibold text-text">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg">
              N
            </span>
            NovaShop
          </Link>
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-bg"
          >
            <ShoppingBag className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-md bg-accent px-1 text-xs font-medium text-accent-fg">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-text-secondary">
          © NovaShop — a demo storefront.
        </div>
      </footer>
    </div>
  );
}
