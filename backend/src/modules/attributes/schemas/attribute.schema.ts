import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ATTRIBUTE_TYPES, type AttributeType } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type AttributeDocument = HydratedDocument<Attribute>;

/** Admin-defined product field (see docs/18-product-attributes.md). */
@Schema(baseSchemaOptions())
export class Attribute {
  @Prop({ type: String, default: generateId })
  _id!: string;

  /** Stable machine key, e.g. `material`. */
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  key!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ type: String, enum: ATTRIBUTE_TYPES, default: 'text' })
  type!: AttributeType;

  /** Allowed values for select / multiselect. */
  @Prop({ type: [String], default: [] })
  options!: string[];

  @Prop()
  unit?: string;

  /** Form section, e.g. "Specs", "Care". */
  @Prop()
  group?: string;

  @Prop({ default: false })
  required!: boolean;

  /** Expose as a storefront filter later. */
  @Prop({ default: false })
  filterable!: boolean;

  /** `all` products, or only those in `categoryIds`. */
  @Prop({ type: String, enum: ['all', 'categories'], default: 'all' })
  scope!: 'all' | 'categories';

  @Prop({ type: [String], default: [] })
  categoryIds!: string[];

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const AttributeSchema = SchemaFactory.createForClass(Attribute);
