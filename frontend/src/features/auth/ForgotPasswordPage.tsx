import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { authApi } from './api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-3">
        <h1 className="text-base font-semibold text-text">Check your email</h1>
        <p className="text-sm text-text-secondary">
          If an account exists for <span className="font-medium text-text">{email}</span>, a reset
          link is on its way. (In dev, the link is printed in the API console.)
        </p>
        <Link to="/auth/login" className="inline-block text-sm font-medium text-info hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <h1 className="text-base font-semibold text-text">Forgot password</h1>
        <p className="text-sm text-text-secondary">We'll email you a reset link.</p>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-secondary">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-text-secondary">
        <Link to="/auth/login" className="font-medium text-info hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
