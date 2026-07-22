import { useCallback, useEffect, useState } from 'react';
import type { OrderStatus, PaymentStatus } from '@ecommerce/shared';
import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/utils/getErrorMessage';

export type { OrderStatus, PaymentStatus };

export interface OrderItem {
  productId?: string;
  name: string;
  sku?: string;
  image?: string;
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

export interface Order {
  id: string;
  orderNumber: string;
  customer: { id?: string; name: string; email: string; phone?: string };
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress?: Record<string, string>;
  timeline: OrderTimelineEntry[];
  notes?: string;
  createdAt?: string;
}

export interface OrderStats {
  total: number;
  revenue: number;
  avgOrderValue: number;
  created: number;
  delivered: number;
  cancelled: number;
  byStatus: Record<string, number>;
}

export interface OrdersFilters {
  page: number;
  pageSize: number;
  search: string;
  status: OrderStatus | '';
  paymentStatus: PaymentStatus | '';
  sort: string;
}

export const fetchOrder = (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data);
export const fetchOrderStats = () => api.get<OrderStats>('/orders/stats').then((r) => r.data);

// ── Returns (orders in RETURNED / REFUNDED) ──
export const fetchReturns = (params: { page?: number; pageSize?: number; search?: string }) =>
  getList<Order>('/orders', { params: { statuses: 'RETURNED,REFUNDED', ...params } });

// ── Abandoned carts (admin) ──
export interface AbandonedCart {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  guest: boolean;
  itemCount: number;
  lineCount: number;
  value: number;
  items: { name: string; image?: string; quantity: number; price: number }[];
  updatedAt: string;
}
export interface AbandonedStats {
  total: number;
  guest: number;
  registered: number;
  potentialRevenue: number;
}
export const fetchAbandonedCarts = (params: { page?: number; pageSize?: number }) =>
  getList<AbandonedCart>('/cart/admin/abandoned', { params });
export const fetchAbandonedStats = () =>
  api.get<AbandonedStats>('/cart/admin/abandoned/stats').then((r) => r.data);
export const updateOrderStatus = (id: string, status: OrderStatus, note?: string) =>
  api.patch<Order>(`/orders/${id}/status`, { status, note }).then((r) => r.data);
export const updateOrder = (id: string, dto: { paymentStatus?: PaymentStatus; notes?: string }) =>
  api.patch<Order>(`/orders/${id}`, dto).then((r) => r.data);

export function useOrders() {
  const [filters, setFilters] = useState<OrdersFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    paymentStatus: '',
    sort: '-createdAt',
  });
  const [data, setData] = useState<Order[]>([]);
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
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      const res = await getList<Order>('/orders', { params });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.page,
    filters.pageSize,
    filters.status,
    filters.paymentStatus,
    filters.sort,
    debouncedSearch,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, filters, setFilters, reload };
}

export function useOrderStats() {
  return useApi(fetchOrderStats, { errorMessage: 'Failed to load order stats' });
}
