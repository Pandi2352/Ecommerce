import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';

export interface CustomerAddress {
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

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  addressCount: number;
}

export interface CustomerOrderRef {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface CustomerDetail extends CustomerItem {
  addresses: CustomerAddress[];
  orders: CustomerOrderRef[];
}

export interface CustomerStats {
  total: number;
  active: number;
  newThisMonth: number;
  withOrders: number;
}

export interface CustomerListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sort?: string;
}

export const fetchCustomers = async (
  query: Partial<CustomerListQuery> = {},
): Promise<{ data: CustomerItem[]; meta: Meta }> =>
  getList<CustomerItem>('/customers', { params: query });

export const fetchCustomerStats = async (): Promise<CustomerStats> =>
  (await api.get<CustomerStats>('/customers/stats')).data;

export const fetchCustomer = async (id: string): Promise<CustomerDetail> =>
  (await api.get<CustomerDetail>(`/customers/${id}`)).data;
