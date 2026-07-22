import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export interface DashboardKpis {
  revenue: number;
  revenueDelta: number;
  orders: number;
  ordersDelta: number;
  customers: number;
  customersDelta: number;
  avgOrderValue: number;
  aovDelta: number;
}

export interface SalesPoint {
  label: string;
  revenue: number;
  orders: number;
  prevRevenue: number;
}

export interface DashboardRecentOrder {
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface DashboardTopProduct {
  name: string;
  qty: number;
  revenue: number;
  image?: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  salesSeries: SalesPoint[];
  ordersByStatus: Record<string, number>;
  categoryDistribution: { name: string; value: number }[];
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  counts: {
    totalProducts: number;
    activeProducts: number;
    lowStock: number;
    totalOrders: number;
    newCustomers30d: number;
  };
}

export const fetchDashboard = async (): Promise<DashboardData> =>
  (await api.get<DashboardData>('/dashboard/overview')).data;

export function useDashboard() {
  return useApi(fetchDashboard, { errorMessage: 'Failed to load dashboard' });
}
