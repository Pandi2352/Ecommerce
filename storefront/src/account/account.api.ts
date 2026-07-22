import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';

export interface Address {
  id: string;
  label?: string;
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export type AddressInput = Omit<Address, 'id'>;

export interface MyOrderItem {
  name: string;
  sku?: string;
  variant?: Record<string, string>;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderTimelineEntry {
  status: string;
  note?: string;
  at: string;
}

export interface MyOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  items: MyOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  customer?: { name: string; email: string; phone?: string };
  shippingAddress?: Record<string, string>;
  timeline?: OrderTimelineEntry[];
}

// ── Profile ──
export const updateProfile = async (input: { name?: string; phone?: string }) =>
  (await api.patch('/storefront/account/profile', input)).data;

// ── Addresses ──
export const fetchAddresses = async (): Promise<Address[]> =>
  (await api.get<Address[]>('/storefront/account/addresses')).data;

export const addAddress = async (input: AddressInput): Promise<Address[]> =>
  (await api.post<Address[]>('/storefront/account/addresses', input)).data;

export const updateAddress = async (id: string, input: AddressInput): Promise<Address[]> =>
  (await api.patch<Address[]>(`/storefront/account/addresses/${id}`, input)).data;

export const removeAddress = async (id: string): Promise<Address[]> =>
  (await api.delete<Address[]>(`/storefront/account/addresses/${id}`)).data;

// ── Orders ──
export const fetchMyOrders = async (
  params: { page?: number; pageSize?: number } = {},
): Promise<{ data: MyOrder[]; meta: Meta }> =>
  getList<MyOrder>('/storefront/account/orders', { params });

export const fetchMyOrder = async (orderNumber: string): Promise<MyOrder> =>
  (await api.get<MyOrder>(`/storefront/account/orders/${orderNumber}`)).data;
