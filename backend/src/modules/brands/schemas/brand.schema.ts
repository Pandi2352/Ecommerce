import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type BrandDocument = HydratedDocument<Brand>;

@Schema(baseSchemaOptions())
export class Brand {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ trim: true })
  banner?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: false, index: true })
  isFeatured!: boolean;

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
