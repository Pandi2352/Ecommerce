import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId!: string;

  @IsString()
  variantSku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  isSavedForLater?: boolean;
}

export class ApplyCartCouponDto {
  @IsString()
  code!: string;
}

export class UpdateCartOptionsDto {
  @IsOptional()
  @IsBoolean()
  isGiftWrap?: boolean;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}

export class MergeCartDto {
  @IsString()
  guestId!: string;
}
