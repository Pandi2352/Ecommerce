import { ShoppingBag, Truck, ArrowLeftRight, PackageCheck, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { DashboardRecentOrder } from '../api';

const configMap = {
  order: { icon: ShoppingBag, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  shipment: { icon: Truck, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  delivered: {
    icon: PackageCheck,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  refund: { icon: ArrowLeftRight, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
} as const;

function kindFor(status: string): keyof typeof configMap {
  if (status === 'DELIVERED') return 'delivered';
  if (status === 'SHIPPED' || status === 'PACKED') return 'shipment';
  if (status === 'CANCELLED' || status === 'RETURNED' || status === 'REFUNDED') return 'refund';
  return 'order';
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function LiveActivity({ orders }: { orders: DashboardRecentOrder[] }) {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-text">Live Activity</h3>
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3.5">
        {orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-xs text-text-secondary">
            <Clock className="h-6 w-6 text-text-muted" />
            No recent activity.
          </div>
        )}
        {orders.map((o) => {
          const kind = kindFor(o.status);
          const cfg = configMap[kind];
          const Icon = cfg.icon;
          const title =
            kind === 'delivered'
              ? `Delivered ${o.orderNumber}`
              : kind === 'shipment'
                ? `Order ${o.status.toLowerCase()} ${o.orderNumber}`
                : kind === 'refund'
                  ? `${o.status[0]}${o.status.slice(1).toLowerCase()} ${o.orderNumber}`
                  : `New order ${o.orderNumber}`;
          return (
            <div
              key={o.orderNumber}
              className="group flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0 transition-all hover:bg-bg/40 rounded-md px-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border',
                    cfg.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-text truncate">{title}</span>
                  <span className="text-[10px] font-semibold text-text-secondary mt-0.5 truncate">
                    {o.customer}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end text-right font-mono shrink-0">
                <span className="text-xs font-bold text-text">{inr(o.total)}</span>
                <span className="text-[9px] font-semibold text-text-secondary mt-0.5">
                  {relTime(o.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
