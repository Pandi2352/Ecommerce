import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';
import { useCart } from '@/cart/CartContext';

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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-text">Checkout</h1>
        <div className="rounded-md border border-border bg-surface p-12 text-center text-sm text-text-secondary">
          Your cart is empty.
          <div>
            <Link to="/" className="mt-3 inline-block text-info">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const set =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

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
      toast.success('Order placed!');
      navigate(`/order/${order.orderNumber}`, { state: { order: res.data } });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Checkout failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section title="Contact details">
            <Field label="Full name" required value={form.name} onChange={set('name')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
              />
              <Field label="Phone" value={form.phone} onChange={set('phone')} />
            </div>
          </Section>

          <Section title="Shipping address">
            <Field label="Address" required value={form.line1} onChange={set('line1')} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" required value={form.city} onChange={set('city')} />
              <Field label="State" value={form.state} onChange={set('state')} />
              <Field
                label="Postal code"
                required
                value={form.postalCode}
                onChange={set('postalCode')}
              />
            </div>
          </Section>

          <Section title="Payment">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text">Payment method</span>
              <select
                value={form.paymentMethod}
                onChange={set('paymentMethod')}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-info"
              >
                <option value="COD">Cash on delivery</option>
                <option value="CARD">Card (pay on delivery)</option>
              </select>
            </label>
          </Section>
        </div>

        {/* Summary */}
        <div className="h-fit space-y-4 rounded-md border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">Your order</h2>
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-2 text-sm">
                <span className="text-text-secondary">
                  {i.name} × {i.quantity}
                </span>
                <span className="text-text">{money(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-sm font-medium text-text">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <p className="text-xs text-text-secondary">
            Final totals (shipping, tax) are confirmed by the store.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-40"
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-md border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-info"
      />
    </label>
  );
}
