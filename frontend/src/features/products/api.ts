import { useCallback, useEffect, useState } from 'react';
import type { ProductStatus } from '@ecommerce/shared';
import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/utils/getErrorMessage';

export type { ProductStatus };

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string | null;
  images: string[];
  status: ProductStatus;
  stock: number;
  tags: string[];
  featured: boolean;
  createdAt?: string;
}

export interface ProductInput {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string | null;
  images?: string[];
  status?: ProductStatus;
  stock?: number;
  featured?: boolean;
}

export interface ProductStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  lowStock: number;
  outOfStock: number;
}

export interface ProductsFilters {
  page: number;
  pageSize: number;
  search: string;
  category: string;
  status: ProductStatus | '';
  sort: string;
}

export const createProduct = (input: ProductInput) =>
  api.post<Product>('/products', input).then((r) => r.data);
export const updateProduct = (id: string, input: Partial<ProductInput>) =>
  api.patch<Product>(`/products/${id}`, input).then((r) => r.data);
export const deleteProduct = (id: string) => api.delete(`/products/${id}`).then(() => undefined);
export const fetchProductStats = () => api.get<ProductStats>('/products/stats').then((r) => r.data);

/** Paginated products with debounced search + category/status filters. */
export function useProducts() {
  const [filters, setFilters] = useState<ProductsFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    category: '',
    status: '',
    sort: '-createdAt',
  });
  const [data, setData] = useState<Product[]>([]);
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
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      const res = await getList<Product>('/products', { params });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.pageSize, filters.category, filters.status, filters.sort, debouncedSearch]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, filters, setFilters, reload };
}

export function useProductStats() {
  return useApi(fetchProductStats, { errorMessage: 'Failed to load product stats' });
}
