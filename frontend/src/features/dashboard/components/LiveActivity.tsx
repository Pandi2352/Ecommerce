import { ShoppingBag, CreditCard, UserPlus, Truck, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ActivityItem {
  id: string;
  type: 'order' | 'payment' | 'customer' | 'shipment' | 'refund';
  title: string;
  detail: string;
  value?: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    title: 'New order #1258',
    detail: '2 sec ago',
    value: '₹12,999',
    time: '2s ago',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment received',
    detail: 'Order #1257',
    value: '₹1,499',
    time: '8s ago',
  },
  {
    id: '3',
    type: 'customer',
    title: 'New customer',
    detail: 'Emily Johnson',
    time: '15s ago',
  },
  {
    id: '4',
    type: 'shipment',
    title: 'Order shipped',
    detail: 'Order #1256',
    time: '24s ago',
  },
  {
    id: '5',
    type: 'refund',
    title: 'Refund processed',
    detail: 'Order #1251',
    value: '₹2,199',
    time: '31s ago',
  },
];

const configMap = {
  order: {
    icon: ShoppingBag,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  payment: {
    icon: CreditCard,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  customer: {
    icon: UserPlus,
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  shipment: {
    icon: Truck,
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  refund: {
    icon: ArrowLeftRight,
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

export function LiveActivity() {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-text">Live Activity</h3>
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <button className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer">
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 space-y-3.5">
        {activities.map((act) => {
          const cfg = configMap[act.type];
          const Icon = cfg.icon;

          return (
            <div
              key={act.id}
              className="group flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0 transition-all hover:bg-bg/40 rounded-md px-1"
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-8.5 w-8.5 items-center justify-center rounded-md border", cfg.color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text group-hover:text-indigo-500 transition-colors">
                    {act.title}
                  </span>
                  <span className="text-[10px] font-semibold text-text-secondary mt-0.5">
                    {act.detail}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end text-right font-mono">
                {act.value && <span className="text-xs font-bold text-text">{act.value}</span>}
                <span className="text-[9px] font-semibold text-text-secondary mt-0.5">
                  {act.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
