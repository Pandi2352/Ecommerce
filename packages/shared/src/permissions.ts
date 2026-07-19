/** Permission catalog — each resource has a `read` and a `write` action. */

export interface PermissionResourceDef {
  key: string;
  label: string;
}

export const PERMISSION_RESOURCES: PermissionResourceDef[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'orders', label: 'Orders' },
  { key: 'customers', label: 'Customers' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles & permissions' },
  { key: 'settings', label: 'Settings' },
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
