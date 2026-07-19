import { type LucideIcon } from 'lucide-react';

/** Tailwind color key used for an item's duotone icon (see icon-colors.ts). */
export type IconColor =
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'cyan'
  | 'fuchsia'
  | 'orange'
  | 'yellow'
  | 'teal'
  | 'blue'
  | 'green'
  | 'purple'
  | 'slate'
  | 'red'
  | 'lime';

/** A leaf link inside a submenu. */
export interface SidebarLeaf {
  label: string;
  to: string;
  badge?: string;
}

/** A top-level item — either a direct link (`to`) or a parent with `children`. */
export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  color: IconColor;
  to?: string;
  badge?: string;
  isNew?: boolean;
  isExternal?: boolean;
  children?: SidebarLeaf[];
  /** If set, the item is hidden unless the user has this permission. */
  permission?: string;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}
