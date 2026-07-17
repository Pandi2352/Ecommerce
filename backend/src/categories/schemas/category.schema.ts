import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      if (ret.parent) ret.parent = String(ret.parent);
      delete ret._id;
    },
  },
})
export class Category {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  image?: string;

  /** Parent category for unlimited nesting (null = top level). */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', default: null, index: true })
  parent?: Types.ObjectId | null;

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
