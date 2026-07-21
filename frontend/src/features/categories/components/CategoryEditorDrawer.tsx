import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Drawer, FormField, Input, Select, Textarea } from '@/components/ui';
import { ImageUploader } from '@/components/common/ImageUploader';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { createCategory, updateCategory, type CategoryInput, type CategoryNode } from '../api';

interface CategoryEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  /** null = create mode */
  category: CategoryNode | null;
  /** Preselected parent id (used by "add subcategory"). */
  defaultParent?: string | null;
  /** Full tree, used to build the parent selector + cycle exclusion. */
  tree: CategoryNode[];
  onSaved: () => void;
}

export function CategoryEditorDrawer({
  open,
  onClose,
  category,
  defaultParent,
  tree,
  onSaved,
}: CategoryEditorDrawerProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parent, setParent] = useState('');
  const [image, setImage] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setParent(category.parent ?? '');
      setImage(category.image ? [category.image] : []);
      setDescription(category.description ?? '');
      setIsActive(category.isActive);
      setMetaTitle(category.metaTitle ?? '');
      setMetaDescription(category.metaDescription ?? '');
    } else {
      setName('');
      setSlug('');
      setParent(defaultParent ?? '');
      setImage([]);
      setDescription('');
      setIsActive(true);
      setMetaTitle('');
      setMetaDescription('');
    }
  }, [category, defaultParent, open]);

  // Flatten the tree for the parent select (with indentation).
  const flat = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = [];
    const walk = (nodes: CategoryNode[], d: number) =>
      nodes.forEach((n) => {
        out.push({ id: n.id, name: n.name, depth: d });
        walk(n.children, d + 1);
      });
    walk(tree, 0);
    return out;
  }, [tree]);

  // Exclude self + descendants from parent options (prevents cycles).
  const excluded = useMemo(() => {
    const set = new Set<string>();
    if (!category) return set;
    set.add(category.id);
    const collect = (n: CategoryNode) =>
      n.children.forEach((c) => {
        set.add(c.id);
        collect(c);
      });
    collect(category);
    return set;
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CategoryInput = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        parent: parent || null,
        image: image[0] || '',
        description: description.trim() || '',
        isActive,
        metaTitle: metaTitle.trim() || '',
        metaDescription: metaDescription.trim() || '',
      };

      if (category) {
        await updateCategory(category.id, payload);
        toast.success(`Category "${name}" updated`);
      } else {
        await createCategory(payload);
        toast.success(`Category "${name}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save category'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={category ? `Edit Category: ${category.name}` : 'Create New Category'}
      widthClassName="w-full max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : category ? 'Update Category' : 'Create Category'}
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
              placeholder="e.g. Women's Dresses"
              autoFocus
            />
          </FormField>
          <FormField label="URL Slug" hint="Leave blank to auto-generate">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. womens-dresses"
              className="font-mono"
            />
          </FormField>
        </div>

        <FormField label="Parent Category" hint="Leave as top level for a root category">
          <Select value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">— None (top level) —</option>
            {flat
              .filter((c) => !excluded.has(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {`${'  '.repeat(c.depth)}${c.name}`}
                </option>
              ))}
          </Select>
        </FormField>

        <FormField label="Category Image">
          <ImageUploader value={image} onChange={setImage} max={1} />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short overview of this category..."
            rows={3}
          />
        </FormField>

        <div className="flex items-center gap-6 rounded-lg border border-border p-3 bg-bg/50">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text">
            <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Active</span>
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3 bg-bg/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text">SEO Metadata</h4>
          <FormField label="Meta Title">
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Custom browser title tag"
            />
          </FormField>
          <FormField label="Meta Description">
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Custom search snippet summary..."
              rows={2}
            />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}
