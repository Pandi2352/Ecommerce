import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VendorStatus } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort } from '../../common/utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateVendorDto, ListVendorsQueryDto, UpdateVendorDto } from './dto/vendor.dto';
import { Vendor, VendorDocument } from './schemas/vendor.schema';

export interface VendorWithProductCount extends Vendor {
  productCount: number;
}

@Injectable()
export class VendorsService extends BaseService<VendorDocument> {
  constructor(
    @InjectModel(Vendor.name) model: Model<VendorDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {
    super(model, 'Vendor');
  }

  async create(dto: CreateVendorDto): Promise<Vendor> {
    const code = dto.code.trim().toUpperCase();
    await this.assertCodeFree(code);
    return this.model.create({ ...dto, code });
  }

  async list(
    q: ListVendorsQueryDto,
  ): Promise<{ data: VendorWithProductCount[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'code', 'contactName', 'email'], q.search),
    };

    if (q.status && q.status !== ('ALL' as any)) {
      filter.status = q.status;
    }

    const sortSpec = parseSort(q.sort);
    const isProductCountSort = 'productCount' in sortSpec;
    const dbSort = isProductCountSort ? { createdAt: -1 as const } : sortSpec;

    const result = await this.paginate({
      filter,
      sort: dbSort,
      page: q.page,
      pageSize: q.pageSize,
    });

    // Attach product counts to vendors
    const vendorIds = result.data.map((v) => v._id);
    const productCounts = await this.productModel.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      { $group: { _id: '$vendorId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(productCounts.map((pc) => [pc._id, pc.count]));

    const data: VendorWithProductCount[] = result.data.map((vendor) => {
      const obj = vendor.toJSON ? vendor.toJSON() : (vendor as any);
      return {
        ...obj,
        productCount: countMap.get(vendor._id) || 0,
      };
    });

    if (isProductCountSort) {
      const dir = sortSpec.productCount === -1 ? -1 : 1;
      data.sort((a, b) => (a.productCount - b.productCount) * dir);
    }

    return { data, meta: result.meta };
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    totalProductsSupplied: number;
  }> {
    const [total, active, pending, totalProductsSupplied] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ status: VendorStatus.ACTIVE }),
      this.model.countDocuments({ status: VendorStatus.PENDING_APPROVAL }),
      this.productModel.countDocuments({ vendorId: { $ne: null } }),
    ]);

    return { total, active, pending, totalProductsSupplied };
  }

  async findOne(id: string): Promise<VendorWithProductCount> {
    const vendor = await this.findByIdOrThrow(id);
    const productCount = await this.productModel.countDocuments({ vendorId: id });
    const obj = vendor.toJSON ? vendor.toJSON() : (vendor as any);
    return { ...obj, productCount };
  }

  async update(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const current = await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      await this.assertCodeFree(code, id);
      patch.code = code;
    }

    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string; detachedProducts: number }> {
    const vendor = await this.findByIdOrThrow(id);
    const res = await this.productModel.updateMany({ vendorId: id }, { $set: { vendorId: null } });
    await this.model.deleteOne({ _id: vendor._id });
    return { id, detachedProducts: res.modifiedCount };
  }

  private async assertCodeFree(code: string, excludeId?: string): Promise<void> {
    const existing = await this.model.findOne({ code });
    if (existing && existing._id !== excludeId) {
      throw new ConflictException(`Vendor code "${code}" is already in use`);
    }
  }
}
