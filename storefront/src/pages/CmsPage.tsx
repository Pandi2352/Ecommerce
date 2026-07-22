import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, FileText, Home } from 'lucide-react';
import { api } from '@/lib/api';

interface CmsPageData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
}

interface PageLink {
  id: string;
  title: string;
  slug: string;
}

export function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPageData | null>(null);
  const [siblings, setSiblings] = useState<PageLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setPage(null);
    api
      .get<CmsPageData>(`/storefront/pages/${slug}`)
      .then((res) => active && setPage(res.data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  // Other published pages — powers the "More information" side nav.
  useEffect(() => {
    api
      .get<PageLink[]>('/storefront/pages')
      .then((res) => setSiblings(res.data))
      .catch(() => setSiblings([]));
  }, []);

  // Reflect SEO metadata into the document head.
  useEffect(() => {
    if (page) document.title = page.metaTitle || page.title;
  }, [page]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-6">
        <div className="h-32 w-full skeleton rounded-2xl" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-11/12 skeleton rounded" />
          <div className="h-4 w-4/5 skeleton rounded" />
          <div className="h-4 w-10/12 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-black text-text">Page not found</h1>
        <p className="text-sm text-text-secondary">
          The page you're looking for doesn't exist or is no longer available.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-danger px-5 py-2.5 text-sm font-bold text-white hover:bg-danger/90"
        >
          <Home className="h-4 w-4" /> Back to store
        </Link>
      </div>
    );
  }

  const others = siblings.filter((s) => s.slug !== page.slug);
  const updated = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6 animate-fadeIn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-danger">
          <Home className="h-3.5 w-3.5" /> Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
        <span className="font-semibold text-text">{page.title}</span>
      </nav>

      {/* Hero */}
      <header
        className="overflow-hidden rounded-2xl px-6 py-10 text-white sm:px-10"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          Information
        </p>
        <h1 className="mt-2 text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
          {page.title}
        </h1>
        {page.excerpt && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">{page.excerpt}</p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        {/* Content */}
        <div className="min-w-0">
          {page.body ? (
            <div
              className="cms-content text-sm leading-relaxed text-text"
              // Body is sanitised server-side before storage (see PagesService).
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          ) : (
            <p className="text-sm text-text-secondary">This page has no content yet.</p>
          )}
          {updated && (
            <p className="mt-10 border-t border-border pt-4 text-xs text-text-muted">
              Last updated {updated}
            </p>
          )}
        </div>

        {/* Sidebar: other info pages */}
        {others.length > 0 && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                More information
              </h2>
              <ul className="space-y-1">
                {others.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/p/${s.slug}`}
                      className="flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-text-secondary hover:bg-bg hover:text-danger"
                    >
                      <span className="truncate">{s.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
