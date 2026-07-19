import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { AtSign, Camera, Globe, Link2, LogOut, Monitor, Trash2 } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Pagination,
  PasswordInput,
  Skeleton,
  Textarea,
  toast,
  type BadgeTone,
} from '@/components/ui';
import { Avatar, PageHeader } from '@/components/common';
import { getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
import { useMutation } from '@/hooks/useMutation';
import { formatDate, formatDateTime, formatRelative } from '@/utils/formatters';
import { isValidPassword, PASSWORD_HINT } from '@/utils/validators';
import { USER_STATUS_TONE, toneFor } from '@/utils/constants';
import { useAuth } from '@/features/auth/AuthContext';
import { authApi } from '@/features/auth/api';
import {
  fetchAdminProfile,
  fetchMyProfile,
  updateMyProfile,
  uploadImage,
  type AdminProfile,
  type ProfileInput,
} from './api';

const roleTone = (name: string): BadgeTone =>
  name === 'Super Admin' ? 'info' : name === 'Customer' ? 'neutral' : 'success';

const emptyForm: ProfileInput = {
  name: '',
  phone: '',
  jobTitle: '',
  department: '',
  bio: '',
  location: '',
  timezone: '',
  links: {},
};

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me, updateUser } = useAuth();
  const isOwn = !id || id === me?.id;
  const editable = isOwn; // super admins view others read-only

  const { data, loading, error, reload, setData } = useApi<AdminProfile>(
    () => (isOwn ? fetchMyProfile() : fetchAdminProfile(id!)),
    { errorMessage: 'Failed to load profile' },
  );

  const [form, setForm] = useState<ProfileInput>(emptyForm);
  const [avatar, setAvatar] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useMutation();

  // ── Change password (own only) ──
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const pwMutation = useMutation();

  // ── Login activity / sessions (own only, paginated) ──
  type Session = { id: string; userAgent: string; createdAt: string; expiresAt: string };
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessMeta, setSessMeta] = useState<Meta | null>(null);
  const [sessPage, setSessPage] = useState(1);
  const revokeMutation = useMutation();

  const loadSessions = useCallback(async () => {
    if (!isOwn) return;
    try {
      const res = await getList<Session>('/auth/sessions', { params: { page: sessPage, pageSize: 5 } });
      setSessions(res.data);
      setSessMeta(res.meta);
    } catch {
      /* non-critical */
    }
  }, [isOwn, sessPage]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const changePassword = () => {
    if (!isValidPassword(pwNext)) return toast.error(PASSWORD_HINT);
    void pwMutation.run(() => authApi.changePassword(pwCurrent, pwNext), {
      success: 'Password changed',
      error: 'Change failed',
      onSuccess: () => {
        setPwCurrent('');
        setPwNext('');
      },
    });
  };

  const revokeSession = (sid: string) =>
    void revokeMutation.run(() => authApi.revokeSession(sid), {
      success: 'Signed out that device',
      error: 'Failed to revoke',
      onSuccess: () => void loadSessions(),
    });

  const signOutEverywhere = () =>
    void revokeMutation.run(() => authApi.revokeAllSessions(), {
      success: 'Signed out on all devices',
      error: 'Failed',
    });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      phone: data.phone ?? '',
      jobTitle: data.jobTitle ?? '',
      department: data.department ?? '',
      bio: data.bio ?? '',
      location: data.location ?? '',
      timezone: data.timezone ?? '',
      links: data.links ?? {},
    });
    setAvatar(data.avatarUrl);
  }, [data]);

  const onSave = () =>
    void save.run(() => updateMyProfile(form), {
      success: 'Profile updated',
      error: 'Save failed',
      onSuccess: () => {
        if (form.name) updateUser({ name: form.name });
        void reload();
      },
    });

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await updateMyProfile({ avatarUrl: url });
      setAvatar(url);
      setData((d) => (d ? { ...d, avatarUrl: url } : d));
      updateUser({ avatarUrl: url }); // reflect in the navbar immediately
      toast.success('Photo updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const setLink = (key: keyof NonNullable<ProfileInput['links']>, value: string) =>
    setForm((f) => ({ ...f, links: { ...f.links, [key]: value } }));

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <Alert>{error}</Alert>;
  if (!data) return null;

  /** Editable input or read-only value depending on `editable`. */
  const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) =>
    editable ? (
      <FormField label={label}>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </FormField>
    ) : (
      <div>
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="mt-1 text-sm text-text">{value || '—'}</p>
      </div>
    );

  const linkField = (label: string, key: keyof NonNullable<ProfileInput['links']>, icon: ReactNode) => {
    const value = form.links?.[key] ?? '';
    return editable ? (
      <FormField label={label}>
        <Input value={value} onChange={(e) => setLink(key, e.target.value)} placeholder="https://…" />
      </FormField>
    ) : (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">{icon}</span>
        {value ? (
          <a href={value} target="_blank" rel="noreferrer" className="truncate text-info hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-text-secondary">—</span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title={isOwn ? 'My Profile' : `${data.name}'s profile`}
        subtitle={isOwn ? 'Your admin account details.' : 'Viewing another admin (read-only).'}
        action={editable && <Button onClick={onSave} loading={save.saving}>Save changes</Button>}
      />

      {/* Header card */}
      <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative">
          <Avatar name={data.name} src={avatar} size="xl" />
          {editable && (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full border border-border bg-surface text-text-secondary hover:text-text"
              >
                <Camera className="size-4" />
              </button>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-text">{data.name}</h2>
            <Badge tone={roleTone(data.role)}>{data.role}</Badge>
            <Badge tone={toneFor(USER_STATUS_TONE, data.status)}>{data.status}</Badge>
            {data.emailVerified ? (
              <Badge tone="success">Verified</Badge>
            ) : (
              <Badge tone="warning">Unverified</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {data.jobTitle || 'Admin'} · {data.email}
          </p>
          {uploading && <p className="mt-1 text-xs text-text-secondary">Uploading photo…</p>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text">Personal information</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {field('Full name', form.name ?? '', (v) => setForm((f) => ({ ...f, name: v })))}
              {field('Phone', form.phone ?? '', (v) => setForm((f) => ({ ...f, phone: v })))}
              {field('Job title', form.jobTitle ?? '', (v) => setForm((f) => ({ ...f, jobTitle: v })))}
              {field('Department', form.department ?? '', (v) => setForm((f) => ({ ...f, department: v })))}
              {field('Location', form.location ?? '', (v) => setForm((f) => ({ ...f, location: v })))}
              {field('Timezone', form.timezone ?? '', (v) => setForm((f) => ({ ...f, timezone: v })), 'e.g. Asia/Kolkata')}
            </div>
            <div className="mt-3">
              {editable ? (
                <FormField label="Bio">
                  <Textarea value={form.bio ?? ''} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="A short bio…" />
                </FormField>
              ) : (
                <div>
                  <p className="text-xs font-medium text-text-secondary">Bio</p>
                  <p className="mt-1 text-sm text-text">{data.bio || '—'}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text">Links</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {linkField('Website', 'website', <Globe className="size-4" />)}
              {linkField('Twitter / X', 'twitter', <AtSign className="size-4" />)}
              {linkField('LinkedIn', 'linkedin', <Link2 className="size-4" />)}
              {linkField('GitHub', 'github', <Link2 className="size-4" />)}
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h3 className="text-sm font-semibold text-text">Account</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-text-secondary">Email</dt>
              <dd className="mt-0.5 text-text">{data.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Role</dt>
              <dd className="mt-0.5"><Badge tone={roleTone(data.role)}>{data.role}</Badge></dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Status</dt>
              <dd className="mt-0.5"><Badge tone={toneFor(USER_STATUS_TONE, data.status)}>{data.status}</Badge></dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Member since</dt>
              <dd className="mt-0.5 text-text">{formatDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Last login</dt>
              <dd className="mt-0.5 text-text">{formatDateTime(data.lastLogin)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {isOwn && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text">Change password</h3>
            <div className="mt-4 space-y-3">
              <FormField label="Current password">
                <PasswordInput value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="off" />
              </FormField>
              <FormField label="New password" hint={PASSWORD_HINT}>
                <PasswordInput value={pwNext} onChange={(e) => setPwNext(e.target.value)} autoComplete="off" />
              </FormField>
              <Button size="sm" onClick={changePassword} loading={pwMutation.saving}>
                Update password
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-text">Login activity</h3>
                <p className="mt-0.5 text-xs text-text-secondary">Devices where you're signed in.</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<LogOut className="size-3.5" />}
                disabled={revokeMutation.saving}
                onClick={signOutEverywhere}
              >
                Sign out everywhere
              </Button>
            </div>
            <div className="mt-4 divide-y divide-border rounded-md border border-border">
              {sessions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-text-secondary">No active sessions.</p>
              )}
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Monitor className="size-4 shrink-0 text-text-secondary" />
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-xs font-medium text-text">{s.userAgent}</p>
                      <p className="text-[11px] text-text-secondary">
                        Signed in {formatRelative(s.createdAt)} · {formatDateTime(s.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" iconOnly aria-label="Revoke" onClick={() => revokeSession(s.id)}>
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
            {sessMeta && <Pagination className="mt-3" meta={sessMeta} onPageChange={setSessPage} />}
          </Card>
        </div>
      )}
    </div>
  );
}
