import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserStatus } from '@ecommerce/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsIn(['true', 'false'])
  verified?: string;
}

export class BulkUsersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @IsIn(['ban', 'restore', 'delete', 'setRole'])
  action!: 'ban' | 'restore' | 'delete' | 'setRole';

  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class SetRoleDto {
  @IsString()
  role!: string;
}
