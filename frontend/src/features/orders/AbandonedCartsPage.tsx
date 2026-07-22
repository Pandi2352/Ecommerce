import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, UserRound, Users, BadgeIndianRupee } from 'lucide-react';
import { Badge, EmptyState, Pagination, Table, type Column } from '@/components/ui';
import { StatCard } from '@/components/common/StatCard';
import type { Meta } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import {
  fetchAbandonedCarts,
  fetchAbandonedStats,
  type AbandonedCart,
  type AbandonedStats,
} from './api';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AbandonedCartsPage() {
  const [rows, setRows] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchAbandonedCarts({ page, pageSize: 10 }),
        fetchAbandonedStats(),
      ]);
      setRows(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load abandoned carts'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<AbandonedCart>[] = [
    {
      key: 'customer',
      header: 'Shopper',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-500">
            {(c.customerName ?? 'G').charAt(0).toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold text-text">{c.customerName ?? 'Guest'}</p>
            <p className="text-[11px] text-text-secondary">{c.customerEmail ?? 'anonymous'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (c) => (
        <div className="max-w-[280px]">
          <span className="text-xs font-semibold text-text">{c.itemCount} item(s)</span>
          <p className="truncate text-[11px] text-text-secondary">
            {c.items.map((i) => i.name).join(', ')}
          </p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Cart value',
      className: 'text-right',
      cell: (c) => <span className="font-mono text-xs font-bold text-text">{inr(c.value)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (c) => (
        <Badge tone={c.guest ? 'neutral' : 'info'}>{c.guest ? 'Guest' : 'Registered'}</Badge>
      ),
    },
    {
      key: 'updated',
      header: 'Last active',
      className: 'text-right',
      cell: (c) => <span className="text-xs text-text-secondary">{relTime(c.updatedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
          <ShoppingCart className="h-5 w-5 text-indigo-500" />
          <span>Abandoned Carts</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Carts with items that haven't checked out in the last hour — potential recoverable
          revenue.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Abandoned carts"
            value={stats.total}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Guest"
            value={stats.guest}
            icon={<UserRound className="h-5 w-5" />}
            tone="slate"
          />
          <StatCard
            label="Registered"
            value={stats.registered}
            icon={<Users className="h-5 w-5" />}
            tone="indigo"
          />
          <StatCard
            label="Potential revenue"
            value={inr(stats.potentialRevenue)}
            icon={<BadgeIndianRupee className="h-5 w-5" />}
            tone="emerald"
          />
        </div>
      )}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<ShoppingCart className="size-8" />}
            title="No abandoned carts"
            description="Carts left with items for over an hour will show up here."
          />
        }
      />

      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}
    </div>
  );
}
