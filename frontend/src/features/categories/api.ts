import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parent?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const fetchCategories = async (): Promise<Category[]> =>
  (await api.get<Category[]>('/categories')).data;

export const createCategory = async (input: CategoryInput): Promise<Category> =>
  (await api.post<Category>('/categories', input)).data;

export const updateCategory = async (id: string, input: CategoryInput): Promise<Category> =>
  (await api.patch<Category>(`/categories/${id}`, input)).data;

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

/** Minimal data hook (no TanStack): fetch on mount + manual reload. */
export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchCategories());
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
