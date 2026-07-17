import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Megaphone,
  Percent,
  Globe,
  Smartphone,
  MonitorDot,
  Star,
  FileSpreadsheet,
  Brain,
  Cpu,
  Settings,
  UserCheck,
  Link,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  isNew?: boolean;
  isExternal?: boolean;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const sidebarConfig: SidebarGroup[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Overview', to: '/', icon: LayoutDashboard },
      { label: 'Analytics', to: '/analytics', icon: TrendingUp },
      { label: 'Orders', to: '/orders', icon: ShoppingBag, badge: '128' },
      { label: 'Products', to: '/products', icon: Package },
      { label: 'Categories', to: '/categories', icon: FolderTree },
      { label: 'Customers', to: '/customers', icon: Users },
      { label: 'Marketing', to: '/marketing', icon: Megaphone },
      { label: 'Discounts', to: '/discounts', icon: Percent },
    ],
  },
  {
    title: 'SALES CHANNELS',
    items: [
      { label: 'Online Store', to: '/online-store', icon: Globe, isExternal: true },
      { label: 'Mobile App', to: '/mobile-app', icon: Smartphone, isExternal: true },
      { label: 'POS Terminal', to: '/pos-terminal', icon: MonitorDot },
    ],
  },
  {
    title: 'APPS & TOOLS',
    items: [
      { label: 'Reviews', to: '/reviews', icon: Star },
      { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
      { label: 'AI Studio', to: '/ai-studio', icon: Brain, isNew: true },
      { label: 'Automation', to: '/automation', icon: Cpu },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Settings', to: '/settings', icon: Settings },
      { label: 'Users & Roles', to: '/users-roles', icon: UserCheck },
      { label: 'Integrations', to: '/integrations', icon: Link },
      { label: 'Billing', to: '/billing', icon: CreditCard },
    ],
  },
];
