import { useState } from 'react';
import { Field, TextInput } from '@/components/form';
import type { Address, AddressInput } from '../account.api';

const EMPTY: AddressInput = {
  label: '',
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

interface Props {
  initial?: Address | null;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (input: AddressInput) => void;
  onCancel?: () => void;
}

/** Reusable add/edit address form (rounded-md, no shadows). Shared by Account + Checkout. */
export function AddressForm({
  initial,
  submitting,
  submitLabel = 'Save address',
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<AddressInput>(initial ? { ...EMPTY, ...initial } : EMPTY);
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...form, fullName: form.fullName.trim(), line1: form.line1.trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-border bg-surface p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required>
          <TextInput
            value={form.fullName}
            onChange={set('fullName')}
            required
            placeholder="Recipient name"
          />
        </Field>
        <Field label="Phone">
          <TextInput
            value={form.phone ?? ''}
            onChange={set('phone')}
            placeholder="Contact number"
          />
        </Field>
      </div>
      <Field label="Address line 1" required>
        <TextInput
          value={form.line1}
          onChange={set('line1')}
          required
          placeholder="House no, street"
        />
      </Field>
      <Field label="Address line 2">
        <TextInput
          value={form.line2 ?? ''}
          onChange={set('line2')}
          placeholder="Area, landmark (optional)"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="City" required>
          <TextInput value={form.city} onChange={set('city')} required />
        </Field>
        <Field label="State">
          <TextInput value={form.state ?? ''} onChange={set('state')} />
        </Field>
        <Field label="Postal code" required>
          <TextInput value={form.postalCode} onChange={set('postalCode')} required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Label" hint="e.g. Home, Office">
          <TextInput value={form.label ?? ''} onChange={set('label')} placeholder="Home" />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-xs font-medium text-text">
          <input
            type="checkbox"
            checked={form.isDefault ?? false}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            className="h-4 w-4 accent-[var(--danger)]"
          />
          Set as default address
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-danger px-4 py-2 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-bg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
