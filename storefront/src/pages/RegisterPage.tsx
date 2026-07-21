import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/auth/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      toast.error('Password must be 8+ characters and include a letter and a number');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, phone: phone || undefined });
      toast.success('Account created!');
      navigate('/account', { replace: true });
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="rounded-md border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-text">Create your account</h1>
        <p className="mt-1 text-xs text-text-secondary">
          Faster checkout, order history and saved addresses.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Full name" value={name} onChange={setName} required autoFocus />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Phone (optional)" value={phone} onChange={setPhone} />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-danger px-4 py-2.5 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-danger hover:underline">
            Sign in
          </Link>
        </p>
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
  autoFocus,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-text">{label}</span>
      <input
        type={type}
        required={required}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger"
      />
    </label>
  );
}
