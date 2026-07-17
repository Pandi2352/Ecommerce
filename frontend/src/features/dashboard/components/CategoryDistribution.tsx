import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChannelData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  hoverColor: string;
  amountStr: string;
}

const channels: ChannelData[] = [
  {
    name: 'Online Store',
    value: 12420000,
    percentage: 50.6,
    color: 'stroke-indigo-500 text-indigo-500 bg-indigo-500',
    hoverColor: 'hover:stroke-indigo-400',
    amountStr: '₹12.42M',
  },
  {
    name: 'Mobile App',
    value: 6320000,
    percentage: 25.7,
    color: 'stroke-sky-500 text-sky-500 bg-sky-500',
    hoverColor: 'hover:stroke-sky-400',
    amountStr: '₹6.32M',
  },
  {
    name: 'POS Terminal',
    value: 3930000,
    percentage: 16.0,
    color: 'stroke-orange-500 text-orange-500 bg-orange-500',
    hoverColor: 'hover:stroke-orange-400',
    amountStr: '₹3.93M',
  },
  {
    name: 'Marketplace',
    value: 1910000,
    percentage: 7.7,
    color: 'stroke-emerald-500 text-emerald-500 bg-emerald-500',
    hoverColor: 'hover:stroke-emerald-400',
    amountStr: '₹1.91M',
  },
];

export function CategoryDistribution() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~314.159

  // Calculate cumulative offsets
  let accumulatedPercent = 0;

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text">Sales by Channel</h3>
        <button className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text hover:bg-bg cursor-pointer">
          <span>This Month</span>
          <ChevronDown className="h-3 w-3 text-text-secondary" />
        </button>
      </div>

      {/* Content Stack - Stacked vertically for wider text space and perfect vertical fitting */}
      <div className="mt-4 flex flex-1 flex-col items-center justify-between w-full gap-4">
        {/* SVG Donut */}
        <div className="relative h-32 w-32 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full -rotate-90 select-none overflow-visible"
          >
            {/* Background Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              className="opacity-20"
            />

            {/* Segments — group scales+fades in on mount */}
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
                      chan.color.split(' ')[0]
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

          {/* Central text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
              {activeIdx !== null ? channels[activeIdx].name : 'Total'}
            </span>
            <span className="text-base font-bold text-text font-mono mt-0.5">
              {activeIdx !== null
                ? channels[activeIdx].amountStr
                : '₹24.58M'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-1">
          {channels.map((chan, idx) => {
            const isActive = activeIdx === idx;
            const isAnyActive = activeIdx !== null;

            return (
              <div
                key={chan.name}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1.5 transition-all duration-150',
                  isActive ? 'bg-bg' : '',
                  isAnyActive && !isActive ? 'opacity-40' : ''
                )}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full shrink-0',
                      chan.color.split(' ')[2]
                    )}
                  />
                  <span className="text-xs font-semibold text-text">{chan.name}</span>
                </div>
                <div className="flex items-center gap-2.5 font-mono text-xs">
                  <span className="font-semibold text-text-secondary text-[10px]">
                    {chan.percentage}%
                  </span>
                  <span className="font-bold text-text">{chan.amountStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
