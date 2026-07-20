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
  metaTitle?: string;
  metaDescription?: string;
  productCount?: number;
  createdAt?: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parent?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export const fetchCategories = async (): Promise<Category[]> =>
  (await api.get<Category[]>('/categories')).data;

export const fetchCategoryTree = async (): Promise<CategoryNode[]> =>
  (await api.get<CategoryNode[]>('/categories', { params: { tree: 'true' } })).data;

export const createCategory = async (input: CategoryInput): Promise<Category> =>
  (await api.post<Category>('/categories', input)).data;

export const updateCategory = async (id: string, input: CategoryInput): Promise<Category> =>
  (await api.patch<Category>(`/categories/${id}`, input)).data;

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

export const reorderCategory = async (id: string, direction: 'up' | 'down'): Promise<void> => {
  await api.patch(`/categories/${id}/move`, { direction });
};

/** Minimal data hook (no TanStack): fetch on mount + manual reload. */
export function useCategories() {
  const { data, ...rest } = useApi(fetchCategories, { errorMessage: 'Failed to load categories' });
  return { data: data ?? [], ...rest };
}

export function useCategoryTree() {
  const { data, ...rest } = useApi(fetchCategoryTree, { errorMessage: 'Failed to load categories' });
  return { data: data ?? [], ...rest };
}
