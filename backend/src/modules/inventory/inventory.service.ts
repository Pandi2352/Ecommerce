import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockAdjustmentType } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { buildSearchFilter, parseSort } from '../../common/utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';
import { AdjustStockDto, ListInventoryQueryDto, ListLedgerQueryDto, TransferStockDto } from './dto/inventory.dto';
import { InventoryRecord, InventoryRecordDocument } from './schemas/inventory-record.schema';
import { StockAdjustment, StockAdjustmentDocument } from './schemas/stock-adjustment.schema';

export interface InventoryItemPayload {
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

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryRecord.name) private readonly inventoryModel: Model<InventoryRecordDocument>,
    @InjectModel(StockAdjustment.name) private readonly ledgerModel: Model<StockAdjustmentDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Warehouse.name) private readonly warehouseModel: Model<WarehouseDocument>,
  ) {}

  async list(q: ListInventoryQueryDto): Promise<{ data: InventoryItemPayload[]; meta: PaginatedMeta }> {
    const page = q.page || 1;
    const pageSize = q.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (q.warehouseId) filter.warehouseId = q.warehouseId;

    if (q.search?.trim()) {
      const searchRegex = { $regex: q.search.trim(), $options: 'i' };
      const matchedProducts = await this.productModel.find({
        $or: [{ name: searchRegex }, { sku: searchRegex }],
      }).select('_id');
      const pIds = matchedProducts.map((p) => p._id);
      filter.$or = [{ variantSku: searchRegex }, { productId: { $in: pIds } }];
    }

    const total = await this.inventoryModel.countDocuments(filter);
    const records = await this.inventoryModel
      .find(filter)
      .sort(parseSort(q.sort) || { variantSku: 1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Collect product & warehouse details
    const pIds = [...new Set(records.map((r) => r.productId))];
    const wIds = [...new Set(records.map((r) => r.warehouseId))];

    const [products, warehouses] = await Promise.all([
      this.productModel.find({ _id: { $in: pIds } }).exec(),
      this.warehouseModel.find({ _id: { $in: wIds } }).exec(),
    ]);

    const pMap = new Map(products.map((p) => [p._id, p]));
    const wMap = new Map(warehouses.map((w) => [w._id, w]));

    const data: InventoryItemPayload[] = records.map((r) => {
      const p = pMap.get(r.productId);
      const w = wMap.get(r.warehouseId);
      const available = Math.max(0, r.onHand - r.reserved);

      let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (available === 0) stockStatus = 'OUT_OF_STOCK';
      else if (available <= r.lowStockThreshold) stockStatus = 'LOW_STOCK';

      return {
        _id: r._id,
        productId: r.productId,
        productName: p?.name || 'Unknown Product',
        productImage: p?.images?.[0] || '',
        variantSku: r.variantSku,
        warehouseId: r.warehouseId,
        warehouseName: w?.name || 'Unknown Warehouse',
        warehouseCode: w?.code || 'WH',
        onHand: r.onHand,
        reserved: r.reserved,
        available,
        lowStockThreshold: r.lowStockThreshold,
        stockStatus,
      };
    });

    // Post-filter stock status if specified
    let filteredData = data;
    if (q.stockStatus) {
      filteredData = data.filter((item) => item.stockStatus === q.stockStatus);
    }

    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
      data: filteredData,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getStats(): Promise<{
    totalOnHand: number;
    totalReserved: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const records = await this.inventoryModel.find().exec();
    let totalOnHand = 0;
    let totalReserved = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const r of records) {
      totalOnHand += r.onHand;
      totalReserved += r.reserved;
      const available = r.onHand - r.reserved;
      if (available <= 0) outOfStockCount++;
      else if (available <= r.lowStockThreshold) lowStockCount++;
    }

    return { totalOnHand, totalReserved, lowStockCount, outOfStockCount };
  }

  async adjustStock(dto: AdjustStockDto, userId?: string): Promise<InventoryRecord> {
    const warehouse = await this.warehouseModel.findById(dto.warehouseId).exec();
    if (!warehouse) throw new BadRequestException('Warehouse not found');

    const product = await this.productModel.findById(dto.productId).exec();
    if (!product) throw new BadRequestException('Product not found');

    let record = await this.inventoryModel.findOne({
      variantSku: dto.variantSku.toUpperCase(),
      warehouseId: dto.warehouseId,
    });

    if (!record) {
      record = await this.inventoryModel.create({
        productId: dto.productId,
        variantSku: dto.variantSku.toUpperCase(),
        warehouseId: dto.warehouseId,
        onHand: 0,
        reserved: 0,
        lowStockThreshold: 5,
      });
    }

    const newOnHand = record.onHand + dto.quantityDelta;
    if (newOnHand < 0) {
      throw new BadRequestException(
        `Cannot reduce stock below 0. Current onHand is ${record.onHand}`,
      );
    }

    record.onHand = newOnHand;
    await record.save();

    // Log transaction ledger
    await this.ledgerModel.create({
      type: dto.type,
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      variantSku: dto.variantSku.toUpperCase(),
      quantityDelta: dto.quantityDelta,
      reason: dto.reason || 'Stock adjustment',
      adjustedBy: userId || 'System',
    });

    // Also sync back to main Product.stock if it's the primary warehouse
    if (warehouse.isPrimary) {
      await this.productModel.updateOne({ _id: dto.productId }, { $set: { stock: newOnHand } });
    }

    return record;
  }

  async transferStock(dto: TransferStockDto, userId?: string): Promise<void> {
    if (dto.sourceWarehouseId === dto.targetWarehouseId) {
      throw new BadRequestException('Source and target warehouse must be different');
    }

    // Reduce at source
    await this.adjustStock(
      {
        type: StockAdjustmentType.TRANSFER,
        warehouseId: dto.sourceWarehouseId,
        productId: dto.productId,
        variantSku: dto.variantSku,
        quantityDelta: -dto.quantity,
        reason: dto.reason || 'Inter-warehouse transfer outbound',
      },
      userId,
    );

    // Increase at target
    await this.adjustStock(
      {
        type: StockAdjustmentType.TRANSFER,
        warehouseId: dto.targetWarehouseId,
        productId: dto.productId,
        variantSku: dto.variantSku,
        quantityDelta: dto.quantity,
        reason: dto.reason || 'Inter-warehouse transfer inbound',
      },
      userId,
    );
  }

  async getLedger(q: ListLedgerQueryDto): Promise<{ data: StockAdjustmentDocument[]; meta: PaginatedMeta }> {
    const page = q.page || 1;
    const pageSize = q.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (q.warehouseId) filter.warehouseId = q.warehouseId;
    if (q.variantSku) filter.variantSku = q.variantSku.toUpperCase();
    if (q.type) filter.type = q.type;

    const total = await this.ledgerModel.countDocuments(filter);
    const data = await this.ledgerModel
      .find(filter)
      .sort(parseSort(q.sort) || { createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
