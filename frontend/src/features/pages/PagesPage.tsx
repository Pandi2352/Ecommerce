import { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  FileEdit,
  PanelBottom,
  Pencil,
  Trash2,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  Table,
  type Column,
} from '@/components/ui';
import { StatCard } from '@/components/common/StatCard';
import type { Meta } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { useAuth } from '@/features/auth/AuthContext';
import { deletePage, fetchPages, type CmsPage } from './api';
import { PageEditorDrawer } from './components/PageEditorDrawer';

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:5175';

export function PagesPage() {
  const { can } = useAuth();
  const canWrite = can('content.write');
  const [rows, setRows] = useState<CmsPage[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [toDelete, setToDelete] = useState<CmsPage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPages({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load pages'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (p: CmsPage) => {
    setEditing(p);
    setDrawerOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deletePage(toDelete.id);
      toast.success(`Deleted "${toDelete.title}"`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete page'));
    } finally {
      setDeleting(false);
    }
  };

  const total = meta?.total ?? rows.length;
  const publishedCount = rows.filter((p) => p.status === 'published').length;
  const draftCount = rows.filter((p) => p.status === 'draft').length;
  const footerCount = rows.filter((p) => p.showInFooter).length;

  const columns: Column<CmsPage>[] = [
    {
      key: 'title',
      header: 'Page',
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-blue-500/10 text-blue-500">
            <FileText className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-xs font-bold text-text">{p.title}</div>
            <span className="font-mono text-[11px] text-text-secondary">/p/{p.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <Badge tone={p.status === 'published' ? 'success' : 'neutral'}>
          {p.status === 'published' ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'footer',
      header: 'Footer',
      cell: (p) =>
        p.showInFooter ? (
          <Badge tone="info">
            <span className="inline-flex items-center gap-1">
              <PanelBottom className="h-3 w-3" /> Linked
            </span>
          </Badge>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        ),
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (p) => (
        <span className="text-xs text-text-secondary">
          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (p) =>
        canWrite && (
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={[
              {
                label: (
                  <span className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </span>
                ),
                onSelect: () => openEdit(p),
              },
              ...(p.status === 'published'
                ? [
                    {
                      label: (
                        <span className="flex items-center gap-2">
                          <ExternalLink className="h-3.5 w-3.5" /> View live
                        </span>
                      ),
                      onSelect: () => window.open(`${STOREFRONT_URL}/p/${p.slug}`, '_blank'),
                    },
                  ]
                : []),
              {
                label: (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-danger" /> Delete
                  </span>
                ),
                danger: true,
                onSelect: () => setToDelete(p),
              },
            ]}
          />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>Pages</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Editable storefront content — About, FAQ, policies and more. Published pages render at
            <span className="font-mono"> /p/&lt;slug&gt;</span>.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> <span>Add Page</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={total} icon={<FileText className="h-5 w-5" />} />
        <StatCard
          label="Published"
          value={publishedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Drafts"
          value={draftCount}
          icon={<FileEdit className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="In footer"
          value={footerCount}
          icon={<PanelBottom className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search pages..."
            containerClassName="w-full max-w-sm"
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="ALL">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<FileText className="size-8" />}
            title="No pages yet"
            description="Create a content page for your storefront — About, FAQ, policies, and more."
            action={
              canWrite && (
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="h-4 w-4" /> Create Page
                </Button>
              )
            }
          />
        }
      />

      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      <PageEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        page={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete page "${toDelete?.title}"?`}
        message="This permanently removes the page. Storefront links to it will 404."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
