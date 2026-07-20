import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiscountStatus, DiscountType } from '@ecommerce/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class TierRuleDto {
  @IsNumber()
  @Min(0)
  minSpend!: number;

  @IsNumber()
  @Min(0)
  discountValue!: number;
}

export class BuyXGetYRuleDto {
  @IsInt()
  @Min(1)
  buyQty!: number;

  @IsInt()
  @Min(1)
  getQty!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  getDiscountPercent!: number;
}

export class CreateCouponDto {
  @IsString()
  code!: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierRuleDto)
  tierRules?: TierRuleDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BuyXGetYRuleDto)
  buyXGetYRule?: BuyXGetYRuleDto;

  @IsOptional()
  @IsBoolean()
  isAutoApplied?: boolean;

  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @IsOptional()
  @IsBoolean()
  firstTimeUserOnly?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableBrandIds?: string[];

  @IsOptional()
  @IsEnum(DiscountStatus)
  status?: DiscountStatus;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsBoolean()
  isAutoApplied?: boolean;

  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @IsOptional()
  @IsBoolean()
  firstTimeUserOnly?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsEnum(DiscountStatus)
  status?: DiscountStatus;
}

export class BatchGenerateCodesDto {
  @IsInt()
  @Min(1)
  @Max(500)
  count!: number;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CartItemSnapshotDto {
  @IsString()
  productId!: string;

  @IsString()
  variantSku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;
}

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsNumber()
  @Min(0)
  cartSubtotal!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemSnapshotDto)
  cartItems?: CartItemSnapshotDto[];
}

export class ListDiscountsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @IsOptional()
  @IsEnum(DiscountStatus)
  status?: DiscountStatus;
}
