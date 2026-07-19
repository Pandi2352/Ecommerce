import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

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
  const { data, ...rest } = useApi(fetchCategories, { errorMessage: 'Failed to load categories' });
  return { data: data ?? [], ...rest };
}
