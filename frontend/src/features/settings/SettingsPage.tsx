import { useEffect, useState, type FormEvent } from 'react';
import { Monitor, Trash2 } from 'lucide-react';
import { Button, Input, toast } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { authApi } from '@/features/auth/api';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type Session = { id: string; userAgent: string; createdAt: string };

export function SettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);

  const loadSessions = () => authApi.listSessions().then(setSessions).catch(() => undefined);
  useEffect(() => {
    void loadSessions();
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfile({ name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error('New password must be at least 8 characters');
    setSavingPw(true);
    try {
      await authApi.changePassword(current, next);
      toast.success('Password changed');
      setCurrent('');
      setNext('');
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const revoke = async (id: string) => {
    await authApi.revokeSession(id);
    toast.success('Session revoked');
    void loadSessions();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your account and security.</p>
      </div>

      <Section title="Profile">
        <form className="space-y-3" onSubmit={saveProfile}>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Email</span>
            <Input value={user?.email ?? ''} disabled />
          </label>
          <Button type="submit" size="sm" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </Section>

      <Section title="Change password">
        <form className="space-y-3" onSubmit={changePassword}>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Current password</span>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">New password</span>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
          </label>
          <Button type="submit" size="sm" disabled={savingPw}>
            {savingPw ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Section>

      <Section title="Active sessions" description="Devices where you're currently signed in.">
        <div className="divide-y divide-border rounded-md border border-border">
          {sessions.length === 0 && (
            <p className="px-3 py-4 text-sm text-text-secondary">No active sessions.</p>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Monitor className="size-4 text-text-secondary" />
                <div className="leading-tight">
                  <p className="max-w-xs truncate text-xs font-medium text-text">{s.userAgent}</p>
                  <p className="text-[11px] text-text-secondary">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
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
