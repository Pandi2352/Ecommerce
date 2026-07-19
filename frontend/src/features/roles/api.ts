import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isDefault: boolean;
}

export interface RoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export const fetchRoles = () => api.get<Role[]>('/roles').then((r) => r.data);
export const createRole = (input: RoleInput) => api.post<Role>('/roles', input).then((r) => r.data);
export const updateRole = (id: string, input: Partial<RoleInput>) =>
  api.patch<Role>(`/roles/${id}`, input).then((r) => r.data);
export const deleteRole = (id: string) => api.delete(`/roles/${id}`).then(() => undefined);
export const setDefaultRole = (id: string) =>
  api.patch<Role>(`/roles/${id}/default`).then((r) => r.data);

/** Fetch roles (used by the Roles page and by role selects on the Users page). */
export function useRoles() {
  const { data, ...rest } = useApi(fetchRoles, { errorMessage: 'Failed to load roles' });
  return { data: data ?? [], ...rest };
}
