import { useCallback, useEffect, useState } from 'react';
import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/utils/getErrorMessage';

export type Role = string;
export type Status = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export type { Meta };

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

export interface UsersFilters {
  page: number;
  pageSize: number;
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

/** Paginated user list with filters (no TanStack). Search is debounced. */
export function useUsers() {
  const [filters, setFilters] = useState<UsersFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    role: '',
    status: '',
  });
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(filters.search, 300);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      const res = await getList<User>('/users', { params });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.pageSize, filters.role, filters.status, debouncedSearch]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, filters, setFilters, reload };
}
