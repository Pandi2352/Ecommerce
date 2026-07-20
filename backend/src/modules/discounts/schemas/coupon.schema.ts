import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DiscountStatus, DiscountType } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema(baseSchemaOptions())
export class Coupon {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code!: string;

  @Prop({ type: String, enum: Object.values(DiscountType), default: DiscountType.PERCENTAGE, index: true })
  type!: DiscountType;

  @Prop({ required: true, default: 0, min: 0 })
  value!: number;

  @Prop({ required: true, default: 0, min: 0 })
  minPurchaseAmount!: number;

  @Prop({ min: 0 })
  maxDiscountAmount?: number;

  @Prop({ type: [{ minSpend: Number, discountValue: Number }] })
  tierRules?: Array<{ minSpend: number; discountValue: number }>;

  @Prop({ type: { buyQty: Number, getQty: Number, getDiscountPercent: Number } })
  buyXGetYRule?: { buyQty: number; getQty: number; getDiscountPercent: number };

  @Prop({ default: false, index: true })
  isAutoApplied!: boolean;

  @Prop({ default: false })
  isStackable!: boolean;

  @Prop({ default: false })
  firstTimeUserOnly!: boolean;

  @Prop({ type: Date, index: true })
  startDate?: Date;

  @Prop({ type: Date, index: true })
  endDate?: Date;

  @Prop({ min: 1 })
  usageLimitTotal?: number;

  @Prop({ required: true, default: 1, min: 1 })
  usageLimitPerUser!: number;

  @Prop({ required: true, default: 0, min: 0 })
  usageCount!: number;

  @Prop({ type: [String], default: [] })
  applicableCategoryIds?: string[];

  @Prop({ type: [String], default: [] })
  applicableBrandIds?: string[];

  @Prop({ type: String, enum: Object.values(DiscountStatus), default: DiscountStatus.ACTIVE, index: true })
  status!: DiscountStatus;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
