import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { money } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';
import { fetchMyOrder, type MyOrder } from '@/account/account.api';
import { OrderTimeline } from '@/account/components/OrderTimeline';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const stateOrder = (location.state as { order?: MyOrder } | null)?.order ?? null;

  const [order, setOrder] = useState<MyOrder | null>(stateOrder);
  const [loading, setLoading] = useState(!stateOrder && !!user);

  // On refresh (no router state), a signed-in customer can re-fetch their order.
  useEffect(() => {
    if (order || !user || !orderNumber) return;
    setLoading(true);
    fetchMyOrder(orderNumber)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [order, user, orderNumber]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      {/* Success header */}
      <div className="rounded-md border border-border bg-surface p-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-text">Thank you for your order!</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your order <span className="font-mono font-semibold text-text">{orderNumber}</span> has
          been placed.
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Payment method: <span className="font-semibold text-text">Cash on Delivery</span>
        </p>
      </div>

      {loading && <p className="text-center text-sm text-text-secondary">Loading order…</p>}

      {order && (
        <>
          {/* Timeline */}
          <div className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-bold text-text">Order status</h2>
            <OrderTimeline status={order.status} timeline={order.timeline ?? []} />
          </div>

          {/* Items + totals */}
          <div className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-bold text-text">Order details</h2>
            <div className="space-y-2">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between gap-2 text-sm">
                  <span className="text-text-secondary line-clamp-1">
                    {i.name}
                    {i.variant ? ` (${Object.values(i.variant).join(', ')})` : ''} × {i.quantity}
                  </span>
                  <span className="shrink-0 text-text">{money(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              {order.discount > 0 && <Row label="Discount" value={`− ${money(order.discount)}`} />}
              <Row label="Shipping" value={order.shipping > 0 ? money(order.shipping) : 'Free'} />
              {order.tax > 0 && <Row label="Tax" value={money(order.tax)} />}
              <div className="flex justify-between border-t border-border pt-2 font-bold text-text">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-2 text-sm font-bold text-text">Shipping to</h2>
              <p className="text-sm text-text">{order.shippingAddress.fullName}</p>
              <p className="text-xs text-text-secondary">
                {[
                  order.shippingAddress.line1,
                  order.shippingAddress.line2,
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                  order.shippingAddress.postalCode,
                  order.shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-center gap-3">
        <Link
          to="/products"
          className="rounded-md bg-danger px-5 py-2.5 text-sm font-bold text-white hover:bg-danger/90"
        >
          Continue shopping
        </Link>
        {user && (
          <Link
            to="/account"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-bg"
          >
            View my orders
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-text-secondary">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
