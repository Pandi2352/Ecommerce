import { BadRequestException, ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort } from '../../common/utils';
import {
  InventoryRecord,
  InventoryRecordDocument,
} from '../inventory/schemas/inventory-record.schema';
import {
  CreateWarehouseDto,
  ListWarehousesQueryDto,
  UpdateWarehouseDto,
} from './dto/warehouse.dto';
import { Warehouse, WarehouseDocument } from './schemas/warehouse.schema';

export interface WarehouseWithItemCount extends Warehouse {
  itemCount: number;
  totalOnHand: number;
}

export interface WarehouseStats {
  total: number;
  active: number;
  inactive: number;
  primary: string | null;
}

@Injectable()
export class WarehousesService extends BaseService<WarehouseDocument> implements OnModuleInit {
  constructor(
    @InjectModel(Warehouse.name) model: Model<WarehouseDocument>,
    @InjectModel(InventoryRecord.name)
    private readonly inventoryModel: Model<InventoryRecordDocument>,
  ) {
    super(model, 'Warehouse');
  }

  async onModuleInit() {
    // Seed default main warehouse if none exist
    const count = await this.model.countDocuments();
    if (count === 0) {
      await this.model.create({
        name: 'Main Fulfilment Center',
        code: 'WH-MAIN',
        contactName: 'Operations Team',
        email: 'ops@nova.shop',
        address: '100 Fulfilment Hub Blvd, Logistics Park',
        isPrimary: true,
        isActive: true,
      });
    }
  }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const code = dto.code.trim().toUpperCase();
    await this.assertCodeFree(code);

    if (dto.isPrimary) {
      await this.model.updateMany({}, { $set: { isPrimary: false } });
    }

    const warehouse = await this.model.create({ ...dto, code });

    // If it's the first warehouse, ensure it's primary
    const totalCount = await this.model.countDocuments();
    if (totalCount === 1) {
      warehouse.isPrimary = true;
      await warehouse.save();
    }

    return warehouse;
  }

  async findById(id: string): Promise<Warehouse> {
    return this.findByIdOrThrow(id);
  }

  async list(
    q: ListWarehousesQueryDto,
  ): Promise<{ data: WarehouseWithItemCount[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'code', 'contactName', 'address'], q.search),
    };

    if (q.status === 'ACTIVE') filter.isActive = true;
    if (q.status === 'INACTIVE') filter.isActive = false;

    const result = await this.paginate({
      filter,
      sort: parseSort(q.sort, { isPrimary: -1, name: 1 }),
      page: q.page,
      pageSize: q.pageSize,
    });

    // Attach per-warehouse inventory counts (distinct SKUs + total units on hand).
    const ids = result.data.map((w) => w._id);
    const agg = await this.inventoryModel.aggregate<{
      _id: string;
      itemCount: number;
      totalOnHand: number;
    }>([
      { $match: { warehouseId: { $in: ids } } },
      { $group: { _id: '$warehouseId', itemCount: { $sum: 1 }, totalOnHand: { $sum: '$onHand' } } },
    ]);
    const byId = new Map(agg.map((a) => [a._id, a]));

    const data: WarehouseWithItemCount[] = result.data.map((w) => {
      const obj = (w.toJSON ? w.toJSON() : w) as Warehouse;
      const stats = byId.get(w._id);
      // toJSON exposes `id` and drops `_id`; re-add `_id` so the admin UI (which
      // keys/edits/deletes rows by `_id`, like the /inventory payload) works.
      return {
        ...obj,
        _id: w._id,
        itemCount: stats?.itemCount ?? 0,
        totalOnHand: stats?.totalOnHand ?? 0,
      };
    });

    return { data, meta: result.meta };
  }

  async getStats(): Promise<WarehouseStats> {
    const [total, active, primaryDoc] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ isActive: true }),
      this.model.findOne({ isPrimary: true }).exec(),
    ]);
    return { total, active, inactive: total - active, primary: primaryDoc?.name ?? null };
  }

  async setPrimary(id: string): Promise<Warehouse> {
    const warehouse = await this.findByIdOrThrow(id);
    if (!warehouse.isActive) {
      throw new BadRequestException('Inactive warehouse cannot be marked as primary');
    }
    await this.model.updateMany({}, { $set: { isPrimary: false } });
    warehouse.isPrimary = true;
    return (await warehouse.save())!;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const current = await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      await this.assertCodeFree(code, id);
      patch.code = code;
    }

    if (dto.isPrimary) {
      await this.model.updateMany({ _id: { $ne: id } }, { $set: { isPrimary: false } });
    }

    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string }> {
    const warehouse = await this.findByIdOrThrow(id);
    if (warehouse.isPrimary) {
      throw new BadRequestException('Cannot delete the primary warehouse');
    }
    // Block deletion while the warehouse still holds stock; otherwise clean up
    // any zeroed inventory rows so we don't orphan them.
    const [{ onHand = 0 } = {}] = await this.inventoryModel.aggregate<{ onHand: number }>([
      { $match: { warehouseId: id } },
      { $group: { _id: null, onHand: { $sum: '$onHand' } } },
    ]);
    if (onHand > 0) {
      throw new BadRequestException(
        `Cannot delete warehouse "${warehouse.name}" — it still holds ${onHand} unit(s) of stock. Transfer or remove stock first.`,
      );
    }
    await this.inventoryModel.deleteMany({ warehouseId: id });
    await this.model.deleteOne({ _id: warehouse._id });
    return { id };
  }

  private async assertCodeFree(code: string, excludeId?: string): Promise<void> {
    const existing = await this.model.findOne({ code });
    if (existing && existing._id !== excludeId) {
      throw new ConflictException(`Warehouse code "${code}" is already in use`);
    }
  }
}
