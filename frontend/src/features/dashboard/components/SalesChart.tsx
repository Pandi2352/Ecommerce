import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DataPoint {
  date: string;
  revenue: number;
  lastMonth: number;
}

const mockData: DataPoint[] = [
  { date: 'May 01', revenue: 600000, lastMonth: 750000 },
  { date: 'May 06', revenue: 950000, lastMonth: 700000 },
  { date: 'May 11', revenue: 850000, lastMonth: 1200000 },
  { date: 'May 16', revenue: 1450000, lastMonth: 1050000 },
  { date: 'May 21', revenue: 1250000, lastMonth: 1400000 },
  { date: 'May 26', revenue: 1900000, lastMonth: 1300000 },
  { date: 'May 31', revenue: 2458980, lastMonth: 1850000 },
];

export function SalesChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 280 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 220),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = 2500000; // Match image ₹2.5M
  const minVal = 0;

  // Convert data points to chart coordinates
  const getCoords = (val: number, index: number) => {
    const x = paddingLeft + (index / (mockData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y };
  };

  const currentMonthPoints = mockData.map((d, i) => getCoords(d.revenue, i));
  const lastMonthPoints = mockData.map((d, i) => getCoords(d.lastMonth, i));

  // Build SVG Path
  const getCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cpY1 = points[i].y;
      const cpX2 = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cpY2 = points[i + 1].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };

  const currentPath = getCurvePath(currentMonthPoints);
  const lastPath = getCurvePath(lastMonthPoints);

  // Y-Axis Ticks
  const yTicks = [2500000, 2000000, 1500000, 1000000, 500000, 0];
  const formatYLabel = (val: number) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(1).replace('.0', '')}M`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Find closest index
    let closestIndex = 0;
    let minDistance = Infinity;

    currentMonthPoints.forEach((pt, index) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    setHoverIndex(closestIndex);

    // Calculate tooltip coordinates
    const pt = currentMonthPoints[closestIndex];
    setTooltipPos({
      x: pt.x,
      y: pt.y - 10,
    });
  };

  return (
    <div className="flex flex-col rounded-md border border-border bg-surface p-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h3 className="text-sm font-bold text-text">Revenue Overview</h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-text">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-slate-400 border-t border-dashed" />
              <span className="text-text-secondary">Revenue (Last Month)</span>
            </div>
          </div>
        </div>
        
        <button className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text hover:bg-bg cursor-pointer">
          <span>This Month</span>
          <ChevronDown className="h-3 w-3 text-text-secondary" />
        </button>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="relative mt-4 flex-1 select-none">
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          className="overflow-visible"
        >
          {/* Horizontal Gridlines & Y-Axis Labels */}
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
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="opacity-60 dark:opacity-30"
                  />
                )}
              </g>
            );
          })}

          {/* Bottom solid line (X Axis) */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="var(--border)"
            strokeWidth="1.5"
          />

          {/* X-Axis Labels */}
          {mockData.map((d, i) => {
            const { x } = currentMonthPoints[i];
            const y = paddingTop + chartHeight + 18;
            return (
              <text
                key={d.date}
                x={x}
                y={y}
                textAnchor="middle"
                className="font-sans text-[9px] font-semibold fill-text-secondary"
              >
                {d.date}
              </text>
            );
          })}

          {/* Lines */}
          {/* Last Month Line (dashed) — fades in */}
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

          {/* Current Month Line — draws left-to-right on mount */}
          <path
            d={currentPath}
            pathLength={1}
            fill="none"
            stroke="var(--color-info)"
            strokeWidth="2"
            className="chart-line"
          />

          {/* Interactive Hover Indicators */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical Guide Line */}
              <line
                x1={currentMonthPoints[hoverIndex].x}
                y1={paddingTop}
                x2={currentMonthPoints[hoverIndex].x}
                y2={paddingTop + chartHeight}
                stroke="var(--color-info)"
                strokeWidth="1"
                strokeDasharray="2 2"
                className="opacity-40"
              />

              {/* Last Month Circle Marker */}
              <circle
                cx={lastMonthPoints[hoverIndex].x}
                cy={lastMonthPoints[hoverIndex].y}
                r="3.5"
                fill="var(--surface)"
                stroke="var(--color-sidebar-text)"
                strokeWidth="1.5"
              />

              {/* Current Month Circle Marker */}
              <circle
                cx={currentMonthPoints[hoverIndex].x}
                cy={currentMonthPoints[hoverIndex].y}
                r="4.5"
                fill="var(--color-info)"
                stroke="var(--surface)"
                strokeWidth="2"
                className=""
              />
            </g>
          )}
        </svg>

        {/* Custom HTML Tooltip overlaid on canvas */}
        {hoverIndex !== null && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-[#111217] p-2.5 text-xs text-white pointer-events-none"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`,
            }}
          >
            <p className="font-semibold text-slate-400 text-[10px] leading-none mb-1.5">
              {mockData[hoverIndex].date}, 2025
            </p>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  This Month:
                </span>
                <span className="font-bold text-white">
                  ₹{mockData[hoverIndex].revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  Last Month:
                </span>
                <span className="font-bold text-slate-350">
                  ₹{mockData[hoverIndex].lastMonth.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
