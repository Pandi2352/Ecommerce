import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { sidebarNav } from './sidebar.config';
import { useSidebar } from '@/hooks/useSidebar';

/** Graphite sidebar. Active item is a white pill with black text. */
export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-text',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-sm font-bold text-black">
          E
        </div>
        {!collapsed && <span className="text-sm font-semibold text-white">Ecommerce</span>}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {sidebarNav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-white font-medium text-black'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
