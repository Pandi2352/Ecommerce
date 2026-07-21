import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Edit2,
  MapPin,
  MoreVertical,
  Plus,
  Power,
  Star,
  Trash2,
  XCircle,
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
import {
  deleteWarehouse,
  fetchWarehouses,
  fetchWarehouseStats,
  setPrimaryWarehouse,
  updateWarehouse,
} from './api';
import { WarehouseEditorDrawer } from './components/WarehouseEditorDrawer';
import type { WarehouseItem, WarehouseStats } from './types';

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('isPrimary:desc');
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchWarehouses({
          page,
          pageSize: 10,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          sort,
        }),
        fetchWarehouseStats(),
      ]);
      setWarehouses(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load warehouses'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setEditingWarehouse(null);
    setDrawerOpen(true);
  };

  const handleEdit = (w: WarehouseItem) => {
    setEditingWarehouse(w);
    setDrawerOpen(true);
  };

  const handleSetPrimary = async (w: WarehouseItem) => {
    if (w.isPrimary) return;
    try {
      await setPrimaryWarehouse(w._id);
      toast.success(`"${w.name}" set as primary warehouse`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update primary warehouse'));
    }
  };

  const handleToggleActive = async (w: WarehouseItem) => {
    try {
      await updateWarehouse(w._id, { isActive: !w.isActive });
      toast.success(`"${w.name}" marked ${w.isActive ? 'inactive' : 'active'}`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update warehouse'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWarehouse) return;
    setDeleting(true);
    try {
      await deleteWarehouse(deletingWarehouse._id);
      toast.success(`Deleted warehouse "${deletingWarehouse.name}"`);
      setDeletingWarehouse(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete warehouse'));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<WarehouseItem>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (w) => (
        <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          {w.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Warehouse',
      cell: (w) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text text-xs">{w.name}</span>
            {w.isPrimary && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-500 border border-indigo-500/20">
                <Star className="h-2.5 w-2.5 fill-indigo-500" />
                Primary
              </span>
            )}
          </div>
          {w.contactName && (
            <span className="text-[11px] text-text-secondary">Contact: {w.contactName}</span>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Location',
      cell: (w) =>
        w.address ? (
          <div className="flex items-start gap-1 text-[11px] text-text-secondary max-w-[240px]">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
            <span className="line-clamp-2">{w.address}</span>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'items',
      header: 'Stock',
      className: 'text-right',
      cell: (w) => (
        <div className="text-right">
          <div className="font-mono text-xs font-bold text-text">{w.totalOnHand ?? 0} units</div>
          <div className="text-[11px] text-text-secondary">{w.itemCount ?? 0} SKUs</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (w) => (
        <Badge tone={w.isActive ? 'success' : 'neutral'}>
          {w.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (w) => (
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
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Warehouse</span>
                </span>
              ),
              onSelect: () => handleEdit(w),
            },
            ...(w.isPrimary
              ? []
              : [
                  {
                    label: (
                      <span className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" />
                        <span>Set as Primary</span>
                      </span>
                    ),
                    onSelect: () => handleSetPrimary(w),
                  },
                ]),
            {
              label: (
                <span className="flex items-center gap-2">
                  <Power className="h-3.5 w-3.5" />
                  <span>{w.isActive ? 'Mark Inactive' : 'Mark Active'}</span>
                </span>
              ),
              onSelect: () => handleToggleActive(w),
            },
            ...(w.isPrimary
              ? []
              : [
                  {
                    label: (
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                        <span>Delete Warehouse</span>
                      </span>
                    ),
                    danger: true,
                    onSelect: () => setDeletingWarehouse(w),
                  },
                ]),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            <span>Warehouses &amp; Fulfilment Centers</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Manage physical stock locations, the primary fulfilment hub, and distribution addresses.
          </p>
        </div>

        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Warehouse</span>
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Warehouses"
            value={stats.total}
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon={<XCircle className="h-5 w-5" />}
            tone="slate"
          />
          <StatCard
            label="Primary Hub"
            value={stats.primary ?? '—'}
            icon={<Star className="h-5 w-5" />}
            tone="indigo"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border bg-surface p-3">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by name, code, contact or address..."
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
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </Select>
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="isPrimary:desc">Sort: Primary First</option>
          <option value="name:asc">Sort: Name (A-Z)</option>
          <option value="code:asc">Sort: Code (A-Z)</option>
          <option value="createdAt:desc">Sort: Newest First</option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        rows={warehouses}
        rowKey={(w) => w._id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Building2 className="size-8" />}
            title="No warehouses found"
            description={
              search || statusFilter !== 'ALL'
                ? 'No warehouses matched your filters. Try adjusting the search criteria.'
                : 'Create your first warehouse or fulfilment hub to start tracking localized stock.'
            }
            action={
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create Warehouse</span>
              </Button>
            }
          />
        }
      />

      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      {/* Editor Drawer */}
      <WarehouseEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        warehouse={editingWarehouse}
        onSaved={loadData}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deletingWarehouse}
        title={`Delete warehouse "${deletingWarehouse?.name}"?`}
        message={
          deletingWarehouse && (deletingWarehouse.totalOnHand ?? 0) > 0
            ? `"${deletingWarehouse.name}" still holds ${deletingWarehouse.totalOnHand} unit(s) of stock. Transfer or zero the stock before deleting.`
            : 'Are you sure you want to delete this warehouse location? This action cannot be undone.'
        }
        confirmLabel="Delete Warehouse"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingWarehouse(null)}
      />
    </div>
  );
}
