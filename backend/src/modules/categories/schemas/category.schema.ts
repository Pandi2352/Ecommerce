import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type CategoryDocument = HydratedDocument<Category>;

@Schema(baseSchemaOptions())
export class Category {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  image?: string;

  /** Parent category for unlimited nesting (null = top level). */
  @Prop({ type: String, ref: 'Category', default: null, index: true })
  parent?: string | null;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
