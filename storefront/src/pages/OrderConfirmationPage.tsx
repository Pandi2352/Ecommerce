import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Package, Mail, Truck, Star, ArrowRight, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setConfettiVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  function copyOrderNumber() {
    navigator.clipboard.writeText(orderNumber ?? '').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const CONFETTI = ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🎁', '🛍️'];

  return (
    <div className="relative mx-auto max-w-2xl py-8 animate-fadeIn">
      {/* Confetti burst */}
      {confettiVisible && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${5 + i * 6}%`,
                top: '-40px',
                animation: `fadeIn ${0.5 + i * 0.1}s ease both, float ${1.5 + (i % 3) * 0.5}s ease-in-out ${0.3 + i * 0.1}s infinite`,
              }}
            >
              {CONFETTI[i % CONFETTI.length]}
            </div>
          ))}
        </div>
      )}

      {/* Success Card */}
      <div className="rounded-3xl overflow-hidden shadow-2xl border border-border">
        {/* Gradient Header */}
        <div
          className="relative p-8 text-center overflow-hidden"
          style={{ background: 'var(--gradient-hero)' }}
        >
          {/* Orbs */}
          <div
            className="orb w-48 h-48 opacity-20"
            style={{ background: '#6366f1', top: '-40px', left: '-20px' }}
          />
          <div
            className="orb w-36 h-36 opacity-15"
            style={{ background: '#ec4899', bottom: '-20px', right: '10%', animationDelay: '-3s' }}
          />

          {/* Success icon */}
          <div className="relative z-10 flex justify-center mb-5">
            <div className="relative">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '3px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <CheckCircle2 className="h-10 w-10 text-emerald" />
              </div>
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-emerald animate-ping"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>

          <h1
            style={{ fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1.1 }}
            className="relative z-10 text-3xl text-white mb-2"
          >
            Order Confirmed! 🎉
          </h1>
          <p className="relative z-10 text-white/70 text-sm">
            {order?.customer?.name ? `Thanks ${order.customer.name}!` : 'Thank you!'} Your order is
            being processed.
          </p>

          {/* Order number */}
          <div
            className="relative z-10 inline-flex items-center gap-3 mt-5 rounded-2xl px-5 py-3"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="text-left">
              <p className="text-xs text-white/50 uppercase tracking-wider">Order Number</p>
              <p className="text-lg font-mono font-bold text-white">{orderNumber}</p>
            </div>
            <button
              onClick={copyOrderNumber}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Steps / Timeline */}
        <div className="bg-surface-2 px-8 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            {[
              { icon: CheckCircle2, label: 'Order Placed', done: true, color: '#10b981' },
              { icon: Package, label: 'Processing', done: false, color: '#6366f1' },
              { icon: Truck, label: 'Shipping', done: false, color: '#f97316' },
              { icon: Star, label: 'Delivered', done: false, color: '#ec4899' },
            ].map(({ icon: Icon, label, done, color }, i, arr) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all"
                    style={
                      done
                        ? { background: `${color}20`, borderColor: color, color }
                        : {
                            background: 'var(--surface)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-muted)',
                          }
                    }
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p
                    className="text-xs font-semibold text-center"
                    style={{ color: done ? color : 'var(--text-muted)' }}
                  >
                    {label}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 rounded-full"
                    style={{ background: done ? color : 'var(--border)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        {order && (
          <div className="p-6 bg-surface space-y-5">
            {/* Customer info */}
            <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 border border-border">
              <Mail className="h-4.5 w-4.5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text">{order.customer.name}</p>
                <p className="text-xs text-text-secondary">{order.customer.email}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-bold text-text mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-text-muted">
                          {Object.entries(item.variant)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-text">{money(item.subtotal)}</p>
                      <p className="text-xs text-text-muted">× {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="p-4 space-y-2">
                <Row label="Subtotal" value={money(order.subtotal)} />
                {order.discount > 0 && (
                  <Row
                    label="Discount"
                    value={`− ${money(order.discount)}`}
                    valueClass="text-emerald"
                  />
                )}
                {order.shipping >= 0 && (
                  <Row
                    label="Shipping"
                    value={order.shipping === 0 ? 'Free 🎉' : money(order.shipping)}
                    valueClass={order.shipping === 0 ? 'text-emerald' : undefined}
                  />
                )}
                {order.tax > 0 && <Row label="Tax" value={money(order.tax)} />}
                {order.paymentMethod && <Row label="Payment" value={order.paymentMethod} />}
              </div>
              <div
                className="flex items-center justify-between px-4 py-4"
                style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}
              >
                <span className="font-bold text-text">Total Paid</span>
                <span
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                  className="text-2xl gradient-text"
                >
                  {money(order.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="p-6 bg-surface border-t border-border flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="btn-primary flex-1 rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="flex-1 rounded-2xl py-3 text-sm font-bold border-2 border-border text-text-secondary hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2">
            <Package className="h-4 w-4" /> Track Order
          </button>
        </div>
      </div>

      {/* Post-order message */}
      <p className="text-center text-xs text-text-muted mt-4">
        A confirmation email has been sent to{' '}
        <span className="text-accent">{order?.customer?.email ?? 'your email'}</span>
      </p>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-semibold ${valueClass ?? 'text-text'}`}>{value}</span>
    </div>
  );
}
