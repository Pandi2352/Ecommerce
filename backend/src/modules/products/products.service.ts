import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductStatus } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort, slugify } from '../../common/utils';
import { AttributesService } from '../attributes/attributes.service';
import { Product, ProductDocument } from './schemas/product.schema';
import {
  type BulkProductAction,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

const LOW_STOCK_THRESHOLD = 5;

type VariantOption = { name: string; values: string[] };
type Variant = { optionValues?: Record<string, string> };

@Injectable()
export class ProductsService extends BaseService<ProductDocument> {
  constructor(
    @InjectModel(Product.name) model: Model<ProductDocument>,
    private readonly attributes: AttributesService,
  ) {
    super(model, 'Product');
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = slugify(dto.slug || dto.name);
    await this.assertSlugFree(slug);
    await this.validateAttributes(dto.category, dto.attributes);
    this.validateVariants(dto.options, dto.variants);
    return this.model.create({ ...dto, slug });
  }

  list(q: ListProductsQueryDto): Promise<{ data: ProductDocument[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'sku'], q.search),
    };
    if (q.category) filter.category = q.category;
    if (q.brandId) filter.brandId = q.brandId;
    if (q.vendorId) filter.vendorId = q.vendorId;
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
    const current = await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!);
      await this.assertSlugFree(slug, id);
      patch.slug = slug;
    }
    if (dto.attributes !== undefined) {
      await this.validateAttributes(dto.category ?? current.category, dto.attributes);
    }
    if (dto.options !== undefined || dto.variants !== undefined) {
      this.validateVariants(dto.options ?? current.options, dto.variants ?? current.variants);
    }
    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  /** Validate a product's custom attribute values against the applicable definitions. */
  private async validateAttributes(
    categoryId: string | null | undefined,
    attributes: Record<string, unknown> = {},
  ): Promise<void> {
    const defs = await this.attributes.applicableFor(categoryId);
    const byKey = new Map(defs.map((d) => [d.key, d]));

    for (const d of defs) {
      const v = attributes[d.key];
      if (d.required && (v === undefined || v === null || v === '')) {
        throw new BadRequestException(`"${d.label}" is required`);
      }
    }

    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined || value === null || value === '') continue;
      const def = byKey.get(key);
      if (!def) throw new BadRequestException(`Unknown product field: "${key}"`);
      const bad = (msg: string) => new BadRequestException(`"${def.label}" ${msg}`);
      switch (def.type) {
        case 'select':
          if (!def.options.includes(String(value))) throw bad('has an invalid option');
          break;
        case 'multiselect':
          if (!Array.isArray(value) || !value.every((x) => def.options.includes(String(x))))
            throw bad('has invalid options');
          break;
        case 'number':
          if (typeof value !== 'number' || Number.isNaN(value)) throw bad('must be a number');
          break;
        case 'boolean':
          if (typeof value !== 'boolean') throw bad('must be true/false');
          break;
        case 'date':
          if (Number.isNaN(new Date(value as string).getTime())) throw bad('must be a valid date');
          break;
        default: // text, textarea, url
          if (typeof value !== 'string') throw bad('must be text');
      }
    }
  }

  /** Ensure every variant's option values belong to the product's declared options. */
  private validateVariants(options: VariantOption[] = [], variants: Variant[] = []): void {
    const allowed = new Map(options.map((o) => [o.name, new Set(o.values)]));
    for (const v of variants) {
      for (const [name, val] of Object.entries(v.optionValues ?? {})) {
        if (!allowed.has(name) || !allowed.get(name)!.has(val)) {
          throw new BadRequestException(`Variant option "${name}: ${val}" is not in the product's options`);
        }
      }
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findByIdOrThrow(id);
    await this.model.findByIdAndDelete(id).exec();
    return { id };
  }

  /** Apply an action to many products at once. */
  async bulk(
    ids: string[],
    action: BulkProductAction,
    status?: ProductStatus,
  ): Promise<{ affected: number }> {
    if (ids.length === 0) return { affected: 0 };
    const filter = { _id: { $in: ids } };
    if (action === 'delete') {
      const res = await this.model.deleteMany(filter).exec();
      return { affected: res.deletedCount };
    }
    const patch =
      action === 'setStatus'
        ? { status: this.requireStatus(status) }
        : { featured: action === 'feature' };
    const res = await this.model.updateMany(filter, patch).exec();
    return { affected: res.modifiedCount };
  }

  private requireStatus(status?: ProductStatus): ProductStatus {
    if (!status) throw new BadRequestException('status is required for setStatus');
    return status;
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
