import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/utils/getErrorMessage';

export interface UseApiOptions {
  /** Fetch immediately on mount (default true). Pass false to fetch manually via `reload`. */
  immediate?: boolean;
  /** Fallback message when the request throws without a usable message. */
  errorMessage?: string;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Generic data-fetching hook — the shared replacement for the per-feature
 * `useState(data/loading/error) + reload + useEffect` boilerplate.
 *
 * The `fetcher` may be an inline arrow (it's kept in a ref, so an unstable
 * identity won't re-fetch on every render). Call `reload()` yourself when
 * inputs the fetcher closes over change (e.g. filters).
 *
 * ```ts
 * const { data, loading, error, reload } = useApi(() => fetchCategories(), {
 *   errorMessage: 'Failed to load categories',
 * });
 * ```
 */
export function useApi<T>(fetcher: () => Promise<T>, options: UseApiOptions = {}): UseApiResult<T> {
  const { immediate = true, errorMessage } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current());
    } catch (e) {
      setError(getErrorMessage(e, errorMessage));
    } finally {
      setLoading(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (immediate) void reload();
  }, [immediate, reload]);

  return { data, loading, error, reload, setData };
}
