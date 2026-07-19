import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type StatTone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';

const tones: Record<StatTone, { chip: string; value: string; wave: string; ring: string }> = {
  indigo: { chip: 'bg-indigo-500/10 text-indigo-500', value: 'text-indigo-500', wave: 'text-indigo-500', ring: 'hover:border-indigo-500/50' },
  emerald: { chip: 'bg-emerald-500/10 text-emerald-600', value: 'text-emerald-600', wave: 'text-emerald-500', ring: 'hover:border-emerald-500/50' },
  amber: { chip: 'bg-amber-500/10 text-amber-600', value: 'text-amber-600', wave: 'text-amber-500', ring: 'hover:border-amber-500/50' },
  rose: { chip: 'bg-rose-500/10 text-rose-600', value: 'text-rose-600', wave: 'text-rose-500', ring: 'hover:border-rose-500/50' },
  sky: { chip: 'bg-sky-500/10 text-sky-600', value: 'text-sky-600', wave: 'text-sky-500', ring: 'hover:border-sky-500/50' },
  violet: { chip: 'bg-violet-500/10 text-violet-600', value: 'text-violet-600', wave: 'text-violet-500', ring: 'hover:border-violet-500/50' },
  slate: { chip: 'bg-slate-500/10 text-slate-500', value: 'text-text', wave: 'text-slate-400', ring: 'hover:border-border' },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  hint?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Count card: label + colored icon chip on top, big colored value, and a
 * decorative tone-colored wave along the bottom. Border-based, no shadow;
 * color is meaningful (status/role counts).
 */
export function StatCard({ label, value, icon, tone = 'indigo', hint, active, onClick, className }: StatCardProps) {
  const t = tones[tone];
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'relative w-full overflow-hidden rounded-md border border-border bg-surface p-4 text-left transition-colors',
        onClick && cn('cursor-pointer', t.ring),
        active && 'border-indigo-500 bg-indigo-500/5',
        className,
      )}
    >
      {/* decorative wave */}
      <svg
        className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-9 w-full opacity-[0.10]', t.wave)}
        viewBox="0 0 400 48"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 26 C 60 8, 120 40, 200 24 C 280 10, 340 40, 400 22 L400 48 L0 48 Z"
          fill="currentColor"
        />
      </svg>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className="mt-0.5 truncate text-xs font-medium text-text-secondary">{label}</span>
        {icon && <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', t.chip)}>{icon}</span>}
      </div>
      <div className={cn('relative z-10 mt-2 text-2xl font-bold leading-none', t.value)}>{value}</div>
      {hint && <div className="relative z-10 mt-1 truncate text-[11px] text-text-secondary">{hint}</div>}
    </Comp>
  );
}
