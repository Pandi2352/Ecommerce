// Public surface of the roles feature. Other features import from here, never
// from './api' or internal files directly.
export { RolesPage } from './RolesPage';
export { useRoles, fetchRoles, createRole, updateRole, deleteRole } from './api';
export type { Role, RoleInput } from './api';
