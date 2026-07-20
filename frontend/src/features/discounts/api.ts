import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import type {
  BatchGenerateCodesInput,
  CouponItem,
  CreateCouponInput,
  DiscountFilterQuery,
  DiscountStats,
  UpdateCouponInput,
  ValidateCouponInput,
  ValidateCouponResult,
} from './types';

export const fetchDiscounts = async (
  query: Partial<DiscountFilterQuery> = {},
): Promise<{ data: CouponItem[]; meta: Meta }> => {
  return getList<CouponItem>('/discounts', { params: query });
};

export const fetchDiscountStats = async (): Promise<DiscountStats> => {
  const res = await api.get<DiscountStats>('/discounts/stats');
  return res.data;
};

export const fetchDiscount = async (id: string): Promise<CouponItem> => {
  const res = await api.get<CouponItem>(`/discounts/${id}`);
  return res.data;
};

export const createDiscount = async (input: CreateCouponInput): Promise<CouponItem> => {
  const res = await api.post<CouponItem>('/discounts', input);
  return res.data;
};

export const batchGenerateDiscounts = async (
  input: BatchGenerateCodesInput,
): Promise<{ generatedCount: number; codes: string[] }> => {
  const res = await api.post<{ generatedCount: number; codes: string[] }>(
    '/discounts/batch-generate',
    input,
  );
  return res.data;
};

export const updateDiscount = async (
  id: string,
  input: UpdateCouponInput,
): Promise<CouponItem> => {
  const res = await api.patch<CouponItem>(`/discounts/${id}`, input);
  return res.data;
};

export const deleteDiscount = async (id: string): Promise<{ id: string }> => {
  const res = await api.delete<{ id: string }>(`/discounts/${id}`);
  return res.data;
};

export const validateDiscountCode = async (
  input: ValidateCouponInput,
): Promise<ValidateCouponResult> => {
  const res = await api.post<ValidateCouponResult>('/discounts/validate', input);
  return res.data;
};
