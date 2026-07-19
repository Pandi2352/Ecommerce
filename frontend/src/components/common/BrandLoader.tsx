import { cn } from '@/utils/cn';

/**
 * Unique branded loader — a rotating arc ring around a pulsing "N" mark.
 * Used for deliberate action feedback (e.g. signing in); page-level loading still
 * uses skeletons per the design system.
 */
export function BrandLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative size-12">
        <svg
          className="absolute inset-0 size-full animate-spin [animation-duration:1.4s]"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle cx="24" cy="24" r="20" stroke="var(--color-border)" strokeWidth="3" />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--color-sidebar-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="34 200"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-5 animate-pulse place-items-center rounded-md bg-indigo-600 text-[10px] font-black text-white">
            N
          </span>
        </span>
      </div>
      {label && <p className="text-xs font-medium text-text-secondary">{label}</p>}
    </div>
  );
}
