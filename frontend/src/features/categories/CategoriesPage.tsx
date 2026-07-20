import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react';
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
  Skeleton,
  Textarea,
  toast,
} from '@/components/ui';
import { ImageUploader, PageHeader } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import {
  createCategory,
  deleteCategory,
  reorderCategory,
  updateCategory,
  useCategoryTree,
  type CategoryInput,
  type CategoryNode,
} from './api';

interface EditState extends CategoryInput {
  id?: string;
}
const emptyForm: EditState = {
  name: '', slug: '', description: '', image: '', parent: '', isActive: true, metaTitle: '', metaDescription: '',
};

export function CategoriesPage() {
  const { can } = useAuth();
  const canWrite = can('categories.write');
  const { data: tree, loading, error, reload } = useCategoryTree();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditState>(emptyForm);
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const save = useMutation();
  const del = useMutation();
  const move = useMutation();

  // Flatten for the parent select (with indentation).
  const flat = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = [];
    const walk = (nodes: CategoryNode[], d: number) =>
      nodes.forEach((n) => { out.push({ id: n.id, name: n.name, depth: d }); walk(n.children, d + 1); });
    walk(tree, 0);
    return out;
  }, [tree]);

  // Exclude self + descendants from the parent options (prevents cycles).
  const excluded = useMemo(() => {
    const set = new Set<string>();
    if (!editingId) return set;
    set.add(editingId);
    const find = (nodes: CategoryNode[]): CategoryNode | null => {
      for (const n of nodes) {
        if (n.id === editingId) return n;
        const f = find(n.children);
        if (f) return f;
      }
      return null;
    };
    const node = find(tree);
    const collect = (n: CategoryNode) => n.children.forEach((c) => { set.add(c.id); collect(c); });
    if (node) collect(node);
    return set;
  }, [editingId, tree]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openCreate = (parent?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, parent: parent ?? '' });
    setOpen(true);
  };
  const openEdit = (c: CategoryNode) => {
    setEditingId(c.id);
    setForm({
      name: c.name, slug: c.slug, description: c.description ?? '', image: c.image ?? '',
      parent: c.parent ?? '', isActive: c.isActive, metaTitle: c.metaTitle ?? '', metaDescription: c.metaDescription ?? '',
    });
    setOpen(true);
  };

  const onSave = () => {
    if (!minLength(form.name, 2)) return toast.error('Name must be at least 2 characters');
    const payload: CategoryInput = { ...form, parent: form.parent || null };
    void save.run(() => (editingId ? updateCategory(editingId, payload) : createCategory(payload)), {
      success: editingId ? 'Category updated' : 'Category created',
      error: 'Save failed',
      onSuccess: () => { setOpen(false); void reload(); },
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    void del.run(() => deleteCategory(toDelete.id), {
      success: 'Category deleted',
      error: 'Delete failed',
      onSuccess: () => { setToDelete(null); void reload(); },
    });
  };

  const doMove = (id: string, direction: 'up' | 'down') =>
    void move.run(() => reorderCategory(id, direction), { error: 'Reorder failed', onSuccess: () => void reload() });

  const renderNode = (node: CategoryNode, depth: number, index: number, siblings: CategoryNode[]) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);
    return (
      <div key={node.id}>
        <div className="flex items-center gap-2 border-b border-border px-2 py-2 hover:bg-row-hover" style={{ paddingLeft: depth * 22 + 8 }}>
          {hasChildren ? (
            <button type="button" onClick={() => toggle(node.id)} className="cursor-pointer text-text-secondary hover:text-text" aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          ) : (
            <span className="inline-block size-4" />
          )}
          {node.image ? (
            <img src={node.image} alt="" className="size-7 shrink-0 rounded-md border border-border object-cover" />
          ) : null}
          <span className="text-sm font-medium text-text">{node.name}</span>
          <span className="font-mono text-[11px] text-text-secondary">/{node.slug}</span>
          <Badge tone="neutral">{node.productCount ?? 0} products</Badge>
          {!node.isActive && <Badge tone="warning">Inactive</Badge>}

          {canWrite && (
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" iconOnly aria-label="Move up" disabled={index === 0 || move.saving} onClick={() => doMove(node.id, 'up')}><ArrowUp className="size-4" /></Button>
              <Button variant="ghost" size="sm" iconOnly aria-label="Move down" disabled={index === siblings.length - 1 || move.saving} onClick={() => doMove(node.id, 'down')}><ArrowDown className="size-4" /></Button>
              <Button variant="ghost" size="sm" iconOnly aria-label="Add subcategory" onClick={() => openCreate(node.id)}><FolderPlus className="size-4" /></Button>
              <Button variant="ghost" size="sm" iconOnly aria-label="Edit" onClick={() => openEdit(node)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="sm" iconOnly aria-label="Delete" onClick={() => setToDelete(node)}><Trash2 className="size-4 text-danger" /></Button>
            </div>
          )}
        </div>
        {hasChildren && !isCollapsed && node.children.map((c, i) => renderNode(c, depth + 1, i, node.children))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categories"
        subtitle="Organize the catalog into a nested tree. Drag order with the arrows; nest with subcategories."
        action={canWrite && <Button leftIcon={<Plus className="size-4" />} onClick={() => openCreate()}>Add category</Button>}
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : tree.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-4 py-10 text-center text-sm text-text-secondary">
          No categories yet. Create your first one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          {tree.map((n, i) => renderNode(n, 0, i, tree))}
        </div>
      )}

      {/* Create / edit */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
        title={editingId ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={save.saving}>Cancel</Button>
            <Button onClick={onSave} loading={save.saving}>{editingId ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Dresses" /></FormField>
            <FormField label="Slug" hint="auto from name"><Input value={form.slug ?? ''} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="font-mono" /></FormField>
          </div>
          <FormField label="Parent">
            <Select value={form.parent ?? ''} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}>
              <option value="">— None (top level) —</option>
              {flat.filter((c) => !excluded.has(c.id)).map((c) => (
                <option key={c.id} value={c.id}>{`${'  '.repeat(c.depth)}${c.name}`}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Image">
            <ImageUploader value={form.image ? [form.image] : []} onChange={(imgs) => setForm((f) => ({ ...f, image: imgs[0] ?? '' }))} max={1} />
          </FormField>
          <FormField label="Description"><Textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" /></FormField>
          <div className="rounded-md border border-border p-3">
            <p className="mb-2 text-xs font-medium text-text-secondary">SEO</p>
            <div className="space-y-3">
              <FormField label="Meta title"><Input value={form.metaTitle ?? ''} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} /></FormField>
              <FormField label="Meta description"><Textarea rows={2} value={form.metaDescription ?? ''} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} /></FormField>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <Checkbox checked={form.isActive ?? true} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category"
        danger
        confirmLabel="Delete"
        loading={del.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={
          <>
            Delete <span className="font-medium text-text">{toDelete?.name}</span>? Its subcategories and{' '}
            {toDelete?.productCount ?? 0} product(s) move up to its parent.
          </>
        }
      />
    </div>
  );
}
