import { BadRequestException, ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort } from '../../common/utils';
import { CreateWarehouseDto, ListWarehousesQueryDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { Warehouse, WarehouseDocument } from './schemas/warehouse.schema';

export interface WarehouseWithItemCount extends Warehouse {
  itemCount: number;
}

@Injectable()
export class WarehousesService extends BaseService<WarehouseDocument> implements OnModuleInit {
  constructor(
    @InjectModel(Warehouse.name) model: Model<WarehouseDocument>,
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

  async list(q: ListWarehousesQueryDto): Promise<{ data: Warehouse[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'code', 'contactName', 'city'], q.search),
    };

    if (q.status === 'ACTIVE') filter.isActive = true;
    if (q.status === 'INACTIVE') filter.isActive = false;

    return this.paginate({
      filter,
      sort: parseSort(q.sort) || { isPrimary: -1, name: 1 },
      page: q.page,
      pageSize: q.pageSize,
    });
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
