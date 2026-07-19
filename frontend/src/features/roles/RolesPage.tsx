import { useMemo, useState } from 'react';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { PERMISSION_RESOURCES, permission } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  FormField,
  Input,
  Modal,
  Skeleton,
  toast,
} from '@/components/ui';
import { PageHeader } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import { createRole, deleteRole, updateRole, useRoles, type Role } from './api';

const emptyForm = { name: '', description: '', permissions: new Set<string>() };

export function RolesPage() {
  const { can } = useAuth();
  const canWrite = can('roles.write');
  const { data, loading, error, reload } = useRoles();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; permissions: Set<string> }>(
    emptyForm,
  );
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const saveMutation = useMutation();
  const deleteMutation = useMutation();

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
    setForm({
      name: role.name,
      description: role.description ?? '',
      permissions: new Set(role.permissions),
    });
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
    const payload = {
      name: form.name,
      description: form.description,
      permissions: [...form.permissions],
    };
    void saveMutation.run(
      () => (editing ? updateRole(editing.id, payload) : createRole(payload)),
      {
        success: editing ? 'Role updated' : 'Role created',
        error: 'Save failed',
        onSuccess: () => {
          setOpen(false);
          void reload();
        },
      },
    );
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        subtitle="Define roles and what each one can access."
        action={
          canWrite && (
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              New role
            </Button>
          )
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        {!loading &&
          data.map((role) => (
            <Card key={role.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">{role.name}</span>
                  {role.isSystem && (
                    <Badge tone="info">
                      <ShieldCheck className="mr-1 size-3" /> System
                    </Badge>
                  )}
                </div>
                {canWrite && !role.isSystem && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" iconOnly aria-label="Edit" onClick={() => openEdit(role)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" iconOnly aria-label="Delete" onClick={() => setToDelete(role)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
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
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Store Manager"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
              autoComplete="off"
            />
          </FormField>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Permissions</span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-info hover:underline"
              >
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
                        <Checkbox
                          checked={form.permissions.has(permission(res.key, 'read'))}
                          onChange={() => toggle(permission(res.key, 'read'))}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Checkbox
                          checked={form.permissions.has(permission(res.key, 'write'))}
                          onChange={() => toggle(permission(res.key, 'write'))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            Delete the <span className="font-medium text-text">{toDelete?.name}</span> role? Users
            with this role will lose its permissions.
          </>
        }
      />
    </div>
  );
}
