import {
  Gauge,
  LineChart,
  Shirt,
  LayoutGrid,
  SlidersHorizontal,
  PackageOpen,
  ShoppingCart,
  UsersRound,
  TicketPercent,
  Rocket,
  Star,
  Store,
  LayoutTemplate,
  PieChart,
  Sparkles,
  ShieldCheck,
  UserCog,
  ScrollText,
  KeyRound,
  UserCircle,
  Building2,
  Wallet,
} from 'lucide-react';
import type { SidebarGroup } from './types';

export const sidebarConfig: SidebarGroup[] = [
  {
    title: 'GENERAL',
    items: [
      { label: 'Overview', icon: Gauge, color: 'indigo', to: '/' },
      { label: 'Analytics', icon: LineChart, color: 'violet', to: '/analytics' },
    ],
  },
  {
    title: 'CATALOG',
    items: [
      {
        label: 'Products',
        icon: Shirt,
        color: 'rose',
        children: [
          { label: 'All Products', to: '/products' },
          { label: 'Add Product', to: '/products/new' },
          { label: 'Collections', to: '/collections' },
        ],
      },
      { label: 'Categories', icon: LayoutGrid, color: 'amber', to: '/categories' },
      { label: 'Product Fields', icon: SlidersHorizontal, color: 'violet', to: '/product-fields', permission: 'attributes.read' },
      {
        label: 'Inventory',
        icon: PackageOpen,
        color: 'emerald',
        children: [
          { label: 'Stock', to: '/inventory' },
          { label: 'Low Stock', to: '/inventory/low', badge: '7' },
          { label: 'Warehouses', to: '/inventory/warehouses' },
        ],
      },
    ],
  },
  {
    title: 'SALES',
    items: [
      {
        label: 'Orders',
        icon: ShoppingCart,
        color: 'sky',
        badge: '128',
        children: [
          { label: 'All Orders', to: '/orders' },
          { label: 'Returns', to: '/orders/returns' },
          { label: 'Abandoned Carts', to: '/orders/abandoned' },
        ],
      },
      { label: 'Customers', icon: UsersRound, color: 'cyan', to: '/customers' },
      { label: 'Discounts', icon: TicketPercent, color: 'fuchsia', to: '/discounts' },
    ],
  },
  {
    title: 'ENGAGE',
    items: [
      { label: 'Marketing', icon: Rocket, color: 'orange', to: '/marketing' },
      { label: 'Reviews', icon: Star, color: 'yellow', to: '/reviews' },
      { label: 'Online Store', icon: Store, color: 'teal', to: '/online-store', isExternal: true },
      { label: 'Pages', icon: LayoutTemplate, color: 'blue', to: '/pages' },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { label: 'Reports', icon: PieChart, color: 'green', to: '/reports' },
      { label: 'AI Studio', icon: Sparkles, color: 'purple', to: '/ai-studio', isNew: true },
    ],
  },
  {
    title: 'ACCESS CONTROL',
    items: [
      { label: 'Admin Users', icon: UserCog, color: 'red', to: '/users-roles', permission: 'users.read' },
      { label: 'Roles', icon: ShieldCheck, color: 'violet', to: '/roles', permission: 'roles.read' },
      { label: 'Permissions', icon: KeyRound, color: 'indigo', to: '/permissions', permission: 'roles.read' },
      { label: 'Audit log', icon: ScrollText, color: 'amber', to: '/audit', permission: 'audit.read' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'My Profile', icon: UserCircle, color: 'sky', to: '/profile' },
      { label: 'Business Settings', icon: Building2, color: 'emerald', to: '/settings/business', permission: 'settings.read' },
      { label: 'Billing', icon: Wallet, color: 'lime', to: '/billing' },
    ],
  },
];
