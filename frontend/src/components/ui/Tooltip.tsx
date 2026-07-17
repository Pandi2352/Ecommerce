import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Lightweight CSS tooltip (hover/focus), styled to tokens — no shadow. */
export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap',
          'rounded-md border bg-surface px-2 py-1 text-xs text-text opacity-0 transition-opacity',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          className,
        )}
      >
        {label}
      </span>
    </span>
  );
}
