import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal, Plus, ShieldCheck, Star, Upload } from 'lucide-react';
import { PERMISSION_RESOURCES, permission } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Dropdown,
  FormField,
  Input,
  Modal,
  SearchInput,
  Skeleton,
  toast,
  type DropdownItem,
} from '@/components/ui';
import { PageHeader } from '@/components/common';
import { getList } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useMutation } from '@/hooks/useMutation';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import { bulkUsers, type User } from '@/features/users';
import { createRole, deleteRole, setDefaultRole, updateRole, useRoles, type Role } from './api';

const emptyForm = { name: '', description: '', permissions: new Set<string>() };

export function RolesPage() {
  const { can } = useAuth();
  const canWrite = can('roles.write');
  const { data, loading, error, reload } = useRoles();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; permissions: Set<string> }>(emptyForm);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const saveMutation = useMutation();
  const deleteMutation = useMutation();
  const defaultMutation = useMutation();
  const importMutation = useMutation();
  const assignMutation = useMutation();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── assign-to-users modal ──
  const [assignRole, setAssignRole] = useState<Role | null>(null);
  const [assignSel, setAssignSel] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const { data: userList, reload: reloadUsers, loading: usersLoading } = useApi(
    async () =>
      (
        await getList<User>('/users', {
          params: { pageSize: 50, ...(debouncedUserSearch ? { search: debouncedUserSearch } : {}) },
        })
      ).data,
    { immediate: false, errorMessage: 'Failed to load users' },
  );
  useEffect(() => {
    if (assignRole) void reloadUsers();
  }, [assignRole, debouncedUserSearch, reloadUsers]);

  const allKeys = useMemo(
    () => PERMISSION_RESOURCES.flatMap((r) => [permission(r.key, 'read'), permission(r.key, 'write')]),
    [],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', permissions: new Set() });
    setOpen(true);
  };
  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description ?? '', permissions: new Set(role.permissions) });
    setOpen(true);
  };

  const toggle = (key: string) =>
    setForm((f) => {
      const next = new Set(f.permissions);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...f, permissions: next };
    });

  const toggleAll = () =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.size === allKeys.length ? new Set() : new Set(allKeys),
    }));

  const save = () => {
    if (!minLength(form.name, 2)) return toast.error('Role name is required');
    const payload = { name: form.name, description: form.description, permissions: [...form.permissions] };
    void saveMutation.run(() => (editing ? updateRole(editing.id, payload) : createRole(payload)), {
      success: editing ? 'Role updated' : 'Role created',
      error: 'Save failed',
      onSuccess: () => {
        setOpen(false);
        void reload();
      },
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    void deleteMutation.run(() => deleteRole(toDelete.id), {
      success: 'Role deleted',
      error: 'Delete failed',
      onSuccess: () => {
        setToDelete(null);
        void reload();
      },
    });
  };

  const makeDefault = (role: Role) =>
    void defaultMutation.run(() => setDefaultRole(role.id), {
      success: `"${role.name}" is now the default role for invites`,
      error: 'Failed to set default',
      onSuccess: () => void reload(),
    });

  const exportRole = (role: Role) => {
    const payload = { name: role.name, description: role.description ?? '', permissions: role.permissions };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `role-${role.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Role exported');
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed?.name || !Array.isArray(parsed.permissions)) {
        throw new Error('Not a valid role file (need name + permissions)');
      }
      void importMutation.run(
        () => createRole({ name: parsed.name, description: parsed.description, permissions: parsed.permissions }),
        { success: `Role "${parsed.name}" imported`, error: 'Import failed', onSuccess: () => void reload() },
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid role file'));
    }
  };

  const openAssign = (role: Role) => {
    setAssignRole(role);
    setAssignSel(new Set());
    setUserSearch('');
  };
  const toggleAssign = (id: string) =>
    setAssignSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const doAssign = () => {
    if (!assignRole || assignSel.size === 0) return;
    void assignMutation.run(() => bulkUsers([...assignSel], 'setRole', assignRole.name), {
      success: `Assigned ${assignSel.size} user${assignSel.size === 1 ? '' : 's'} to ${assignRole.name}`,
      error: 'Assign failed',
      onSuccess: () => setAssignRole(null),
    });
  };

  const roleMenu = (role: Role): DropdownItem[] => {
    const items: DropdownItem[] = [];
    if (!role.isDefault) items.push({ label: 'Set as default', onSelect: () => makeDefault(role) });
    items.push({ label: 'Assign to users', onSelect: () => openAssign(role) });
    items.push({ label: 'Export JSON', onSelect: () => exportRole(role) });
    if (!role.isSystem) {
      items.push({ label: 'Edit', onSelect: () => openEdit(role) });
      items.push({ label: 'Delete', danger: true, onSelect: () => setToDelete(role) });
    }
    return items;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles & permissions"
        subtitle="Define roles and what each one can access."
        action={
          canWrite && (
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
              <Button variant="secondary" leftIcon={<Upload className="size-4" />} loading={importMutation.saving} onClick={() => fileRef.current?.click()}>
                Import
              </Button>
              <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
                New role
              </Button>
            </div>
          )
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {!loading &&
          data.map((role) => (
            <Card key={role.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-text">{role.name}</span>
                  {role.isSystem && (
                    <Badge tone="info">
                      <ShieldCheck className="mr-1 size-3" /> System
                    </Badge>
                  )}
                  {role.isDefault && (
                    <Badge tone="success">
                      <Star className="mr-1 size-3" /> Default
                    </Badge>
                  )}
                </div>
                {canWrite && (
                  <Dropdown
                    align="right"
                    items={roleMenu(role)}
                    trigger={
                      <span className="grid size-7 place-items-center rounded-md text-text-secondary hover:bg-row-hover hover:text-text">
                        <MoreHorizontal className="size-4" />
                      </span>
                    }
                  />
                )}
              </div>
              <p className="mt-1 min-h-8 text-xs text-text-secondary">{role.description}</p>
              <p className="mt-auto pt-2 text-xs font-medium text-text-secondary">
                {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
              </p>
            </Card>
          ))}
      </div>

      {/* Create / edit with permission matrix */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
        title={editing ? `Edit role — ${editing.name}` : 'New role'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saveMutation.saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saveMutation.saving}>
              {editing ? 'Save changes' : 'Create role'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Role name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Store Manager" autoComplete="off" />
          </FormField>
          <FormField label="Description" hint="Shown on the role card — explain what this role is for.">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" autoComplete="off" />
          </FormField>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Permissions</span>
              <button type="button" onClick={toggleAll} className="cursor-pointer text-xs font-medium text-info hover:underline">
                {form.permissions.size === allKeys.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border border-border scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-table-header">
                  <tr className="text-xs text-text-secondary">
                    <th className="px-3 py-2 text-left font-medium">Resource</th>
                    <th className="w-16 px-3 py-2 text-center font-medium">Read</th>
                    <th className="w-16 px-3 py-2 text-center font-medium">Write</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_RESOURCES.map((res) => (
                    <tr key={res.key} className="border-t border-border">
                      <td className="px-3 py-2 text-text">{res.label}</td>
                      <td className="px-3 py-2 text-center">
                        <Checkbox checked={form.permissions.has(permission(res.key, 'read'))} onChange={() => toggle(permission(res.key, 'read'))} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Checkbox checked={form.permissions.has(permission(res.key, 'write'))} onChange={() => toggle(permission(res.key, 'write'))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Assign role to users */}
      <Modal
        open={!!assignRole}
        onClose={() => setAssignRole(null)}
        title={`Assign "${assignRole?.name}" to users`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignRole(null)} disabled={assignMutation.saving}>
              Cancel
            </Button>
            <Button onClick={doAssign} loading={assignMutation.saving} disabled={assignSel.size === 0}>
              Assign {assignSel.size > 0 ? `(${assignSel.size})` : ''}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <SearchInput value={userSearch} onValueChange={setUserSearch} loading={usersLoading} placeholder="Search users…" />
          <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border scrollbar-thin">
            {(userList ?? []).length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-text-secondary">No users found.</p>
            )}
            {(userList ?? []).map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-row-hover">
                <Checkbox checked={assignSel.has(u.id)} onChange={() => toggleAssign(u.id)} />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm text-text">{u.name}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {u.email} · <span className="font-medium">{u.role}</span>
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete role"
        danger
        confirmLabel="Delete"
        loading={deleteMutation.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={
          <>
            Delete the <span className="font-medium text-text">{toDelete?.name}</span> role? Users with this role will
            lose its permissions.
          </>
        }
      />
    </div>
  );
}
