import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CUSTOMER_ROLE, OrderStatus, UserStatus } from '@ecommerce/shared';
import { buildMeta, type PaginatedMeta } from '../../common/dto/pagination.dto';
import { buildSearchFilter } from '../../common/utils';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { ListCustomersQueryDto } from './dto/customer-list.dto';

const VOID_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
  OrderStatus.REFUNDED,
];
const money = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
  ) {}

  /** Per-customer order rollups keyed by (lowercased) email. */
  private async orderRollup(emails: string[]) {
    const rows = await this.orders.aggregate<{ _id: string; count: number; spent: number }>([
      { $match: { 'customer.email': { $in: emails } } },
      {
        $group: {
          _id: '$customer.email',
          count: { $sum: 1 },
          spent: { $sum: { $cond: [{ $in: ['$status', VOID_STATUSES] }, 0, '$total'] } },
        },
      },
    ]);
    return new Map(rows.map((r) => [r._id, r]));
  }

  async list(q: ListCustomersQueryDto): Promise<{ data: unknown[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      role: CUSTOMER_ROLE,
      ...buildSearchFilter(['name', 'email'], q.search),
    };
    if (q.status) filter.status = q.status;

    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const [total, docs] = await Promise.all([
      this.users.countDocuments(filter),
      this.users
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
    ]);

    const rollup = await this.orderRollup(docs.map((u) => u.email));
    const data = docs.map((u) => {
      const r = rollup.get(u.email);
      return {
        ...(u.toJSON() as unknown as Record<string, unknown>),
        orderCount: r?.count ?? 0,
        totalSpent: money(r?.spent ?? 0),
        addressCount: u.addresses?.length ?? 0,
      };
    });

    return { data, meta: buildMeta(total, page, pageSize) };
  }

  async stats() {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const [total, active, newThisMonth, orderEmails] = await Promise.all([
      this.users.countDocuments({ role: CUSTOMER_ROLE }),
      this.users.countDocuments({ role: CUSTOMER_ROLE, status: UserStatus.ACTIVE }),
      this.users.countDocuments({ role: CUSTOMER_ROLE, createdAt: { $gte: since } }),
      this.orders.distinct('customer.email'),
    ]);
    const withOrders = await this.users.countDocuments({
      role: CUSTOMER_ROLE,
      email: { $in: orderEmails },
    });
    return { total, active, newThisMonth, withOrders };
  }

  async getOne(id: string) {
    const user = await this.users.findOne({ _id: id, role: CUSTOMER_ROLE }).exec();
    if (!user) throw new NotFoundException('Customer not found');
    const orders = await this.orders
      .find({ 'customer.email': user.email })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
    const spent = orders
      .filter((o) => !VOID_STATUSES.includes(o.status))
      .reduce((s, o) => s + o.total, 0);
    return {
      ...(user.toJSON() as unknown as Record<string, unknown>),
      orderCount: orders.length,
      totalSpent: money(spent),
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: (o as unknown as { createdAt: Date }).createdAt,
      })),
    };
  }
}
