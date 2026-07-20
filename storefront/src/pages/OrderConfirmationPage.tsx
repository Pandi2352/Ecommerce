import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { money } from '@/lib/utils';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: Record<string, string>;
}

interface Order {
  orderNumber: string;
  customer: { name: string; email: string };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod?: string;
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6 text-center">
      <div className="flex justify-center">
        <CheckCircle2 className="h-14 w-14 text-success" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-text">Thank you for your order!</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your order <span className="font-medium text-text">{orderNumber}</span> has been placed.
        </p>
      </div>

      {order && (
        <div className="space-y-4 rounded-md border border-border bg-surface p-5 text-left">
          <div className="space-y-2">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-2 text-sm">
                <span className="text-text-secondary">
                  {i.name} × {i.quantity}
                </span>
                <span className="text-text">{money(i.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={money(order.subtotal)} />
            {order.discount > 0 && <Row label="Discount" value={`− ${money(order.discount)}`} />}
            {order.shipping > 0 && <Row label="Shipping" value={money(order.shipping)} />}
            {order.tax > 0 && <Row label="Tax" value={money(order.tax)} />}
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-text">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
          {order.paymentMethod && (
            <p className="text-xs text-text-secondary">Payment: {order.paymentMethod}</p>
          )}
        </div>
      )}

      <Link
        to="/"
        className="inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        Continue shopping
      </Link>
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
