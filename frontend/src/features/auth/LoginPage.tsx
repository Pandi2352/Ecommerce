import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
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
      setError((err as { message?: string })?.message ?? 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <h1 className="text-base font-semibold text-text">Sign in</h1>
        <p className="text-sm text-text-secondary">Welcome back to NovaShop admin.</p>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-secondary">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">Password</span>
          <Link to="/auth/forgot" className="text-xs font-medium text-info hover:underline">
            Forgot?
          </Link>
        </div>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </label>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        No account?{' '}
        <Link to="/auth/signup" className="font-medium text-info hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
