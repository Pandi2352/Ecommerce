import { useEffect, useState } from 'react';
import { Button, Checkbox, Drawer, FormField, Input, Textarea } from '@/components/ui';
import { ImageUploader } from '@/components/common/ImageUploader';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { createBrand, updateBrand } from '../api';
import type { BrandItem } from '../types';

interface BrandEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  brand: BrandItem | null; // null = create mode
  onSaved: () => void;
}

export function BrandEditorDrawer({ open, onClose, brand, onSaved }: BrandEditorDrawerProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState<string[]>([]);
  const [banner, setBanner] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setSlug(brand.slug);
      setLogo(brand.logo ? [brand.logo] : []);
      setBanner(brand.banner ? [brand.banner] : []);
      setWebsite(brand.website || '');
      setDescription(brand.description || '');
      setIsActive(brand.isActive);
      setIsFeatured(brand.isFeatured);
      setMetaTitle(brand.metaTitle || '');
      setMetaDescription(brand.metaDescription || '');
    } else {
      setName('');
      setSlug('');
      setLogo([]);
      setBanner([]);
      setWebsite('');
      setDescription('');
      setIsActive(true);
      setIsFeatured(false);
      setMetaTitle('');
      setMetaDescription('');
    }
  }, [brand, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        logo: logo[0] || '',
        banner: banner[0] || '',
        website: website.trim() || '',
        description: description.trim() || '',
        isActive,
        isFeatured,
        metaTitle: metaTitle.trim() || '',
        metaDescription: metaDescription.trim() || '',
      };

      if (brand) {
        await updateBrand(brand.id, payload);
        toast.success(`Brand "${name}" updated`);
      } else {
        await createBrand(payload);
        toast.success(`Brand "${name}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save brand'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={brand ? `Edit Brand: ${brand.name}` : 'Create New Brand'}
      widthClassName="w-full max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : brand ? 'Update Brand' : 'Create Brand'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Brand Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apple, Nike, Sony"
            autoFocus
          />
        </FormField>

        <FormField label="URL Slug" hint="Leave blank to auto-generate from name">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. apple" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Brand Logo">
            <ImageUploader value={logo} onChange={setLogo} max={1} />
          </FormField>
          <FormField label="Brand Banner">
            <ImageUploader value={banner} onChange={setBanner} max={1} />
          </FormField>
        </div>

        <FormField label="Official Website URL">
          <Input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short overview about this brand..."
            rows={3}
          />
        </FormField>

        <div className="flex items-center gap-6 rounded-lg border border-border p-3 bg-bg/50">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
            <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
            <Checkbox checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            <span>Featured Brand ⭐</span>
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3 bg-bg/50">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider">SEO Metadata</h4>
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
