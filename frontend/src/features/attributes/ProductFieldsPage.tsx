import { useState } from 'react';
import { Pencil, Plus, Trash2, Wand2 } from 'lucide-react';
import { ATTRIBUTE_TYPES, OPTION_ATTRIBUTE_TYPES, type AttributeType } from '@ecommerce/shared';
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
import { useApi } from '@/hooks/useApi';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories';
import {
  applyPreset,
  createAttribute,
  deleteAttribute,
  fetchPresets,
  updateAttribute,
  useAttributes,
  type AttributeDefinition,
  type AttributeInput,
} from './api';

const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

interface FieldForm {
  label: string;
  key: string;
  type: AttributeType;
  optionsText: string;
  unit: string;
  group: string;
  sortOrder: string;
  required: boolean;
  filterable: boolean;
  scope: 'all' | 'categories';
  categoryIds: string[];
}

const emptyForm: FieldForm = {
  label: '',
  key: '',
  type: 'text',
  optionsText: '',
  unit: '',
  group: '',
  sortOrder: '0',
  required: false,
  filterable: false,
  scope: 'all',
  categoryIds: [],
};

export function ProductFieldsPage() {
  const { can } = useAuth();
  const canWrite = can('attributes.write');
  const { data, loading, error, reload } = useAttributes();
  const { data: categories } = useCategories();
  const { data: presets } = useApi(fetchPresets, { errorMessage: 'Failed to load presets' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);
  const [form, setForm] = useState<FieldForm>(emptyForm);
  const [keyTouched, setKeyTouched] = useState(false);
  const [toDelete, setToDelete] = useState<AttributeDefinition | null>(null);
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetId, setPresetId] = useState('');
  const save = useMutation();
  const del = useMutation();
  const preset = useMutation();

  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const needsOptions = OPTION_ATTRIBUTE_TYPES.includes(form.type);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setKeyTouched(false);
    setOpen(true);
  };
  const openEdit = (a: AttributeDefinition) => {
    setEditing(a);
    setKeyTouched(true);
    setForm({
      label: a.label,
      key: a.key,
      type: a.type,
      optionsText: a.options.join(', '),
      unit: a.unit ?? '',
      group: a.group ?? '',
      sortOrder: String(a.sortOrder),
      required: a.required,
      filterable: a.filterable,
      scope: a.scope,
      categoryIds: a.categoryIds ?? [],
    });
    setOpen(true);
  };

  const onLabel = (label: string) =>
    setForm((f) => ({ ...f, label, key: keyTouched ? f.key : slug(label) }));

  const buildPayload = (): AttributeInput => ({
    label: form.label,
    type: form.type,
    options: needsOptions
      ? form.optionsText
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : [],
    unit: form.unit || undefined,
    group: form.group || undefined,
    sortOrder: Number(form.sortOrder) || 0,
    required: form.required,
    filterable: form.filterable,
    scope: form.scope,
    categoryIds: form.scope === 'categories' ? form.categoryIds : [],
  });

  const onSave = () => {
    if (form.label.trim().length < 1) return toast.error('Label is required');
    if (!editing && !form.key) return toast.error('Key is required');
    if (needsOptions && !buildPayload().options?.length)
      return toast.error('Add at least one option');
    const payload = buildPayload();
    void save.run(
      () =>
        editing
          ? updateAttribute(editing.id, payload)
          : createAttribute({ ...payload, key: form.key }),
      {
        success: editing ? 'Field updated' : 'Field created',
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
    void del.run(() => deleteAttribute(toDelete.id), {
      success: 'Field deleted',
      error: 'Delete failed',
      onSuccess: () => {
        setToDelete(null);
        void reload();
      },
    });
  };

  const doApplyPreset = () => {
    if (!presetId) return toast.error('Pick a preset');
    void preset.run(() => applyPreset(presetId), {
      error: 'Failed to apply preset',
      onSuccess: (res) => {
        toast.success(
          res.added > 0
            ? `Added ${res.added} field${res.added === 1 ? '' : 's'}`
            : 'All preset fields already exist',
        );
        setPresetOpen(false);
        setPresetId('');
        void reload();
      },
    });
  };

  const columns: Column<AttributeDefinition>[] = [
    {
      key: 'field',
      header: 'Field',
      cell: (a) => (
        <div className="leading-tight">
          <p className="text-sm font-medium text-text">
            {a.label}
            {a.unit ? <span className="text-text-secondary"> ({a.unit})</span> : null}
          </p>
          <p className="font-mono text-[11px] text-text-secondary">{a.key}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', cell: (a) => <Badge tone="info">{a.type}</Badge> },
    { key: 'group', header: 'Group', cell: (a) => a.group || '—' },
    {
      key: 'scope',
      header: 'Applies to',
      cell: (a) =>
        a.scope === 'all' ? (
          <Badge tone="neutral">All products</Badge>
        ) : (
          <span className="text-xs text-text-secondary">
            {a.categoryIds.map((id) => catName[id] ?? '?').join(', ') || 'No categories'}
          </span>
        ),
    },
    {
      key: 'flags',
      header: '',
      cell: (a) => (
        <div className="flex gap-1">
          {a.required && <Badge tone="warning">Required</Badge>}
          {a.filterable && <Badge tone="success">Filter</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (a) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Edit"
              onClick={() => openEdit(a)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Delete"
              onClick={() => setToDelete(a)}
            >
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Product Fields"
        subtitle="Define the custom fields your shop's products need. Rendered on the product form."
        action={
          canWrite && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                leftIcon={<Wand2 className="size-4" />}
                onClick={() => setPresetOpen(true)}
              >
                Apply preset
              </Button>
              <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
                Add field
              </Button>
            </div>
          )
        }
      />

      <Alert tone="info">
        These are <b>descriptive attributes</b> (one value per product). Purchasable variant options
        (size, color) that create per-SKU stock are configured on the product itself.
      </Alert>

      {error && <Alert>{error}</Alert>}

      <Table
        columns={columns}
        rows={data}
        rowKey={(a) => a.id}
        loading={loading}
        emptyState="No product fields yet. Add one or apply a shop preset."
      />

      {/* Create / edit field */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
        title={editing ? `Edit field — ${editing.label}` : 'New product field'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={save.saving}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={save.saving}>
              {editing ? 'Save changes' : 'Create field'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Label" required>
            <Input
              value={form.label}
              onChange={(e) => onLabel(e.target.value)}
              placeholder="e.g. Material"
            />
          </FormField>
          <FormField label="Key" hint={editing ? 'Fixed after creation' : 'Auto from label'}>
            <Input
              value={form.key}
              disabled={!!editing}
              onChange={(e) => {
                setKeyTouched(true);
                setForm((f) => ({ ...f, key: slug(e.target.value) }));
              }}
              className="font-mono"
            />
          </FormField>
          <FormField label="Type">
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AttributeType }))}
            >
              {ATTRIBUTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Unit" hint="optional, e.g. cm, g">
            <Input
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </FormField>
          {needsOptions && (
            <FormField label="Options" required className="col-span-2" hint="comma-separated">
              <Input
                value={form.optionsText}
                onChange={(e) => setForm((f) => ({ ...f, optionsText: e.target.value }))}
                placeholder="Small, Medium, Large"
              />
            </FormField>
          )}
          <FormField label="Group" hint="form section">
            <Input
              value={form.group}
              onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              placeholder="Specs"
            />
          </FormField>
          <FormField label="Sort order">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </FormField>
          <FormField label="Applies to" className="col-span-2">
            <Select
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({ ...f, scope: e.target.value as 'all' | 'categories' }))
              }
            >
              <option value="all">All products</option>
              <option value="categories">Specific categories</option>
            </Select>
          </FormField>
          {form.scope === 'categories' && (
            <div className="col-span-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2 scrollbar-thin">
              {categories.length === 0 && (
                <p className="text-xs text-text-secondary">No categories yet.</p>
              )}
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-text"
                >
                  <Checkbox
                    checked={form.categoryIds.includes(c.id)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        categoryIds: f.categoryIds.includes(c.id)
                          ? f.categoryIds.filter((id) => id !== c.id)
                          : [...f.categoryIds, c.id],
                      }))
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-text">
            <Checkbox
              checked={form.required}
              onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
            />
            Required
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <Checkbox
              checked={form.filterable}
              onChange={(e) => setForm((f) => ({ ...f, filterable: e.target.checked }))}
            />
            Filterable
          </label>
          <p className="col-span-2 -mt-1 text-xs text-text-secondary">
            <span className="font-medium text-text">Filterable</span> fields appear as shopper
            filters on the storefront's All Products page (e.g. Material, Fit, Gender). Works best
            with <span className="font-medium">select</span> /{' '}
            <span className="font-medium">boolean</span> types.
          </p>
        </div>
      </Modal>

      {/* Apply preset */}
      <Modal
        open={presetOpen}
        onClose={() => setPresetOpen(false)}
        title="Apply a shop preset"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPresetOpen(false)}
              disabled={preset.saving}
            >
              Cancel
            </Button>
            <Button onClick={doApplyPreset} loading={preset.saving} disabled={!presetId}>
              Apply
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Seeds the fields for a shop type. Existing fields are kept — nothing is overwritten.
          </p>
          <div className="space-y-2">
            {(presets ?? []).map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 hover:bg-row-hover"
              >
                <input
                  type="radio"
                  name="preset"
                  className="mt-1"
                  checked={presetId === p.id}
                  onChange={() => setPresetId(p.id)}
                />
                <div>
                  <p className="text-sm font-medium text-text">
                    {p.label}{' '}
                    <span className="text-xs font-normal text-text-secondary">
                      · {p.fieldCount} fields
                    </span>
                  </p>
                  <p className="text-xs text-text-secondary">{p.description}</p>
                  {p.variantOptions.length > 0 && (
                    <p className="mt-1 text-[11px] text-text-secondary">
                      Variant options: {p.variantOptions.join(', ')}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete field"
        danger
        confirmLabel="Delete"
        loading={del.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={
          <>
            Delete the <span className="font-medium text-text">{toDelete?.label}</span> field?
            Existing product values for it will be ignored.
          </>
        }
      />
    </div>
  );
}
