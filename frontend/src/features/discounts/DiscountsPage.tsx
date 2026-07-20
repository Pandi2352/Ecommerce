import { useCallback, useEffect, useState } from 'react';
import { Tag, Plus, Sparkles, Percent, DollarSign, Truck, Layers, MoreVertical, Edit2, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { DiscountStatus, DiscountType } from '@ecommerce/shared';
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
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { deleteDiscount, fetchDiscounts, fetchDiscountStats, updateDiscount } from './api';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { DiscountEditorDrawer } from './components/DiscountEditorDrawer';
import type { CouponItem, DiscountStats } from './types';

export function DiscountsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [stats, setStats] = useState<DiscountStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchDiscounts({
          page,
          pageSize: 10,
          search: search.trim() || undefined,
          type: typeFilter !== 'ALL' ? (typeFilter as DiscountType) : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as DiscountStatus) : undefined,
          sort,
        }),
        fetchDiscountStats(),
      ]);
      setCoupons(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load discount coupons'));
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setEditingCoupon(null);
    setDrawerOpen(true);
  };

  const handleEdit = (c: CouponItem) => {
    setEditingCoupon(c);
    setDrawerOpen(true);
  };

  const handleToggleStatus = async (c: CouponItem) => {
    const nextStatus =
      c.status === DiscountStatus.ACTIVE ? DiscountStatus.DISABLED : DiscountStatus.ACTIVE;
    try {
      await updateDiscount(c._id, { status: nextStatus });
      toast.success(`Coupon "${c.code}" is now ${nextStatus.toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update coupon status'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCoupon) return;
    setDeleting(true);
    try {
      await deleteDiscount(deletingCoupon._id);
      toast.success(`Deleted promo code "${deletingCoupon.code}"`);
      setDeletingCoupon(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete coupon'));
    } finally {
      setDeleting(false);
    }
  };

  const getTypeIcon = (t: DiscountType) => {
    switch (t) {
      case DiscountType.PERCENTAGE:
        return <Percent className="h-3.5 w-3.5 text-indigo-500" />;
      case DiscountType.FIXED_AMOUNT:
        return <DollarSign className="h-3.5 w-3.5 text-emerald-500" />;
      case DiscountType.FREE_SHIPPING:
        return <Truck className="h-3.5 w-3.5 text-amber-500" />;
      case DiscountType.BUY_X_GET_Y:
        return <Layers className="h-3.5 w-3.5 text-violet-500" />;
      case DiscountType.TIERED:
        return <Sparkles className="h-3.5 w-3.5 text-sky-500" />;
    }
  };

  const getStatusTone = (s: DiscountStatus) => {
    switch (s) {
      case DiscountStatus.ACTIVE:
        return 'success';
      case DiscountStatus.DISABLED:
        return 'neutral';
      case DiscountStatus.EXPIRED:
        return 'danger';
    }
  };

  const columns: Column<CouponItem>[] = [
    {
      key: 'code',
      header: 'Promo Code & Badges',
      cell: (c) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {c.code}
            </span>
            {c.isAutoApplied && (
              <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20" title="Auto-applies to cart">
                <Zap className="h-3 w-3 fill-amber-500" />
                <span>Auto</span>
              </span>
            )}
            {c.firstTimeUserOnly && (
              <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-500 border border-sky-500/20" title="First time buyers only">
                1st Order
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Discount Rule',
      cell: (c) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-text">
          {getTypeIcon(c.type)}
          <span>
            {c.type === DiscountType.PERCENTAGE
              ? `${c.value}% Off`
              : c.type === DiscountType.FIXED_AMOUNT
              ? `${formatCurrency(c.value)} Off`
              : c.type === DiscountType.FREE_SHIPPING
              ? 'Free Shipping'
              : c.type.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'minPurchase',
      header: 'Min Spend & Cap',
      cell: (c) => (
        <div className="text-xs space-y-0.5">
          <div className="text-text-secondary">
            Min: {c.minPurchaseAmount > 0 ? formatCurrency(c.minPurchaseAmount) : 'None'}
          </div>
          {c.maxDiscountAmount && (
            <div className="text-[11px] text-text-secondary">
              Cap: {formatCurrency(c.maxDiscountAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Redemptions',
      cell: (c) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-text">{c.usageCount}</span>
            <span className="text-text-secondary">/ {c.usageLimitTotal ? c.usageLimitTotal : '∞'}</span>
          </div>
          {c.usageLimitTotal && (
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${Math.min(100, (c.usageCount / c.usageLimitTotal) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Validity Period',
      cell: (c) => (
        <div className="text-xs text-text-secondary font-mono">
          {c.startDate || c.endDate ? (
            <div>
              {c.startDate && <div>From: {c.startDate.split('T')[0]}</div>}
              {c.endDate && <div>To: {c.endDate.split('T')[0]}</div>}
            </div>
          ) : (
            <span>Always Valid</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => <Badge tone={getStatusTone(c.status)}>{c.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (c) => (
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
                  <span>Edit Coupon</span>
                </span>
              ),
              onSelect: () => handleEdit(c),
            },
            {
              label: (
                <span className="flex items-center gap-2">
                  <span>
                    {c.status === DiscountStatus.ACTIVE ? 'Disable Coupon' : 'Enable Coupon'}
                  </span>
                </span>
              ),
              onSelect: () => handleToggleStatus(c),
            },
            {
              label: (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                  <span>Delete Coupon</span>
                </span>
              ),
              danger: true,
              onSelect: () => setDeletingCoupon(c),
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
            <Tag className="h-5 w-5 text-indigo-500" />
            <span>Discounts & Promo Codes</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Manage promotional codes, percentage/fixed discounts, free shipping vouchers, and batch generators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setBatchModalOpen(true)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Batch Generator</span>
          </Button>

          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Promo Code</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Coupons" value={stats.total} icon={<Tag className="h-5 w-5" />} />
          <StatCard
            label="Active Promos"
            value={stats.active}
            icon={<ShieldCheck className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Total Redemptions"
            value={stats.totalRedemptions}
            icon={<Zap className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Total Saved"
            value={formatCurrency(stats.totalDiscountSaved)}
            icon={<DollarSign className="h-5 w-5" />}
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
            placeholder="Search by promo code (e.g. SUMMER20)..."
            containerClassName="w-full max-w-sm"
          />

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="ALL">All Types</option>
            <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
            <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount ($)</option>
            <option value={DiscountType.FREE_SHIPPING}>Free Shipping</option>
            <option value={DiscountType.BUY_X_GET_Y}>Buy X Get Y</option>
            <option value={DiscountType.TIERED}>Tiered Spend</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value={DiscountStatus.ACTIVE}>Active</option>
            <option value={DiscountStatus.DISABLED}>Disabled</option>
            <option value={DiscountStatus.EXPIRED}>Expired</option>
          </Select>
        </div>

        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="createdAt:desc">Sort: Newest First</option>
          <option value="code:asc">Sort: Code (A-Z)</option>
          <option value="usageCount:desc">Sort: Most Redemptions</option>
        </Select>
      </div>

      {/* Table Content */}
      <Table
        columns={columns}
        rows={coupons}
        rowKey={(c) => c._id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Tag className="size-8" />}
            title="No promo codes found"
            description={
              search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No promo codes matched your search filters. Try adjusting filter criteria.'
                : 'Create your first discount coupon code or generate a batch of promotional vouchers.'
            }
            action={
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create Coupon</span>
              </Button>
            }
          />
        }
      />

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      {/* Drawer Editor */}
      <DiscountEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        coupon={editingCoupon}
        onSaved={loadData}
      />

      {/* Batch Generator Modal */}
      <BatchGeneratorModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onGenerated={loadData}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deletingCoupon}
        title={`Delete promo code "${deletingCoupon?.code}"?`}
        message="Are you sure you want to delete this promotional coupon code? This action cannot be undone."
        confirmLabel="Delete Coupon"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingCoupon(null)}
      />
    </div>
  );
}
