import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type PageDocument = HydratedDocument<Page>;

/**
 * A CMS content page — About, FAQ, policies and other storefront copy that a
 * non-developer edits from the admin. Rendered on the storefront at `/p/:slug`.
 */
@Schema(baseSchemaOptions())
export class Page {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, trim: true, index: true })
  title!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  /** Short summary — shown in listings / meta fallback. */
  @Prop({ trim: true })
  excerpt?: string;

  /** Rich-text body stored as sanitised HTML. */
  @Prop({ default: '' })
  body!: string;

  @Prop({ type: String, enum: ['draft', 'published'], default: 'draft', index: true })
  status!: 'draft' | 'published';

  /** Surface this page as a link in the storefront footer. */
  @Prop({ default: false, index: true })
  showInFooter!: boolean;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;
}

export const PageSchema = SchemaFactory.createForClass(Page);
