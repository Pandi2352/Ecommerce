import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@ecommerce/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListCustomersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
