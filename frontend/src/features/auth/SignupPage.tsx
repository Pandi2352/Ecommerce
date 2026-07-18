import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { useAuth } from './AuthContext';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    try {
      await signup(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <h1 className="text-base font-semibold text-text">Create account</h1>
        <p className="text-sm text-text-secondary">Get started with NovaShop admin.</p>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-secondary">Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
      </label>
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
        <span className="text-xs font-medium text-text-secondary">Password</span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />
      </label>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Creating…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-info hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
