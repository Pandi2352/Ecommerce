import { useState } from 'react';
import { cn } from '@/utils/cn';

const PALETTE = [
  { stroke: 'stroke-indigo-500', dot: 'bg-indigo-500' },
  { stroke: 'stroke-sky-500', dot: 'bg-sky-500' },
  { stroke: 'stroke-orange-500', dot: 'bg-orange-500' },
  { stroke: 'stroke-emerald-500', dot: 'bg-emerald-500' },
  { stroke: 'stroke-violet-500', dot: 'bg-violet-500' },
  { stroke: 'stroke-rose-500', dot: 'bg-rose-500' },
];

export function CategoryDistribution({ data }: { data: { name: string; value: number }[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const channels = data.map((d, i) => ({
    name: d.name,
    value: d.value,
    percentage: Math.round((d.value / total) * 1000) / 10,
    ...PALETTE[i % PALETTE.length],
  }));

  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">Products by Category</h3>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-between w-full gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full -rotate-90 select-none overflow-visible"
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              className="opacity-20"
            />
            <g className="chart-donut">
              {channels.map((chan, idx) => {
                const strokeLength = (chan.percentage / 100) * circumference;
                const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
                accumulatedPercent += chan.percentage;
                const isActive = activeIdx === idx;
                return (
                  <circle
                    key={chan.name}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    strokeWidth={isActive ? strokeWidth + 2 : strokeWidth}
                    className={cn(
                      'transition-all duration-250 ease-out cursor-pointer',
                      chan.stroke,
                    )}
                    strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                  />
                );
              })}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
              {activeIdx !== null ? channels[activeIdx].name : 'Products'}
            </span>
            <span className="text-lg font-bold text-text font-mono mt-0.5">
              {activeIdx !== null ? channels[activeIdx].value : total}
            </span>
          </div>
        </div>

        <div className="w-full space-y-1">
          {channels.length === 0 && (
            <p className="py-4 text-center text-xs text-text-secondary">No categories yet.</p>
          )}
          {channels.map((chan, idx) => {
            const isActive = activeIdx === idx;
            const isAnyActive = activeIdx !== null;
            return (
              <div
                key={chan.name}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1.5 transition-all duration-150',
                  isActive ? 'bg-bg' : '',
                  isAnyActive && !isActive ? 'opacity-40' : '',
                )}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', chan.dot)} />
                  <span className="text-xs font-semibold text-text truncate">{chan.name}</span>
                </div>
                <div className="flex items-center gap-2.5 font-mono text-xs shrink-0">
                  <span className="font-semibold text-text-secondary text-[10px]">
                    {chan.percentage}%
                  </span>
                  <span className="font-bold text-text">{chan.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
