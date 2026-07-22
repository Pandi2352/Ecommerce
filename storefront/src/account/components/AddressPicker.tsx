import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { addAddress, fetchAddresses, type Address, type AddressInput } from '../account.api';
import { AddressCard } from './AddressCard';
import { AddressForm } from './AddressForm';

/**
 * Checkout address step for signed-in customers: pick a saved address or add a
 * new one (persisted to the account). Calls `onSelect` with the chosen address.
 */
export function AddressPicker({ onSelect }: { onSelect: (a: Address | null) => void }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses()
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0] ?? null;
        setSelectedId(def?.id ?? null);
        onSelect(def ?? null);
        setAdding(list.length === 0);
      })
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  }, [onSelect]);

  const pick = (a: Address) => {
    setSelectedId(a.id);
    onSelect(a);
  };

  const handleAdd = async (input: AddressInput) => {
    setSaving(true);
    try {
      const prevIds = new Set(addresses.map((a) => a.id));
      const list = await addAddress(input);
      setAddresses(list);
      const chosen =
        list.find((a) => !prevIds.has(a.id)) ?? list.find((a) => a.isDefault) ?? list[0];
      if (chosen) pick(chosen);
      setAdding(false);
      toast.success('Address added');
    } catch {
      toast.error('Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-4 text-sm text-text-secondary">Loading addresses…</p>;

  return (
    <div className="space-y-3">
      {addresses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              selectable
              selected={selectedId === a.id}
              onSelect={() => pick(a)}
            />
          ))}
        </div>
      )}

      {adding ? (
        <AddressForm
          submitting={saving}
          submitLabel="Save & use this address"
          onSubmit={handleAdd}
          onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:border-danger"
        >
          <Plus className="h-4 w-4" /> Add a new address
        </button>
      )}
    </div>
  );
}
