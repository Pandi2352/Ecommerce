import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type CollectionDocument = HydratedDocument<Collection>;

/** One auto-collection rule, e.g. { field:'tag', operator:'eq', value:'summer' }. */
export interface CollectionCondition {
  field: 'tag' | 'brand' | 'category' | 'price' | 'featured' | 'onSale';
  operator: 'eq' | 'contains' | 'gt' | 'lt' | 'is';
  value: string;
}

/**
 * A merchandising collection — a curated group of products, separate from the
 * category taxonomy. Manual (hand-picked) or automatic (rule-matched).
 */
@Schema(baseSchemaOptions())
export class Collection {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  image?: string;

  @Prop({ type: String, enum: ['manual', 'auto'], default: 'manual', index: true })
  type!: 'manual' | 'auto';

  /** Manual collections: explicit product ids. */
  @Prop({ type: [String], default: [] })
  productIds!: string[];

  /** Auto collections: match ALL or ANY condition. */
  @Prop({ type: String, enum: ['all', 'any'], default: 'all' })
  match!: 'all' | 'any';

  @Prop({ type: [Object], default: [] })
  conditions!: CollectionCondition[];

  @Prop({ default: true, index: true })
  isActive!: boolean;

  /** Surface on the storefront homepage. */
  @Prop({ default: false, index: true })
  isFeatured!: boolean;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
