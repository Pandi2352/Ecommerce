import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  IndianRupee,
  Image as ImageIcon,
  Info,
  Layers,
  Package,
  Plus,
  SlidersHorizontal,
  Tag,
  Trash2,
} from 'lucide-react';
import { ProductStatus } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Select,
  Skeleton,
  Textarea,
  toast,
} from '@/components/ui';
import { ImageUploader, PageHeader } from '@/components/common';
import { cn } from '@/utils/cn';
import { useMutation } from '@/hooks/useMutation';
import { useApi } from '@/hooks/useApi';
import { minLength } from '@/utils/validators';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories';
import { fetchBrands } from '@/features/brands/api';
import { fetchVendors } from '@/features/vendors/api';
import { useAttributes, type AttributeDefinition } from '@/features/attributes';
import { createProduct, fetchProduct, updateProduct, type Product, type ProductInput } from './api';

const toneChip: Record<string, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-500',
  sky: 'bg-sky-500/10 text-sky-600',
  violet: 'bg-violet-500/10 text-violet-600',
  amber: 'bg-amber-500/10 text-amber-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  slate: 'bg-slate-500/10 text-slate-500',
};

function Section({ icon, tone, title, description, children }: { icon: ReactNode; tone: keyof typeof toneChip; title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', toneChip[tone])}>{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {description && <p className="text-xs text-text-secondary">{description}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

interface OptionRow { name: string; valuesText: string }
interface VariantRow { sig: string; optionValues: Record<string, string>; sku: string; price: string; stock: string }
interface FormState {
  name: string; sku: string; price: string; compareAtPrice: string; category: string;
  brandId: string; vendorId: string;
  status: ProductStatus; stock: string; description: string; images: string[]; featured: boolean;
  attributes: Record<string, unknown>; options: OptionRow[]; variants: VariantRow[];
}
const emptyForm: FormState = {
  name: '', sku: '', price: '', compareAtPrice: '', category: '', brandId: '', vendorId: '', status: ProductStatus.DRAFT,
  stock: '0', description: '', images: [], featured: false, attributes: {}, options: [], variants: [],
};
const parseValues = (t: string) => t.split(',').map((v) => v.trim()).filter(Boolean);
const sigOf = (opts: { name: string; values: string[] }[], ov: Record<string, string>) => opts.map((o) => `${o.name}:${ov[o.name]}`).join('|');

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data: categories } = useCategories();
  const { data: attributes } = useAttributes();
  const { data: brandsRes } = useApi(fetchBrands, { errorMessage: 'Failed to load brands' });
  const { data: vendorsRes } = useApi(fetchVendors, { errorMessage: 'Failed to load vendors' });
  const brands = brandsRes?.data ?? [];
  const vendors = vendorsRes?.data ?? [];
  const save = useMutation();

  const { data: product, loading } = useApi<Product | null>(
    () => (id ? fetchProduct(id) : Promise.resolve(null)),
    { errorMessage: 'Failed to load product' },
  );

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!product) return;
    const opts = (product.options ?? []).map((o) => ({ name: o.name, values: o.values }));
    setForm({
      name: product.name, sku: product.sku ?? '', price: String(product.price),
      compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
      category: product.category ?? '',
      brandId: (product as any).brandId ?? '',
      vendorId: (product as any).vendorId ?? '',
      status: product.status, stock: String(product.stock),
      description: product.description ?? '', images: product.images ?? [], featured: product.featured,
      attributes: product.attributes ?? {},
      options: (product.options ?? []).map((o) => ({ name: o.name, valuesText: o.values.join(', ') })),
      variants: (product.variants ?? []).map((v) => ({
        sig: sigOf(opts, v.optionValues), optionValues: v.optionValues,
        sku: v.sku ?? '', price: String(v.price), stock: String(v.stock),
      })),
    });
  }, [product]);

  const applicableAttrs = useMemo(
    () => attributes.filter((a) => a.isActive !== false && (a.scope === 'all' || (form.category && a.categoryIds.includes(form.category)))),
    [attributes, form.category],
  );
  const attrGroups = useMemo(() => {
    const g: Record<string, AttributeDefinition[]> = {};
    for (const a of applicableAttrs) (g[a.group || 'Details'] ??= []).push(a);
    return g;
  }, [applicableAttrs]);

  const setAttr = (key: string, value: unknown) => setForm((f) => ({ ...f, attributes: { ...f.attributes, [key]: value } }));
  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, { name: '', valuesText: '' }] }));
  const setOption = (i: number, patch: Partial<OptionRow>) => setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) }));
  const removeOption = (i: number) => setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i), variants: [] }));
  const setVariant = (sig: string, patch: Partial<VariantRow>) => setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.sig === sig ? { ...v, ...patch } : v)) }));

  const generateVariants = () => {
    const opts = form.options.map((o) => ({ name: o.name.trim(), values: parseValues(o.valuesText) })).filter((o) => o.name && o.values.length);
    if (!opts.length) return setForm((f) => ({ ...f, variants: [] }));
    let combos: Record<string, string>[] = [{}];
    for (const o of opts) combos = combos.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v })));
    const existing = new Map(form.variants.map((v) => [v.sig, v]));
    const rows = combos.map((ov) => existing.get(sigOf(opts, ov)) ?? { sig: sigOf(opts, ov), optionValues: ov, sku: '', price: form.price || '', stock: '0' });
    setForm((f) => ({ ...f, variants: rows }));
    toast.success(`${rows.length} variant${rows.length === 1 ? '' : 's'} generated`);
  };

  const onSave = () => {
    if (!minLength(form.name, 2)) return toast.error('Name must be at least 2 characters');
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return toast.error('Enter a valid price');
    for (const a of applicableAttrs) {
      const v = form.attributes[a.key];
      if (a.required && (v === undefined || v === '' || (Array.isArray(v) && v.length === 0))) return toast.error(`"${a.label}" is required`);
    }
    const options = form.options.map((o) => ({ name: o.name.trim(), values: parseValues(o.valuesText) })).filter((o) => o.name && o.values.length);
    const attributesPayload: Record<string, unknown> = {};
    for (const a of applicableAttrs) {
      const v = form.attributes[a.key];
      if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) attributesPayload[a.key] = v;
    }
    const payload: ProductInput = {
      name: form.name, sku: form.sku || undefined, description: form.description || undefined,
      price, compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      category: form.category || null,
      brandId: form.brandId || null,
      vendorId: form.vendorId || null,
      status: form.status, stock: Number(form.stock) || 0,
      images: form.images, featured: form.featured, attributes: attributesPayload, options,
      variants: form.variants.map((v) => ({ optionValues: v.optionValues, sku: v.sku || undefined, price: Number(v.price) || 0, stock: Number(v.stock) || 0 })),
    };
    void save.run(() => (editing ? updateProduct(id!, payload) : createProduct(payload)), {
      success: editing ? 'Product updated' : 'Product created',
      error: 'Save failed',
      onSuccess: () => navigate('/products'),
    });
  };

  const renderAttr = (a: AttributeDefinition): ReactNode => {
    const value = form.attributes[a.key];
    const label = `${a.label}${a.unit ? ` (${a.unit})` : ''}`;
    switch (a.type) {
      case 'textarea':
        return <FormField key={a.key} label={label} required={a.required} className="sm:col-span-2"><Textarea value={(value as string) ?? ''} onChange={(e) => setAttr(a.key, e.target.value)} /></FormField>;
      case 'number':
        return <FormField key={a.key} label={label} required={a.required}><Input type="number" value={value === undefined ? '' : String(value)} onChange={(e) => setAttr(a.key, e.target.value === '' ? undefined : Number(e.target.value))} /></FormField>;
      case 'boolean':
        return <label key={a.key} className="flex items-center gap-2 text-sm text-text"><Checkbox checked={!!value} onChange={(e) => setAttr(a.key, e.target.checked)} />{label}</label>;
      case 'select':
        return <FormField key={a.key} label={label} required={a.required}><Select value={(value as string) ?? ''} onChange={(e) => setAttr(a.key, e.target.value || undefined)}><option value="">—</option>{a.options.map((o) => <option key={o} value={o}>{o}</option>)}</Select></FormField>;
      case 'multiselect':
        return (
          <FormField key={a.key} label={label} required={a.required} className="sm:col-span-2">
            <div className="flex flex-wrap gap-3 rounded-md border border-border p-2">
              {a.options.map((o) => {
                const arr = Array.isArray(value) ? (value as string[]) : [];
                return <label key={o} className="flex items-center gap-1.5 text-sm text-text"><Checkbox checked={arr.includes(o)} onChange={() => setAttr(a.key, arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])} />{o}</label>;
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

  if (!can('products.write')) return <Alert>You don't have permission to edit products.</Alert>;

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/products')} className="cursor-pointer text-text-secondary hover:text-text" aria-label="Back">
              <ArrowLeft className="size-5" />
            </button>
            {editing ? `Edit — ${product?.name ?? ''}` : 'New product'}
          </span>
        }
        subtitle="Fill in the details below. Fields marked * are required."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/products')} disabled={save.saving}>Cancel</Button>
            <Button onClick={onSave} loading={save.saving}>{editing ? 'Save changes' : 'Create product'}</Button>
          </div>
        }
      />

      {editing && loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-4 lg:col-span-2">
            <Section icon={<Package className="size-4" />} tone="indigo" title="Basics" description="The essentials shown everywhere.">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Linen Wrap Dress" /></FormField>
                <FormField label="SKU" hint="Your internal code"><Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="NOVA-001" /></FormField>
                <FormField label="Featured" hint="Highlight on the storefront">
                  <label className="flex h-10 items-center gap-2 text-sm text-text"><Checkbox checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />Feature this product</label>
                </FormField>
                <FormField label="Description" className="col-span-2"><Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the product…" /></FormField>
              </div>
            </Section>

            <Section icon={<ImageIcon className="size-4" />} tone="sky" title="Media" description="Photos of the product.">
              <Alert tone="info">The first image is used as the primary thumbnail in lists and cards.</Alert>
              <div className="mt-3"><ImageUploader value={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} /></div>
            </Section>

            <Section icon={<SlidersHorizontal className="size-4" />} tone="violet" title="Product fields" description="Custom attributes for your shop.">
              {applicableAttrs.length === 0 ? (
                <Alert tone="info">No custom fields for this {form.category ? 'category' : 'shop'} yet. Define them under <b>Product Fields</b> (Catalog → Product Fields).</Alert>
              ) : (
                Object.entries(attrGroups).map(([group, defs]) => (
                  <div key={group} className="mb-3">
                    <p className="mb-1.5 text-[11px] font-medium text-text-secondary">{group}</p>
                    <div className="grid grid-cols-2 gap-3">{defs.map(renderAttr)}</div>
                  </div>
                ))
              )}
            </Section>

            <Section icon={<Layers className="size-4" />} tone="amber" title="Variants" description="Sell size/colour combos with their own stock.">
              <Alert tone="info">Add options like <b>Size</b> or <b>Color</b>, then <b>Generate</b> to create sellable combinations — each with its own SKU, price and stock. No options = a simple product using the base price &amp; stock.</Alert>
              <div className="mt-3 space-y-2">
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <FormField label="Option" className="w-40"><Input value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} placeholder="Size" /></FormField>
                    <FormField label="Values (comma-separated)" className="flex-1"><Input value={o.valuesText} onChange={(e) => setOption(i, { valuesText: e.target.value })} placeholder="S, M, L" /></FormField>
                    <Button variant="ghost" size="sm" iconOnly aria-label="Remove option" onClick={() => removeOption(i)}><Trash2 className="size-4 text-danger" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Plus className="size-3.5" />} onClick={addOption}>Add option</Button>
                  {form.options.length > 0 && <Button variant="secondary" size="sm" onClick={generateVariants}>Generate variants</Button>}
                </div>

                {form.variants.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-table-header">
                        <tr className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                          <th className="px-3 py-2 text-left">Variant</th>
                          <th className="w-32 px-2 py-2 text-left">SKU</th>
                          <th className="w-28 px-2 py-2 text-left">Price</th>
                          <th className="w-24 px-2 py-2 text-left">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.variants.map((v) => (
                          <tr key={v.sig} className="border-t border-border">
                            <td className="px-3 py-1.5"><div className="flex flex-wrap gap-1">{Object.values(v.optionValues).map((val, k) => <Badge key={k} tone="neutral">{val}</Badge>)}</div></td>
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
            </Section>
          </div>

          {/* Side column */}
          <div className="space-y-4">
            <Section icon={<Info className="size-4" />} tone="slate" title="Status">
              <FormField label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}>{Object.values(ProductStatus).map((st) => <option key={st} value={st}>{st}</option>)}</Select></FormField>
              <p className="mt-2 text-[11px] text-text-secondary">Only <b>Active</b> products appear on the storefront. Use <b>Draft</b> while preparing.</p>
            </Section>

            <Section icon={<IndianRupee className="size-4" />} tone="emerald" title="Pricing">
              <div className="space-y-3">
                <FormField label="Price" required><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" /></FormField>
                <FormField label="Compare-at price" hint="Shown struck-through as the 'was' price"><Input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="Optional" /></FormField>
              </div>
            </Section>

            <Section icon={<Boxes className="size-4" />} tone="amber" title="Inventory">
              <FormField label="Stock"><Input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} /></FormField>
              {form.variants.length > 0 && <p className="mt-2 text-[11px] text-amber-600">This product has variants — stock is tracked per variant, not here.</p>}
            </Section>

            <Section icon={<Tag className="size-4" />} tone="sky" title="Organization">
              <div className="space-y-3">
                <FormField label="Category">
                  <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="Brand">
                  <Select value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}>
                    <option value="">— None —</option>
                    {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="Vendor / Supplier">
                  <Select value={form.vendorId} onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}>
                    <option value="">— None —</option>
                    {vendors.map((v) => <option key={v._id} value={v._id}>{v.name} ({v.code})</option>)}
                  </Select>
                </FormField>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
