import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import type { DashboardRecentOrder } from '../api';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  CREATED: 'info',
  PAID: 'info',
  PACKED: 'warning',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
  REFUNDED: 'neutral',
};

export function RecentOrders({ orders }: { orders: DashboardRecentOrder[] }) {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text">Recent Orders</h3>
        <Link
          to="/orders"
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text hover:bg-bg"
        >
          View All Orders
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-[10px] font-bold text-text-secondary uppercase tracking-wider bg-table-header/30">
              <th className="py-2.5 px-3">Order</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-text-secondary">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.orderNumber} className="hover:bg-row-hover/60 transition-colors group">
                <td className="py-3 px-3 font-mono text-xs font-bold text-text">{o.orderNumber}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-500">
                      {o.customer.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-text">{o.customer}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-xs text-text-secondary font-medium">
                  {new Date(o.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </td>
                <td className="py-3 px-3 font-mono text-xs font-bold text-text">{inr(o.total)}</td>
                <td className="py-3 px-3">
                  <Badge tone={STATUS_TONE[o.status] ?? 'neutral'}>{o.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
