import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { Button, Checkbox, Drawer, FormField, Input, Select, Textarea } from '@/components/ui';
import { ImageUploader } from '@/components/common/ImageUploader';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import {
  createCollection,
  previewCollection,
  searchProducts,
  updateCollection,
  type Collection,
  type CollectionCondition,
  type CollectionInput,
  type ConditionField,
  type PickerProduct,
} from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
  collection: Collection | null;
  onSaved: () => void;
}

// Fields exposed in the rule builder (backend also supports brand/category by id).
const FIELD_OPTS: { field: ConditionField; label: string }[] = [
  { field: 'tag', label: 'Tag' },
  { field: 'price', label: 'Price' },
  { field: 'featured', label: 'Featured' },
  { field: 'onSale', label: 'On sale' },
];

function defaultCondition(field: ConditionField): CollectionCondition {
  if (field === 'price') return { field, operator: 'gt', value: '' };
  if (field === 'featured' || field === 'onSale') return { field, operator: 'is', value: 'true' };
  return { field, operator: 'contains', value: '' };
}

export function CollectionEditorDrawer({ open, onClose, collection, onSaved }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string[]>([]);
  const [type, setType] = useState<'manual' | 'auto'>('manual');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [match, setMatch] = useState<'all' | 'any'>('all');
  const [conditions, setConditions] = useState<CollectionCondition[]>([]);
  const [selected, setSelected] = useState<PickerProduct[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (collection) {
      setName(collection.name);
      setSlug(collection.slug);
      setDescription(collection.description ?? '');
      setImage(collection.image ? [collection.image] : []);
      setType(collection.type);
      setIsActive(collection.isActive);
      setIsFeatured(collection.isFeatured);
      setMetaTitle(collection.metaTitle ?? '');
      setMetaDescription(collection.metaDescription ?? '');
      setMatch(collection.match);
      setConditions(collection.conditions ?? []);
      // Hydrate the picked products (manual) from the resolved preview.
      if (collection.type === 'manual') {
        previewCollection(collection.id)
          .then(setSelected)
          .catch(() => setSelected([]));
      } else {
        setSelected([]);
      }
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setImage([]);
      setType('manual');
      setIsActive(true);
      setIsFeatured(false);
      setMetaTitle('');
      setMetaDescription('');
      setMatch('all');
      setConditions([]);
      setSelected([]);
    }
    setQuery('');
    setResults([]);
  }, [collection, open]);

  useEffect(() => {
    if (type !== 'manual') return;
    const t = setTimeout(() => {
      if (query.trim().length < 1) return setResults([]);
      searchProducts(query.trim())
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query, type]);

  const addProduct = (p: PickerProduct) => {
    if (!selected.some((s) => s.id === p.id)) setSelected((prev) => [...prev, p]);
  };
  const removeProduct = (id: string) => setSelected((prev) => prev.filter((s) => s.id !== id));

  const setCond = (i: number, patch: Partial<CollectionCondition>) =>
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error('Name must be at least 2 characters');
    setSubmitting(true);
    try {
      const payload: CollectionInput = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || '',
        image: image[0] || '',
        type,
        isActive,
        isFeatured,
        metaTitle: metaTitle.trim() || '',
        metaDescription: metaDescription.trim() || '',
        productIds: type === 'manual' ? selected.map((s) => s.id) : [],
        match,
        conditions: type === 'auto' ? conditions.filter((c) => c.field) : [],
      };
      if (collection) {
        await updateCollection(collection.id, payload);
        toast.success(`Collection "${name}" updated`);
      } else {
        await createCollection(payload);
        toast.success(`Collection "${name}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save collection'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={collection ? `Edit: ${collection.name}` : 'New Collection'}
      widthClassName="w-full max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : collection ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale"
              autoFocus
            />
          </FormField>
          <FormField label="Slug" hint="auto from name">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono"
              placeholder="summer-sale"
            />
          </FormField>
        </div>

        <FormField label="Image">
          <ImageUploader value={image} onChange={setImage} max={1} />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short description shown on the collection page"
          />
        </FormField>

        {/* Type toggle */}
        <FormField label="Type">
          <div className="flex gap-2">
            {(['manual', 'auto'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${
                  type === t
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600'
                    : 'border-border text-text-secondary hover:bg-bg'
                }`}
              >
                {t === 'manual' ? 'Manual — pick products' : 'Automatic — by rules'}
              </button>
            ))}
          </div>
        </FormField>

        {/* Manual: product picker */}
        {type === 'manual' && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products to add…"
                className="pl-8"
              />
            </div>
            {results.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-bg"
                  >
                    <Plus className="h-3 w-3 text-indigo-500" />
                    <span className="flex-1 truncate text-text">{p.name}</span>
                    <span className="font-mono text-text-secondary">₹{p.price}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] font-semibold text-text-secondary">
              {selected.length} product(s) selected
            </p>
            <div className="space-y-1">
              {selected.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-md bg-bg/50 px-2 py-1 text-xs"
                >
                  <span className="flex-1 truncate text-text">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => removeProduct(p.id)}
                    className="text-text-secondary hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto: rule builder */}
        {type === 'auto' && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary">Products matching</span>
              <Select
                value={match}
                onChange={(e) => setMatch(e.target.value as 'all' | 'any')}
                className="w-24"
              >
                <option value="all">all</option>
                <option value="any">any</option>
              </Select>
              <span className="text-text-secondary">of these rules:</span>
            </div>
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={c.field}
                  onChange={(e) => setCond(i, defaultCondition(e.target.value as ConditionField))}
                  className="w-28"
                >
                  {FIELD_OPTS.map((f) => (
                    <option key={f.field} value={f.field}>
                      {f.label}
                    </option>
                  ))}
                </Select>
                {c.field === 'price' && (
                  <Select
                    value={c.operator}
                    onChange={(e) =>
                      setCond(i, { operator: e.target.value as CollectionCondition['operator'] })
                    }
                    className="w-24"
                  >
                    <option value="gt">over</option>
                    <option value="lt">under</option>
                  </Select>
                )}
                {(c.field === 'tag' || c.field === 'price') && (
                  <Input
                    value={c.value}
                    onChange={(e) => setCond(i, { value: e.target.value })}
                    placeholder={c.field === 'price' ? '₹ amount' : 'tag'}
                    className="flex-1"
                  />
                )}
                {(c.field === 'featured' || c.field === 'onSale') && (
                  <span className="flex-1 text-xs text-text-secondary">is true</span>
                )}
                <button
                  type="button"
                  onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-text-secondary hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="gap-1"
              onClick={() => setConditions((prev) => [...prev, defaultCondition('tag')])}
            >
              <Plus className="h-3.5 w-3.5" /> Add rule
            </Button>
          </div>
        )}

        {/* Flags */}
        <div className="flex items-center gap-6 rounded-md border border-border p-3 bg-bg/50">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text">
            <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text">
            <Checkbox checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />{' '}
            Feature on homepage
          </label>
        </div>

        <div className="space-y-3 rounded-md border border-border p-3 bg-bg/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text">SEO</h4>
          <FormField label="Meta title">
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </FormField>
          <FormField label="Meta description">
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}
