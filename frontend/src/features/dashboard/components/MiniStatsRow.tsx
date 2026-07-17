import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MiniCardProps {
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  sparklineData: number[];
  color: string;
  isBarChart?: boolean;
}

function MiniCard({
  label,
  value,
  delta,
  isPositive,
  sparklineData,
  color,
  isBarChart = false,
}: MiniCardProps) {
  const width = 80;
  const height = 18;
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min || 1;

  const points = sparklineData.map((val, index) => {
    const x = (index / (sparklineData.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return { x, y };
  });

  return (
    <div className="flex flex-col justify-between rounded-md border border-border bg-surface p-3 transition-all hover:border-slate-350 dark:hover:border-slate-700">
      <div>
        <p className="text-[10px] font-semibold text-text-secondary tracking-wide uppercase">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-text font-mono leading-none">{value}</span>
          <span
            className={cn(
              "inline-flex items-center text-[9px] font-bold leading-none",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-2 w-2" /> : <ArrowDownRight className="h-2 w-2" />}
            {delta}
          </span>
        </div>
      </div>

      {/* Mini Trend Line or Bar Chart */}
      <div className="mt-3.5 h-4.5 w-full overflow-hidden">
        {isBarChart ? (
          <div className="flex items-end justify-between h-full gap-0.5 px-1">
            {sparklineData.map((val, idx) => {
              const h = ((val - min) / range) * 100 || 10;
              return (
                <div
                  key={idx}
                  className="w-1.5 rounded-t-md bg-indigo-500 opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${Math.max(h, 20)}%` }}
                />
              );
            })}
          </div>
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
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

export function MiniStatsRow() {
  const profitData = [10, 15, 8, 20, 22, 18, 30];
  const soldData = [5, 12, 10, 15, 13, 20, 24];
  const custData = [12, 10, 15, 18, 14, 22, 25];
  const cartData = [25, 22, 28, 19, 15, 12, 8];
  const subsData = [8, 10, 11, 14, 15, 13, 18];

  // Radial progress calculations for Revenue Goal
  const goalPercentage = 74;
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius; // ~150.8
  const offset = circumference - (goalPercentage / 100) * circumference;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {/* Total Profit */}
      <MiniCard
        label="Total Profit"
        value="₹8,45,210"
        delta="14.2%"
        isPositive={true}
        sparklineData={profitData}
        color="var(--color-success)"
      />

      {/* Products Sold */}
      <MiniCard
        label="Products Sold"
        value="12,842"
        delta="13.1%"
        isPositive={true}
        sparklineData={soldData}
        color="var(--color-info)"
        isBarChart={true}
      />

      {/* Returning Customers */}
      <MiniCard
        label="Returning Customers"
        value="2,543"
        delta="9.3%"
        isPositive={true}
        sparklineData={custData}
        color="var(--color-success)"
      />

      {/* Abandoned Carts */}
      <MiniCard
        label="Abandoned Carts"
        value="1,246"
        delta="8.4%"
        isPositive={false}
        sparklineData={cartData}
        color="var(--color-danger)"
      />

      {/* Active Subscriptions */}
      <MiniCard
        label="Active Subscriptions"
        value="568"
        delta="6.2%"
        isPositive={true}
        sparklineData={subsData}
        color="var(--color-info)"
      />

      {/* Revenue Goal Card */}
      <div className="flex items-center justify-between rounded-md bg-indigo-600 p-3.5 text-white">
        <div className="flex items-center gap-3">
          {/* Circular progress */}
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 60 60" className="-rotate-90 h-full w-full">
              {/* Outer ring path */}
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.15)"
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
              {goalPercentage}%
            </div>
          </div>

          <div className="flex flex-col justify-center leading-none">
            <span className="text-[10px] font-bold tracking-wider text-indigo-100 uppercase">
              Revenue Goal
            </span>
            <span className="mt-1 text-sm font-bold tracking-tight font-mono text-white">
              ₹24.58M <span className="text-[10px] text-indigo-200 font-normal">/ ₹33M</span>
            </span>
            <span className="mt-1 text-[9px] font-semibold text-indigo-200">
              Monthly Goal
            </span>
          </div>
        </div>

        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" aria-label="Goal details">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
