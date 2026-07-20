import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ATTRIBUTE_TYPES, ATTRIBUTE_KEY_REGEX, type AttributeType } from '@ecommerce/shared';

export class CreateAttributeDto {
  @IsString()
  @Matches(ATTRIBUTE_KEY_REGEX, { message: 'key must be lowercase letters, digits and underscores' })
  key!: string;

  @IsString()
  @MinLength(1)
  label!: string;

  @IsIn(ATTRIBUTE_TYPES)
  type!: AttributeType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() group?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsBoolean() filterable?: boolean;

  @IsOptional() @IsIn(['all', 'categories']) scope?: 'all' | 'categories';
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];

  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAttributeDto {
  @IsOptional() @IsString() @MinLength(1) label?: string;
  @IsOptional() @IsIn(ATTRIBUTE_TYPES) type?: AttributeType;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() group?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsBoolean() filterable?: boolean;
  @IsOptional() @IsIn(['all', 'categories']) scope?: 'all' | 'categories';
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ApplyPresetDto {
  @IsString()
  @MinLength(1)
  presetId!: string;
}
