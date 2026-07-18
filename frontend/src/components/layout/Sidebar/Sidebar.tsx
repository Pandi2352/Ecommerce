import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { storeConfig } from '@/config/store.config';
import { useSidebar } from '@/hooks/useSidebar';
import { sidebarConfig } from './sidebar.config';
import { SidebarItemRow } from './SidebarItem';

/** Theme-aware sidebar: light in light mode, graphite in dark; collapsible with flyout submenus. */
export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        'relative z-20 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'relative flex h-16 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <div className="flex items-center gap-2.5 group/logo cursor-pointer">
          <div className="relative flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.25)] group-hover/logo:scale-105 transition-all duration-300">
            {/* Pulsing Gradient Layer */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 opacity-90 group-hover/logo:animate-pulse" />
            
            {/* Animated Rotating Outer dash ring */}
            <svg className="absolute inset-0 h-full w-full select-none overflow-visible" viewBox="0 0 34 34">
              <circle
                cx="17"
                cy="17"
                r="15"
                fill="none"
                stroke="url(#sidebar-logo-grad)"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                className="origin-center"
                style={{ animation: 'spin 12s linear infinite' }}
              />
              <defs>
                <linearGradient id="sidebar-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>

            {/* Letter N */}
            <span className="relative z-10 text-xs font-black tracking-wider text-white select-none">
              N
            </span>
            
            {/* Glowing dot */}
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
          </div>
          {!collapsed && (
            <span className="bg-gradient-to-r from-text to-text/80 bg-clip-text text-sm font-extrabold tracking-tight text-transparent transition-all group-hover/logo:text-indigo-500 dark:from-white dark:to-slate-350">
              {storeConfig.name}
            </span>
          )}
        </div>

        <button
          onClick={toggle}
          className="absolute -right-3 top-5 z-30 grid size-6 place-items-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-text transition-colors hover:text-text cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
        {sidebarConfig.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2 text-[10px] font-bold tracking-wider text-sidebar-heading">
                {group.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarItemRow key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
