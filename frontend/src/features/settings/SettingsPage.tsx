import { useState, type FormEvent, type ReactNode } from 'react';
import { Monitor, Trash2 } from 'lucide-react';
import { Button, Card, FormField, Input, PasswordInput, toast } from '@/components/ui';
import { PageHeader } from '@/components/common';
import { useApi } from '@/hooks/useApi';
import { useMutation } from '@/hooks/useMutation';
import { formatDateTime } from '@/utils/formatters';
import { isValidPassword, PASSWORD_HINT } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import { authApi } from '@/features/auth/api';

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

type Session = { id: string; userAgent: string; createdAt: string };

export function SettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  const profileMutation = useMutation();
  const passwordMutation = useMutation();
  const revokeMutation = useMutation();

  const { data: sessions, reload: reloadSessions } = useApi(() => authApi.listSessions() as Promise<Session[]>, {
    errorMessage: 'Failed to load sessions',
  });
  const sessionList = sessions ?? [];

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    void profileMutation.run(() => authApi.updateProfile({ name }), {
      success: 'Profile updated',
      error: 'Update failed',
    });
  };

  const changePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPassword(next)) return toast.error(PASSWORD_HINT);
    void passwordMutation.run(() => authApi.changePassword(current, next), {
      success: 'Password changed',
      error: 'Change failed',
      onSuccess: () => {
        setCurrent('');
        setNext('');
      },
    });
  };

  const revoke = (id: string) =>
    void revokeMutation.run(() => authApi.revokeSession(id), {
      success: 'Session revoked',
      error: 'Failed to revoke',
      onSuccess: () => reloadSessions(),
    });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and security." />

      <Section title="Profile">
        <form className="space-y-3" onSubmit={saveProfile}>
          <FormField label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Email">
            <Input value={user?.email ?? ''} disabled />
          </FormField>
          <Button type="submit" size="sm" loading={profileMutation.saving}>
            Save profile
          </Button>
        </form>
      </Section>

      <Section title="Change password">
        <form className="space-y-3" onSubmit={changePassword}>
          <FormField label="Current password">
            <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="off" required />
          </FormField>
          <FormField label="New password" hint={PASSWORD_HINT}>
            <PasswordInput value={next} onChange={(e) => setNext(e.target.value)} autoComplete="off" required />
          </FormField>
          <Button type="submit" size="sm" loading={passwordMutation.saving}>
            Update password
          </Button>
        </form>
      </Section>

      <Section title="Active sessions" description="Devices where you're currently signed in.">
        <div className="divide-y divide-border rounded-md border border-border">
          {sessionList.length === 0 && (
            <p className="px-3 py-4 text-sm text-text-secondary">No active sessions.</p>
          )}
          {sessionList.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Monitor className="size-4 text-text-secondary" />
                <div className="leading-tight">
                  <p className="max-w-xs truncate text-xs font-medium text-text">{s.userAgent}</p>
                  <p className="text-[11px] text-text-secondary">{formatDateTime(s.createdAt)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => revoke(s.id)} aria-label="Revoke">
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
