import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

export interface RoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export const createRole = (input: RoleInput) => api.post<Role>('/roles', input).then((r) => r.data);
export const updateRole = (id: string, input: Partial<RoleInput>) =>
  api.patch<Role>(`/roles/${id}`, input).then((r) => r.data);
export const deleteRole = (id: string) => api.delete(`/roles/${id}`).then(() => undefined);

/** Fetch roles (used by the Roles page and by role selects on the Users page). */
export function useRoles() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData((await api.get<Role[]>('/roles')).data);
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
