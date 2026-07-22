import { useEffect, useState } from 'react';
import { Button, Checkbox, Drawer, FormField, Input, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { createPage, updatePage, type CmsPage, type PageInput, type PageStatus } from '../api';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  open: boolean;
  onClose: () => void;
  page: CmsPage | null;
  onSaved: () => void;
}

export function PageEditorDrawer({ open, onClose, page, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [showInFooter, setShowInFooter] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setExcerpt(page.excerpt ?? '');
      setBody(page.body ?? '');
      setStatus(page.status);
      setShowInFooter(page.showInFooter);
      setMetaTitle(page.metaTitle ?? '');
      setMetaDescription(page.metaDescription ?? '');
    } else {
      setTitle('');
      setSlug('');
      setExcerpt('');
      setBody('');
      setStatus('draft');
      setShowInFooter(false);
      setMetaTitle('');
      setMetaDescription('');
    }
  }, [page, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return toast.error('Title must be at least 2 characters');
    setSubmitting(true);
    try {
      const payload: PageInput = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || '',
        body,
        status,
        showInFooter,
        metaTitle: metaTitle.trim() || '',
        metaDescription: metaDescription.trim() || '',
      };
      if (page) {
        await updatePage(page.id, payload);
        toast.success(`Page "${title}" updated`);
      } else {
        await createPage(payload);
        toast.success(`Page "${title}" created`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save page'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={page ? `Edit: ${page.title}` : 'New Page'}
      widthClassName="w-full max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : page ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Privacy Policy"
              autoFocus
            />
          </FormField>
          <FormField label="Slug" hint="auto from title">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono"
              placeholder="privacy-policy"
            />
          </FormField>
        </div>

        <p className="text-[11px] text-text-secondary">
          Live at <span className="font-mono text-text">/p/{slug || 'your-slug'}</span> on the
          storefront once published.
        </p>

        <FormField label="Excerpt" hint="short summary — used for SEO fallback">
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="One-line summary of the page"
          />
        </FormField>

        <FormField label="Content">
          <RichTextEditor value={body} onChange={setBody} placeholder="Write the page content…" />
        </FormField>

        {/* Publish controls */}
        <div className="space-y-3 rounded-md border border-border bg-bg/50 p-3">
          <FormField label="Status">
            <div className="flex gap-2">
              {(['draft', 'published'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold capitalize ${
                    status === s
                      ? 'border-info bg-info/10 text-info'
                      : 'border-border text-text-secondary hover:bg-bg'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormField>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text">
            <Checkbox checked={showInFooter} onChange={(e) => setShowInFooter(e.target.checked)} />{' '}
            Show link in storefront footer
          </label>
        </div>

        <div className="space-y-3 rounded-md border border-border bg-bg/50 p-3">
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
