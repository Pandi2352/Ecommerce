import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';

export function ContactPage() {
  const { config } = useStorefrontConfig();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // No backend contact endpoint yet — acknowledge locally.
    setTimeout(() => {
      toast.success("Thanks! We'll get back to you soon.");
      setForm({ name: '', email: '', message: '' });
      setSending(false);
    }, 500);
  }

  const details = [
    { icon: Mail, label: 'Email', value: config?.supportEmail || 'support@nova.shop' },
    { icon: Phone, label: 'Phone', value: config?.supportPhone || '(801) 2345 - 6789' },
    { icon: MapPin, label: 'Address', value: '100 Fulfilment Hub Blvd, Bengaluru, KA 560100' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>
          Get in touch
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Questions about an order or a product? We'd love to help.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-surface p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" value={form.name} onChange={set('name')} required />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-text">Message</span>
            <textarea
              value={form.message}
              onChange={set('message')}
              required
              rows={5}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-md bg-danger px-5 py-2.5 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>

        {/* Details */}
        <div className="space-y-3">
          {details.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  {label}
                </p>
                <p className="text-sm text-text break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-text">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger"
      />
    </label>
  );
}
