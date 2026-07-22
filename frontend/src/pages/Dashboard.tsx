import { DollarSign, ShoppingBag, Users, CreditCard } from 'lucide-react';
import { Alert, Skeleton } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/api';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { SalesChart } from '@/features/dashboard/components/SalesChart';
import { CategoryDistribution } from '@/features/dashboard/components/CategoryDistribution';
import { LiveActivity } from '@/features/dashboard/components/LiveActivity';
import { MiniStatsRow } from '@/features/dashboard/components/MiniStatsRow';
import { RecentOrders } from '@/features/dashboard/components/RecentOrders';
import { TopProducts } from '@/features/dashboard/components/TopProducts';
import { SalesHeatmap } from '@/features/dashboard/components/SalesHeatmap';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const pctStr = (n: number) => `${Math.abs(n)}%`;

export function Dashboard() {
  const { data, loading, error } = useDashboard();

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-md lg:col-span-6" />
          <Skeleton className="h-72 rounded-md lg:col-span-3" />
          <Skeleton className="h-72 rounded-md lg:col-span-3" />
        </div>
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  if (error || !data) {
    return <Alert>{error || 'Failed to load dashboard.'}</Alert>;
  }

  const { kpis, salesSeries } = data;
  const revSeries = salesSeries.map((s) => s.revenue);
  const ordSeries = salesSeries.map((s) => s.orders);

  return (
    <div className="space-y-6">
      {/* 1. KPI row (real data) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Revenue (30d)"
          value={inr(kpis.revenue)}
          delta={pctStr(kpis.revenueDelta)}
          isPositive={kpis.revenueDelta >= 0}
          icon={DollarSign}
          iconBgColor="bg-violet-500/10 dark:bg-violet-500/20"
          iconColor="text-violet-500 dark:text-violet-400"
          sparklineData={revSeries}
          sparklineColor="#7c3aed"
        />
        <StatsCard
          label="Orders (30d)"
          value={kpis.orders.toLocaleString('en-IN')}
          delta={pctStr(kpis.ordersDelta)}
          isPositive={kpis.ordersDelta >= 0}
          icon={ShoppingBag}
          iconBgColor="bg-sky-500/10 dark:bg-sky-500/20"
          iconColor="text-sky-500 dark:text-sky-400"
          sparklineData={ordSeries}
          sparklineColor="#0ea5e9"
        />
        <StatsCard
          label="Customers"
          value={kpis.customers.toLocaleString('en-IN')}
          delta={pctStr(kpis.customersDelta)}
          isPositive={kpis.customersDelta >= 0}
          icon={Users}
          iconBgColor="bg-emerald-500/10 dark:bg-emerald-500/20"
          iconColor="text-emerald-500 dark:text-emerald-400"
          sparklineData={revSeries}
          sparklineColor="#10b981"
        />
        <StatsCard
          label="Avg. Order Value"
          value={inr(kpis.avgOrderValue)}
          delta={pctStr(kpis.aovDelta)}
          isPositive={kpis.aovDelta >= 0}
          icon={CreditCard}
          iconBgColor="bg-teal-500/10 dark:bg-teal-500/20"
          iconColor="text-teal-500 dark:text-teal-400"
          sparklineData={revSeries}
          sparklineColor="#14b8a6"
        />
      </div>

      {/* 2. Sales chart + category donut + live activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 flex flex-col h-full">
          <SalesChart data={salesSeries} />
        </div>
        <div className="lg:col-span-3 flex flex-col h-full">
          <CategoryDistribution data={data.categoryDistribution} />
        </div>
        <div className="lg:col-span-3 flex flex-col h-full">
          <LiveActivity orders={data.recentOrders} />
        </div>
      </div>

      {/* 3. Mini stats */}
      <MiniStatsRow data={data} />

      {/* 4. Recent orders + top products + activity heatmap */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 flex flex-col h-full">
          <RecentOrders orders={data.recentOrders} />
        </div>
        <div className="lg:col-span-3 flex flex-col h-full">
          <TopProducts products={data.topProducts} />
        </div>
        <div className="lg:col-span-3 flex flex-col h-full">
          <SalesHeatmap series={salesSeries} />
        </div>
      </div>
    </div>
  );
}
