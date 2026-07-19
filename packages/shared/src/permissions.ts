/** Permission catalog — each resource has a `read` and a `write` action. */

export interface PermissionResourceDef {
  key: string;
  label: string;
  /** What this area covers — shown on the Permissions reference page. */
  description: string;
}

export const PERMISSION_RESOURCES: PermissionResourceDef[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'The admin dashboard and its summary metrics.' },
  { key: 'products', label: 'Products', description: 'The product catalog — items, pricing, media and stock.' },
  { key: 'categories', label: 'Categories', description: 'Product categories and their nesting.' },
  { key: 'inventory', label: 'Inventory', description: 'Stock levels, warehouses and adjustments.' },
  { key: 'orders', label: 'Orders', description: 'Customer orders, fulfilment, returns and refunds.' },
  { key: 'customers', label: 'Customers', description: 'Customer accounts, addresses and activity.' },
  { key: 'marketing', label: 'Marketing', description: 'Campaigns, deals and marketing tools.' },
  { key: 'discounts', label: 'Discounts', description: 'Coupons, discounts and promotional pricing.' },
  { key: 'reviews', label: 'Reviews', description: 'Product reviews and moderation.' },
  { key: 'reports', label: 'Reports', description: 'Reports, analytics and data exports.' },
  { key: 'users', label: 'Users', description: 'Admin & staff accounts and invitations.' },
  { key: 'roles', label: 'Roles & permissions', description: 'Roles and the permissions granted to them.' },
  { key: 'audit', label: 'Audit log', description: 'The trail of every admin action.' },
  { key: 'settings', label: 'Settings', description: 'Store settings and configuration.' },
];

export type PermissionAction = 'read' | 'write';

/** A permission key, e.g. `products.write`. */
export type Permission = string;

export const permission = (resource: string, action: PermissionAction): Permission =>
  `${resource}.${action}`;

/** Every permission in the catalog. */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_RESOURCES.flatMap((r) => [
  permission(r.key, 'read'),
  permission(r.key, 'write'),
]);

/** The system super-admin role name — always has every permission and can't be edited/deleted. */
export const SUPER_ADMIN_ROLE = 'Super Admin';

/** The storefront shopper role — customers, NOT staff. Excluded from admin user management. */
export const CUSTOMER_ROLE = 'Customer';

/** True if a permission set satisfies the required permission (write implies read on the same resource). */
export function hasPermission(granted: Permission[], required: Permission): boolean {
  if (granted.includes(required)) return true;
  // write grants read on the same resource
  if (required.endsWith('.read')) {
    const write = required.replace(/\.read$/, '.write');
    return granted.includes(write);
  }
  return false;
}
