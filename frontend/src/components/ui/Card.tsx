import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Apply default `p-4` padding (default true). Set false for flush content like tables. */
  padded?: boolean;
}

/**
 * Bordered surface container — the shared version of
 * `rounded-md border border-border bg-surface p-4` used on every widget/panel.
 * No shadow (per design rules); regions are separated by the 1px border.
 */
export function Card({ className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-md border border-border bg-surface', padded && 'p-4', className)}
      {...props}
    />
  );
}
