import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_REGEX } from '@ecommerce/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class RegisterCustomerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @Matches(PASSWORD_REGEX, {
    message: 'Password must be at least 8 characters and include a letter and a number',
  })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CustomerLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CustomerAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(2)
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ListMyOrdersQueryDto extends PaginationQueryDto {}
