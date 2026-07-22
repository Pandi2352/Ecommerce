import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, PackageX, BadgeIndianRupee, Undo2 } from 'lucide-react';
import { OrderStatus } from '@ecommerce/shared';
import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  SearchInput,
  Table,
  type Column,
} from '@/components/ui';
import { StatCard } from '@/components/common/StatCard';
import type { Meta } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchReturns, updateOrderStatus, type Order } from './api';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function ReturnsPage() {
  const { can } = useAuth();
  const canWrite = can('orders.write');
  const [rows, setRows] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReturns({ page, pageSize: 10, search: search.trim() || undefined });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load returns'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const processRefund = async (o: Order) => {
    setRefunding(o.id);
    try {
      await updateOrderStatus(o.id, OrderStatus.REFUNDED, 'Refund processed');
      toast.success(`Refund processed for ${o.orderNumber}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to process refund'));
    } finally {
      setRefunding(null);
    }
  };

  const returned = rows.filter((o) => o.status === OrderStatus.RETURNED);
  const refunded = rows.filter((o) => o.status === OrderStatus.REFUNDED);
  const refundedValue = refunded.reduce((s, o) => s + o.total, 0);

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      cell: (o) => (
        <span className="font-mono text-xs font-bold text-indigo-500">{o.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o) => (
        <div className="leading-tight">
          <p className="text-xs font-bold text-text">{o.customer.name}</p>
          <p className="text-[11px] text-text-secondary">{o.customer.email}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Ordered',
      cell: (o) => (
        <span className="text-xs text-text-secondary">
          {o.createdAt
            ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Amount',
      className: 'text-right',
      cell: (o) => <span className="font-mono text-xs font-bold text-text">{inr(o.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (o) => (
        <Badge tone={o.status === OrderStatus.REFUNDED ? 'neutral' : 'warning'}>
          {o.status === OrderStatus.REFUNDED ? 'Refunded' : 'Return requested'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-36 text-right',
      cell: (o) =>
        canWrite && o.status === OrderStatus.RETURNED ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            loading={refunding === o.id}
            onClick={() => processRefund(o)}
          >
            <Undo2 className="h-3 w-3" /> Process refund
          </Button>
        ) : o.status === OrderStatus.REFUNDED ? (
          <span className="text-[11px] font-semibold text-emerald-500">✓ Refunded</span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
          <RotateCcw className="h-5 w-5 text-indigo-500" />
          <span>Returns &amp; Refunds</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Orders customers returned — process refunds here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting refund"
          value={returned.length}
          icon={<PackageX className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Refunded"
          value={refunded.length}
          icon={<Undo2 className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Refunded value"
          value={inr(refundedValue)}
          icon={<BadgeIndianRupee className="h-5 w-5" />}
          tone="rose"
        />
      </div>

      <div className="rounded-md border border-border bg-surface p-3">
        <SearchInput
          value={search}
          onValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search returns by order number, customer or email..."
          containerClassName="w-full max-w-sm"
        />
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<RotateCcw className="size-8" />}
            title="No returns"
            description="Returned or refunded orders will appear here."
          />
        }
      />

      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}
    </div>
  );
}
