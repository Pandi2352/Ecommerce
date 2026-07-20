import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutCustomerDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
}

class CheckoutItemDto {
  @IsString() productId!: string;
  @IsOptional() @IsObject() variant?: Record<string, string>;
  @IsInt() @Min(1) quantity!: number;
}

export class CheckoutDto {
  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer!: CheckoutCustomerDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsOptional() @IsObject() shippingAddress?: Record<string, string>;
  @IsOptional() @IsString() paymentMethod?: string;
}
