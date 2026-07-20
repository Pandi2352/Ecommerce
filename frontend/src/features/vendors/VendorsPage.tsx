import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Users, Clock, Layers, MoreVertical, Edit2, Trash2, Globe, Mail, Phone } from 'lucide-react';
import { VendorStatus } from '@ecommerce/shared';
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
import { deleteVendor, fetchVendors, fetchVendorStats, updateVendor } from './api';
import { VendorEditorDrawer } from './components/VendorEditorDrawer';
import type { VendorItem, VendorStats } from './types';

export function VendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sort, setSort] = useState('name:asc');
  const [page, setPage] = useState(1);

  // Drawer & Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<VendorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchVendors({
          page,
          pageSize: 10,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as VendorStatus) : undefined,
          sort,
        }),
        fetchVendorStats(),
      ]);
      setVendors(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load vendors'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setEditingVendor(null);
    setDrawerOpen(true);
  };

  const handleEdit = (v: VendorItem) => {
    setEditingVendor(v);
    setDrawerOpen(true);
  };

  const handleStatusChange = async (v: VendorItem, nextStatus: VendorStatus) => {
    try {
      await updateVendor(v._id, { status: nextStatus });
      toast.success(`Vendor "${v.name}" status updated to ${nextStatus}`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update vendor status'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVendor) return;
    setDeleting(true);
    try {
      const res = await deleteVendor(deletingVendor._id);
      if (res.detachedProducts > 0) {
        toast.success(
          `Deleted vendor "${deletingVendor.name}" and detached ${res.detachedProducts} products`,
        );
      } else {
        toast.success(`Deleted vendor "${deletingVendor.name}"`);
      }
      setDeletingVendor(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete vendor'));
    } finally {
      setDeleting(false);
    }
  };

  const getStatusTone = (status: VendorStatus) => {
    switch (status) {
      case VendorStatus.ACTIVE:
        return 'success';
      case VendorStatus.PENDING_APPROVAL:
        return 'warning';
      case VendorStatus.INACTIVE:
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const columns: Column<VendorItem>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (v) => (
        <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          {v.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Vendor & Contact',
      cell: (v) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text text-xs">{v.name}</span>
            {v.website && (
              <a
                href={v.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-indigo-500"
                title="Visit website"
              >
                <Globe className="h-3 w-3" />
              </a>
            )}
          </div>
          {v.contactName && (
            <span className="text-[11px] text-text-secondary">
              Contact: {v.contactName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      cell: (v) => (
        <div className="space-y-0.5 text-xs text-text-secondary">
          {v.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{v.email}</span>
            </div>
          )}
          {v.phone && (
            <div className="flex items-center gap-1 text-[11px]">
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{v.phone}</span>
            </div>
          )}
          {!v.email && !v.phone && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: 'commission',
      header: 'Commission',
      className: 'text-right',
      cell: (v) => <span className="font-mono text-xs font-bold text-text">{v.commissionRate}%</span>,
    },
    {
      key: 'products',
      header: 'Products',
      className: 'text-right',
      cell: (v) => <span className="font-mono text-xs font-semibold text-text-secondary">{v.productCount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => <Badge tone={getStatusTone(v.status)}>{v.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (v) => (
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
                  <span>Edit Vendor</span>
                </span>
              ),
              onSelect: () => handleEdit(v),
            },
            {
              label: (
                <span className="flex items-center gap-2">
                  <span>
                    {v.status === VendorStatus.ACTIVE ? 'Mark Inactive' : 'Mark Active'}
                  </span>
                </span>
              ),
              onSelect: () =>
                handleStatusChange(
                  v,
                  v.status === VendorStatus.ACTIVE
                    ? VendorStatus.INACTIVE
                    : VendorStatus.ACTIVE,
                ),
            },
            {
              label: (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                  <span>Delete Vendor</span>
                </span>
              ),
              danger: true,
              onSelect: () => setDeletingVendor(v),
            },
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
            <span>Vendors & Suppliers</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Manage product suppliers, distributor codes, contact info, and commission percentages.
          </p>
        </div>

        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Vendors" value={stats.total} icon={<Building2 className="h-5 w-5" />} />
          <StatCard
            label="Active Vendors"
            value={stats.active}
            icon={<Users className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Pending Approval"
            value={stats.pending}
            icon={<Clock className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Products Supplied"
            value={stats.totalProductsSupplied}
            icon={<Layers className="h-5 w-5" />}
            tone="indigo"
          />
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search vendors by name, code, contact or email..."
            containerClassName="w-full max-w-sm"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="ALL">All Statuses</option>
            <option value={VendorStatus.ACTIVE}>Active</option>
            <option value={VendorStatus.INACTIVE}>Inactive</option>
            <option value={VendorStatus.PENDING_APPROVAL}>Pending Approval</option>
          </Select>
        </div>

        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-44"
        >
          <option value="name:asc">Sort: Name (A-Z)</option>
          <option value="code:asc">Sort: Code (A-Z)</option>
          <option value="productCount:desc">Sort: Most Products</option>
          <option value="createdAt:desc">Sort: Newest First</option>
        </Select>
      </div>

      {/* Table Content */}
      <Table
        columns={columns}
        rows={vendors}
        rowKey={(v) => v._id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Building2 className="size-8" />}
            title="No vendors found"
            description={
              search || statusFilter !== 'ALL'
                ? 'No vendors matched your filter search criteria. Try adjusting filters.'
                : 'Add your first supplier or distributor to track vendor products and commission rules.'
            }
            action={
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create Vendor</span>
              </Button>
            }
          />
        }
      />

      {/* Pagination */}
      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Drawer Editor */}
      <VendorEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        vendor={editingVendor}
        onSaved={loadData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingVendor}
        title={`Delete vendor "${deletingVendor?.name}"?`}
        message={
          deletingVendor && deletingVendor.productCount > 0
            ? `Warning: This vendor is currently assigned as supplier for ${deletingVendor.productCount} product(s). Deleting it will detach the vendor reference.`
            : 'Are you sure you want to delete this vendor? This action cannot be undone.'
        }
        confirmLabel="Delete Vendor"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingVendor(null)}
      />
    </div>
  );
}
