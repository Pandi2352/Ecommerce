import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CUSTOMER_ROLE, OrderStatus, ProductStatus } from '@ecommerce/shared';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';

const DAY = 86_400_000;
const VOID_STATUSES = [OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.REFUNDED];
const money = (n: number) => Math.round(n * 100) / 100;
const pct = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? 100 : 0;

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Category.name) private readonly categories: Model<CategoryDocument>,
  ) {}

  async overview() {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * DAY);
    const d60 = new Date(now.getTime() - 60 * DAY);

    const [
      kpis,
      salesSeries,
      ordersByStatus,
      categoryDistribution,
      recentOrders,
      topProducts,
      counts,
    ] = await Promise.all([
      this.kpis(now, d30, d60),
      this.salesSeries(now),
      this.ordersByStatus(),
      this.categoryDistribution(),
      this.recentOrders(),
      this.topProducts(),
      this.counts(d30),
    ]);

    return {
      kpis,
      salesSeries,
      ordersByStatus,
      categoryDistribution,
      recentOrders,
      topProducts,
      counts,
    };
  }

  /** Revenue / orders / customers / AOV — current 30d vs previous 30d. */
  private async kpis(now: Date, d30: Date, d60: Date) {
    const window = async (from: Date, to: Date) => {
      const [rev] = await this.orders.aggregate<{ revenue: number; count: number }>([
        { $match: { createdAt: { $gte: from, $lt: to }, status: { $nin: VOID_STATUSES } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      const orders = await this.orders.countDocuments({ createdAt: { $gte: from, $lt: to } });
      const customers = await this.users.countDocuments({
        role: CUSTOMER_ROLE,
        createdAt: { $gte: from, $lt: to },
      });
      return { revenue: rev?.revenue ?? 0, netCount: rev?.count ?? 0, orders, customers };
    };

    const cur = await window(d30, now);
    const prev = await window(d60, d30);
    const totalCustomers = await this.users.countDocuments({ role: CUSTOMER_ROLE });
    const aovCur = cur.netCount ? cur.revenue / cur.netCount : 0;
    const aovPrev = prev.netCount ? prev.revenue / prev.netCount : 0;

    return {
      revenue: money(cur.revenue),
      revenueDelta: pct(cur.revenue, prev.revenue),
      orders: cur.orders,
      ordersDelta: pct(cur.orders, prev.orders),
      customers: totalCustomers,
      customersDelta: pct(cur.customers, prev.customers),
      avgOrderValue: money(aovCur),
      aovDelta: pct(aovCur, aovPrev),
    };
  }

  /** 14-day daily revenue vs the prior 14 days (index-aligned) for the sales chart. */
  private async salesSeries(now: Date) {
    const start = new Date(now.getTime() - 27 * DAY);
    const rows = await this.orders.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { createdAt: { $gte: start }, status: { $nin: VOID_STATUSES } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
    ]);
    const byDay = new Map(rows.map((r) => [r._id, r]));
    const days: { key: string; label: string }[] = [];
    for (let i = 27; i >= 0; i--) {
      const dt = new Date(now.getTime() - i * DAY);
      days.push({
        key: dt.toISOString().slice(0, 10),
        label: `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`,
      });
    }
    const prev = days.slice(0, 14);
    const cur = days.slice(14);
    return cur.map((d, i) => ({
      label: d.label,
      revenue: money(byDay.get(d.key)?.revenue ?? 0),
      orders: byDay.get(d.key)?.orders ?? 0,
      prevRevenue: money(byDay.get(prev[i].key)?.revenue ?? 0),
    }));
  }

  private async ordersByStatus(): Promise<Record<string, number>> {
    const rows = await this.orders.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  }

  /** Product count per top category (donut). */
  private async categoryDistribution() {
    const rows = await this.products.aggregate<{ _id: string | null; value: number }>([
      { $group: { _id: '$category', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]);
    const cats = await this.categories.find().select('name').exec();
    const name = new Map(cats.map((c) => [String(c._id), c.name]));
    return rows
      .map((r) => ({
        name: r._id ? (name.get(r._id) ?? 'Other') : 'Uncategorized',
        value: r.value,
      }))
      .slice(0, 6);
  }

  private async recentOrders() {
    const rows = await this.orders.find().sort({ createdAt: -1 }).limit(6).exec();
    return rows.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.customer?.name ?? 'Guest',
      total: o.total,
      status: o.status,
      createdAt: (o as unknown as { createdAt: Date }).createdAt,
    }));
  }

  /** Best sellers by revenue from order line items. */
  private async topProducts() {
    return this.orders.aggregate([
      { $match: { status: { $nin: VOID_STATUSES } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          image: { $first: '$items.image' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: '$_id', qty: 1, revenue: 1, image: 1 } },
    ]);
  }

  private async counts(d30: Date) {
    const [totalProducts, activeProducts, lowStock, totalOrders, newCustomers30d] =
      await Promise.all([
        this.products.countDocuments(),
        this.products.countDocuments({ status: ProductStatus.ACTIVE }),
        this.products.countDocuments({ status: ProductStatus.ACTIVE, stock: { $lte: 5 } }),
        this.orders.countDocuments(),
        this.users.countDocuments({ role: CUSTOMER_ROLE, createdAt: { $gte: d30 } }),
      ]);
    return { totalProducts, activeProducts, lowStock, totalOrders, newCustomers30d };
  }
}
