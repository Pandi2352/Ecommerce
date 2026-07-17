import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

// Heatmap grid data (5 weeks x 7 days)
// 0: low sales -> 4: high sales
const heatmapData = [
  [1, 0, 2, 1, 3, 2, 4], // Week 1
  [0, 1, 1, 3, 2, 4, 3], // Week 2
  [2, 2, 3, 4, 4, 3, 2], // Week 3
  [1, 3, 4, 2, 3, 1, 1], // Week 4
  [2, 4, 3, 1, 2, 0, 2], // Week 5
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

// Color density classes
const densityClasses = [
  'bg-indigo-50/20 border-indigo-100/10 dark:bg-indigo-950/20 dark:border-indigo-900/10', // 0
  'bg-indigo-500/20 border-indigo-500/10 dark:bg-indigo-500/15', // 1
  'bg-indigo-500/40 border-indigo-500/20 dark:bg-indigo-500/30', // 2
  'bg-indigo-500/70 border-indigo-500/30 dark:bg-indigo-500/60', // 3
  'bg-indigo-600 border-indigo-650/40 dark:bg-indigo-500',      // 4
];

export function SalesHeatmap() {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text">Sales Heatmap</h3>
        <button className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text hover:bg-bg cursor-pointer">
          <span>This Month</span>
          <ChevronDown className="h-3 w-3 text-text-secondary" />
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <div className="min-w-[280px] space-y-2">
            
            {/* Days of Week Header */}
            <div className="grid grid-cols-[55px_repeat(7,_1fr)] gap-1 text-center">
              <div /> {/* Top-left empty spacer */}
              {daysOfWeek.map((day) => (
                <span key={day} className="text-[9px] font-bold text-text-secondary uppercase">
                  {day}
                </span>
              ))}
            </div>

            {/* Weeks and Cells */}
            {heatmapData.map((weekData, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-[55px_repeat(7,_1fr)] gap-1 items-center">
                {/* Week Label */}
                <span className="text-[10px] font-bold text-text-secondary text-left pr-2">
                  {weeks[weekIdx]}
                </span>
                
                {/* 7 Days of Cells */}
                {weekData.map((density, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      'aspect-square w-full rounded-md border transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-indigo-500/30',
                      densityClasses[density]
                    )}
                    title={`Week ${weekIdx + 1}, Day ${daysOfWeek[dayIdx]}: Level ${density}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-1.5 text-[9px] font-semibold text-text-secondary">
          <span>Low Sales</span>
          <div className="flex gap-0.5">
            {densityClasses.map((cls, idx) => (
              <div key={idx} className={cn('h-2.5 w-2.5 rounded-md border', cls)} />
            ))}
          </div>
          <span>High Sales</span>
        </div>
      </div>
    </div>
  );
}
