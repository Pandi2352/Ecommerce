import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { money } from '@/lib/utils';
import { lineKey, useCart } from '@/cart/CartContext';

export function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-text">Your cart</h1>
        <div className="rounded-md border border-border bg-surface p-12 text-center">
          <p className="text-sm text-text-secondary">Your cart is empty.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Your cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Line items */}
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
          {items.map((item) => {
            const key = lineKey(item);
            return (
              <div key={key} className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-bg">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-text-secondary">
                      —
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/products/${item.slug}`}
                        className="text-sm font-medium text-text hover:text-info"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {Object.entries(item.variant)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(key)}
                      className="rounded-md p-1 text-text-secondary hover:bg-bg hover:text-danger"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        onClick={() => setQuantity(key, item.quantity - 1)}
                        className="grid h-8 w-8 place-items-center text-text-secondary hover:bg-bg"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(key, item.quantity + 1)}
                        className="grid h-8 w-8 place-items-center text-text-secondary hover:bg-bg"
                        aria-label="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-text">
                      {money(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="h-fit space-y-4 rounded-md border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">Order summary</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-medium text-text">{money(subtotal)}</span>
          </div>
          <p className="text-xs text-text-secondary">Shipping & taxes calculated at checkout.</p>
          <Link
            to="/checkout"
            className="block rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            Checkout
          </Link>
          <Link to="/" className="block text-center text-xs text-text-secondary hover:text-text">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
