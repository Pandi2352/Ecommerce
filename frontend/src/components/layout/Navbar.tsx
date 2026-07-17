import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useSidebar } from '@/hooks/useSidebar';

/** Top bar: 64px, bottom border only (no shadow). */
export function Navbar() {
  const { theme, toggle } = useTheme();
  const { toggle: toggleSidebar } = useSidebar();

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-surface px-4">
      <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <Menu className="size-4" />
      </Button>

      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
        <input
          placeholder="Search anything…  ⌘K"
          className="h-9 w-full rounded-md border bg-bg pl-9 pr-3 text-sm text-text placeholder:text-text-secondary focus:border-info focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="sm" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <div className="ml-1 grid size-8 place-items-center rounded-md border bg-bg text-xs font-semibold text-text">
          AD
        </div>
      </div>
    </header>
  );
}
