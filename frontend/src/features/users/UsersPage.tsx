import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  Copy,
  Lock,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { CUSTOMER_ROLE, SUPER_ADMIN_ROLE } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Dropdown,
  Drawer,
  FormField,
  Input,
  Modal,
  Pagination,
  SearchInput,
  Select,
  Table,
  Tabs,
  toast,
  type Column,
  type DropdownItem,
  type SortState,
} from '@/components/ui';
import { Avatar, PageHeader, StatCard, type StatTone } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { formatDateTime, formatRelative } from '@/utils/formatters';
import { isEmail, minLength } from '@/utils/validators';
import { USER_STATUS_TONE, toneFor } from '@/utils/constants';
import { useAuth } from '@/features/auth/AuthContext';
import { useRoles } from '@/features/roles';
import {
  banUser,
  bulkUsers,
  deleteUser,
  inviteUser,
  reinviteUser,
  resendVerification,
  restoreUser,
  revokeInvite,
  setUserRole,
  useInvitedCount,
  useUsers,
  useUserStats,
  type BulkAction,
  type Status,
  type User,
} from './api';

const roleTone = (name: string): 'info' | 'success' | 'neutral' =>
  name === 'Super Admin' ? 'info' : name === 'Customer' ? 'neutral' : 'success';

const emptyInvite = { name: '', email: '', role: 'Admin' };

type Tab = 'all' | 'invited';
type ConfirmKind = 'ban' | 'delete' | 'revoke' | 'bulk-delete';

const isExpired = (iso?: string) => (iso ? new Date(iso).getTime() < Date.now() : false);

