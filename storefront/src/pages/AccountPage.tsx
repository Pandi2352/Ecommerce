import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, MapPin, Package, Plus, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { money } from '@/lib/utils';
import { Field, TextInput } from '@/components/form';
import { useAuth } from '@/auth/AuthContext';
import {
  addAddress,
  fetchAddresses,
  fetchMyOrders,
  removeAddress,
  updateAddress,
  updateProfile,
  type Address,
  type AddressInput,
  type MyOrder,
} from '@/account/account.api';
import { AddressCard } from '@/account/components/AddressCard';
import { AddressForm } from '@/account/components/AddressForm';
import { OrderTimeline } from '@/account/components/OrderTimeline';

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
  const [openId, setOpenId] = useState<string | null>(null);

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
          to="/products"
          className="mt-3 inline-block text-sm font-semibold text-danger hover:underline"
        >
          Start shopping
        </Link>
      </div>
    );

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const open = openId === o.orderNumber;
        return (
          <div key={o.id} className="rounded-md border border-border bg-surface">
            <button
              onClick={() => setOpenId(open ? null : o.orderNumber)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div>
                <p className="text-sm font-bold text-text">{o.orderNumber}</p>
                <p className="text-[11px] text-text-secondary">
                  {new Date(o.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {o.items.length} item(s) · {o.paymentMethod ?? 'COD'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[o.status] ?? 'bg-slate-500/10 text-slate-600'}`}
                >
                  {o.status}
                </span>
                <span className="text-sm font-bold text-text">{money(o.total)}</span>
                <ChevronDown
                  className={`h-4 w-4 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {open && (
              <div className="space-y-4 border-t border-border p-4">
                <OrderTimeline status={o.status} timeline={o.timeline ?? []} />
                <div className="space-y-1.5 border-t border-border pt-3">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-xs">
                      <span className="text-text-secondary line-clamp-1">
                        {i.name}
                        {i.variant ? ` (${Object.values(i.variant).join(', ')})` : ''} ×{' '}
                        {i.quantity}
                      </span>
                      <span className="shrink-0 text-text">{money(i.subtotal)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-text">
                    <span>Total</span>
                    <span>{money(o.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses()
      .then(setAddresses)
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (input: AddressInput) => {
    setSaving(true);
    try {
      const next =
        mode === 'edit' && editing
          ? await updateAddress(editing.id, input)
          : await addAddress(input);
      setAddresses(next);
      setMode('list');
      setEditing(null);
      toast.success(mode === 'edit' ? 'Address updated' : 'Address added');
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Address) => {
    try {
      setAddresses(await removeAddress(a.id));
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const setDefault = async (a: Address) => {
    try {
      setAddresses(await updateAddress(a.id, { ...a, isDefault: true }));
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update default');
    }
  };

  if (loading) return <p className="py-8 text-center text-sm text-text-secondary">Loading…</p>;

  if (mode !== 'list') {
    return (
      <AddressForm
        initial={mode === 'edit' ? editing : null}
        submitting={saving}
        submitLabel={mode === 'edit' ? 'Update address' : 'Save address'}
        onSubmit={save}
        onCancel={() => {
          setMode('list');
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <p className="rounded-md border border-border bg-surface p-6 text-center text-sm text-text-secondary">
          No saved addresses yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              onEdit={() => {
                setEditing(a);
                setMode('edit');
              }}
              onDelete={() => remove(a)}
              onSetDefault={() => setDefault(a)}
            />
          ))}
        </div>
      )}
      <button
        onClick={() => setMode('add')}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:border-danger"
      >
        <Plus className="h-4 w-4" /> Add address
      </button>
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
      <Field label="Full name" required>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email">
        <TextInput value={user?.email ?? ''} disabled />
      </Field>
      <Field label="Phone">
        <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
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
