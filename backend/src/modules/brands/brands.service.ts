import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort, slugify } from '../../common/utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateBrandDto, ListBrandsQueryDto, UpdateBrandDto } from './dto/brand.dto';
import { Brand, BrandDocument } from './schemas/brand.schema';

export interface BrandWithProductCount extends Brand {
  productCount: number;
}

@Injectable()
export class BrandsService extends BaseService<BrandDocument> {
  constructor(
    @InjectModel(Brand.name) model: Model<BrandDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {
    super(model, 'Brand');
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const slug = slugify(dto.slug || dto.name);
    await this.assertSlugFree(slug);
    return this.model.create({ ...dto, slug });
  }

  async list(
    q: ListBrandsQueryDto,
  ): Promise<{ data: BrandWithProductCount[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'slug', 'description'], q.search),
    };

    if (q.status === 'ACTIVE') filter.isActive = true;
    if (q.status === 'INACTIVE') filter.isActive = false;
    if (q.featured === 'true') filter.isFeatured = true;
    else if (q.featured === 'false') filter.isFeatured = false;

    const sortSpec = parseSort(q.sort);
    const isProductCountSort = 'productCount' in sortSpec;
    const dbSort = isProductCountSort ? { createdAt: -1 as const } : sortSpec;

    const result = await this.paginate({
      filter,
      sort: dbSort,
      page: q.page,
      pageSize: q.pageSize,
    });

    // Attach product counts to brands
    const brandIds = result.data.map((b) => b._id);
    const productCounts = await this.productModel.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(productCounts.map((pc) => [pc._id, pc.count]));

    const data: BrandWithProductCount[] = result.data.map((brand) => {
      const obj = brand.toJSON ? brand.toJSON() : (brand as any);
      return {
        ...obj,
        productCount: countMap.get(brand._id) || 0,
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
    featured: number;
    totalProductsAttached: number;
  }> {
    const [total, active, featured, totalProductsAttached] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ isActive: true }),
      this.model.countDocuments({ isFeatured: true }),
      this.productModel.countDocuments({ brandId: { $ne: null } }),
    ]);

    return { total, active, featured, totalProductsAttached };
  }

  async findOne(id: string): Promise<BrandWithProductCount> {
    const brand = await this.findByIdOrThrow(id);
    const productCount = await this.productModel.countDocuments({ brandId: id });
    const obj = brand.toJSON ? brand.toJSON() : (brand as any);
    return { ...obj, productCount };
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const current = await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };

    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!);
      await this.assertSlugFree(slug, id);
      patch.slug = slug;
    }

    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string; detachedProducts: number }> {
    const brand = await this.findByIdOrThrow(id);
    // Unset brandId on any associated products
    const res = await this.productModel.updateMany({ brandId: id }, { $set: { brandId: null } });
    await this.model.deleteOne({ _id: brand._id });
    return { id, detachedProducts: res.modifiedCount };
  }

  private async assertSlugFree(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.model.findOne({ slug });
    if (existing && existing._id !== excludeId) {
      throw new ConflictException(`Brand slug "${slug}" is already in use`);
    }
  }
}
