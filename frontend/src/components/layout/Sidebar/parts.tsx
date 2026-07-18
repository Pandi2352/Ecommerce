import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { ICON_COLORS } from './icon-colors';
import type { SidebarItem } from './types';

/** Small count/label pill used on items and submenu leaves. */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full border border-sidebar-accent/30 bg-sidebar-accent/10 px-1 text-[9px] font-bold text-sidebar-accent">
      {children}
    </span>
  );
}

/** Duotone icon: colored outline + faint fill of the same hue (no box/tile). */
export function ItemIcon({ item, className }: { item: SidebarItem; className?: string }) {
  const Icon = item.icon;
  return (
    <Icon
      className={cn('size-[18px] shrink-0', ICON_COLORS[item.color], className)}
      fill="currentColor"
      fillOpacity={0.16}
      strokeWidth={2}
    />
  );
}
