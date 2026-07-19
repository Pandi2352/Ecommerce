import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  FormField,
  Input,
  Modal,
  Select,
  Table,
  toast,
  type Column,
} from '@/components/ui';
import { PageHeader } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  useCategories,
  type Category,
  type CategoryInput,
} from './api';

const emptyForm: CategoryInput = { name: '', slug: '', description: '', parent: '', isActive: true };

export function CategoriesPage() {
  const { can } = useAuth();
  const canWrite = can('categories.write');
  const { data, loading, error, reload } = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const saveMutation = useMutation();
  const deleteMutation = useMutation();

  const nameById = useMemo(
    () => Object.fromEntries(data.map((c) => [c.id, c.name])),
    [data],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      parent: c.parent ?? '',
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const save = () => {
    if (!minLength(form.name, 2)) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    const payload: CategoryInput = { ...form, parent: form.parent || null };
    void saveMutation.run(
      () => (editing ? updateCategory(editing.id, payload) : createCategory(payload)),
      {
        success: editing ? 'Category updated' : 'Category created',
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
    void deleteMutation.run(() => deleteCategory(toDelete.id), {
      success: 'Category deleted',
      error: 'Delete failed',
      onSuccess: () => {
        setToDelete(null);
        void reload();
      },
    });
  };

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name', cell: (c) => <span className="font-medium text-text">{c.name}</span> },
    { key: 'slug', header: 'Slug', cell: (c) => <span className="font-mono text-xs text-text-secondary">{c.slug}</span> },
    { key: 'parent', header: 'Parent', cell: (c) => (c.parent ? nameById[c.parent] ?? '—' : '—') },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (c) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setToDelete(c)} aria-label="Delete">
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organize the catalog into nested categories."
        action={
          canWrite && (
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              Add category
            </Button>
          )
        }
      />

      {error && <Alert>{error} — is the API running on <code>/api</code>?</Alert>}

      <Table
        columns={columns}
        rows={data}
        rowKey={(c) => c.id}
        loading={loading}
        emptyState="No categories yet. Create your first one."
      />

      {/* Create / Edit */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saveMutation.saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saveMutation.saving}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Dresses"
            />
          </FormField>
          <FormField label="Slug (optional)">
            <Input
              value={form.slug ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated from name"
            />
          </FormField>
          <FormField label="Parent">
            <Select
              value={form.parent ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
            >
              <option value="">— None (top level) —</option>
              {data
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Description">
            <Input
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
            />
          </FormField>
          <label className="flex items-center gap-2 pt-1 text-sm text-text">
            <Checkbox
              checked={form.isActive ?? true}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete category"
        danger
        confirmLabel="Delete"
        loading={deleteMutation.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={
          <>
            Delete <span className="font-medium text-text">{toDelete?.name}</span>? Any sub-categories
            will be moved up to its parent.
          </>
        }
      />
    </div>
  );
}
