import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type CartDocument = HydratedDocument<Cart>;

@Schema()
export class CartItem {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, type: String, ref: 'Product', index: true })
  productId!: string;

  @Prop({ required: true, uppercase: true, trim: true, index: true })
  variantSku!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  image?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 1, default: 1 })
  quantity!: number;

  @Prop({ default: false })
  isSavedForLater!: boolean;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema(baseSchemaOptions())
export class Cart {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ type: String, ref: 'User', index: true })
  userId?: string;

  @Prop({ type: String, index: true })
  guestId?: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: CartItem[];

  @Prop({
    type: {
      code: String,
      discountAmount: Number,
      type: String,
    },
  })
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    type: string;
  };

  @Prop({ default: false })
  isGiftWrap!: boolean;

  @Prop({ trim: true })
  deliveryNotes?: string;

  @Prop({
    type: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      giftWrapFee: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    default: { subtotal: 0, discount: 0, shipping: 0, tax: 0, giftWrapFee: 0, total: 0 },
  })
  totals!: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    giftWrapFee: number;
    total: number;
  };

  @Prop({ type: Date, index: { expires: '30d' } })
  expiresAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
