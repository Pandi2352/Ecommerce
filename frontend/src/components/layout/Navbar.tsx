import { Bell, MessageSquare, Moon, Search, Sun, BarChart2, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/AuthContext';
import { Dropdown } from '@/components/ui';

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 transition-all duration-200">
      
      {/* Welcome Greetings (Left) */}
      <div className="flex flex-col">
        <h1 className="text-base font-bold text-text flex items-center gap-1.5 leading-none">
          Good morning, John! <span className="animate-wiggle text-base">👋</span>
        </h1>
        <p className="mt-1 text-[11px] font-medium text-text-secondary">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Search Input (Center) */}
      <div className="relative mx-4 hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="Search anything..."
          className="h-9 w-full rounded-md border border-border bg-bg pl-9 pr-14 text-xs text-text placeholder:text-text-secondary focus:border-indigo-500 focus:outline-none transition-all"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-4 select-none items-center gap-0.5 rounded-md border border-border bg-surface px-1.5 font-mono text-[9px] font-medium text-text-secondary">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </div>

      {/* Right Actions Panel */}
      <div className="flex items-center gap-3">
        {/* Statistics Icon */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text transition-colors cursor-pointer" aria-label="Stats">
          <BarChart2 className="h-4.5 w-4.5" />
        </button>

        {/* Messaging Icon with Badge */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text transition-colors cursor-pointer" aria-label="Messages">
          <MessageSquare className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white ring-2 ring-surface">
            5
          </span>
        </button>

        {/* Notification Icon with Badge */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text transition-colors cursor-pointer" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-surface">
            12
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggle} 
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text transition-colors cursor-pointer" 
          aria-label="Theme toggle"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className="h-6 w-px bg-border" />

        {/* User Profile + menu */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-indigo-500/10 text-xs font-bold text-indigo-500">
                {initials}
              </span>
              <div className="hidden flex-col items-start leading-none sm:flex">
                <span className="text-xs font-semibold text-text">{user?.name ?? 'Account'}</span>
                <span className="mt-0.5 text-[9px] font-medium capitalize text-text-secondary">
                  {user?.role?.toLowerCase() ?? ''}
                </span>
              </div>
            </div>
          }
          items={[
            { label: 'Profile', onSelect: () => navigate('/settings') },
            { label: 'Sign out', onSelect: () => void logout(), danger: true },
          ]}
        />

        {/* Add New Dropdown Button */}
        <button className="flex items-center gap-1.5 rounded-md bg-indigo-650 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors cursor-pointer">
          <Plus className="h-3.5 w-3.5" />
          <span>Add New</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>
    </header>
  );
}
