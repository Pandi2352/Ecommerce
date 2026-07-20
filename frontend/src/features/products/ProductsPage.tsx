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
  Textarea,
  toast,
  type BadgeTone,
  type Column,
  type SortState,
} from '@/components/ui';
import { ImageUploader, PageHeader, StatCard, type StatTone } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { formatCurrency } from '@/utils/formatters';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories';
import { useAttributes, type AttributeDefinition } from '@/features/attributes';
import {
  bulkProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  useProducts,
  useProductStats,
  type Product,
  type ProductInput,
} from './api';

const statusTone: Record<string, BadgeTone> = { ACTIVE: 'success', DRAFT: 'info', ARCHIVED: 'neutral' };

interface OptionRow {
  name: string;
  valuesText: string;
}
interface VariantRow {
  sig: string;
  optionValues: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
}
interface FormState {
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  category: string;
  status: ProductStatus;
  stock: string;
  description: string;
  images: string[];
  featured: boolean;
  attributes: Record<string, unknown>;
  options: OptionRow[];
  variants: VariantRow[];
}

const emptyForm: FormState = {
  name: '', sku: '', price: '', compareAtPrice: '', category: '', status: ProductStatus.DRAFT,
  stock: '0', description: '', images: [], featured: false,
  attributes: {}, options: [], variants: [],
};

const parseValues = (text: string) => text.split(',').map((v) => v.trim()).filter(Boolean);
const sigOf = (opts: { name: string; values: string[] }[], ov: Record<string, string>) =>
  opts.map((o) => `${o.name}:${ov[o.name]}`).join('|');

