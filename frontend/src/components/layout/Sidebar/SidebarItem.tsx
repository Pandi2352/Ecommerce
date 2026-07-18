import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ItemIcon, Pill } from './parts';
import { SidebarLeafLink } from './SidebarLeafLink';
import { SidebarFlyout } from './SidebarFlyout';
import type { SidebarItem } from './types';

function useItemActive(item: SidebarItem): boolean {
  const { pathname } = useLocation();
  if (item.children?.length) {
    return item.children.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'));
  }
  if (item.to) return item.to === '/' ? pathname === '/' : pathname === item.to;
  return false;
}

const BASE_ROW = 'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors';

function rowCls(active: boolean, extra?: string) {
  return cn(
    BASE_ROW,
    active
      ? 'bg-sidebar-hover font-semibold text-text'
      : 'font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-text',
    extra,
  );
}

/** Collapsed (icon-only) item with a hover flyout: tooltip for leaves, submenu for parents. */
function CollapsedItem({ item }: { item: SidebarItem }) {
  const active = useItemActive(item);
  const to = item.to ?? item.children?.[0]?.to ?? '#';
  const anchor = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const show = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = window.setTimeout(() => setOpen(false), 90);
  };

  let style: CSSProperties | undefined;
  if (open && anchor.current) {
    const r = anchor.current.getBoundingClientRect();
    style = item.children?.length
      ? { left: r.right, top: r.top }
      : { left: r.right, top: r.top + r.height / 2, transform: 'translateY(-50%)' };
  }

  return (
    <>
      <Link
        ref={anchor}
        to={to}
        aria-label={item.label}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={rowCls(active, 'justify-center')}
      >
        <ItemIcon item={item} />
      </Link>
      {open &&
        style &&
        createPortal(
          <SidebarFlyout item={item} style={style} onMouseEnter={show} onMouseLeave={hide} />,
          document.body,
        )}
    </>
  );
}

/** A top-level sidebar item — collapsed (flyout), a direct link, or an expandable parent. */
export function SidebarItemRow({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const active = useItemActive(item);
  const hasChildren = !!item.children?.length;
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active && hasChildren) setOpen(true);
  }, [active, hasChildren]);

  if (collapsed) return <CollapsedItem item={item} />;

  // Direct link (no submenu).
  if (!hasChildren && item.to) {
    return (
      <NavLink to={item.to} end={item.to === '/'} className={rowCls(active)}>
        <ItemIcon item={item} />
        <span className="truncate">{item.label}</span>
        {item.isNew && (
          <span className="ml-auto rounded-md border border-sidebar-accent/30 bg-sidebar-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sidebar-accent">
            New
          </span>
        )}
        {item.badge && <Pill>{item.badge}</Pill>}
        {item.isExternal && <ExternalLink className="ml-auto size-3 text-sidebar-heading" />}
      </NavLink>
    );
  }

  // Parent with expandable submenu.
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className={rowCls(active, 'w-full')}>
        <ItemIcon item={item} />
        <span className="truncate">{item.label}</span>
        {item.badge && <Pill>{item.badge}</Pill>}
        <ChevronRight
          className={cn(
            'ml-1 size-3.5 shrink-0 text-sidebar-heading transition-transform',
            !item.badge && 'ml-auto',
            open && 'rotate-90',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-[22px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
            {item.children!.map((leaf) => (
              <SidebarLeafLink key={leaf.to} leaf={leaf} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
