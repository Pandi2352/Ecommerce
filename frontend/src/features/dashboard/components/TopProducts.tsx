import { Package } from 'lucide-react';
import type { DashboardTopProduct } from '../api';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function TopProducts({ products }: { products: DashboardTopProduct[] }) {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text">Top Selling Products</h3>
      </div>

      <div className="flex-1 space-y-3.5">
        {products.length === 0 && (
          <p className="py-6 text-center text-xs text-text-secondary">No sales yet.</p>
        )}
        {products.map((prod, i) => (
          <div
            key={prod.name}
            className="flex items-center justify-between group hover:bg-bg/40 rounded-md p-1 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg text-[10px] font-bold text-text-secondary border border-border/40">
                {i + 1}
              </span>
              {prod.image ? (
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="h-9 w-9 rounded-md border border-border object-cover bg-bg shrink-0"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-bg text-text-secondary">
                  <Package className="h-4 w-4" />
                </span>
              )}
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-xs font-bold text-text truncate group-hover:text-indigo-500 transition-colors">
                  {prod.name}
                </span>
                <span className="text-[10px] font-semibold text-text-secondary mt-1">
                  {prod.qty} sold
                </span>
              </div>
            </div>
            <div className="font-mono text-xs font-bold text-text text-right shrink-0">
              {inr(prod.revenue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
