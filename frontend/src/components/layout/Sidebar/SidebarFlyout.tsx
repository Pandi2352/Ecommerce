import type { CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Pill } from './parts';
import type { SidebarItem } from './types';

interface Props {
  item: SidebarItem;
  style: CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Hover flyout for the COLLAPSED sidebar. Rendered in a portal with `fixed`
 * positioning so it escapes the sidebar's scroll clip. Leaf → label tooltip;
 * parent → submenu popover. The `pl-2` creates a hoverable bridge over the gap.
 */
export function SidebarFlyout({ item, style, onMouseEnter, onMouseLeave }: Props) {
  const hasChildren = !!item.children?.length;

  return (
    <div
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[60] pl-2"
    >
      {hasChildren ? (
        <div className="min-w-[11rem] rounded-md border border-sidebar-border bg-sidebar py-1.5">
          <div className="mb-1 border-b border-sidebar-border px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-sidebar-heading">
            {item.label}
          </div>
          <div className="px-1">
            {item.children!.map((leaf) => (
              <NavLink
                key={leaf.to}
                to={leaf.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-hover text-text'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-text',
                  )
                }
              >
                <span className="truncate">{leaf.label}</span>
                {leaf.badge && <Pill>{leaf.badge}</Pill>}
              </NavLink>
            ))}
          </div>
        </div>
      ) : (
        <div className="whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar px-2.5 py-1.5 text-[12px] font-medium text-text">
          {item.label}
        </div>
      )}
    </div>
  );
}
