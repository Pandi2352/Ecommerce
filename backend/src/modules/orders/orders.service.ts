import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, now, parseSort } from '../../common/utils';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto, ListOrdersQueryDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const VOID_STATUSES = [OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.REFUNDED];
const money = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class OrdersService extends BaseService<OrderDocument> {
  constructor(@InjectModel(Order.name) model: Model<OrderDocument>) {
    super(model, 'Order');
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const items = dto.items.map((i) => ({ ...i, subtotal: money(i.price * i.quantity) }));
    const subtotal = money(items.reduce((sum, i) => sum + i.subtotal, 0));
    const discount = dto.discount ?? 0;
    const shipping = dto.shipping ?? 0;
    const tax = dto.tax ?? 0;
    const total = money(Math.max(0, subtotal - discount + shipping + tax));
    const status = OrderStatus.CREATED;
    return this.model.create({
      orderNumber: await this.nextOrderNumber(),
      customer: dto.customer,
      items,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentStatus ?? PaymentStatus.PENDING,
      notes: dto.notes,
      status,
      timeline: [{ status, note: 'Order created', at: now() }],
    });
  }

  list(q: ListOrdersQueryDto): Promise<{ data: OrderDocument[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['orderNumber', 'customer.name', 'customer.email'], q.search),
    };
    if (q.status) filter.status = q.status;
    if (q.paymentStatus) filter.paymentStatus = q.paymentStatus;
    return this.paginate({ filter, sort: parseSort(q.sort, { createdAt: -1 }), page: q.page, pageSize: q.pageSize });
  }

  findOne(id: string): Promise<OrderDocument> {
    return this.findByIdOrThrow(id);
  }

  /** Change status and append a timeline entry (atomic). */
  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    await this.findByIdOrThrow(id);
    return (await this.model
      .findByIdAndUpdate(
        id,
        { status: dto.status, $push: { timeline: { status: dto.status, note: dto.note ?? '', at: now() } } },
        { new: true },
      )
      .exec())!;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    await this.findByIdOrThrow(id);
    return (await this.model.findByIdAndUpdate(id, dto, { new: true }).exec())!;
  }

  /** Dashboard/list stat cards: counts by status + revenue. */
  async stats(): Promise<{
    total: number;
    revenue: number;
    avgOrderValue: number;
    created: number;
    delivered: number;
    cancelled: number;
    byStatus: Record<string, number>;
  }> {
    const [byStatus, revenueAgg, total] = await Promise.all([
      this.model.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.model.aggregate<{ _id: null; revenue: number; count: number }>([
        { $match: { status: { $nin: VOID_STATUSES } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      this.model.countDocuments().exec(),
    ]);
    const s = Object.fromEntries(byStatus.map((r) => [r._id, r.count])) as Record<string, number>;
    const revenue = money(revenueAgg[0]?.revenue ?? 0);
    const revCount = revenueAgg[0]?.count ?? 0;
    return {
      total,
      revenue,
      avgOrderValue: revCount ? money(revenue / revCount) : 0,
      created: s[OrderStatus.CREATED] ?? 0,
      delivered: s[OrderStatus.DELIVERED] ?? 0,
      cancelled: VOID_STATUSES.reduce((sum, st) => sum + (s[st] ?? 0), 0),
      byStatus: s,
    };
  }

  private async nextOrderNumber(): Promise<string> {
    const count = await this.model.countDocuments().exec();
    return `NOVA-${1001 + count}`;
  }
}
