import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductStatus } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort, slugify } from '../../common/utils';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class ProductsService extends BaseService<ProductDocument> {
  constructor(@InjectModel(Product.name) model: Model<ProductDocument>) {
    super(model, 'Product');
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = slugify(dto.slug || dto.name);
    await this.assertSlugFree(slug);
    return this.model.create({ ...dto, slug });
  }

  list(q: ListProductsQueryDto): Promise<{ data: ProductDocument[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'sku'], q.search),
    };
    if (q.category) filter.category = q.category;
    if (q.status) filter.status = q.status;
    return this.paginate({
      filter,
      sort: parseSort(q.sort),
      page: q.page,
      pageSize: q.pageSize,
    });
  }

  findOne(id: string): Promise<ProductDocument> {
    return this.findByIdOrThrow(id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!);
      await this.assertSlugFree(slug, id);
      patch.slug = slug;
    }
    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findByIdOrThrow(id);
    await this.model.findByIdAndDelete(id).exec();
    return { id };
  }

  /** Count cards for the Products page. */
  async stats(): Promise<{
    total: number;
    active: number;
    draft: number;
    archived: number;
    lowStock: number;
    outOfStock: number;
  }> {
    const [byStatus, lowStock, outOfStock, total] = await Promise.all([
      this.model.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }).exec(),
      this.model.countDocuments({ stock: 0 }).exec(),
      this.model.countDocuments().exec(),
    ]);
    const s = Object.fromEntries(byStatus.map((r) => [r._id, r.count])) as Record<string, number>;
    return {
      total,
      active: s[ProductStatus.ACTIVE] ?? 0,
      draft: s[ProductStatus.DRAFT] ?? 0,
      archived: s[ProductStatus.ARCHIVED] ?? 0,
      lowStock,
      outOfStock,
    };
  }

  private async assertSlugFree(slug: string, exceptId?: string): Promise<void> {
    const existing = await this.model.findOne({ slug }).exec();
    if (existing && String(existing._id) !== exceptId) {
      throw new ConflictException(`A product with slug "${slug}" already exists`);
    }
  }
}
