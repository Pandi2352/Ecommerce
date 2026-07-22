import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { DashboardData } from '../api';

interface MiniCardProps {
  label: string;
  value: string;
  delta?: number;
  positiveWhenUp?: boolean;
  sparklineData: number[];
  color: string;
  isBarChart?: boolean;
}

function MiniCard({
  label,
  value,
  delta,
  positiveWhenUp = true,
  sparklineData,
  color,
  isBarChart = false,
}: MiniCardProps) {
  const width = 80;
  const height = 18;
  const max = Math.max(...sparklineData, 1);
  const min = Math.min(...sparklineData, 0);
  const range = max - min || 1;
  const points = sparklineData.map((val, index) => ({
    x: (index / Math.max(sparklineData.length - 1, 1)) * width,
    y: height - ((val - min) / range) * height,
  }));

  const up = (delta ?? 0) >= 0;
  const good = positiveWhenUp ? up : !up;

  return (
    <div className="flex flex-col justify-between rounded-md border border-border bg-surface p-3 transition-all hover:border-slate-350 dark:hover:border-slate-700">
      <div>
        <p className="text-[10px] font-semibold text-text-secondary tracking-wide uppercase">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-text font-mono leading-none">{value}</span>
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center text-[9px] font-bold leading-none',
                good ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {up ? <ArrowUpRight className="h-2 w-2" /> : <ArrowDownRight className="h-2 w-2" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-3.5 h-4.5 w-full overflow-hidden">
        {isBarChart ? (
          <div className="flex items-end justify-between h-full gap-0.5 px-1">
            {sparklineData.map((val, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-t-md bg-indigo-500 opacity-80"
                style={{ height: `${Math.max(((val - min) / range) * 100, 20)}%` }}
              />
            ))}
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <path
              d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

/** Round up to a "nice" ceiling for the revenue goal. */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}
const compact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.00$/, '')}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.00$/, '')}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${n}`;
};

export function MiniStatsRow({ data }: { data: DashboardData }) {
  const { counts, kpis, salesSeries } = data;
  const spark = salesSeries.slice(-7).map((s) => s.revenue);
  const bars = salesSeries.slice(-7).map((s) => s.orders);

  // Soft monthly revenue goal derived from current run-rate.
  const goal = niceCeil(Math.max(kpis.revenue * 1.4, 1));
  const goalPct = Math.min(100, Math.round((kpis.revenue / goal) * 100));
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (goalPct / 100) * circumference;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <MiniCard
        label="Total Orders"
        value={String(counts.totalOrders)}
        delta={kpis.ordersDelta}
        sparklineData={spark}
        color="var(--color-info)"
      />
      <MiniCard
        label="Products Sold"
        value={String(bars.reduce((a, b) => a + b, 0))}
        sparklineData={bars}
        color="var(--color-info)"
        isBarChart
      />
      <MiniCard
        label="New Customers (30d)"
        value={String(counts.newCustomers30d)}
        delta={kpis.customersDelta}
        sparklineData={spark}
        color="var(--color-success)"
      />
      <MiniCard
        label="Active Products"
        value={String(counts.activeProducts)}
        sparklineData={spark}
        color="var(--color-success)"
      />
      <MiniCard
        label="Low Stock"
        value={String(counts.lowStock)}
        positiveWhenUp={false}
        sparklineData={spark}
        color="var(--color-danger)"
      />

      {/* Revenue Goal */}
      <div className="flex items-center justify-between rounded-md bg-indigo-600 p-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 60 60" className="-rotate-90 h-full w-full">
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="transparent"
                stroke="#ffffff"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-white">
              {goalPct}%
            </div>
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="text-[10px] font-bold tracking-wider text-indigo-100 uppercase">
              Revenue Goal
            </span>
            <span className="mt-1 text-sm font-bold tracking-tight font-mono text-white">
              {compact(kpis.revenue)}{' '}
              <span className="text-[10px] text-indigo-200 font-normal">/ {compact(goal)}</span>
            </span>
            <span className="mt-1 text-[9px] font-semibold text-indigo-200">Last 30 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
