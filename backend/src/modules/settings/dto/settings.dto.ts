import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Nested DTOs ────────────────────────────────────────────────────────────

export class ThemeConfigDto {
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsString() buttonRadius?: string;
  @IsOptional() @IsString() fontFamily?: string;
  @IsOptional() @IsIn(['gradient', 'solid', 'outline']) buttonStyle?:
    'gradient' | 'solid' | 'outline';
  @IsOptional() @IsBoolean() darkMode?: boolean;
}

export class BannerSlideDto {
  @IsOptional() @IsString() id?: string;
  @IsString() imageUrl!: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() ctaText?: string;
  @IsOptional() @IsString() ctaLink?: string;
  @IsOptional() @IsString() badgeText?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() order?: number;
}

export class HomepageSectionsDto {
  @IsOptional() @IsBoolean() showBanners?: boolean;
  @IsOptional() @IsBoolean() showFeatured?: boolean;
  @IsOptional() @IsBoolean() showBestSellers?: boolean;
  @IsOptional() @IsBoolean() showCategories?: boolean;
  @IsOptional() @IsBoolean() showDeals?: boolean;
}

export class SocialLinksDto {
  @IsOptional() @IsString() facebook?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() youtube?: string;
  @IsOptional() @IsString() linkedin?: string;
}

// ── Main DTO ───────────────────────────────────────────────────────────────

export class UpdateBusinessSettingsDto {
  // Identity
  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() faviconUrl?: string;
  @IsOptional() @IsString() defaultProductImageUrl?: string;
  @IsOptional() @IsString() footerText?: string;

  // Contact
  @IsOptional() @IsString() supportEmail?: string;
  @IsOptional() @IsString() supportPhone?: string;

  @IsOptional()
  @IsObject()
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  // Localization
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() timezone?: string;

  // Storefront Theme
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  theme?: ThemeConfigDto;

  // Hero Banners
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerSlideDto)
  banners?: BannerSlideDto[];

  // Homepage Sections
  @IsOptional()
  @ValidateNested()
  @Type(() => HomepageSectionsDto)
  homepageSections?: HomepageSectionsDto;

  // Social Links
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  // Storage
  @IsOptional() @IsIn(['local', 's3']) uploadDriver?: 'local' | 's3';
  @IsOptional() @IsString() s3Bucket?: string;
  @IsOptional() @IsString() s3Region?: string;
  @IsOptional() @IsString() s3AccessKeyId?: string;
  @IsOptional() @IsString() s3SecretAccessKey?: string;
}
