import { useCallback, useEffect, useState } from 'react';
import {
  UsersRound,
  UserCheck,
  UserPlus,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Eye,
} from 'lucide-react';
import {
  Badge,
  Button,
  Drawer,
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
  fetchCustomer,
  fetchCustomers,
  fetchCustomerStats,
  type CustomerDetail,
  type CustomerItem,
  type CustomerStats,
} from './api';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const statusTone = (s: string): 'success' | 'warning' | 'danger' | 'neutral' =>
  s === 'ACTIVE' ? 'success' : s === 'BANNED' || s === 'DELETED' ? 'danger' : 'neutral';

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchCustomers({
          page,
          pageSize: 10,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          sort,
        }),
        fetchCustomerStats(),
      ]);
      setCustomers(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load customers'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDetail = async (c: CustomerItem) => {
    setDetailLoading(true);
    try {
      setDetail(await fetchCustomer(c.id));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load customer'));
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<CustomerItem>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-500">
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text">{c.name}</span>
              {c.emailVerified && (
                <Badge tone="success" className="py-0 text-[9px]">
                  Verified
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-text-secondary">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (c) => <span className="text-xs text-text-secondary">{c.phone || '—'}</span>,
    },
    {
      key: 'addresses',
      header: 'Addresses',
      className: 'text-right',
      cell: (c) => <span className="font-mono text-xs text-text-secondary">{c.addressCount}</span>,
    },
    {
      key: 'orders',
      header: 'Orders',
      className: 'text-right',
      cell: (c) => (
        <span className="font-mono text-xs font-semibold text-text">{c.orderCount}</span>
      ),
    },
    {
      key: 'spent',
      header: 'Total Spent',
      className: 'text-right',
      cell: (c) => (
        <span className="font-mono text-xs font-bold text-text">{inr(c.totalSpent)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => <Badge tone={statusTone(c.status)}>{c.status}</Badge>,
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (c) => (
        <span className="text-xs text-text-secondary">
          {new Date(c.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (c) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="View"
          onClick={() => openDetail(c)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
            <UsersRound className="h-5 w-5 text-indigo-500" />
            <span>Customers</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Storefront shoppers — accounts, saved addresses and order history.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Customers"
            value={stats.total}
            icon={<UsersRound className="h-5 w-5" />}
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<UserCheck className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="New (30d)"
            value={stats.newThisMonth}
            icon={<UserPlus className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            label="With Orders"
            value={stats.withOrders}
            icon={<ShoppingBag className="h-5 w-5" />}
            tone="amber"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search customers by name or email..."
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
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Banned</option>
          </Select>
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="createdAt:desc">Sort: Newest</option>
          <option value="name:asc">Sort: Name (A–Z)</option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        rows={customers}
        rowKey={(c) => c.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<UsersRound className="size-8" />}
            title="No customers found"
            description={
              search || statusFilter !== 'ALL'
                ? 'No customers matched your filters.'
                : 'Customers appear here when shoppers register on the storefront.'
            }
          />
        }
      />

      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      {/* Detail drawer */}
      <Drawer
        open={!!detail || detailLoading}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : 'Customer'}
        widthClassName="w-full max-w-md"
      >
        {detailLoading || !detail ? (
          <p className="text-sm text-text-secondary">Loading…</p>
        ) : (
          <div className="space-y-5">
            {/* Profile */}
            <div className="space-y-1.5 rounded-md border border-border bg-bg/40 p-4 text-sm">
              <div className="flex items-center gap-2 text-text">
                <Mail className="h-3.5 w-3.5 text-text-secondary" /> {detail.email}
                {detail.emailVerified && (
                  <Badge tone="success" className="py-0 text-[9px]">
                    Verified
                  </Badge>
                )}
              </div>
              {detail.phone && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="h-3.5 w-3.5" /> {detail.phone}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-text-secondary">
                <span>
                  <Badge tone={statusTone(detail.status)}>{detail.status}</Badge>
                </span>
                <span>{detail.orderCount} orders</span>
                <span className="font-semibold text-text">{inr(detail.totalSpent)} spent</span>
              </div>
            </div>

            {/* Addresses */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text">
                <MapPin className="h-3.5 w-3.5" /> Addresses ({detail.addresses.length})
              </h4>
              {detail.addresses.length === 0 ? (
                <p className="text-xs text-text-secondary">No saved addresses.</p>
              ) : (
                <div className="space-y-2">
                  {detail.addresses.map((a) => (
                    <div key={a.id} className="rounded-md border border-border p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text">{a.fullName}</span>
                        {a.label && (
                          <span className="rounded bg-bg px-1.5 py-0.5 text-[10px] text-text-secondary">
                            {a.label}
                          </span>
                        )}
                        {a.isDefault && (
                          <Badge tone="success" className="py-0 text-[9px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-text-secondary">
                        {[a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent orders */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text">
                <ShoppingBag className="h-3.5 w-3.5" /> Recent orders
              </h4>
              {detail.orders.length === 0 ? (
                <p className="text-xs text-text-secondary">No orders yet.</p>
              ) : (
                <div className="divide-y divide-border rounded-md border border-border">
                  {detail.orders.map((o) => (
                    <div
                      key={o.orderNumber}
                      className="flex items-center justify-between gap-2 p-2.5 text-xs"
                    >
                      <span className="font-mono font-bold text-text">{o.orderNumber}</span>
                      <Badge tone={statusTone(o.status === 'DELIVERED' ? 'ACTIVE' : o.status)}>
                        {o.status}
                      </Badge>
                      <span className="font-mono font-semibold text-text">{inr(o.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
