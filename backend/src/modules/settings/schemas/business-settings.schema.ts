import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';

export type BusinessSettingsDocument = HydratedDocument<BusinessSettings>;

export type UploadDriver = 'local' | 's3';

interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** Single-document store/business configuration (fixed `_id: 'business'`). */
@Schema(baseSchemaOptions(['s3SecretAccessKey']))
export class BusinessSettings {
  @Prop({ type: String, default: 'business' })
  _id!: string;

  // ── Store identity ──
  @Prop({ default: 'NovaShop' })
  storeName!: string;

  @Prop()
  legalName?: string;

  @Prop()
  tagline?: string;

  @Prop()
  logoUrl?: string;

  // ── Contact ──
  @Prop()
  supportEmail?: string;

  @Prop()
  supportPhone?: string;

  @Prop({ type: Object, default: {} })
  address?: Address;

  // ── Localization ──
  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ default: 'en-IN' })
  locale!: string;

  @Prop({ default: 'Asia/Kolkata' })
  timezone!: string;

  // ── Uploads / storage ──
  @Prop({ type: String, enum: ['local', 's3'], default: 'local' })
  uploadDriver!: UploadDriver;

  @Prop()
  s3Bucket?: string;

  @Prop()
  s3Region?: string;

  @Prop()
  s3AccessKeyId?: string;

  /** Never returned in API responses (stripped) and not selected by default. */
  @Prop({ select: false })
  s3SecretAccessKey?: string;
}

export const BusinessSettingsSchema = SchemaFactory.createForClass(BusinessSettings);
