import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, Tag } from 'lucide-react';
import { money } from '@/lib/utils';
import { lineKey, useCart } from '@/cart/CartContext';

export function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
        {/* Animated empty bag */}
        <div className="relative mb-8 animate-float">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-3xl"
            style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-glow)' }}
          >
            <ShoppingBag className="h-14 w-14 text-white" />
          </div>
          <div
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--gradient-warm)' }}
          >
            0
          </div>
        </div>
        <h1
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          className="text-3xl text-text mb-3"
        >
          Your Cart is Empty
        </h1>
        <p className="text-text-secondary mb-8 max-w-xs">
          Looks like you haven't added anything yet. Let's find something awesome!
        </p>
        <Link
          to="/"
          className="btn-primary rounded-2xl px-8 py-3 text-sm font-bold flex items-center gap-2"
        >
          <ShoppingBag className="h-4 w-4" /> Start Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Popular categories */}
        <div className="mt-12 text-left">
          <p className="text-sm font-semibold text-text-secondary mb-4 text-center">
            Popular Categories
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Electronics 🎧', 'Fashion 👗', 'Home 🏠', 'Sports ⚽', 'Beauty 💄'].map((cat) => (
              <Link
                key={cat}
                to="/"
                className="rounded-full px-4 py-2 text-sm font-medium border border-border bg-surface text-text hover:border-accent/50 hover:text-accent transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            className="text-3xl text-text"
          >
            Your Cart
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Line Items ──────────────────────────────────── */}
        <div className="space-y-4">
          {/* Free shipping progress */}
          {subtotal < 50 && (
            <div className="rounded-2xl border border-border bg-surface p-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-text">
                  <Package className="h-4 w-4 text-accent" />
                  Add <span className="gradient-text">{money(50 - subtotal)}</span> more for free
                  shipping!
                </div>
                <span className="text-xs text-text-muted">
                  {Math.round((subtotal / 50) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((subtotal / 50) * 100, 100)}%`,
                    background: 'var(--gradient-brand)',
                  }}
                />
              </div>
            </div>
          )}

          {subtotal >= 50 && (
            <div
              className="rounded-2xl p-4 flex items-center gap-3 animate-scaleIn"
              style={{ background: '#10b98115', border: '1px solid #10b98130' }}
            >
              <div className="text-2xl">🎉</div>
              <div>
                <p className="text-sm font-bold text-emerald">Free shipping unlocked!</p>
                <p className="text-xs text-text-secondary">
                  Your order qualifies for free standard shipping
                </p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {items.map((item, idx) => {
              const key = lineKey(item);
              return (
                <div
                  key={key}
                  className="flex gap-4 rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:border-accent/20 hover:shadow-md animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.07}s` }}
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 border border-border">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-3xl">📦</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/products/${item.slug}`}
                          className="text-sm font-semibold text-text hover:text-accent transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        {item.variant && (
                          <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {Object.entries(item.variant)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(key)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-all"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-0.5">
                        <button
                          onClick={() => setQuantity(key, item.quantity - 1)}
                          className="qty-btn h-7 w-7"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-text">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(key, item.quantity + 1)}
                          className="qty-btn h-7 w-7"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-base font-bold text-text">
                        {money(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Order Summary ──────────────────────────────── */}
        <div className="h-fit space-y-0 rounded-3xl border border-border bg-surface overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-5 border-b border-border" style={{ background: 'var(--surface-2)' }}>
            <h2
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              className="text-lg text-text"
            >
              Order Summary
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Coupon */}
            <div className="flex gap-2">
              <input placeholder="Promo code" className="nova-input flex-1 text-sm" />
              <button
                className="rounded-xl px-4 py-2 text-sm font-bold text-white shrink-0"
                style={{ background: 'var(--gradient-brand)' }}
              >
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Subtotal ({items.length} items)</span>
                <span className="font-semibold text-text">{money(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Shipping</span>
                <span className="font-semibold text-emerald">
                  {shipping === 0 ? '🎉 Free' : money(shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Tax (8%)</span>
                <span className="font-semibold text-text">{money(tax)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-base font-bold text-text">Total</span>
              <span
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                className="text-2xl gradient-text"
              >
                {money(total)}
              </span>
            </div>

            {/* CTA */}
            <Link
              to="/checkout"
              className="btn-primary w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-xs text-center text-text-muted">
              🔒 Secure checkout · SSL encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
