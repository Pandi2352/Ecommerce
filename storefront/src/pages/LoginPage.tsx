import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="rounded-md border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-text">Sign in</h1>
        <p className="mt-1 text-xs text-text-secondary">
          Access your orders, addresses and profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
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
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-text-secondary">
          New here?{' '}
          <Link to="/auth/register" className="font-semibold text-danger hover:underline">
            Create an account
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
