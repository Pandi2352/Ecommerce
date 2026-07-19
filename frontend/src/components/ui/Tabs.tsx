import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
  key: string;
  label: ReactNode;
  /** Optional count badge (e.g. number of pending invites). */
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

/**
 * Underline tab nav (border-based, no shadow). Reusable across list pages that
 * need to switch views — e.g. All users / Invited.
 */
export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-border', className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative -mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-indigo-600 text-text'
                : 'border-transparent text-text-secondary hover:text-text',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                  active ? 'bg-indigo-600 text-white' : 'bg-row-hover text-text-secondary',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
