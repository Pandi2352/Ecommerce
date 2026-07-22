import { cn } from '@/utils/cn';
import type { SalesPoint } from '../api';

const densityClasses = [
  'bg-indigo-50/20 border-indigo-100/10 dark:bg-indigo-950/20 dark:border-indigo-900/10',
  'bg-indigo-500/20 border-indigo-500/10 dark:bg-indigo-500/15',
  'bg-indigo-500/40 border-indigo-500/20 dark:bg-indigo-500/30',
  'bg-indigo-500/70 border-indigo-500/30 dark:bg-indigo-500/60',
  'bg-indigo-600 border-indigo-650/40 dark:bg-indigo-500',
];

/** Real order-count heatmap over the last 14 days, laid out as rows of 7. */
export function SalesHeatmap({ series }: { series: SalesPoint[] }) {
  const maxOrders = Math.max(...series.map((s) => s.orders), 1);
  const density = (o: number) => (o === 0 ? 0 : Math.min(4, Math.ceil((o / maxOrders) * 4)));

  const rows: SalesPoint[][] = [];
  for (let i = 0; i < series.length; i += 7) rows.push(series.slice(i, i + 7));

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text">Order Activity</h3>
        <span className="text-[10px] font-semibold text-text-secondary">
          Last {series.length} days
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {rows.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((d) => (
                <div
                  key={d.label}
                  className={cn(
                    'aspect-square w-full rounded-md border transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-indigo-500/30',
                    densityClasses[density(d.orders)],
                  )}
                  title={`${d.label}: ${d.orders} order${d.orders === 1 ? '' : 's'} · ₹${d.revenue.toLocaleString('en-IN')}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1.5 text-[9px] font-semibold text-text-secondary">
          <span>Fewer</span>
          <div className="flex gap-0.5">
            {densityClasses.map((cls, idx) => (
              <div key={idx} className={cn('h-2.5 w-2.5 rounded-md border', cls)} />
            ))}
          </div>
          <span>More orders</span>
        </div>
      </div>
    </div>
  );
}
