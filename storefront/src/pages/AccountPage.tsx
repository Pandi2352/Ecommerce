import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, MapPin, Package, Plus, Trash2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { money } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';
import {
  addAddress,
  fetchAddresses,
  fetchMyOrders,
  removeAddress,
  updateProfile,
  type Address,
  type AddressInput,
  type MyOrder,
} from '@/account/account.api';

type Tab = 'orders' | 'addresses' | 'profile';

export function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">My Account</h1>
          <p className="text-xs text-text-secondary">
            {user?.name} · {user?.email}
          </p>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:border-danger hover:text-danger"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(
          [
            ['orders', 'Orders', Package],
            ['addresses', 'Addresses', MapPin],
            ['profile', 'Profile', UserIcon],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === key
                ? 'border-danger text-danger'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && <OrdersTab />}
      {tab === 'addresses' && <AddressesTab />}
      {tab === 'profile' && <ProfileTab onSaved={refreshUser} />}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  CREATED: 'bg-sky-500/10 text-sky-600',
  PACKED: 'bg-violet-500/10 text-violet-600',
  SHIPPED: 'bg-amber-500/10 text-amber-600',
  DELIVERED: 'bg-emerald-500/10 text-emerald-600',
  CANCELLED: 'bg-rose-500/10 text-rose-600',
  RETURNED: 'bg-rose-500/10 text-rose-600',
  REFUNDED: 'bg-rose-500/10 text-rose-600',
};

function OrdersTab() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders({ pageSize: 50 })
      .then((res) => setOrders(res.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="py-8 text-center text-sm text-text-secondary">Loading orders…</p>;
  if (orders.length === 0)
    return (
      <div className="rounded-md border border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-secondary">You haven't placed any orders yet.</p>
        <Link
          to="/"
          className="mt-3 inline-block text-sm font-semibold text-danger hover:underline"
        >
          Start shopping
        </Link>
      </div>
    );

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-md border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{o.orderNumber}</p>
              <p className="text-[11px] text-text-secondary">
                {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s) ·{' '}
                {o.paymentMethod ?? 'COD'}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                STATUS_TONE[o.status] ?? 'bg-slate-500/10 text-slate-600'
              }`}
            >
              {o.status}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
            <div className="text-xs text-text-secondary line-clamp-1 max-w-[70%]">
              {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
            </div>
            <span className="text-sm font-bold text-text">{money(o.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_ADDR: AddressInput = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
};

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddressInput>(EMPTY_ADDR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses()
      .then(setAddresses)
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await addAddress(form);
      setAddresses(next);
      setForm(EMPTY_ADDR);
      setAdding(false);
      toast.success('Address added');
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      setAddresses(await removeAddress(id));
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !adding && (
        <p className="rounded-md border border-border bg-surface p-6 text-center text-sm text-text-secondary">
          No saved addresses yet.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-text">{a.fullName}</span>
              {a.isDefault && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}, {a.city}
              {a.state ? `, ${a.state}` : ''} {a.postalCode}
              {a.country ? `, ${a.country}` : ''}
            </p>
            {a.phone && <p className="text-[11px] text-text-secondary">{a.phone}</p>}
            <button
              onClick={() => handleRemove(a.id)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-danger hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-md border border-border bg-surface p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Full name"
              value={form.fullName}
              onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
              required
            />
            <Input
              label="Phone"
              value={form.phone ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
          </div>
          <Input
            label="Address line 1"
            value={form.line1}
            onChange={(v) => setForm((f) => ({ ...f, line1: v }))}
            required
          />
          <Input
            label="Address line 2"
            value={form.line2 ?? ''}
            onChange={(v) => setForm((f) => ({ ...f, line2: v }))}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="City"
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              required
            />
            <Input
              label="State"
              value={form.state ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, state: v }))}
            />
            <Input
              label="Postal code"
              value={form.postalCode}
              onChange={(v) => setForm((f) => ({ ...f, postalCode: v }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-text">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as default address
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-danger px-4 py-2 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save address'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setForm(EMPTY_ADDR);
              }}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-bg"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:border-danger"
        >
          <Plus className="h-4 w-4" /> Add address
        </button>
      )}
    </div>
  );
}

function ProfileTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, phone });
      await onSaved();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-md space-y-4 rounded-md border border-border bg-surface p-5"
    >
      <Input label="Full name" value={name} onChange={setName} required />
      <Input label="Email" value={user?.email ?? ''} onChange={() => {}} disabled />
      <Input label="Phone" value={phone} onChange={setPhone} />
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-danger px-4 py-2.5 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-text">{label}</span>
      <input
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger disabled:opacity-60"
      />
    </label>
  );
}
