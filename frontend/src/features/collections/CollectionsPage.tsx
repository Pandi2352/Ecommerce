import { useCallback, useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Sparkles,
  Star,
  Hand,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
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
import { deleteCollection, fetchCollections, type Collection } from './api';
import { CollectionEditorDrawer } from './components/CollectionEditorDrawer';

export function CollectionsPage() {
  const { can } = useAuth();
  const canWrite = can('products.write');
  const [rows, setRows] = useState<Collection[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [toDelete, setToDelete] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCollections({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load collections'));
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: Collection) => {
    setEditing(c);
    setDrawerOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCollection(toDelete.id);
      toast.success(`Deleted "${toDelete.name}"`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete collection'));
    } finally {
      setDeleting(false);
    }
  };

  const total = meta?.total ?? rows.length;
  const activeCount = rows.filter((c) => c.isActive).length;
  const autoCount = rows.filter((c) => c.type === 'auto').length;
  const featuredCount = rows.filter((c) => c.isFeatured).length;

  const columns: Column<Collection>[] = [
    {
      key: 'name',
      header: 'Collection',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          {c.image ? (
            <img
              src={c.image}
              alt=""
              className="h-9 w-9 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-md bg-indigo-500/10 text-indigo-500">
              <Layers className="h-4 w-4" />
            </span>
          )}
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text">{c.name}</span>
              {c.isFeatured && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
            </div>
            <span className="font-mono text-[11px] text-text-secondary">/{c.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (c) => (
        <Badge tone={c.type === 'auto' ? 'info' : 'neutral'}>
          <span className="inline-flex items-center gap-1">
            {c.type === 'auto' ? <Sparkles className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
            {c.type === 'auto' ? 'Automatic' : 'Manual'}
          </span>
        </Badge>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      className: 'text-right',
      cell: (c) => (
        <span className="font-mono text-xs font-semibold text-text">{c.productCount ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <Badge tone={c.isActive ? 'success' : 'neutral'}>
          {c.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (c) =>
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
                onSelect: () => openEdit(c),
              },
              {
                label: (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-danger" /> Delete
                  </span>
                ),
                danger: true,
                onSelect: () => setToDelete(c),
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
            <Layers className="h-5 w-5 text-indigo-500" />
            <span>Collections</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Curated product groups for merchandising — manual picks or automatic rules. Separate
            from categories.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> <span>Add Collection</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={total} icon={<Layers className="h-5 w-5" />} />
        <StatCard
          label="Active"
          value={activeCount}
          icon={<Eye className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Automatic"
          value={autoCount}
          icon={<Sparkles className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="Featured"
          value={featuredCount}
          icon={<Star className="h-5 w-5" />}
          tone="amber"
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
            placeholder="Search collections..."
            containerClassName="w-full max-w-sm"
          />
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-32"
          >
            <option value="ALL">All types</option>
            <option value="manual">Manual</option>
            <option value="auto">Automatic</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-32"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Layers className="size-8" />}
            title="No collections yet"
            description="Create a collection to group products for storefront merchandising."
            action={
              canWrite && (
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="h-4 w-4" /> Create Collection
                </Button>
              )
            }
          />
        }
      />

      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      <CollectionEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        collection={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete collection "${toDelete?.name}"?`}
        message="This removes the collection (products are not affected)."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
