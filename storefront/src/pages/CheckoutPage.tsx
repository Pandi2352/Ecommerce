import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';
import { useCart } from '@/cart/CartContext';
import { useAuth } from '@/auth/AuthContext';
import { User, Mail, Phone, MapPin, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

interface FormState {
  name: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  paymentMethod: 'COD',
};

const STEPS = ['Contact', 'Shipping', 'Payment', 'Review'];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  // Prefill contact details for a signed-in customer so the order links to their account.
  const [form, setForm] = useState<FormState>(
    user ? { ...EMPTY, name: user.name, email: user.email, phone: user.phone ?? '' } : EMPTY,
  );
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
        <div className="text-6xl mb-6 animate-float">🛒</div>
        <h1
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          className="text-3xl text-text mb-2"
        >
          No Items to Checkout
        </h1>
        <p className="text-text-secondary mb-6">Add some items to your cart first.</p>
        <Link to="/" className="btn-primary rounded-xl px-6 py-2.5 text-sm font-bold">
          Browse Products
        </Link>
      </div>
    );
  }

  const set =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/storefront/checkout', {
        customer: { name: form.name, email: form.email, phone: form.phone || undefined },
        items: items.map((i) => ({
          productId: i.productId,
          variant: i.variant,
          quantity: i.quantity,
        })),
        shippingAddress: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
        },
        paymentMethod: form.paymentMethod,
      });
      const order = res.data as { orderNumber: string };
      clear();
      toast.success('Order placed! 🎉');
      navigate(`/order/${order.orderNumber}`, { state: { order: res.data } });
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <h1
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          className="text-3xl text-text mb-2"
        >
          Secure Checkout
        </h1>
        <p className="text-sm text-text-secondary flex items-center justify-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald" /> SSL encrypted · Your information is safe
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-0 rounded-2xl overflow-hidden border border-border bg-surface">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 text-xs font-semibold transition-all"
            style={
              i === 0
                ? { background: 'var(--gradient-brand)', color: 'white' }
                : { color: 'var(--text-muted)' }
            }
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0"
              style={
                i === 0 ? { background: 'rgba(255,255,255,0.25)' } : { background: 'var(--border)' }
              }
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{step}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Contact */}
          <Section
            icon={<User className="h-4.5 w-4.5" />}
            title="Contact Details"
            gradient="var(--gradient-brand)"
          >
            <Field
              icon={<User className="h-4 w-4" />}
              label="Full Name"
              required
              value={form.name}
              onChange={set('name')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
              />
              <Field
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={form.phone}
                onChange={set('phone')}
              />
            </div>
          </Section>

          {/* Shipping */}
          <Section
            icon={<MapPin className="h-4.5 w-4.5" />}
            title="Shipping Address"
            gradient="var(--gradient-cool)"
          >
            <Field
              icon={<MapPin className="h-4 w-4" />}
              label="Street Address"
              required
              value={form.line1}
              onChange={set('line1')}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" required value={form.city} onChange={set('city')} />
              <Field label="State" value={form.state} onChange={set('state')} />
              <Field
                label="Postal Code"
                required
                value={form.postalCode}
                onChange={set('postalCode')}
              />
            </div>
          </Section>

          {/* Payment */}
          <Section
            icon={<CreditCard className="h-4.5 w-4.5" />}
            title="Payment Method"
            gradient="var(--gradient-warm)"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  value: 'COD',
                  label: 'Cash on Delivery',
                  emoji: '💵',
                  desc: 'Pay when your order arrives',
                },
                {
                  value: 'CARD',
                  label: 'Card on Delivery',
                  emoji: '💳',
                  desc: 'Swipe card at your door',
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: opt.value }))}
                  className="flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200"
                  style={
                    form.paymentMethod === opt.value
                      ? { borderColor: 'var(--accent)', background: 'rgba(99,102,241,0.06)' }
                      : { borderColor: 'var(--border)', background: 'var(--surface)' }
                  }
                >
                  <span className="text-2xl mt-0.5">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-text">{opt.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                  </div>
                  {form.paymentMethod === opt.value && (
                    <div className="ml-auto">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-3xl border border-border bg-surface overflow-hidden shadow-lg">
          <div className="p-5 border-b border-border" style={{ background: 'var(--surface-2)' }}>
            <h2
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              className="text-lg text-text"
            >
              Your Order ({items.length})
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Items list */}
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {items.map((i, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden shrink-0 border border-border">
                    {i.image ? (
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text line-clamp-1">{i.name}</p>
                    <p className="text-xs text-text-muted">× {i.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-text shrink-0">
                    {money(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium text-text">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Shipping</span>
                <span className="font-medium text-emerald">
                  {shipping === 0 ? 'Free 🎉' : money(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Tax (8%)</span>
                <span className="font-medium text-text">{money(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-bold text-text">Total</span>
                <span
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                  className="text-2xl gradient-text"
                >
                  {money(total)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{' '}
                  Placing Order…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Place Order · {money(total)}
                </>
              )}
            </button>
            <p className="text-xs text-center text-text-muted">
              By placing your order you agree to our Terms & Privacy Policy
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  icon,
  gradient,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b border-border"
        style={{ background: 'var(--surface-2)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold text-text">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  type = 'text',
  value,
  onChange,
  icon,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-text">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          className="nova-input"
          style={{ paddingLeft: icon ? '2.5rem' : '0.875rem' }}
        />
      </div>
    </label>
  );
}
