import { DollarSign, ShoppingBag, Users, TrendingUp, CreditCard } from 'lucide-react';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { SalesChart } from '@/features/dashboard/components/SalesChart';
import { CategoryDistribution } from '@/features/dashboard/components/CategoryDistribution';
import { LiveActivity } from '@/features/dashboard/components/LiveActivity';
import { MiniStatsRow } from '@/features/dashboard/components/MiniStatsRow';
import { RecentOrders } from '@/features/dashboard/components/RecentOrders';
import { TopProducts } from '@/features/dashboard/components/TopProducts';
import { SalesHeatmap } from '@/features/dashboard/components/SalesHeatmap';

export function Dashboard() {
  return (
    <div className="space-y-6">
      
      {/* 1. Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          label="Total Revenue"
          value="₹24,58,980"
          delta="18.2%"
          isPositive={true}
          icon={DollarSign}
          iconBgColor="bg-violet-500/10 dark:bg-violet-500/20"
          iconColor="text-violet-500 dark:text-violet-400"
          sparklineData={[10, 14, 18, 12, 20, 24, 28, 22, 26, 32]}
          sparklineColor="#7c3aed"
        />
        <StatsCard
          label="Orders"
          value="8,643"
          delta="12.4%"
          isPositive={true}
          icon={ShoppingBag}
          iconBgColor="bg-sky-500/10 dark:bg-sky-500/20"
          iconColor="text-sky-500 dark:text-sky-400"
          sparklineData={[5, 12, 10, 15, 18, 14, 22, 20, 26, 28]}
          sparklineColor="#0ea5e9"
        />
        <StatsCard
          label="Customers"
          value="6,324"
          delta="8.7%"
          isPositive={true}
          icon={Users}
          iconBgColor="bg-emerald-500/10 dark:bg-emerald-500/20"
          iconColor="text-emerald-500 dark:text-emerald-400"
          sparklineData={[8, 10, 15, 12, 16, 20, 18, 22, 24, 25]}
          sparklineColor="#10b981"
        />
        <StatsCard
          label="Conversion Rate"
          value="3.24%"
          delta="2.1%"
          isPositive={true}
          icon={TrendingUp}
          iconBgColor="bg-orange-500/10 dark:bg-orange-500/20"
          iconColor="text-orange-500 dark:text-orange-400"
          sparklineData={[15, 12, 18, 16, 20, 14, 18, 22, 19, 21]}
          sparklineColor="#f97316"
        />
        <StatsCard
          label="Avg. Order Value"
          value="₹2,847"
          delta="6.8%"
          isPositive={true}
          icon={CreditCard}
          iconBgColor="bg-teal-500/10 dark:bg-teal-500/20"
          iconColor="text-teal-500 dark:text-teal-400"
          sparklineData={[22, 20, 24, 21, 26, 28, 25, 27, 29, 30]}
          sparklineColor="#14b8a6"
        />
      </div>

      {/* 2. Middle Row (Sales Chart, Channel Donut, Live Activity Feed) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full">
          <SalesChart />
        </div>
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full">
          <CategoryDistribution />
        </div>
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full">
          <LiveActivity />
        </div>
      </div>

      {/* 3. Bottom Row 1 (Mini Stats Cards + Revenue Goal Card) */}
      <MiniStatsRow />

      {/* 4. Bottom Row 2 (Recent Orders Table, Top Selling Products, Sales Heatmap) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full">
          <RecentOrders />
        </div>
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full">
          <TopProducts />
        </div>
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full">
          <SalesHeatmap />
        </div>
      </div>

    </div>
  );
}