export function ProductsPage() {
  const { can } = useAuth();
  const canWrite = can('products.write');
  const { data, meta, loading, error, filters, setFilters, reload } = useProducts();
  const { data: categories } = useCategories();
  const { data: attributes } = useAttributes();
  const stats = useProductStats();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const saveMutation = useMutation();
  const deleteMutation = useMutation();
  const bulk = useMutation();

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
      onSuccess: () => {
        setSelected(new Set());
        setBulkDeleteOpen(false);
        void reload();
        void stats.reload();
      },
    });
  };

  const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  // Attribute definitions applicable to the selected category.
  const applicableAttrs = useMemo(
    () =>
      attributes.filter(
        (a) => a.isActive !== false && (a.scope === 'all' || (form.category && a.categoryIds.includes(form.category))),
      ),
    [attributes, form.category],
  );
  const attrGroups = useMemo(() => {
    const g: Record<string, AttributeDefinition[]> = {};
    for (const a of applicableAttrs) (g[a.group || 'Details'] ??= []).push(a);
    return g;
  }, [applicableAttrs]);

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
    const options = (p.options ?? []).map((o) => ({ name: o.name, valuesText: o.values.join(', ') }));
    const parsedOpts = (p.options ?? []).map((o) => ({ name: o.name, values: o.values }));
    setForm({
      name: p.name, sku: p.sku ?? '', price: String(p.price),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
      category: p.category ?? '', status: p.status, stock: String(p.stock),
      description: p.description ?? '', images: p.images ?? [], featured: p.featured,
      attributes: p.attributes ?? {},
      options,
      variants: (p.variants ?? []).map((v) => ({
        sig: sigOf(parsedOpts, v.optionValues), optionValues: v.optionValues,
        sku: v.sku ?? '', price: String(v.price), stock: String(v.stock),
      })),
    });
    setOpen(true);
  };

  const setAttr = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [key]: value } }));

  // ── variant options ──
  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, { name: '', valuesText: '' }] }));
  const setOption = (i: number, patch: Partial<OptionRow>) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) }));
  const removeOption = (i: number) =>
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i), variants: [] }));

  const generateVariants = () => {
    const opts = form.options
      .map((o) => ({ name: o.name.trim(), values: parseValues(o.valuesText) }))
      .filter((o) => o.name && o.values.length);
    if (!opts.length) return setForm((f) => ({ ...f, variants: [] }));
    let combos: Record<string, string>[] = [{}];
    for (const o of opts) combos = combos.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v })));
    const existing = new Map(form.variants.map((v) => [v.sig, v]));
    const rows: VariantRow[] = combos.map((ov) => {
      const sig = sigOf(opts, ov);
      return existing.get(sig) ?? { sig, optionValues: ov, sku: '', price: form.price || '', stock: '0' };
    });
    setForm((f) => ({ ...f, variants: rows }));
    toast.success(`${rows.length} variant${rows.length === 1 ? '' : 's'} generated`);
  };
  const setVariant = (sig: string, patch: Partial<VariantRow>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.sig === sig ? { ...v, ...patch } : v)) }));

  const save = () => {
    if (!minLength(form.name, 2)) return toast.error('Name must be at least 2 characters');
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return toast.error('Enter a valid price');
    // required custom fields
    for (const a of applicableAttrs) {
      const v = form.attributes[a.key];
      if (a.required && (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)))
        return toast.error(`"${a.label}" is required`);
    }
    const options = form.options
      .map((o) => ({ name: o.name.trim(), values: parseValues(o.valuesText) }))
      .filter((o) => o.name && o.values.length);
    const attributes: Record<string, unknown> = {};
    for (const a of applicableAttrs) {
      const v = form.attributes[a.key];
      if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) attributes[a.key] = v;
    }
    const payload: ProductInput = {
      name: form.name, sku: form.sku || undefined, description: form.description || undefined,
      price, compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      category: form.category || null, status: form.status, stock: Number(form.stock) || 0,
      images: form.images, featured: form.featured,
      attributes, options,
      variants: form.variants.map((v) => ({
        optionValues: v.optionValues, sku: v.sku || undefined,
        price: Number(v.price) || 0, stock: Number(v.stock) || 0,
      })),
    };
    void saveMutation.run(() => (editing ? updateProduct(editing.id, payload) : createProduct(payload)), {
      success: editing ? 'Product updated' : 'Product created',
      error: 'Save failed',
      onSuccess: () => { setOpen(false); void reload(); void stats.reload(); },
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    void deleteMutation.run(() => deleteProduct(toDelete.id), {
      success: 'Product deleted', error: 'Delete failed',
      onSuccess: () => { setToDelete(null); void reload(); void stats.reload(); },
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

  const stockBadge = (n: number) =>
    n === 0 ? <Badge tone="danger">Out</Badge> : n <= 5 ? <Badge tone="warning">Low · {n}</Badge> : <Badge tone="neutral">{n}</Badge>;

  const columns: Column<Product>[] = [
    ...(canWrite
      ? [
          {
            key: 'select',
            className: 'w-10',
            header: <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all" />,
            cell: (p: Product) => <Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />,
          } as Column<Product>,
        ]
      : []),
    {
      key: 'name', header: 'Product', sortable: true,
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
            <p className="text-[11px] text-text-secondary">
              {p.sku && <span className="font-mono">{p.sku}</span>}
              {p.variants && p.variants.length > 0 ? ` · ${p.variants.length} variants` : ''}
            </p>
          </div>
        </div>
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
            <Button variant="ghost" size="sm" iconOnly aria-label="Edit" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="sm" iconOnly aria-label="Delete" onClick={() => setToDelete(p)}><Trash2 className="size-4 text-danger" /></Button>
          </div>
        ),
    },
  ];

  const renderAttr = (a: AttributeDefinition): ReactNode => {
    const value = form.attributes[a.key];
    const label = `${a.label}${a.unit ? ` (${a.unit})` : ''}`;
    switch (a.type) {
      case 'textarea':
        return <FormField key={a.key} label={label} required={a.required} className="col-span-2"><Textarea value={(value as string) ?? ''} onChange={(e) => setAttr(a.key, e.target.value)} /></FormField>;
      case 'number':
        return <FormField key={a.key} label={label} required={a.required}><Input type="number" value={value === undefined ? '' : String(value)} onChange={(e) => setAttr(a.key, e.target.value === '' ? undefined : Number(e.target.value))} /></FormField>;
      case 'boolean':
        return <label key={a.key} className="flex items-center gap-2 text-sm text-text"><Checkbox checked={!!value} onChange={(e) => setAttr(a.key, e.target.checked)} />{label}</label>;
      case 'select':
        return <FormField key={a.key} label={label} required={a.required}><Select value={(value as string) ?? ''} onChange={(e) => setAttr(a.key, e.target.value || undefined)}><option value="">—</option>{a.options.map((o) => <option key={o} value={o}>{o}</option>)}</Select></FormField>;
      case 'multiselect':
        return (
          <FormField key={a.key} label={label} required={a.required} className="col-span-2">
            <div className="flex flex-wrap gap-3 rounded-md border border-border p-2">
              {a.options.map((o) => {
                const arr = Array.isArray(value) ? (value as string[]) : [];
                return (
                  <label key={o} className="flex items-center gap-1.5 text-sm text-text">
                    <Checkbox checked={arr.includes(o)} onChange={() => setAttr(a.key, arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])} />{o}
                  </label>
                );
              })}
            </div>
          </FormField>
        );
      case 'date':
        return <FormField key={a.key} label={label} required={a.required}><Input type="date" value={(value as string)?.slice(0, 10) ?? ''} onChange={(e) => setAttr(a.key, e.target.value || undefined)} /></FormField>;
      default:
        return <FormField key={a.key} label={label} required={a.required}><Input value={(value as string) ?? ''} onChange={(e) => setAttr(a.key, e.target.value)} /></FormField>;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle="Your catalog — create, price, and stock your items."
        action={canWrite && <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>Add product</Button>}
      />

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {cards.map((c) => (
          <StatCard key={c.label} className="min-w-36 flex-1" label={c.label} value={c.value} tone={c.tone} icon={c.icon} active={c.active} onClick={c.onClick} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput containerClassName="min-w-56 flex-1" placeholder="Search name or SKU…" value={filters.search} loading={loading && !!filters.search} onValueChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} />
        <Select className="w-44" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            {Object.values(ProductStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" disabled={!bulkStatus || bulk.saving} onClick={() => runBulk('setStatus', bulkStatus as ProductStatus)}>
            Apply
          </Button>
          <Button size="sm" variant="secondary" disabled={bulk.saving} onClick={() => runBulk('feature')}>
            Feature
          </Button>
          <Button size="sm" variant="secondary" disabled={bulk.saving} onClick={() => runBulk('unfeature')}>
            Unfeature
          </Button>
          <Button size="sm" variant="danger" leftIcon={<Trash2 className="size-3.5" />} disabled={bulk.saving} onClick={() => setBulkDeleteOpen(true)}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      <Table columns={columns} rows={data} rowKey={(p) => p.id} loading={loading} sort={sortState} onSort={onSort} emptyState="No products match these filters." />

      {meta && <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-3xl"
        title={editing ? `Edit — ${editing.name}` : 'New product'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saveMutation.saving}>Cancel</Button>
            <Button onClick={save} loading={saveMutation.saving}>{editing ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1 scrollbar-thin">
          {/* Basics */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Basics</h4>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Linen Wrap Dress" /></FormField>
              <FormField label="SKU"><Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} /></FormField>
              <FormField label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}>{Object.values(ProductStatus).map((st) => <option key={st} value={st}>{st}</option>)}</Select></FormField>
              <FormField label="Price" required><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></FormField>
              <FormField label="Compare-at price"><Input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} /></FormField>
              <FormField label="Category"><Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}><option value="">— None —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormField>
              <FormField label="Stock" hint={form.variants.length ? 'Variants carry their own stock' : undefined}><Input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} /></FormField>
              <FormField label="Images" className="col-span-2" hint="First image is the primary thumbnail.">
                <ImageUploader value={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
              </FormField>
              <FormField label="Description" className="col-span-2"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
              <label className="col-span-2 flex items-center gap-2 text-sm text-text"><Checkbox checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />Featured product</label>
            </div>
          </section>

          {/* Custom attributes */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Product fields</h4>
            {applicableAttrs.length === 0 ? (
              <p className="text-xs text-text-secondary">No custom fields for this {form.category ? 'category' : 'shop'}. Configure them in Product Fields.</p>
            ) : (
              Object.entries(attrGroups).map(([group, defs]) => (
                <div key={group} className="mb-3">
                  <p className="mb-1.5 text-[11px] font-medium text-text-secondary">{group}</p>
                  <div className="grid grid-cols-2 gap-3">{defs.map(renderAttr)}</div>
                </div>
              ))
            )}
          </section>

          {/* Variants */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Variants</h4>
              <Button variant="ghost" size="sm" leftIcon={<Plus className="size-3.5" />} onClick={addOption}>Add option</Button>
            </div>
            {form.options.length === 0 ? (
              <p className="text-xs text-text-secondary">No variants — this is a simple product using the base price &amp; stock. Add an option (e.g. Size) to create variants.</p>
            ) : (
              <div className="space-y-2">
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <FormField label="Option" className="w-32"><Input value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} placeholder="Size" /></FormField>
                    <FormField label="Values (comma-separated)" className="flex-1"><Input value={o.valuesText} onChange={(e) => setOption(i, { valuesText: e.target.value })} placeholder="S, M, L" /></FormField>
                    <Button variant="ghost" size="sm" iconOnly aria-label="Remove option" onClick={() => removeOption(i)}><Trash2 className="size-4 text-danger" /></Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={generateVariants}>Generate variants</Button>

                {form.variants.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-table-header">
                        <tr className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                          <th className="px-3 py-2 text-left">Variant</th>
                          <th className="w-28 px-2 py-2 text-left">SKU</th>
                          <th className="w-24 px-2 py-2 text-left">Price</th>
                          <th className="w-20 px-2 py-2 text-left">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.variants.map((v) => (
                          <tr key={v.sig} className="border-t border-border">
                            <td className="px-3 py-1.5">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(v.optionValues).map(([k, val]) => <Badge key={k} tone="neutral">{val}</Badge>)}
                              </div>
                            </td>
                            <td className="px-2 py-1.5"><Input className="h-8" value={v.sku} onChange={(e) => setVariant(v.sig, { sku: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><Input className="h-8" type="number" min="0" value={v.price} onChange={(e) => setVariant(v.sig, { price: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><Input className="h-8" type="number" min="0" value={v.stock} onChange={(e) => setVariant(v.sig, { stock: e.target.value })} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
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
