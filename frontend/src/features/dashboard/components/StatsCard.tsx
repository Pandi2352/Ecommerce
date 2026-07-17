import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  sparklineData: number[];
  sparklineColor: string;
}

export function StatsCard({
  label,
  value,
  delta,
  isPositive,
  icon: Icon,
  iconBgColor,
  iconColor,
  sparklineData,
  sparklineColor,
}: StatsCardProps) {
  // Generate SVG path for sparkline
  const width = 120;
  const height = 36;
  const padding = 2;
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min || 1;

  const points = sparklineData.map((val, index) => {
    const x = (index / (sparklineData.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return { x, y };
  });

  // Create smooth bezier curve path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 2;
    const cpY1 = points[i].y;
    const cpX2 = points[i].x + (points[i + 1].x - points[i].x) / 2;
    const cpY2 = points[i + 1].y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
  }

  // Create fill path (closing the area under the curve)
  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="flex flex-col justify-between rounded-md border border-border bg-surface p-4 transition-all hover:border-slate-350 dark:hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-text-secondary uppercase">
            {label}
          </p>
          <h3 className="mt-1.5 text-xl font-bold tracking-tight text-text font-mono">
            {value}
          </h3>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", iconBgColor)}>
          <Icon className={cn("h-4.5 w-4.5", iconColor)} />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-bold",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
          <span className="text-[10px] font-medium text-text-secondary">vs last month</span>
        </div>

        {/* Custom SVG Sparkline */}
        <div className="w-28 h-9 overflow-hidden">
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Flat translucent fill under the curve (no gradient — spec compliant) */}
            <path d={fillD} fill={sparklineColor} fillOpacity={0.1} className="chart-fade" />
            {/* Sparkline Curve — draws on mount */}
            <path
              d={pathD}
              pathLength={1}
              fill="none"
              stroke={sparklineColor}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chart-line"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
