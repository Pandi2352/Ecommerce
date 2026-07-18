import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Pill } from './parts';
import type { SidebarLeaf } from './types';

/** A submenu leaf link shown in the expanded sidebar (indented, with a dot marker). */
export function SidebarLeafLink({ leaf }: { leaf: SidebarLeaf }) {
  return (
    <NavLink
      to={leaf.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md py-1.5 pl-3 pr-2 text-[12.5px] font-medium transition-colors',
          isActive ? 'text-text' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full transition-colors',
              isActive ? 'bg-sidebar-accent' : 'bg-sidebar-border',
            )}
          />
          <span className="truncate">{leaf.label}</span>
          {leaf.badge && <Pill>{leaf.badge}</Pill>}
        </>
      )}
    </NavLink>
  );
}
