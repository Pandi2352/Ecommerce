import { useState } from 'react';
import { Ban, RotateCcw, Search, Trash2, UserPlus } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  FormField,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  toast,
  type Column,
} from '@/components/ui';
import { Avatar, PageHeader } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { formatDate } from '@/utils/formatters';
import { isEmail, minLength } from '@/utils/validators';
import { USER_STATUS_TONE, toneFor } from '@/utils/constants';
import { useAuth } from '@/features/auth/AuthContext';
import { useRoles } from '@/features/roles';
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

const emptyInvite = { name: '', email: '', role: 'Admin' };

export function UsersPage() {
  const { user: me } = useAuth();
  const { data, meta, loading, error, filters, setFilters, reload } = useUsers();
  const { data: roles } = useRoles();
  const roleNames = roles.map((r) => r.name);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [confirm, setConfirm] = useState<{ user: User; kind: 'ban' | 'delete' } | null>(null);
  const inviteMutation = useMutation();
  const rowAction = useMutation();

  const runConfirm = () => {
    if (!confirm) return;
    const { user, kind } = confirm;
    void rowAction.run(() => (kind === 'delete' ? deleteUser(user.id) : banUser(user.id)), {
      success: kind === 'delete' ? 'User deleted' : 'User banned',
      error: 'Action failed',
      onSuccess: () => {
        setConfirm(null);
        void reload();
      },
    });
  };

  const sendInvite = () => {
    if (!minLength(invite.name, 2) || !isEmail(invite.email)) {
      return toast.error('Enter a name and a valid email');
    }
    void inviteMutation.run(() => inviteUser(invite), {
      success: `Invitation sent to ${invite.email}`,
      error: 'Invite failed',
      onSuccess: () => {
        setInviteOpen(false);
        setInvite(emptyInvite);
        void reload();
      },
    });
  };

  const act = (fn: () => Promise<void>, ok: string) =>
    void rowAction.run(fn, { success: ok, error: 'Action failed', onSuccess: () => reload() });

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} />
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
      cell: (u) => <Badge tone={toneFor(USER_STATUS_TONE, u.status)}>{u.status}</Badge>,
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      cell: (u) => <span className="text-xs text-text-secondary">{formatDate(u.lastLogin)}</span>,
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
              <Button variant="ghost" size="sm" onClick={() => setConfirm({ user: u, kind: 'ban' })} aria-label="Ban">
                <Ban className="size-4 text-warning" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setConfirm({ user: u, kind: 'delete' })} aria-label="Delete">
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        subtitle="Manage team members and customer accounts."
        action={
          <Button leftIcon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        }
      />

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

      {error && <Alert>{error}</Alert>}

      <Table
        columns={columns}
        rows={data}
        rowKey={(u) => u.id}
        loading={loading}
        emptyState="No users match these filters."
      />

      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))}
        />
      )}

      {/* Invite user */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviteMutation.saving}>
              Cancel
            </Button>
            <Button onClick={sendInvite} loading={inviteMutation.saving}>
              Send invitation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            They'll get an email with a link to set their password and activate the account.
          </p>
          <FormField label="Name" required>
            <Input
              value={invite.name}
              onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
              placeholder="Jane Doe"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={invite.email}
              onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
              placeholder="jane@nova.shop"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Role">
            <Select value={invite.role} onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value }))}>
              {roleNames.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === 'delete' ? 'Delete user' : 'Ban user'}
        danger
        confirmLabel={confirm?.kind === 'delete' ? 'Delete' : 'Ban'}
        loading={rowAction.saving}
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
        message={
          confirm?.kind === 'delete' ? (
            <>
              Delete <span className="font-medium text-text">{confirm?.user.name}</span>? This marks
              the account as deleted and revokes access.
            </>
          ) : (
            <>
              Ban <span className="font-medium text-text">{confirm?.user.name}</span>? They'll be
              signed out and blocked from signing in until restored.
            </>
          )
        }
      />
    </div>
  );
}
