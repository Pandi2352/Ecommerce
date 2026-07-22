import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { money } from '@/lib/utils';
import { lineKey, useCart } from '@/cart/CartContext';

export function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-md border border-border bg-surface">
          <ShoppingBag className="h-7 w-7 text-text-secondary" />
        </div>
        <h1 className="text-xl font-bold text-text">Your cart is empty</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse the catalog and add something you like.
        </p>
        <Link
          to="/products"
          className="mt-5 inline-block rounded-md bg-danger px-5 py-2.5 text-sm font-bold text-white hover:bg-danger/90"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Your Cart</h1>
          <p className="text-xs text-text-secondary">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link to="/products" className="text-sm font-semibold text-danger hover:underline">
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
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
                <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.slug}`}
                        className="text-sm font-semibold text-text hover:text-danger line-clamp-1"
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
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(key, item.quantity + 1)}
                        className="grid h-8 w-8 place-items-center text-text-secondary hover:bg-bg"
                        aria-label="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-text">
                      {money(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="h-fit space-y-4 rounded-md border border-border bg-surface p-5 lg:sticky lg:top-4">
          <h2 className="text-sm font-bold text-text">Order summary</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-semibold text-text">{money(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Shipping</span>
            <span className="font-semibold text-text">Free</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-text">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            className="block rounded-md bg-danger px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-danger/90"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
