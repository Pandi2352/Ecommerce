import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockAdjustmentType } from '@ecommerce/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AdjustStockDto {
  @IsEnum(StockAdjustmentType)
  type!: StockAdjustmentType;

  @IsString()
  warehouseId!: string;

  @IsString()
  productId!: string;

  @IsString()
  variantSku!: string;

  @IsInt()
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class TransferStockDto {
  @IsString()
  sourceWarehouseId!: string;

  @IsString()
  targetWarehouseId!: string;

  @IsString()
  productId!: string;

  @IsString()
  variantSku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ListInventoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export class ListLedgerQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  variantSku?: string;

  @IsOptional()
  @IsEnum(StockAdjustmentType)
  type?: StockAdjustmentType;
}
