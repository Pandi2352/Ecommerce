import { useState, type ReactNode } from 'react';
import { Ban, CheckCircle2, Clock, IndianRupee, ShoppingCart } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '@ecommerce/shared';
import {
  Alert,
  Badge,
  Button,
  Drawer,
  FormField,
  Input,
  Pagination,
  SearchInput,
  Select,
  Table,
  type BadgeTone,
  type Column,
  type SortState,
} from '@/components/ui';
import { PageHeader, StatCard, type StatTone } from '@/components/common';
import { useMutation } from '@/hooks/useMutation';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { useAuth } from '@/features/auth/AuthContext';
import { updateOrderStatus, useOrders, useOrderStats, type Order } from './api';

const orderTone: Record<string, BadgeTone> = {
  CREATED: 'info', PAID: 'success', PACKED: 'warning', SHIPPED: 'info',
  DELIVERED: 'success', CANCELLED: 'danger', RETURNED: 'warning', REFUNDED: 'neutral',
};
const payTone: Record<string, BadgeTone> = {
  PENDING: 'warning', PAID: 'success', PARTIALLY_REFUNDED: 'warning', REFUNDED: 'neutral', FAILED: 'danger',
};

export function OrdersPage() {
  const { can } = useAuth();
  const canWrite = can('orders.write');
  const { data, meta, loading, error, filters, setFilters, reload } = useOrders();
  const stats = useOrderStats();

  const [detail, setDetail] = useState<Order | null>(null);
  const [statusValue, setStatusValue] = useState<OrderStatus>(OrderStatus.CREATED);
  const [note, setNote] = useState('');
  const statusMutation = useMutation();

  const sortState: SortState = { key: filters.sort.replace(/^-/, ''), dir: filters.sort.startsWith('-') ? 'desc' : 'asc' };
  const onSort = (field: string) =>
    setFilters((f) => {
      const cur = f.sort.replace(/^-/, '');
      const desc = f.sort.startsWith('-');
      return { ...f, sort: cur === field ? (desc ? field : `-${field}`) : `-${field}`, page: 1 };
    });

  const openDetail = (o: Order) => {
    setDetail(o);
    setStatusValue(o.status);
    setNote('');
  };

  const applyStatus = () => {
    if (!detail) return;
    void statusMutation.run(() => updateOrderStatus(detail.id, statusValue, note || undefined), {
      success: 'Order status updated',
      error: 'Update failed',
      onSuccess: (updated) => {
        setDetail(updated);
        setNote('');
        void reload();
        void stats.reload();
      },
    });
  };

  const s = stats.data;
  const cards: Array<{ label: string; value: ReactNode; tone: StatTone; icon: ReactNode }> = [
    { label: 'Orders', value: s?.total ?? 0, tone: 'indigo', icon: <ShoppingCart className="size-5" /> },
    { label: 'Revenue', value: s ? formatCurrency(s.revenue) : '—', tone: 'emerald', icon: <IndianRupee className="size-5" /> },
    { label: 'Pending', value: s?.created ?? 0, tone: 'amber', icon: <Clock className="size-5" /> },
    { label: 'Delivered', value: s?.delivered ?? 0, tone: 'sky', icon: <CheckCircle2 className="size-5" /> },
    { label: 'Cancelled', value: s?.cancelled ?? 0, tone: 'rose', icon: <Ban className="size-5" /> },
    { label: 'Avg. order', value: s ? formatCurrency(s.avgOrderValue) : '—', tone: 'violet', icon: <IndianRupee className="size-5" /> },
  ];

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber', header: 'Order', sortable: true,
      cell: (o) => (
        <button type="button" onClick={() => openDetail(o)} className="cursor-pointer text-left">
          <p className="font-mono text-sm font-medium text-text hover:text-indigo-500">{o.orderNumber}</p>
          <p className="text-[11px] text-text-secondary">{o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
        </button>
      ),
    },
    {
      key: 'customer', header: 'Customer',
      cell: (o) => (
        <div className="leading-tight">
          <p className="text-sm text-text">{o.customer.name}</p>
          <p className="text-[11px] text-text-secondary">{o.customer.email}</p>
        </div>
      ),
    },
    { key: 'total', header: 'Total', sortable: true, cell: (o) => <span className="whitespace-nowrap text-text">{formatCurrency(o.total)}</span> },
    { key: 'status', header: 'Status', sortable: true, cell: (o) => <Badge tone={orderTone[o.status] ?? 'neutral'}>{o.status}</Badge> },
    { key: 'paymentStatus', header: 'Payment', cell: (o) => <Badge tone={payTone[o.paymentStatus] ?? 'neutral'}>{o.paymentStatus}</Badge> },
    { key: 'createdAt', header: 'Placed', sortable: true, cell: (o) => <span className="whitespace-nowrap text-xs text-text-secondary">{formatDate(o.createdAt)}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Orders" subtitle="Track, fulfil, and manage customer orders." />

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {cards.map((c) => <StatCard key={c.label} className="min-w-36 flex-1" label={c.label} value={c.value} tone={c.tone} icon={c.icon} />)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput containerClassName="min-w-56 flex-1" placeholder="Search order # or customer…" value={filters.search} loading={loading && !!filters.search} onValueChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))} />
        <Select className="w-40" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as OrderStatus | '', page: 1 }))}>
          <option value="">All statuses</option>
          {Object.values(OrderStatus).map((st) => <option key={st} value={st}>{st}</option>)}
        </Select>
        <Select className="w-40" value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value as PaymentStatus | '', page: 1 }))}>
          <option value="">All payments</option>
          {Object.values(PaymentStatus).map((st) => <option key={st} value={st}>{st}</option>)}
        </Select>
      </div>

      {error && <Alert>{error}</Alert>}

      <Table columns={columns} rows={data} rowKey={(o) => o.id} loading={loading} sort={sortState} onSort={onSort} emptyState="No orders yet." />

      {meta && <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))} />}

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order ${detail.orderNumber}` : ''} widthClassName="w-full max-w-lg">
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={orderTone[detail.status] ?? 'neutral'}>{detail.status}</Badge>
              <Badge tone={payTone[detail.paymentStatus] ?? 'neutral'}>{detail.paymentStatus}</Badge>
              {detail.paymentMethod && <span className="text-xs text-text-secondary">via {detail.paymentMethod}</span>}
              <span className="ml-auto text-xs text-text-secondary">{formatDateTime(detail.createdAt)}</span>
            </div>

            <div>
              <p className="text-xs font-medium text-text-secondary">Customer</p>
              <p className="mt-0.5 text-sm text-text">{detail.customer.name}</p>
              <p className="text-xs text-text-secondary">{detail.customer.email}{detail.customer.phone ? ` · ${detail.customer.phone}` : ''}</p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-text-secondary">Items</p>
              <div className="divide-y divide-border rounded-md border border-border">
                {detail.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">{it.name}</p>
                      <p className="text-[11px] text-text-secondary">
                        {it.variant ? Object.values(it.variant).join(' / ') + ' · ' : ''}{formatCurrency(it.price)} × {it.quantity}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm text-text">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={formatCurrency(detail.subtotal)} />
              {detail.discount > 0 && <Row label="Discount" value={`− ${formatCurrency(detail.discount)}`} />}
              {detail.shipping > 0 && <Row label="Shipping" value={formatCurrency(detail.shipping)} />}
              {detail.tax > 0 && <Row label="Tax" value={formatCurrency(detail.tax)} />}
              <div className="flex justify-between border-t border-border pt-1 font-semibold text-text">
                <span>Total</span><span>{formatCurrency(detail.total)}</span>
              </div>
            </div>

            {detail.shippingAddress && Object.values(detail.shippingAddress).some(Boolean) && (
              <div>
                <p className="text-xs font-medium text-text-secondary">Shipping to</p>
                <p className="mt-0.5 text-sm text-text">
                  {[detail.shippingAddress.line1, detail.shippingAddress.line2, detail.shippingAddress.city, detail.shippingAddress.state, detail.shippingAddress.postalCode, detail.shippingAddress.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-text-secondary">Timeline</p>
              <ol className="space-y-2 border-l border-border pl-3">
                {[...detail.timeline].reverse().map((t, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-text">{t.status}</span>
                    {t.note ? <span className="text-text-secondary"> — {t.note}</span> : null}
                    <span className="block text-[11px] text-text-secondary">{formatDateTime(t.at)}</span>
                  </li>
                ))}
              </ol>
            </div>

            {canWrite && (
              <div className="rounded-md border border-border p-3">
                <p className="mb-2 text-xs font-medium text-text-secondary">Update status</p>
                <div className="flex flex-col gap-2">
                  <Select value={statusValue} onChange={(e) => setStatusValue(e.target.value as OrderStatus)}>
                    {Object.values(OrderStatus).map((st) => <option key={st} value={st}>{st}</option>)}
                  </Select>
                  <FormField label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Shipped via BlueDart AWB 123" /></FormField>
                  <Button onClick={applyStatus} loading={statusMutation.saving} disabled={statusValue === detail.status && !note}>Update</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-text-secondary">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
