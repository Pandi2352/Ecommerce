import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type Role = string;
export type Status = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: Status;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UsersFilters {
  page: number;
  search: string;
  role: string;
  status: Status | '';
}

export const setUserRole = (id: string, role: string) =>
  api.patch(`/users/${id}/role`, { role }).then(() => undefined);
export const banUser = (id: string) => api.post(`/users/${id}/ban`).then(() => undefined);
export const restoreUser = (id: string) => api.post(`/users/${id}/restore`).then(() => undefined);
export const deleteUser = (id: string) => api.delete(`/users/${id}`).then(() => undefined);

export const inviteUser = (input: { name: string; email: string; role: string }) =>
  api.post('/auth/invite', input).then(() => undefined);

/** Paginated user list with filters (no TanStack). */
export function useUsers() {
  const [filters, setFilters] = useState<UsersFilters>({ page: 1, search: '', role: '', status: '' });
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page: filters.page, pageSize: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      const res = await api.get<User[]>('/users', { params });
      setData(res.data);
      setMeta((res as unknown as { meta: Meta }).meta);
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, filters, setFilters, reload };
}
