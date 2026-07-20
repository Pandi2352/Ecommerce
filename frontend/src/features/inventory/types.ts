import type { PaginationQuery, StockAdjustmentType } from '@ecommerce/shared';

export interface WarehouseItem {
  _id: string;
  name: string;
  code: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantSku: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface InventoryStats {
  totalOnHand: number;
  totalReserved: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockAdjustmentItem {
  _id: string;
  type: StockAdjustmentType;
  warehouseId: string;
  targetWarehouseId?: string;
  productId: string;
  variantSku: string;
  quantityDelta: number;
  reason?: string;
  adjustedBy?: string;
  createdAt: string;
}

export interface InventoryFilterQuery extends PaginationQuery {
  warehouseId?: string;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export interface AdjustStockInput {
  type: StockAdjustmentType;
  warehouseId: string;
  productId: string;
  variantSku: string;
  quantityDelta: number;
  reason?: string;
}

export interface TransferStockInput {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  productId: string;
  variantSku: string;
  quantity: number;
  reason?: string;
}
