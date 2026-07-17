import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { sidebarConfig } from './sidebar.config';
import { useSidebar } from '@/hooks/useSidebar';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        'relative z-20 flex h-full flex-col !border-r !border-[#2b2f38] bg-[#111217] text-slate-450 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        "relative flex h-16 items-center !border-b !border-[#2b2f38]/60",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 font-bold text-white">
            <span className="text-lg tracking-wider font-extrabold">N</span>
          </div>
          {/* Logo text - hide on collapsed */}
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-white">NovaShop</span>
          )}
        </div>
        
        {/* Toggle Button - positioned absolute so it overflows the border cleanly */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-5 z-35 flex h-6.5 w-6.5 items-center justify-center rounded-full !border !border-[#2b2f38] bg-[#111217] text-slate-400 hover:text-white hover:!border-slate-600 transition-all duration-200 cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {sidebarConfig.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2.5 text-[9px] font-bold tracking-wider text-slate-500">
                {group.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center rounded-md px-2.5 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer',
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:bg-[#1a1b22] hover:text-white',
                        collapsed ? 'justify-center' : 'justify-between'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-violet-500/10 px-1 text-[9px] font-bold text-violet-400 !border !border-violet-500/20">
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 !border !border-indigo-500/30">
                            New
                          </span>
                        )}
                        {item.isExternal && (
                          <ExternalLink className="h-3 w-3 text-slate-650 group-hover:text-slate-450 transition-colors" />
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
