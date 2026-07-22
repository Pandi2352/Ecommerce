import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';
import { Field, TextInput } from '@/components/form';
import { lineKey, useCart } from '@/cart/CartContext';
import { useAuth } from '@/auth/AuthContext';
import { AddressPicker } from '@/account/components/AddressPicker';
import type { Address } from '@/account/account.api';

interface GuestAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}
const EMPTY_GUEST: GuestAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear, remove } = useCart();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [guest, setGuest] = useState<GuestAddress>(EMPTY_GUEST);
  const [submitting, setSubmitting] = useState(false);

  const onSelectAddress = useCallback((a: Address | null) => setSelectedAddress(a), []);
  const setG = (k: keyof GuestAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setGuest((g) => ({ ...g, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <h1 className="text-xl font-bold text-text">Checkout</h1>
        <div className="mt-4 rounded-md border border-border bg-surface p-10 text-sm text-text-secondary">
          Your cart is empty.
          <div>
            <Link
              to="/products"
              className="mt-3 inline-block font-semibold text-danger hover:underline"
            >
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function placeOrder() {
    // Resolve the shipping address (saved selection for members, typed for guests).
    const addr = user
      ? selectedAddress && {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone ?? '',
          line1: selectedAddress.line1,
          line2: selectedAddress.line2 ?? '',
          city: selectedAddress.city,
          state: selectedAddress.state ?? '',
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country ?? 'India',
        }
      : guest;

    if (!name.trim() || !email.trim()) return toast.error('Name and email are required');
    if (!addr || !addr.line1?.trim() || !addr.city?.trim() || !addr.postalCode?.trim()) {
      return toast.error('Please provide a complete shipping address');
    }

    setSubmitting(true);
    try {
      // Re-resolve each cart line by its slug so stale product ids (e.g. after a
      // catalog reseed) are healed, and anything genuinely gone is dropped.
      const resolved: { productId: string; variant?: Record<string, string>; quantity: number }[] =
        [];
      const gone: typeof items = [];
      for (const i of items) {
        try {
          const p = await api.get<{ id: string }>(`/storefront/products/${i.slug}`);
          resolved.push({ productId: p.data.id, variant: i.variant, quantity: i.quantity });
        } catch {
          gone.push(i);
        }
      }
      if (gone.length) {
        gone.forEach((g) => remove(lineKey(g)));
        toast.error(
          `${gone.length} item(s) are no longer available and were removed from your cart.`,
        );
        if (resolved.length === 0) {
          setSubmitting(false);
          return;
        }
      }

      const res = await api.post('/storefront/checkout', {
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined },
        items: resolved,
        shippingAddress: addr,
        paymentMethod: 'COD',
      });
      const order = res.data as { orderNumber: string };
      clear();
      toast.success('Order placed!');
      navigate(`/order/${order.orderNumber}`, { state: { order: res.data } });
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div>
        <h1 className="text-xl font-bold text-text">Checkout</h1>
        <p className="text-xs text-text-secondary">
          Complete your details below — you're just a step away from your order.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Contact */}
          <Section title="Contact details" step={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" required>
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone">
                <TextInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 90000 00000"
                  autoComplete="tel"
                />
              </Field>
            </div>
            {!user && (
              <p className="mt-3 text-xs text-text-secondary">
                Have an account?{' '}
                <Link
                  to="/auth/login"
                  state={{ from: '/checkout' }}
                  className="font-semibold text-danger hover:underline"
                >
                  Sign in
                </Link>{' '}
                to use your saved addresses.
              </p>
            )}
          </Section>

          {/* Shipping address */}
          <Section title="Shipping address" step={2}>
            {user ? (
              <AddressPicker onSelect={onSelectAddress} />
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <TextInput
                      value={guest.fullName}
                      onChange={setG('fullName')}
                      placeholder="Recipient's full name"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Phone">
                    <TextInput
                      value={guest.phone}
                      onChange={setG('phone')}
                      placeholder="+91 90000 00000"
                      autoComplete="tel"
                    />
                  </Field>
                </div>
                <Field label="Address line 1" required>
                  <TextInput
                    value={guest.line1}
                    onChange={setG('line1')}
                    placeholder="House / flat no, street"
                    autoComplete="address-line1"
                  />
                </Field>
                <Field label="Address line 2">
                  <TextInput
                    value={guest.line2}
                    onChange={setG('line2')}
                    placeholder="Area, landmark (optional)"
                    autoComplete="address-line2"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="City" required>
                    <TextInput value={guest.city} onChange={setG('city')} placeholder="Bengaluru" />
                  </Field>
                  <Field label="State">
                    <TextInput
                      value={guest.state}
                      onChange={setG('state')}
                      placeholder="Karnataka"
                    />
                  </Field>
                  <Field label="Postal code" required>
                    <TextInput
                      value={guest.postalCode}
                      onChange={setG('postalCode')}
                      placeholder="560001"
                      autoComplete="postal-code"
                    />
                  </Field>
                </div>
              </div>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment method" step={3}>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-danger bg-danger/5 p-3">
                <span className="grid h-4 w-4 place-items-center rounded-full border border-danger bg-danger">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <Banknote className="h-4 w-4 text-danger" />
                <span className="text-sm font-semibold text-text">Cash on Delivery</span>
                <span className="ml-auto text-[11px] text-text-secondary">Pay when it arrives</span>
              </label>
              <div className="flex cursor-not-allowed items-center gap-3 rounded-md border border-border p-3 opacity-60">
                <span className="h-4 w-4 rounded-full border border-border" />
                <CreditCard className="h-4 w-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-secondary">Card / UPI</span>
                <span className="ml-auto text-[11px] text-text-secondary">Coming soon</span>
              </div>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <div className="h-fit space-y-4 rounded-md border border-border bg-surface p-5 lg:sticky lg:top-4">
          <h2 className="text-sm font-bold text-text">Order summary</h2>
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-2 text-sm">
                <span className="text-text-secondary line-clamp-1">
                  {i.name} × {i.quantity}
                </span>
                <span className="shrink-0 text-text">{money(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label="Shipping" value="Free" />
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-text">
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </div>
          </div>
          <button
            onClick={placeOrder}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-danger px-4 py-2.5 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {submitting ? 'Placing order…' : 'Place Order (COD)'}
          </button>
          <p className="text-center text-[11px] text-text-secondary">
            By placing your order you agree to our terms. Totals are confirmed by the store.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-danger text-[11px] font-bold text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
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