export function UsersPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const { data, meta, loading, error, filters, setFilters, reload } = useUsers();
  const { data: roles } = useRoles();
  const invitedCount = useInvitedCount();
  const stats = useUserStats();
  // Admin user management is staff-only — never offer the storefront Customer role here.
  const roleNames = roles.map((r) => r.name).filter((r) => r !== CUSTOMER_ROLE);
  const defaultRole =
    roles.find((r) => r.isDefault && r.name !== CUSTOMER_ROLE)?.name ?? roleNames[0] ?? 'Admin';

  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [linkModal, setLinkModal] = useState<{ email: string; link: string } | null>(null);
  const [detail, setDetail] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<{ user?: User; kind: ConfirmKind } | null>(null);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [roleValue, setRoleValue] = useState('');
  const inviteMutation = useMutation();
  const rowAction = useMutation();

  const openRoleModal = (u: User) => {
    setRoleModal(u);
    setRoleValue(u.role);
  };
  const saveRole = () => {
    if (!roleModal) return;
    void rowAction.run(() => setUserRole(roleModal.id, roleValue), {
      success: 'Role updated',
      error: 'Failed to change role',
      onSuccess: () => {
        setRoleModal(null);
        refreshAll();
      },
    });
  };

  /** Roles assignable from the UI — never promote to Super Admin from here. */
  const assignableRoles = roleNames.filter((r) => r !== SUPER_ADMIN_ROLE);
  const isProtected = (u: User) => u.id === me?.id || u.role === SUPER_ADMIN_ROLE;

  const rowMenu = (u: User): DropdownItem[] => {
    const items: DropdownItem[] = [
      { label: 'View profile', onSelect: () => navigate(`/profile/${u.id}`) },
      { label: 'Change role', onSelect: () => openRoleModal(u) },
    ];
    if (u.status === 'ACTIVE' && !u.emailVerified) {
      items.push({ label: 'Resend verification', onSelect: () => act(() => resendVerification(u.id), 'Verification email sent') });
    }
    if (u.status === 'BANNED') {
      items.push({ label: 'Restore', onSelect: () => act(() => restoreUser(u.id), 'Restored') });
    } else {
      items.push({ label: 'Ban', onSelect: () => setConfirm({ user: u, kind: 'ban' }) });
    }
    items.push({ label: 'Delete', danger: true, onSelect: () => setConfirm({ user: u, kind: 'delete' }) });
    return items;
  };

  const invited = tab === 'invited';

  const refreshAll = () => {
    void reload();
    void invitedCount.reload();
    void stats.reload();
  };

  const changeTab = (key: string) => {
    const next = key as Tab;
    setTab(next);
    setSelected(new Set());
    setFilters((f) => ({
      ...f,
      status: next === 'invited' ? 'INVITED' : '',
      role: '',
      search: '',
      verified: '',
      page: 1,
    }));
  };

  // ── sorting ──
  const sortState: SortState = {
    key: filters.sort.replace(/^-/, ''),
    dir: filters.sort.startsWith('-') ? 'desc' : 'asc',
  };
  const onSort = (field: string) =>
    setFilters((f) => {
      const cur = f.sort.replace(/^-/, '');
      const desc = f.sort.startsWith('-');
      const next = cur === field ? (desc ? field : `-${field}`) : `-${field}`;
      return { ...f, sort: next, page: 1 };
    });

  // ── selection ──
  const pageIds = data.map((u) => u.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ── mutations ──
  const act = (fn: () => Promise<unknown>, ok: string) =>
    void rowAction.run(fn, { success: ok, error: 'Action failed', onSuccess: refreshAll });

  const sendInvite = () => {
    if (!minLength(invite.name, 2) || !isEmail(invite.email)) {
      return toast.error('Enter a name and a valid email');
    }
    void inviteMutation.run(() => inviteUser(invite), {
      error: 'Invite failed',
      onSuccess: (res) => {
        toast.success(`Invitation sent to ${invite.email} (expires in 15 min)`);
        setLinkModal({ email: invite.email, link: res.link });
        setInviteOpen(false);
        setInvite(emptyInvite);
        refreshAll();
      },
    });
  };

  const reinvite = (u: User) =>
    void rowAction.run(() => reinviteUser(u.id), {
      error: 'Reinvite failed',
      onSuccess: (res) => {
        toast.success(`Invitation re-sent to ${u.email}`);
        setLinkModal({ email: u.email, link: res.link });
        refreshAll();
      },
    });

  const runBulk = (action: BulkAction, role?: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    void rowAction.run(() => bulkUsers(ids, action, role), {
      success: `Updated ${ids.length} user${ids.length === 1 ? '' : 's'}`,
      error: 'Bulk action failed',
      onSuccess: () => {
        setSelected(new Set());
        setConfirm(null);
        refreshAll();
      },
    });
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'bulk-delete') return runBulk('delete');
    const u = confirm.user!;
    const map: Record<Exclude<ConfirmKind, 'bulk-delete'>, { fn: () => Promise<unknown>; ok: string }> = {
      delete: { fn: () => deleteUser(u.id), ok: 'User deleted' },
      ban: { fn: () => banUser(u.id), ok: 'User banned' },
      revoke: { fn: () => revokeInvite(u.id), ok: 'Invite revoked' },
    };
    const { fn, ok } = map[confirm.kind];
    void rowAction.run(fn, {
      success: ok,
      error: 'Action failed',
      onSuccess: () => {
        setConfirm(null);
        setDetail(null);
        refreshAll();
      },
    });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Copy failed — select the link manually');
    }
  };

  // ── stat cards (colorful, clickable → filter) ──
  const applyFilter = (patch: Partial<typeof filters>, targetTab: Tab = 'all') => {
    setTab(targetTab);
    setSelected(new Set());
    setFilters((f) => ({
      ...f,
      status: '',
      role: '',
      verified: '',
      page: 1,
      ...(targetTab === 'invited' ? { status: 'INVITED' } : {}),
      ...patch,
    }));
  };
  const s = stats.data;
  type CardDef = { label: string; value: number; tone: StatTone; icon: ReactNode; onClick: () => void; active: boolean };
  const roleTones: StatTone[] = ['violet', 'sky', 'emerald', 'amber', 'rose', 'indigo'];
  const cards: CardDef[] = [
    { label: 'Total users', value: s?.total ?? 0, tone: 'indigo', icon: <Users className="size-5" />, onClick: () => applyFilter({}), active: !invited && !filters.status && !filters.verified && !filters.role },
    { label: 'Active', value: s?.active ?? 0, tone: 'emerald', icon: <UserCheck className="size-5" />, onClick: () => applyFilter({ status: 'ACTIVE' }), active: !invited && filters.status === 'ACTIVE' },
    { label: 'Invited', value: s?.invited ?? 0, tone: 'amber', icon: <Send className="size-5" />, onClick: () => applyFilter({}, 'invited'), active: invited },
    { label: 'Banned', value: s?.banned ?? 0, tone: 'rose', icon: <Ban className="size-5" />, onClick: () => applyFilter({ status: 'BANNED' }), active: !invited && filters.status === 'BANNED' },
    { label: 'Verified', value: s?.verified ?? 0, tone: 'sky', icon: <ShieldCheck className="size-5" />, onClick: () => applyFilter({ verified: 'true' }), active: !invited && filters.verified === 'true' },
    { label: 'Unverified', value: s?.unverified ?? 0, tone: 'slate', icon: <ShieldAlert className="size-5" />, onClick: () => applyFilter({ verified: 'false' }), active: !invited && filters.verified === 'false' },
    // Role breakdown — folded into the same grid (no separate row).
    ...(s?.byRole ?? []).map((r, i) => ({
      label: r.role,
      value: r.count,
      tone: roleTones[i % roleTones.length],
      icon: <Shield className="size-5" />,
      onClick: () => applyFilter({ role: r.role }),
      active: !invited && filters.role === r.role,
    })),
  ];

  // ── columns ──
  const userCell = (u: User) => (
    <div className="flex items-center gap-2.5">
      <Avatar name={u.name} />
      <div className="leading-tight">
        <button
          type="button"
          onClick={() => setDetail(u)}
          className="cursor-pointer text-sm font-medium text-text hover:text-indigo-500"
        >
          {u.name}
          {me?.id === u.id && <span className="ml-1.5 text-[10px] text-text-secondary">(you)</span>}
        </button>
        <p className="text-xs text-text-secondary">{u.email}</p>
      </div>
    </div>
  );

  const selectCol: Column<User> = {
    key: 'select',
    className: 'w-10',
    header: <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all" />,
    cell: (u) => <Checkbox checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} aria-label={`Select ${u.name}`} />,
  };

  const allColumns: Column<User>[] = [
    selectCol,
    { key: 'user', header: 'User', sortable: true, sortKey: 'name', cell: userCell },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      cell: (u) => <Badge tone={roleTone(u.role)}>{u.role}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-1.5">
          <Badge tone={toneFor(USER_STATUS_TONE, u.status)}>{u.status}</Badge>
          {!u.emailVerified && u.status === 'ACTIVE' && <Badge tone="warning">Unverified</Badge>}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      sortable: true,
      cell: (u) => <span className="whitespace-nowrap text-xs text-text-secondary">{formatDateTime(u.lastLogin)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (u) =>
        isProtected(u) ? (
          <span
            className="inline-grid size-8 place-items-center text-text-secondary/60"
            title={u.id === me?.id ? 'This is you' : 'Super Admin is protected'}
          >
            <Lock className="size-3.5" />
          </span>
        ) : (
          <Dropdown
            align="right"
            items={rowMenu(u)}
            trigger={
              <span className="grid size-8 place-items-center rounded-md text-text-secondary hover:bg-row-hover hover:text-text">
                <MoreHorizontal className="size-4" />
              </span>
            }
          />
        ),
    },
  ];

  const invitedColumns: Column<User>[] = [
    { key: 'user', header: 'User', cell: userCell },
    { key: 'role', header: 'Role', cell: (u) => <Badge tone={roleTone(u.role)}>{u.role}</Badge> },
    { key: 'invited', header: 'Invited', cell: (u) => <span className="text-xs text-text-secondary">{formatRelative(u.invitedAt)}</span> },
    {
      key: 'expiry',
      header: 'Invite status',
      cell: (u) =>
        isExpired(u.inviteExpiresAt) ? (
          <Badge tone="danger">Expired</Badge>
        ) : (
          <Badge tone="warning">Expires {formatRelative(u.inviteExpiresAt)}</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-44 text-right',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" leftIcon={<Send className="size-3.5" />} disabled={rowAction.saving} onClick={() => reinvite(u)}>
            Reinvite
          </Button>
          <Button variant="ghost" size="sm" iconOnly aria-label="Revoke invite" onClick={() => setConfirm({ user: u, kind: 'revoke' })}>
            <Trash2 className="size-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Users"
        subtitle="Admin & staff accounts only — shoppers are managed under Customers."
        action={
          <Button
            leftIcon={<UserPlus className="size-4" />}
            onClick={() => {
              setInvite({ ...emptyInvite, role: defaultRole });
              setInviteOpen(true);
            }}
          >
            Invite user
          </Button>
        }
      />

      {/* Colorful count cards (click to filter) — status + verification + role breakdown.
          Single row: cards stretch to fill and scroll horizontally if they run out of width. */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            className="min-w-36 flex-1"
            label={c.label}
            value={c.value}
            tone={c.tone}
            icon={c.icon}
            active={c.active}
            onClick={c.onClick}
          />
        ))}
      </div>

      <Tabs
        value={tab}
        onChange={changeTab}
        tabs={[
          { key: 'all', label: 'All users' },
          { key: 'invited', label: 'Invited', count: invitedCount.data ?? undefined },
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          containerClassName="min-w-56 flex-1"
          placeholder="Search name or email…"
          value={filters.search}
          loading={loading && !!filters.search}
          onValueChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
        />
        <Select className="w-40" value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}>
          <option value="">All roles</option>
          {roleNames.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        {!invited && (
          <>
            <Select className="w-40" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Status | '', page: 1 }))}>
              <option value="">All statuses</option>
              {(['ACTIVE', 'BANNED', 'DELETED', 'INVITED', 'SUSPENDED'] as Status[]).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
            <Select className="w-40" value={filters.verified} onChange={(e) => setFilters((f) => ({ ...f, verified: e.target.value as '' | 'true' | 'false', page: 1 }))}>
              <option value="">Any verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </Select>
          </>
        )}
      </div>

      {/* Bulk toolbar */}
      {!invited && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-indigo-500/40 bg-indigo-500/5 px-3 py-2">
          <span className="text-sm font-medium text-text">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Select className="h-8 w-36" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)}>
            <option value="">Set role…</option>
            {roleNames.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" disabled={!bulkRole || rowAction.saving} onClick={() => runBulk('setRole', bulkRole)}>
            Apply role
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<Ban className="size-3.5" />} disabled={rowAction.saving} onClick={() => runBulk('ban')}>
            Ban
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="size-3.5" />} disabled={rowAction.saving} onClick={() => runBulk('restore')}>
            Restore
          </Button>
          <Button size="sm" variant="danger" leftIcon={<Trash2 className="size-3.5" />} disabled={rowAction.saving} onClick={() => setConfirm({ kind: 'bulk-delete' })}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      <Table
        columns={invited ? invitedColumns : allColumns}
        rows={data}
        rowKey={(u) => u.id}
        loading={loading}
        sort={sortState}
        onSort={invited ? undefined : onSort}
        emptyState={invited ? 'No pending invites.' : 'No users match these filters.'}
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
            They'll get an email with a link to set their password. The link{' '}
            <span className="font-medium text-text">expires in 15 minutes</span> — re-send it from the
            Invited tab if it lapses.
          </p>
          <FormField label="Name" required>
            <Input value={invite.name} onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))} placeholder="Jane Doe" autoComplete="off" />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={invite.email} onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))} placeholder="jane@nova.shop" autoComplete="off" />
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

      {/* Invite link (copyable — handy when SMTP is off) */}
      <Modal
        open={!!linkModal}
        onClose={() => setLinkModal(null)}
        title="Invitation link"
        footer={
          <Button variant="secondary" onClick={() => setLinkModal(null)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Sent to <span className="font-medium text-text">{linkModal?.email}</span>. It expires in 15
            minutes — you can share this link directly if the email doesn't arrive.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={linkModal?.link ?? ''} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="secondary" leftIcon={<Copy className="size-4" />} onClick={() => linkModal && copy(linkModal.link)}>
              Copy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change role */}
      <Modal
        open={!!roleModal}
        onClose={() => setRoleModal(null)}
        title={`Change role — ${roleModal?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleModal(null)} disabled={rowAction.saving}>
              Cancel
            </Button>
            <Button onClick={saveRole} loading={rowAction.saving} disabled={roleValue === roleModal?.role}>
              Save
            </Button>
          </>
        }
      >
        <FormField label="Role">
          <Select value={roleValue} onChange={(e) => setRoleValue(e.target.value)}>
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </FormField>
      </Modal>

      {/* User detail drawer */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title="User details">
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={detail.name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-text">{detail.name}</p>
                <p className="text-xs text-text-secondary">{detail.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-text-secondary">Role</dt>
                <dd className="mt-0.5"><Badge tone={roleTone(detail.role)}>{detail.role}</Badge></dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Status</dt>
                <dd className="mt-0.5"><Badge tone={toneFor(USER_STATUS_TONE, detail.status)}>{detail.status}</Badge></dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Email verified</dt>
                <dd className="mt-0.5"><Badge tone={detail.emailVerified ? 'success' : 'warning'}>{detail.emailVerified ? 'Verified' : 'Unverified'}</Badge></dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Last login</dt>
                <dd className="mt-0.5 text-text">{formatDateTime(detail.lastLogin)}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Created</dt>
                <dd className="mt-0.5 text-text">{formatDateTime(detail.createdAt)}</dd>
              </div>
              {detail.status === 'INVITED' && (
                <div>
                  <dt className="text-xs text-text-secondary">Invite expires</dt>
                  <dd className="mt-0.5 text-text">{formatRelative(detail.inviteExpiresAt)}</dd>
                </div>
              )}
            </dl>
            {detail.status === 'ACTIVE' && !detail.emailVerified && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<Mail className="size-4" />}
                onClick={() => act(() => resendVerification(detail.id), 'Verification email sent')}
              >
                Resend verification email
              </Button>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === 'delete'
            ? 'Delete user'
            : confirm?.kind === 'ban'
              ? 'Ban user'
              : confirm?.kind === 'bulk-delete'
                ? `Delete ${selected.size} users`
                : 'Revoke invite'
        }
        danger
        confirmLabel={confirm?.kind === 'ban' ? 'Ban' : confirm?.kind === 'revoke' ? 'Revoke' : 'Delete'}
        loading={rowAction.saving}
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
        message={
          confirm?.kind === 'bulk-delete' ? (
            <>Delete <span className="font-medium text-text">{selected.size}</span> selected users? This marks the accounts as deleted (you are excluded).</>
          ) : confirm?.kind === 'delete' ? (
            <>Delete <span className="font-medium text-text">{confirm?.user?.name}</span>? This marks the account as deleted and revokes access.</>
          ) : confirm?.kind === 'ban' ? (
            <>Ban <span className="font-medium text-text">{confirm?.user?.name}</span>? They'll be signed out and blocked until restored.</>
          ) : (
            <>Revoke the invite for <span className="font-medium text-text">{confirm?.user?.email}</span>? The pending account is removed and their link stops working.</>
          )
        }
      />
    </div>
  );
}
