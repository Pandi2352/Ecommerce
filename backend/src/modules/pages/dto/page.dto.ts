import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreatePageDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsIn(['draft', 'published']) status?: 'draft' | 'published';
  @IsOptional() @IsBoolean() showInFooter?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
}

export class UpdatePageDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsIn(['draft', 'published']) status?: 'draft' | 'published';
  @IsOptional() @IsBoolean() showInFooter?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
}

export class ListPagesQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() status?: string;
}
