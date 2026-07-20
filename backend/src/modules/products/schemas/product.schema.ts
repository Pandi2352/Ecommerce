import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProductStatus } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type ProductDocument = HydratedDocument<Product>;

@Schema(baseSchemaOptions())
export class Product {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ trim: true, index: true })
  sku?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  /** Optional "was" price for showing a discount. */
  @Prop({ min: 0 })
  compareAtPrice?: number;

  /** Reference to a Category document (UUID string), or null. */
  @Prop({ type: String, ref: 'Category', default: null, index: true })
  category?: string | null;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: String, enum: Object.values(ProductStatus), default: ProductStatus.DRAFT, index: true })
  status!: ProductStatus;

  @Prop({ default: 0, min: 0 })
  stock!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: false })
  featured!: boolean;

  // ── Custom attributes (validated against AttributeDefinitions) ──
  @Prop({ type: Object, default: {} })
  attributes!: Record<string, unknown>;

  // ── Variant options + generated matrix (docs/18 §4) ──
  @Prop({ type: [Object], default: [] })
  options!: { name: string; values: string[] }[];

  @Prop({ type: [Object], default: [] })
  variants!: Array<{
    id?: string;
    sku?: string;
    optionValues: Record<string, string>;
    price: number;
    stock: number;
    image?: string;
    barcode?: string;
    isActive?: boolean;
  }>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
