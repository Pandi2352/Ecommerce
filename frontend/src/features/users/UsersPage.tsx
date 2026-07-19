import { useState } from 'react';
import { Ban, RotateCcw, Search, Trash2, UserPlus } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Table,
  toast,
  type Column,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useRoles } from '@/features/roles/api';
import {
  banUser,
  deleteUser,
  inviteUser,
  restoreUser,
  setUserRole,
  useUsers,
  type Status,
  type User,
} from './api';

const roleTone = (name: string): 'info' | 'success' | 'neutral' =>
  name === 'Super Admin' ? 'info' : name === 'Customer' ? 'neutral' : 'success';

const statusTone: Record<Status, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  SUSPENDED: 'warning',
  BANNED: 'danger',
  DELETED: 'neutral',
};

const emptyInvite = { name: '', email: '', role: 'Admin' };

export function UsersPage() {
  const { user: me } = useAuth();
  const { data, meta, loading, error, filters, setFilters, reload } = useUsers();
  const { data: roles } = useRoles();
  const roleNames = roles.map((r) => r.name);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [inviting, setInviting] = useState(false);

  const sendInvite = async () => {
    if (invite.name.trim().length < 2 || !invite.email.includes('@')) {
      return toast.error('Enter a name and a valid email');
    }
    setInviting(true);
    try {
      await inviteUser(invite);
      toast.success(`Invitation sent to ${invite.email}`);
      setInviteOpen(false);
      setInvite(emptyInvite);
      await reload();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await reload();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Action failed');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-indigo-500/10 text-xs font-bold text-indigo-500">
            {u.name
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-text">
              {u.name}
              {me?.id === u.id && <span className="ml-1.5 text-[10px] text-text-secondary">(you)</span>}
            </p>
            <p className="text-xs text-text-secondary">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) =>
        me?.id === u.id ? (
          <Badge tone={roleTone(u.role)}>{u.role}</Badge>
        ) : (
          <Select
            className="h-8 w-32"
            value={u.role}
            onChange={(e) => act(() => setUserRole(u.id, e.target.value), 'Role updated')}
          >
            {roleNames.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => <Badge tone={statusTone[u.status]}>{u.status}</Badge>,
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      cell: (u) => (
        <span className="text-xs text-text-secondary">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (u) =>
        me?.id === u.id ? null : (
          <div className="flex justify-end gap-1">
            {u.status === 'BANNED' ? (
              <Button variant="ghost" size="sm" onClick={() => act(() => restoreUser(u.id), 'Restored')} aria-label="Restore">
                <RotateCcw className="size-4 text-success" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => act(() => banUser(u.id), 'Banned')} aria-label="Ban">
                <Ban className="size-4 text-warning" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => act(() => deleteUser(u.id), 'Deleted')} aria-label="Delete">
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Users &amp; Roles</h1>
          <p className="text-sm text-text-secondary">Manage team members and customer accounts.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" /> Invite user
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            className="pl-9"
            placeholder="Search name or email…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>
        <Select
          className="w-40"
          value={filters.role}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
        >
          <option value="">All roles</option>
          {roleNames.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Status | '', page: 1 }))}
        >
          <option value="">All statuses</option>
          {(['ACTIVE', 'BANNED', 'DELETED', 'INVITED', 'SUSPENDED'] as Status[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Table
        columns={columns}
        rows={data}
        rowKey={(u) => u.id}
        loading={loading}
        emptyState="No users match these filters."
      />

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} users
          </span>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Invite user */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button onClick={sendInvite} disabled={inviting}>
              {inviting ? 'Sending…' : 'Send invitation'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            They'll get an email with a link to set their password and activate the account.
          </p>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Name</span>
            <Input
              value={invite.name}
              onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
              placeholder="Jane Doe"
              autoComplete="off"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Email</span>
            <Input
              type="email"
              value={invite.email}
              onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
              placeholder="jane@nova.shop"
              autoComplete="off"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Role</span>
            <Select
              value={invite.role}
              onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value }))}
            >
              {roleNames.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Modal>
    </div>
  );
}
