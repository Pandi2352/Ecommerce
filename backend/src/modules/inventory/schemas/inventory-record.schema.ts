import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type InventoryRecordDocument = HydratedDocument<InventoryRecord>;

@Schema(baseSchemaOptions())
export class InventoryRecord {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, type: String, ref: 'Product', index: true })
  productId!: string;

  @Prop({ required: true, uppercase: true, trim: true, index: true })
  variantSku!: string;

  @Prop({ required: true, type: String, ref: 'Warehouse', index: true })
  warehouseId!: string;

  @Prop({ required: true, default: 0, min: 0 })
  onHand!: number;

  @Prop({ required: true, default: 0, min: 0 })
  reserved!: number;

  @Prop({ required: true, default: 5, min: 0 })
  lowStockThreshold!: number;
}

export const InventoryRecordSchema = SchemaFactory.createForClass(InventoryRecord);
InventoryRecordSchema.index({ variantSku: 1, warehouseId: 1 }, { unique: true });
