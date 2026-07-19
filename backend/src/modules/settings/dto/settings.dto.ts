import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateBusinessSettingsDto {
  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() logoUrl?: string;

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

  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() timezone?: string;

  @IsOptional() @IsIn(['local', 's3']) uploadDriver?: 'local' | 's3';
  @IsOptional() @IsString() s3Bucket?: string;
  @IsOptional() @IsString() s3Region?: string;
  @IsOptional() @IsString() s3AccessKeyId?: string;
  @IsOptional() @IsString() s3SecretAccessKey?: string;
}
