import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { VendorStatus } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type VendorDocument = HydratedDocument<Vendor>;

@Schema(baseSchemaOptions())
export class Vendor {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code!: string;

  @Prop({ trim: true })
  contactName?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ default: 0, min: 0, max: 100 })
  commissionRate!: number;

  @Prop({ type: String, enum: Object.values(VendorStatus), default: VendorStatus.ACTIVE, index: true })
  status!: VendorStatus;

  @Prop({ trim: true })
  notes?: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
