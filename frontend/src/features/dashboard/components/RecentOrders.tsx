import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui';

interface Order {
  id: string;
  customer: {
    name: string;
    avatar: string;
  };
  date: string;
  amount: string;
  status: 'Processing' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment: 'Paid' | 'Refunded';
}

const orders: Order[] = [
  {
    id: '#1258',
    customer: {
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80',
    },
    date: 'May 31, 2025',
    amount: '₹12,999',
    status: 'Processing',
    payment: 'Paid',
  },
  {
    id: '#1257',
    customer: {
      name: 'Emily Johnson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80',
    },
    date: 'May 31, 2025',
    amount: '₹1,499',
    status: 'Confirmed',
    payment: 'Paid',
  },
  {
    id: '#1256',
    customer: {
      name: 'Michael Brown',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80',
    },
    date: 'May 31, 2025',
    amount: '₹3,299',
    status: 'Shipped',
    payment: 'Paid',
  },
  {
    id: '#1255',
    customer: {
      name: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80',
    },
    date: 'May 30, 2025',
    amount: '₹7,599',
    status: 'Delivered',
    payment: 'Paid',
  },
  {
    id: '#1254',
    customer: {
      name: 'David Lee',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80',
    },
    date: 'May 30, 2025',
    amount: '₹2,199',
    status: 'Cancelled',
    payment: 'Refunded',
  },
];

export function RecentOrders() {
  const getStatusTone = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'Processing':
        return 'warning';
      case 'Cancelled':
        return 'danger';
      case 'Confirmed':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text">Recent Orders</h3>
        <button className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text hover:bg-bg cursor-pointer">
          View All Orders
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-[10px] font-bold text-text-secondary uppercase tracking-wider bg-table-header/30">
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Payment</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-row-hover/60 transition-colors group">
                <td className="py-3 px-3 font-mono text-xs font-bold text-text">
                  {order.id}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={order.customer.avatar}
                      alt={order.customer.name}
                      className="h-6 w-6 rounded-full border border-border object-cover"
                    />
                    <span className="text-xs font-semibold text-text group-hover:text-indigo-500 transition-colors">
                      {order.customer.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-xs text-text-secondary font-medium">
                  {order.date}
                </td>
                <td className="py-3 px-3 font-mono text-xs font-bold text-text">
                  {order.amount}
                </td>
                <td className="py-3 px-3">
                  <Badge
                    tone={getStatusTone(order.status)}
                    className={
                      order.status === 'Shipped'
                        ? 'border-violet-500/20 text-violet-400 bg-violet-500/5 dark:bg-violet-500/10 dark:text-violet-300'
                        : ''
                    }
                  >
                    {order.status}
                  </Badge>
                </td>
                <td className="py-3 px-3">
                  <Badge
                    tone={order.payment === 'Paid' ? 'success' : 'neutral'}
                    className={
                      order.payment === 'Refunded'
                        ? 'border-slate-500/20 text-slate-400 bg-slate-500/5 dark:bg-slate-500/10'
                        : ''
                    }
                  >
                    {order.payment}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  <button className="p-1 rounded-md text-text-secondary hover:bg-bg hover:text-text transition-colors cursor-pointer inline-flex items-center justify-center">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
