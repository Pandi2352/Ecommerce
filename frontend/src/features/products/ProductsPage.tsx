import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, FileEdit, Package, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import { ProductStatus } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  FormField,
  Input,
  Modal,
  Pagination,
  SearchInput,
  Select,
  Table,
  toast,
  type BadgeTone,
  type Column,
  type SortState,
} from '@/components/ui';
import { PageHeader, StatCard, type StatTone } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { formatCurrency } from '@/utils/formatters';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories';
import {
  createProduct,
  deleteProduct,
  updateProduct,
  useProducts,
  useProductStats,
  type Product,
  type ProductInput,
} from './api';

const statusTone: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  DRAFT: 'info',
  ARCHIVED: 'neutral',
};

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  category: '',
  status: ProductStatus.DRAFT as ProductStatus,
  stock: '0',
  description: '',
  image: '',
  featured: false,
};
type FormState = typeof emptyForm;

export function ProductsPage() {
  const { can } = useAuth();
  const canWrite = can('products.write');
  const { data, meta, loading, error, filters, setFilters, reload } = useProducts();
  const { data: categories } = useCategories();
  const stats = useProductStats();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const saveMutation = useMutation();
  const deleteMutation = useMutation();

  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const sortState: SortState = {
    key: filters.sort.replace(/^-/, ''),
    dir: filters.sort.startsWith('-') ? 'desc' : 'asc',
  };
  const onSort = (field: string) =>
    setFilters((f) => {
      const cur = f.sort.replace(/^-/, '');
      const desc = f.sort.startsWith('-');
      return { ...f, sort: cur === field ? (desc ? field : `-${field}`) : `-${field}`, page: 1 };
    });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? '',
      price: String(p.price),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
      category: p.category ?? '',
      status: p.status,
      stock: String(p.stock),
      description: p.description ?? '',
      image: p.images[0] ?? '',
      featured: p.featured,
    });
    setOpen(true);
  };

  const save = () => {
    if (!minLength(form.name, 2)) return toast.error('Name must be at least 2 characters');
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return toast.error('Enter a valid price');
    const payload: ProductInput = {
      name: form.name,
      sku: form.sku || undefined,
      description: form.description || undefined,
      price,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      category: form.category || null,
      status: form.status,
      stock: Number(form.stock) || 0,
      images: form.image ? [form.image] : [],
      featured: form.featured,
    };
    void saveMutation.run(() => (editing ? updateProduct(editing.id, payload) : createProduct(payload)), {
      success: editing ? 'Product updated' : 'Product created',
      error: 'Save failed',
      onSuccess: () => {
        setOpen(false);
        void reload();
        void stats.reload();
      },
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    void deleteMutation.run(() => deleteProduct(toDelete.id), {
      success: 'Product deleted',
      error: 'Delete failed',
      onSuccess: () => {
        setToDelete(null);
        void reload();
        void stats.reload();
      },
    });
  };

  const applyStatus = (status: ProductStatus | '') =>
    setFilters((f) => ({ ...f, status, page: 1 }));

  const s = stats.data;
  const cards: Array<{ label: string; value: number; tone: StatTone; icon: ReactNode; onClick?: () => void; active?: boolean }> = [
    { label: 'Total', value: s?.total ?? 0, tone: 'indigo', icon: <Package className="size-5" />, onClick: () => applyStatus(''), active: !filters.status },
    { label: 'Active', value: s?.active ?? 0, tone: 'emerald', icon: <CheckCircle2 className="size-5" />, onClick: () => applyStatus(ProductStatus.ACTIVE), active: filters.status === ProductStatus.ACTIVE },
    { label: 'Draft', value: s?.draft ?? 0, tone: 'sky', icon: <FileEdit className="size-5" />, onClick: () => applyStatus(ProductStatus.DRAFT), active: filters.status === ProductStatus.DRAFT },
    { label: 'Archived', value: s?.archived ?? 0, tone: 'slate', icon: <Boxes className="size-5" />, onClick: () => applyStatus(ProductStatus.ARCHIVED), active: filters.status === ProductStatus.ARCHIVED },
    { label: 'Low stock', value: s?.lowStock ?? 0, tone: 'amber', icon: <AlertTriangle className="size-5" /> },
    { label: 'Out of stock', value: s?.outOfStock ?? 0, tone: 'rose', icon: <XCircle className="size-5" /> },
  ];

  const stockBadge = (n: number) =>
    n === 0 ? <Badge tone="danger">Out</Badge> : n <= 5 ? <Badge tone="warning">Low · {n}</Badge> : <Badge tone="neutral">{n}</Badge>;

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          {p.images[0] ? (
            <img src={p.images[0]} alt="" className="size-9 shrink-0 rounded-md border border-border object-cover" />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-bg text-text-secondary">
              <Package className="size-4" />
            </span>
          )}
          <div className="leading-tight">
            <p className="text-sm font-medium text-text">{p.name}</p>
            {p.sku && <p className="font-mono text-[11px] text-text-secondary">{p.sku}</p>}
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (p) => (p.category ? categoryName[p.category] ?? '—' : '—') },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      cell: (p) => (
        <div className="whitespace-nowrap">
          <span className="text-text">{formatCurrency(p.price)}</span>
          {p.compareAtPrice ? (
            <span className="ml-1.5 text-xs text-text-secondary line-through">{formatCurrency(p.compareAtPrice)}</span>
          ) : null}
        </div>
      ),
    },
    { key: 'stock', header: 'Stock', sortable: true, cell: (p) => stockBadge(p.stock) },
    { key: 'status', header: 'Status', sortable: true, cell: (p) => <Badge tone={statusTone[p.status] ?? 'neutral'}>{p.status}</Badge> },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (p) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" iconOnly aria-label="Edit" onClick={() => openEdit(p)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" iconOnly aria-label="Delete" onClick={() => setToDelete(p)}>
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle="Your catalog — create, price, and stock your items."
        action={
          canWrite && (
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              Add product
            </Button>
          )
        }
      />

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {cards.map((c) => (
          <StatCard key={c.label} className="min-w-36 flex-1" label={c.label} value={c.value} tone={c.tone} icon={c.icon} active={c.active} onClick={c.onClick} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          containerClassName="min-w-56 flex-1"
          placeholder="Search name or SKU…"
          value={filters.search}
          loading={loading && !!filters.search}
          onValueChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
        />
        <Select className="w-44" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select className="w-40" value={filters.status} onChange={(e) => applyStatus(e.target.value as ProductStatus | '')}>
          <option value="">All statuses</option>
          {Object.values(ProductStatus).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>
      </div>

      {error && <Alert>{error}</Alert>}

      <Table
        columns={columns}
        rows={data}
        rowKey={(p) => p.id}
        loading={loading}
        sort={sortState}
        onSort={onSort}
        emptyState="No products match these filters."
      />

      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-xl"
        title={editing ? `Edit — ${editing.name}` : 'New product'}
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
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name" required className="col-span-2">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Linen Wrap Dress" />
          </FormField>
          <FormField label="SKU">
            <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="NOVA-001" />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}>
              {Object.values(ProductStatus).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Price" required>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" />
          </FormField>
          <FormField label="Compare-at price">
            <Input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="Optional" />
          </FormField>
          <FormField label="Category">
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Stock">
            <Input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          </FormField>
          <FormField label="Image URL" className="col-span-2">
            <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://…" />
          </FormField>
          <FormField label="Description" className="col-span-2">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          </FormField>
          <label className="col-span-2 flex items-center gap-2 text-sm text-text">
            <Checkbox checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
            Featured product
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete product"
        danger
        confirmLabel="Delete"
        loading={deleteMutation.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={
          <>
            Delete <span className="font-medium text-text">{toDelete?.name}</span>? This can't be undone.
          </>
        }
      />
    </div>
  );
}
