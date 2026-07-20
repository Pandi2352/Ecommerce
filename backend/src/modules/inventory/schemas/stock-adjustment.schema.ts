import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { StockAdjustmentType } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type StockAdjustmentDocument = HydratedDocument<StockAdjustment>;

@Schema(baseSchemaOptions())
export class StockAdjustment {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ type: String, enum: Object.values(StockAdjustmentType), required: true, index: true })
  type!: StockAdjustmentType;

  @Prop({ required: true, type: String, ref: 'Warehouse', index: true })
  warehouseId!: string;

  @Prop({ type: String, ref: 'Warehouse' })
  targetWarehouseId?: string;

  @Prop({ required: true, type: String, ref: 'Product', index: true })
  productId!: string;

  @Prop({ required: true, uppercase: true, trim: true, index: true })
  variantSku!: string;

  @Prop({ required: true })
  quantityDelta!: number;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true, index: true })
  adjustedBy?: string;
}

export const StockAdjustmentSchema = SchemaFactory.createForClass(StockAdjustment);
