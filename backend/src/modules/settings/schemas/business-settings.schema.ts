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

/** A single hero/banner carousel slide. */
export interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  badgeText?: string;
  isActive: boolean;
  order: number;
}

/** Storefront color & typography theme settings. */
export interface ThemeConfig {
  primaryColor?: string; // e.g. '#6366f1'
  accentColor?: string; // e.g. '#ec4899'
  buttonRadius?: string; // e.g. '10px'
  fontFamily?: string; // e.g. 'Inter' | 'Outfit' | 'Poppins'
  buttonStyle?: 'gradient' | 'solid' | 'outline';
  darkMode?: boolean;
}

/** Which homepage sections are visible on the storefront. */
export interface HomepageSections {
  showBanners?: boolean;
  showFeatured?: boolean;
  showBestSellers?: boolean;
  showCategories?: boolean;
  showDeals?: boolean;
}

/** Optional social links. */
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

/** Single-document store/business configuration (fixed `_id: 'business'`). */
@Schema(baseSchemaOptions(['s3SecretAccessKey']))
export class BusinessSettings {
  @Prop({ type: String, default: 'business' })
  _id!: string;

  // ── Store identity ──────────────────────────────────────────
  @Prop({ default: 'NovaShop' })
  storeName!: string;

  @Prop()
  legalName?: string;

  @Prop()
  tagline?: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  faviconUrl?: string;

  @Prop()
  defaultProductImageUrl?: string;

  @Prop()
  footerText?: string;

  // ── Contact ─────────────────────────────────────────────────
  @Prop()
  supportEmail?: string;

  @Prop()
  supportPhone?: string;

  @Prop({ type: Object, default: {} })
  address?: Address;

  // ── Localization ─────────────────────────────────────────────
  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ default: 'en-IN' })
  locale!: string;

  @Prop({ default: 'Asia/Kolkata' })
  timezone!: string;

  // ── Storefront Theme ─────────────────────────────────────────
  @Prop({
    type: Object,
    default: {
      primaryColor: '#6366f1',
      accentColor: '#ec4899',
      buttonRadius: '10px',
      fontFamily: 'Inter',
      buttonStyle: 'gradient',
      darkMode: false,
    },
  })
  theme?: ThemeConfig;

  // ── Hero Banners ─────────────────────────────────────────────
  @Prop({ type: Array, default: [] })
  banners?: BannerSlide[];

  // ── Homepage Section Visibility ──────────────────────────────
  @Prop({
    type: Object,
    default: {
      showBanners: true,
      showFeatured: true,
      showBestSellers: true,
      showCategories: true,
      showDeals: true,
    },
  })
  homepageSections?: HomepageSections;

  // ── Social Links ─────────────────────────────────────────────
  @Prop({ type: Object, default: {} })
  socialLinks?: SocialLinks;

  // ── Uploads / storage ────────────────────────────────────────
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
