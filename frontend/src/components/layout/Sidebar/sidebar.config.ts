import {
  Gauge,
  LineChart,
  Shirt,
  LayoutGrid,
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
  Settings2,
  ShieldCheck,
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
    title: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings2, color: 'slate', to: '/settings' },
      { label: 'Users & Roles', icon: ShieldCheck, color: 'red', to: '/users-roles' },
      { label: 'Billing', icon: Wallet, color: 'lime', to: '/billing' },
    ],
  },
];
