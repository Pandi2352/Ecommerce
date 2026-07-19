import { useCallback, useEffect, useState } from 'react';
import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
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
  // Set while status = INVITED
  invitedAt?: string;
  inviteExpiresAt?: string;
  invitedBy?: string;
}

export interface UsersFilters {
  page: number;
  pageSize: number;
  search: string;
  role: string;
  status: Status | '';
  verified: '' | 'true' | 'false';
  sort: string;
}

export interface UserStats {
  total: number;
  active: number;
  invited: number;
  banned: number;
  suspended: number;
  deleted: number;
  verified: number;
  unverified: number;
  byRole: Array<{ role: string; count: number }>;
}

export type BulkAction = 'ban' | 'restore' | 'delete' | 'setRole';

export const setUserRole = (id: string, role: string) =>
  api.patch(`/users/${id}/role`, { role }).then(() => undefined);
export const banUser = (id: string) => api.post(`/users/${id}/ban`).then(() => undefined);
export const restoreUser = (id: string) => api.post(`/users/${id}/restore`).then(() => undefined);
export const deleteUser = (id: string) => api.delete(`/users/${id}`).then(() => undefined);

/** Returns the set-password link (useful for copy when SMTP isn't configured). */
export const inviteUser = (input: { name: string; email: string; role: string }) =>
  api.post<{ link: string }>('/auth/invite', input).then((r) => r.data);

export const reinviteUser = (id: string) =>
  api.post<{ link: string }>(`/auth/reinvite/${id}`).then((r) => r.data);

export const revokeInvite = (id: string) =>
  api.delete(`/auth/invite/${id}`).then(() => undefined);

export const resendVerification = (id: string) =>
  api.post(`/auth/resend-verification/${id}`).then(() => undefined);

export const bulkUsers = (ids: string[], action: BulkAction, role?: string) =>
  api.post<{ affected: number }>('/users/bulk', { ids, action, role }).then((r) => r.data);

export const fetchUserStats = () => api.get<UserStats>('/users/stats').then((r) => r.data);

/** Paginated user list with filters (no TanStack). Search is debounced. */
export function useUsers() {
  const [filters, setFilters] = useState<UsersFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    role: '',
    status: '',
    verified: '',
    sort: '-createdAt',
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
        sort: filters.sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.verified) params.verified = filters.verified;
      const res = await getList<User>('/users', { params });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.page,
    filters.pageSize,
    filters.role,
    filters.status,
    filters.verified,
    filters.sort,
    debouncedSearch,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, filters, setFilters, reload };
}

/** Count of pending invites — drives the "Invited" tab badge. */
export function useInvitedCount() {
  return useApi(
    async () => (await getList<User>('/users', { params: { status: 'INVITED', pageSize: 1 } })).meta.total,
    { errorMessage: 'Failed to load invite count' },
  );
}

/** Aggregate counts for the Users page stat cards. */
export function useUserStats() {
  return useApi(fetchUserStats, { errorMessage: 'Failed to load stats' });
}
