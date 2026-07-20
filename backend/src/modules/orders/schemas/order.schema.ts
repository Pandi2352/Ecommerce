import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type OrderDocument = HydratedDocument<Order>;

interface OrderItem {
  productId?: string;
  name: string;
  sku?: string;
  image?: string;
  variant?: Record<string, string>;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Address {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface TimelineEntry {
  status: string;
  note?: string;
  at: Date;
}

@Schema(baseSchemaOptions())
export class Order {
  @Prop({ type: String, default: generateId })
  _id!: string;

  /** Human-friendly, unique order number, e.g. NOVA-1042. */
  @Prop({ required: true, unique: true, index: true })
  orderNumber!: string;

  /** Customer snapshot (no customer accounts yet — storefront phase). */
  @Prop({ type: Object, required: true })
  customer!: { id?: string; name: string; email: string; phone?: string };

  @Prop({ type: [Object], default: [] })
  items!: OrderItem[];

  @Prop({ type: String, enum: Object.values(OrderStatus), default: OrderStatus.CREATED, index: true })
  status!: OrderStatus;

  @Prop({ type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true })
  paymentStatus!: PaymentStatus;

  @Prop()
  paymentMethod?: string;

  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ default: 0 })
  subtotal!: number;

  @Prop({ default: 0 })
  discount!: number;

  @Prop({ default: 0 })
  shipping!: number;

  @Prop({ default: 0 })
  tax!: number;

  @Prop({ default: 0 })
  total!: number;

  @Prop({ type: Object })
  shippingAddress?: Address;

  @Prop({ type: [Object], default: [] })
  timeline!: TimelineEntry[];

  /** Internal admin notes. */
  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
