import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from './api';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'verifying' | 'ok' | 'error'>('verifying');

  useEffect(() => {
    if (!token) return setState('error');
    let active = true;
    authApi
      .verifyEmail(token)
      .then(() => active && setState('ok'))
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="space-y-3 text-center">
      {state === 'verifying' && <p className="text-sm text-text-secondary">Verifying your email…</p>}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="mx-auto size-8 text-success" />
          <h1 className="text-base font-semibold text-text">Email verified</h1>
          <p className="text-sm text-text-secondary">Your email address is confirmed.</p>
          <Link to="/" className="inline-block text-sm font-medium text-info hover:underline">
            Go to dashboard
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <XCircle className="mx-auto size-8 text-danger" />
          <h1 className="text-base font-semibold text-text">Verification failed</h1>
          <p className="text-sm text-text-secondary">This link is invalid or has expired.</p>
          <Link to="/" className="inline-block text-sm font-medium text-info hover:underline">
            Back to app
          </Link>
        </>
      )}
    </div>
  );
}
