import { useCallback, useEffect, useState } from 'react';
import { getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/utils/getErrorMessage';

export interface AuditLog {
  id: string;
  actor?: { id?: string; name?: string; email?: string; role?: string };
  action: string;
  method?: string;
  path?: string;
  resource?: string;
  resourceId?: string;
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

interface AuditFilters {
  page: number;
  pageSize: number;
  search: string;
}

/** Paginated audit trail (newest first), with debounced search. */
export function useAuditLogs() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, pageSize: 25, search: '' });
  const [data, setData] = useState<AuditLog[]>([]);
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
        sort: '-createdAt',
      };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getList<AuditLog>('/audit', { params });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load audit log'));
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.pageSize, debouncedSearch]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, filters, setFilters, reload };
}
