import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilterQuery,
  VendorItem,
  VendorStats,
} from './types';

export const fetchVendors = async (
  query: Partial<VendorFilterQuery> = {},
): Promise<{ data: VendorItem[]; meta: Meta }> => {
  const res = await getList<VendorItem>('/vendors', { params: query });
  return res;
};

export const fetchVendorStats = async (): Promise<VendorStats> => {
  const res = await api.get<VendorStats>('/vendors/stats');
  return res.data;
};

export const fetchVendor = async (id: string): Promise<VendorItem> => {
  const res = await api.get<VendorItem>(`/vendors/${id}`);
  return res.data;
};

export const createVendor = async (input: CreateVendorInput): Promise<VendorItem> => {
  const res = await api.post<VendorItem>('/vendors', input);
  return res.data;
};

export const updateVendor = async (id: string, input: UpdateVendorInput): Promise<VendorItem> => {
  const res = await api.patch<VendorItem>(`/vendors/${id}`, input);
  return res.data;
};

export const deleteVendor = async (
  id: string,
): Promise<{ id: string; detachedProducts: number }> => {
  const res = await api.delete<{ id: string; detachedProducts: number }>(`/vendors/${id}`);
  return res.data;
};
