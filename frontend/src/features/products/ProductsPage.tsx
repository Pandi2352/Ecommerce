import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Boxes, CheckCircle2, FileEdit, Package, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import { ProductStatus } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Pagination,
  SearchInput,
  Select,
  Table,
  type BadgeTone,
  type Column,
  type SortState,
} from '@/components/ui';
import { PageHeader, StatCard, type StatTone } from '@/components/common';
import { cn } from '@/utils/cn';
import { useMutation } from '@/hooks/useMutation';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories';
import { fetchBrands } from '@/features/brands/api';
import { fetchVendors } from '@/features/vendors/api';
import { useApi } from '@/hooks/useApi';
import { bulkProducts, deleteProduct, useProducts, useProductStats, type Product } from './api';

const statusTone: Record<string, BadgeTone> = { ACTIVE: 'success', DRAFT: 'info', ARCHIVED: 'neutral' };

export function ProductsPage() {
  const { can } = useAuth();
  const canWrite = can('products.write');
  const navigate = useNavigate();
  const { data, meta, loading, error, filters, setFilters, reload } = useProducts();
  const { data: categories } = useCategories();
  const { data: brandsRes } = useApi(fetchBrands, { errorMessage: 'Failed to load brands' });
  const { data: vendorsRes } = useApi(fetchVendors, { errorMessage: 'Failed to load vendors' });
  const brands = brandsRes?.data ?? [];
  const vendors = vendorsRes?.data ?? [];
  const stats = useProductStats();

  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const deleteMutation = useMutation();
  const bulk = useMutation();

  const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const sortState: SortState = { key: filters.sort.replace(/^-/, ''), dir: filters.sort.startsWith('-') ? 'desc' : 'asc' };
  const onSort = (field: string) =>
    setFilters((f) => {
      const cur = f.sort.replace(/^-/, '');
      const desc = f.sort.startsWith('-');
      return { ...f, sort: cur === field ? (desc ? field : `-${field}`) : `-${field}`, page: 1 };
    });

  const confirmDelete = () => {
    if (!toDelete) return;
    void deleteMutation.run(() => deleteProduct(toDelete.id), {
      success: 'Product deleted', error: 'Delete failed',
      onSuccess: () => { setToDelete(null); void reload(); void stats.reload(); },
    });
  };

  // ── bulk ──
  const pageIds = data.map((p) => p.id);
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
  const runBulk = (action: 'delete' | 'setStatus' | 'feature' | 'unfeature', status?: ProductStatus) => {
    const ids = [...selected];
    if (!ids.length) return;
    void bulk.run(() => bulkProducts(ids, action, status), {
      success: `Updated ${ids.length} product${ids.length === 1 ? '' : 's'}`,
      error: 'Bulk action failed',
      onSuccess: () => { setSelected(new Set()); setBulkDeleteOpen(false); void reload(); void stats.reload(); },
    });
  };

  const applyStatus = (status: ProductStatus | '') => setFilters((f) => ({ ...f, status, page: 1 }));

  const s = stats.data;
  const cards: Array<{ label: string; value: number; tone: StatTone; icon: ReactNode; onClick?: () => void; active?: boolean }> = [
    { label: 'Total', value: s?.total ?? 0, tone: 'indigo', icon: <Package className="size-5" />, onClick: () => applyStatus(''), active: !filters.status },
    { label: 'Active', value: s?.active ?? 0, tone: 'emerald', icon: <CheckCircle2 className="size-5" />, onClick: () => applyStatus(ProductStatus.ACTIVE), active: filters.status === ProductStatus.ACTIVE },
    { label: 'Draft', value: s?.draft ?? 0, tone: 'sky', icon: <FileEdit className="size-5" />, onClick: () => applyStatus(ProductStatus.DRAFT), active: filters.status === ProductStatus.DRAFT },
    { label: 'Archived', value: s?.archived ?? 0, tone: 'slate', icon: <Boxes className="size-5" />, onClick: () => applyStatus(ProductStatus.ARCHIVED), active: filters.status === ProductStatus.ARCHIVED },
    { label: 'Low stock', value: s?.lowStock ?? 0, tone: 'amber', icon: <AlertTriangle className="size-5" /> },
    { label: 'Out of stock', value: s?.outOfStock ?? 0, tone: 'rose', icon: <XCircle className="size-5" /> },
  ];

  const stockBadge = (n: number) => (n === 0 ? <Badge tone="danger">Out</Badge> : n <= 5 ? <Badge tone="warning">Low · {n}</Badge> : <Badge tone="neutral">{n}</Badge>);

  const columns: Column<Product>[] = [
    ...(canWrite
      ? [{
          key: 'select', className: 'w-10',
          header: <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all" />,
          cell: (p: Product) => <Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />,
        } as Column<Product>]
      : []),
    {
      key: 'name', header: 'Product', sortable: true,
      cell: (p) => (
        <button type="button" onClick={() => canWrite && navigate(`/products/${p.id}/edit`)} className={cn(canWrite && 'cursor-pointer text-left hover:text-indigo-500')}>
          <div className="flex items-center gap-2.5">
            {p.images[0] ? (
              <img src={p.images[0]} alt="" className="size-9 shrink-0 rounded-md border border-border object-cover" />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-bg text-text-secondary"><Package className="size-4" /></span>
            )}
            <div className="leading-tight">
              <p className="text-sm font-medium text-text">{p.name}</p>
              <p className="text-[11px] text-text-secondary">{p.sku && <span className="font-mono">{p.sku}</span>}{p.variants && p.variants.length > 0 ? ` · ${p.variants.length} variants` : ''}</p>
            </div>
          </div>
        </button>
      ),
    },
    { key: 'category', header: 'Category', cell: (p) => (p.category ? categoryName[p.category] ?? '—' : '—') },
    {
      key: 'price', header: 'Price', sortable: true,
      cell: (p) => (
        <div className="whitespace-nowrap">
          <span className="text-text">{formatCurrency(p.price)}</span>
          {p.compareAtPrice ? <span className="ml-1.5 text-xs text-text-secondary line-through">{formatCurrency(p.compareAtPrice)}</span> : null}
        </div>
      ),
    },
    { key: 'stock', header: 'Stock', sortable: true, cell: (p) => stockBadge(p.stock) },
    { key: 'status', header: 'Status', sortable: true, cell: (p) => <Badge tone={statusTone[p.status] ?? 'neutral'}>{p.status}</Badge> },
    {
      key: 'actions', header: '', className: 'w-24 text-right',
      cell: (p) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" iconOnly aria-label="Edit" onClick={() => navigate(`/products/${p.id}/edit`)}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="sm" iconOnly aria-label="Delete" onClick={() => setToDelete(p)}><Trash2 className="size-4 text-danger" /></Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle="Your catalog — create, price, and stock your items."
        action={canWrite && <Button leftIcon={<Plus className="size-4" />} onClick={() => navigate('/products/new')}>Add product</Button>}
      />

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {cards.map((c) => <StatCard key={c.label} className="min-w-36 flex-1" label={c.label} value={c.value} tone={c.tone} icon={c.icon} active={c.active} onClick={c.onClick} />)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput containerClassName="min-w-56 flex-1" placeholder="Search name or SKU…" value={filters.search} loading={loading && !!filters.search} onValueChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} />
        <Select className="w-44" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select className="w-40" value={filters.brandId} onChange={(e) => setFilters((f) => ({ ...f, brandId: e.target.value, page: 1 }))}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <Select className="w-40" value={filters.vendorId} onChange={(e) => setFilters((f) => ({ ...f, vendorId: e.target.value, page: 1 }))}>
          <option value="">All vendors</option>
          {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
        </Select>
        <Select className="w-40" value={filters.status} onChange={(e) => applyStatus(e.target.value as ProductStatus | '')}>
          <option value="">All statuses</option>
          {Object.values(ProductStatus).map((st) => <option key={st} value={st}>{st}</option>)}
        </Select>
      </div>

      {canWrite && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-indigo-500/40 bg-indigo-500/5 px-3 py-2">
          <span className="text-sm font-medium text-text">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Select className="h-8 w-36" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            <option value="">Set status…</option>
            {Object.values(ProductStatus).map((st) => <option key={st} value={st}>{st}</option>)}
          </Select>
          <Button size="sm" variant="secondary" disabled={!bulkStatus || bulk.saving} onClick={() => runBulk('setStatus', bulkStatus as ProductStatus)}>Apply</Button>
          <Button size="sm" variant="secondary" disabled={bulk.saving} onClick={() => runBulk('feature')}>Feature</Button>
          <Button size="sm" variant="secondary" disabled={bulk.saving} onClick={() => runBulk('unfeature')}>Unfeature</Button>
          <Button size="sm" variant="danger" leftIcon={<Trash2 className="size-3.5" />} disabled={bulk.saving} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      <Table columns={columns} rows={data} rowKey={(p) => p.id} loading={loading} sort={sortState} onSort={onSort} emptyState="No products match these filters." />

      {meta && <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))} />}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete product"
        danger
        confirmLabel="Delete"
        loading={deleteMutation.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={<>Delete <span className="font-medium text-text">{toDelete?.name}</span>? This can't be undone.</>}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.size} products`}
        danger
        confirmLabel="Delete"
        loading={bulk.saving}
        onConfirm={() => runBulk('delete')}
        onClose={() => setBulkDeleteOpen(false)}
        message={<>Delete <span className="font-medium text-text">{selected.size}</span> selected products? This can't be undone.</>}
      />
    </div>
  );
}
