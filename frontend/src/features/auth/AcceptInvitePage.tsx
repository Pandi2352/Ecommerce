import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, PasswordInput } from '@/components/ui';
import { BrandLoader } from '@/components/common/BrandLoader';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { isValidPassword, PASSWORD_HINT } from '@/utils/validators';
import { useAuth } from './AuthContext';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPassword(password)) return setError(PASSWORD_HINT);
    setBusy(true);
    try {
      await acceptInvite(token, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not accept invitation'));
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-3">
        <h1 className="text-base font-semibold text-text">Invalid invitation</h1>
        <p className="text-sm text-text-secondary">This invite link is missing its token.</p>
        <Link to="/auth/login" className="text-sm font-medium text-info hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {busy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-border bg-surface/85 backdrop-blur-sm">
          <BrandLoader label="Activating your account…" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text">Accept your invitation</h1>
        <p className="mt-1 text-sm text-text-secondary">Set a password to activate your account.</p>
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      <form className="space-y-4" onSubmit={submit} autoComplete="off">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-text-secondary">Create password</span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="off"
            required
          />
        </label>
        <Button type="submit" className="w-full" disabled={busy}>
          Activate account
        </Button>
      </form>
    </div>
  );
}
