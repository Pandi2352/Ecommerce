import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, PasswordInput, toast } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { isValidPassword } from '@/utils/validators';
import { authApi } from './api';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPassword(password)) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated — please sign in');
      navigate('/auth/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Reset failed'));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-3">
        <h1 className="text-base font-semibold text-text">Invalid link</h1>
        <p className="text-sm text-text-secondary">This reset link is missing its token.</p>
        <Link to="/auth/forgot" className="text-sm font-medium text-info hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <h1 className="text-base font-semibold text-text">Set a new password</h1>
        <p className="text-sm text-text-secondary">Choose a strong password.</p>
      </div>
      {error && <Alert>{error}</Alert>}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-secondary">New password</span>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />
      </label>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
