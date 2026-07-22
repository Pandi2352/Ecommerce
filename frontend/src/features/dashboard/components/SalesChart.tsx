import { useEffect, useRef, useState } from 'react';
import type { SalesPoint } from '../api';

/** Round up to a "nice" axis ceiling (1/2/5 × 10ⁿ). */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 280 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 220) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const chartData = data.map((d) => ({
    date: d.label,
    revenue: d.revenue,
    lastMonth: d.prevRevenue,
  }));
  const { width, height } = dimensions;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = niceCeil(Math.max(1, ...chartData.flatMap((d) => [d.revenue, d.lastMonth])));
  const minVal = 0;
  const denom = Math.max(chartData.length - 1, 1);

  const getCoords = (val: number, index: number) => ({
    x: paddingLeft + (index / denom) * chartWidth,
    y: paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight,
  });

  const currentMonthPoints = chartData.map((d, i) => getCoords(d.revenue, i));
  const lastMonthPoints = chartData.map((d, i) => getCoords(d.lastMonth, i));

  const getCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const midX = points[i].x + (points[i + 1].x - points[i].x) / 2;
      path += ` C ${midX} ${points[i].y}, ${midX} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };

  const currentPath = getCurvePath(currentMonthPoints);
  const lastPath = getCurvePath(lastMonthPoints);

  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(maxVal * f));
  const formatYLabel = (val: number) => {
    if (val >= 1_000_000) return `₹${(val / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (val >= 1_000) return `₹${(val / 1_000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let closest = 0;
    let min = Infinity;
    currentMonthPoints.forEach((pt, i) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < min) {
        min = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
    setTooltipPos({ x: currentMonthPoints[closest].x, y: currentMonthPoints[closest].y - 10 });
  };

  // Only label a subset of x ticks to avoid crowding 14 days.
  const labelEvery = Math.ceil(chartData.length / 7);

  return (
    <div className="flex flex-col rounded-md border border-border bg-surface p-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h3 className="text-sm font-bold text-text">Revenue Overview</h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-info" />
              <span className="text-text">Last 14 days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-t border-dashed border-slate-400" />
              <span className="text-text-secondary">Prior 14 days</span>
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative mt-4 flex-1 select-none min-h-[220px]">
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          className="overflow-visible"
        >
          {yTicks.map((val) => {
            const y = paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
            return (
              <g key={val}>
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[9px] font-bold fill-text-secondary"
                >
                  {formatYLabel(val)}
                </text>
                {val !== 0 && (
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    className="opacity-60 dark:opacity-30"
                  />
                )}
              </g>
            );
          })}

          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="var(--border)"
            strokeWidth="1.5"
          />

          {chartData.map((d, i) =>
            i % labelEvery === 0 || i === chartData.length - 1 ? (
              <text
                key={d.date}
                x={currentMonthPoints[i].x}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                className="font-sans text-[9px] font-semibold fill-text-secondary"
              >
                {d.date}
              </text>
            ) : null,
          )}

          <g className="chart-fade">
            <path
              d={lastPath}
              fill="none"
              stroke="var(--color-sidebar-text)"
              strokeWidth="1.75"
              strokeDasharray="4 4"
              className="opacity-50"
            />
          </g>
          <path
            d={currentPath}
            pathLength={1}
            fill="none"
            stroke="var(--color-info)"
            strokeWidth="2"
            className="chart-line"
          />

          {hoverIndex !== null && (
            <g>
              <line
                x1={currentMonthPoints[hoverIndex].x}
                y1={paddingTop}
                x2={currentMonthPoints[hoverIndex].x}
                y2={paddingTop + chartHeight}
                stroke="var(--color-info)"
                strokeDasharray="2 2"
                className="opacity-40"
              />
              <circle
                cx={lastMonthPoints[hoverIndex].x}
                cy={lastMonthPoints[hoverIndex].y}
                r="3.5"
                fill="var(--surface)"
                stroke="var(--color-sidebar-text)"
                strokeWidth="1.5"
              />
              <circle
                cx={currentMonthPoints[hoverIndex].x}
                cy={currentMonthPoints[hoverIndex].y}
                r="4.5"
                fill="var(--color-info)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {hoverIndex !== null && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-[#111217] p-2.5 text-xs text-white pointer-events-none"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 12}px` }}
          >
            <p className="font-semibold text-slate-400 text-[10px] leading-none mb-1.5">
              {chartData[hoverIndex].date}
            </p>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-info" /> This period:
                </span>
                <span className="font-bold text-white">
                  ₹{chartData[hoverIndex].revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Prior:
                </span>
                <span className="font-bold text-slate-300">
                  ₹{chartData[hoverIndex].lastMonth.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
