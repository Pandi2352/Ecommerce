import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ProductStatus } from '@ecommerce/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { IsUuidId } from '../../../common/decorators/is-uuid-id.decorator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsUuidId()
  category?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  /** Custom attribute values, validated server-side against the definitions. */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  /** Variant option axes, e.g. [{ name:'Size', values:['S','M'] }]. */
  @IsOptional()
  @IsArray()
  options?: { name: string; values: string[] }[];

  /** Generated variant matrix (per-SKU price/stock). */
  @IsOptional()
  @IsArray()
  variants?: Array<{
    sku?: string;
    optionValues: Record<string, string>;
    price: number;
    stock: number;
    image?: string;
    barcode?: string;
    isActive?: boolean;
  }>;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsUuidId()
  category?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  /** Custom attribute values, validated server-side against the definitions. */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  /** Variant option axes, e.g. [{ name:'Size', values:['S','M'] }]. */
  @IsOptional()
  @IsArray()
  options?: { name: string; values: string[] }[];

  /** Generated variant matrix (per-SKU price/stock). */
  @IsOptional()
  @IsArray()
  variants?: Array<{
    sku?: string;
    optionValues: Record<string, string>;
    price: number;
    stock: number;
    image?: string;
    barcode?: string;
    isActive?: boolean;
  }>;
}

export type BulkProductAction = 'delete' | 'setStatus' | 'feature' | 'unfeature';

export class BulkProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @IsIn(['delete', 'setStatus', 'feature', 'unfeature'])
  action!: BulkProductAction;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class ListProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
