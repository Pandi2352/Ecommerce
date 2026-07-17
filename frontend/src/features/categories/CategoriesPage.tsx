import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Modal,
  Select,
  Table,
  toast,
  type Column,
} from '@/components/ui';
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
  const { data, loading, error, reload } = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

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

  const save = async () => {
    if (form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const payload: CategoryInput = { ...form, parent: form.parent || null };
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      setOpen(false);
      await reload();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCategory(toDelete.id);
      toast.success('Category deleted');
      setToDelete(null);
      await reload();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Delete failed');
    }
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
      cell: (c) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Categories</h1>
          <p className="text-sm text-text-secondary">Organize the catalog into nested categories.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error} — is the API running on <code>/api</code>?
        </div>
      )}

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
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Name</span>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Dresses"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Slug (optional)</span>
            <Input
              value={form.slug ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated from name"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Parent</span>
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
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">Description</span>
            <Input
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
            />
          </label>
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
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete category"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        Delete <span className="font-medium text-text">{toDelete?.name}</span>? Any sub-categories
        will be moved up to its parent.
      </Modal>
    </div>
  );
}
