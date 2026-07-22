import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CollectionConditionDto {
  @IsIn(['tag', 'brand', 'category', 'price', 'featured', 'onSale'])
  field!: 'tag' | 'brand' | 'category' | 'price' | 'featured' | 'onSale';

  @IsIn(['eq', 'contains', 'gt', 'lt', 'is'])
  operator!: 'eq' | 'contains' | 'gt' | 'lt' | 'is';

  @IsString()
  value!: string;
}

export class CreateCollectionDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;

  @IsOptional() @IsIn(['manual', 'auto']) type?: 'manual' | 'auto';
  @IsOptional() @IsArray() @IsString({ each: true }) productIds?: string[];
  @IsOptional() @IsIn(['all', 'any']) match?: 'all' | 'any';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionConditionDto)
  conditions?: CollectionConditionDto[];

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
}

export class UpdateCollectionDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsIn(['manual', 'auto']) type?: 'manual' | 'auto';
  @IsOptional() @IsArray() @IsString({ each: true }) productIds?: string[];
  @IsOptional() @IsIn(['all', 'any']) match?: 'all' | 'any';
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionConditionDto)
  conditions?: CollectionConditionDto[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
}

export class ListCollectionsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['manual', 'auto']) type?: 'manual' | 'auto';
  @IsOptional() @IsString() status?: string;
}
