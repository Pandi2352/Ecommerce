import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Button, Input, PasswordInput } from '@/components/ui';
import { BrandLoader } from '@/components/common/BrandLoader';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Sign in failed');
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      {/* Unique loader overlay while signing in */}
      {busy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-border bg-surface/85 backdrop-blur-sm">
          <BrandLoader label="Signing you in…" />
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to your NovaShop admin.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* autoComplete off → don't bind cached/autofilled values */}
      <form className="space-y-4" onSubmit={submit} autoComplete="off">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-text-secondary">Email address</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            <Input
              type="email"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nova.shop"
              autoComplete="off"
              required
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Password</span>
            <Link to="/auth/forgot" className="text-xs font-medium text-info hover:underline">
              Forgot?
            </Link>
          </div>
          <PasswordInput
            leftIcon={<Lock className="size-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="off"
            required
          />
        </label>

        <Button type="submit" className="w-full" disabled={busy}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-secondary">
        Admin access is invite-only. Ask an admin to invite you.
      </p>
    </div>
  );
}
