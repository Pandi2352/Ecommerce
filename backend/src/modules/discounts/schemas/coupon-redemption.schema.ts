import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type CouponRedemptionDocument = HydratedDocument<CouponRedemption>;

@Schema(baseSchemaOptions())
export class CouponRedemption {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, type: String, ref: 'Coupon', index: true })
  couponId!: string;

  @Prop({ required: true, uppercase: true, trim: true, index: true })
  couponCode!: string;

  @Prop({ required: true, type: String, ref: 'User', index: true })
  userId!: string;

  @Prop({ required: true, type: String, ref: 'Order', index: true })
  orderId!: string;

  @Prop({ required: true, min: 0 })
  discountAmount!: number;

  @Prop({ type: Date, default: Date.now })
  redeemedAt!: Date;
}

export const CouponRedemptionSchema = SchemaFactory.createForClass(CouponRedemption);
