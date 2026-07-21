import { api, getList } from '@/lib/api';
import type { Meta } from '@/lib/types';
import type {
  AdjustStockInput,
  CreateWarehouseInput,
  InventoryFilterQuery,
  InventoryItem,
  InventoryStats,
  StockAdjustmentItem,
  TransferStockInput,
  UpdateWarehouseInput,
  WarehouseFilterQuery,
  WarehouseItem,
  WarehouseStats,
} from './types';

// ── Warehouses ──
export const fetchWarehouses = async (
  query: Partial<WarehouseFilterQuery> = {},
): Promise<{ data: WarehouseItem[]; meta: Meta }> => {
  return getList<WarehouseItem>('/inventory/warehouses', { params: query });
};

export const fetchWarehouseStats = async (): Promise<WarehouseStats> => {
  const res = await api.get<WarehouseStats>('/inventory/warehouses/stats');
  return res.data;
};

export const createWarehouse = async (input: CreateWarehouseInput): Promise<WarehouseItem> => {
  const res = await api.post<WarehouseItem>('/inventory/warehouses', input);
  return res.data;
};

export const updateWarehouse = async (
  id: string,
  input: UpdateWarehouseInput,
): Promise<WarehouseItem> => {
  const res = await api.patch<WarehouseItem>(`/inventory/warehouses/${id}`, input);
  return res.data;
};

export const setPrimaryWarehouse = async (id: string): Promise<WarehouseItem> => {
  const res = await api.patch<WarehouseItem>(`/inventory/warehouses/${id}/primary`);
  return res.data;
};

export const deleteWarehouse = async (id: string): Promise<{ id: string }> => {
  const res = await api.delete<{ id: string }>(`/inventory/warehouses/${id}`);
  return res.data;
};

// ── Inventory Records ──
export const fetchInventory = async (
  query: Partial<InventoryFilterQuery> = {},
): Promise<{ data: InventoryItem[]; meta: Meta }> => {
  return getList<InventoryItem>('/inventory', { params: query });
};

export const fetchInventoryStats = async (): Promise<InventoryStats> => {
  const res = await api.get<InventoryStats>('/inventory/stats');
  return res.data;
};

export const fetchLowStock = async (
  query: Partial<InventoryFilterQuery> = {},
): Promise<{ data: InventoryItem[]; meta: Meta }> => {
  return getList<InventoryItem>('/inventory/low', { params: query });
};

export const adjustStock = async (input: AdjustStockInput): Promise<InventoryItem> => {
  const res = await api.post<InventoryItem>('/inventory/adjust', input);
  return res.data;
};

export const transferStock = async (input: TransferStockInput): Promise<void> => {
  await api.post('/inventory/transfer', input);
};

export const fetchStockLedger = async (
  variantSku?: string,
): Promise<{ data: StockAdjustmentItem[]; meta: Meta }> => {
  return getList<StockAdjustmentItem>('/inventory/ledger', {
    params: { variantSku },
  });
};
