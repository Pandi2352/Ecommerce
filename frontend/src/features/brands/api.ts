import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import type {
  BrandFilterQuery,
  BrandItem,
  BrandStats,
  CreateBrandInput,
  UpdateBrandInput,
} from './types';

export const fetchBrands = async (
  query: Partial<BrandFilterQuery> = {},
): Promise<{ data: BrandItem[]; meta: Meta }> => {
  const res = await getList<BrandItem>('/brands', { params: query });
  return res;
};

export const fetchBrandStats = async (): Promise<BrandStats> => {
  const res = await api.get<BrandStats>('/brands/stats');
  return res.data;
};

export const fetchBrand = async (id: string): Promise<BrandItem> => {
  const res = await api.get<BrandItem>(`/brands/${id}`);
  return res.data;
};

export const createBrand = async (input: CreateBrandInput): Promise<BrandItem> => {
  const res = await api.post<BrandItem>('/brands', input);
  return res.data;
};

export const updateBrand = async (id: string, input: UpdateBrandInput): Promise<BrandItem> => {
  const res = await api.patch<BrandItem>(`/brands/${id}`, input);
  return res.data;
};

export const deleteBrand = async (id: string): Promise<{ id: string; detachedProducts: number }> => {
  const res = await api.delete<{ id: string; detachedProducts: number }>(`/brands/${id}`);
  return res.data;
};
