import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductStatus } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort, slugify } from '../../common/utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  CreateCollectionDto,
  ListCollectionsQueryDto,
  UpdateCollectionDto,
} from './dto/collection.dto';
import { Collection, CollectionCondition, CollectionDocument } from './schemas/collection.schema';

export interface CollectionWithCount extends Collection {
  productCount: number;
}

@Injectable()
export class CollectionsService extends BaseService<CollectionDocument> {
  constructor(
    @InjectModel(Collection.name) model: Model<CollectionDocument>,
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
  ) {
    super(model, 'Collection');
  }

  /** Translate one auto-rule into a Mongo clause. */
  private clause(c: CollectionCondition): Record<string, unknown> | null {
    switch (c.field) {
      case 'tag':
        return { tags: c.value };
      case 'brand':
        return { brandId: c.value };
      case 'category':
        return { category: c.value };
      case 'price':
        if (c.operator === 'gt') return { price: { $gt: Number(c.value) } };
        if (c.operator === 'lt') return { price: { $lt: Number(c.value) } };
        return { price: Number(c.value) };
      case 'featured':
        return { featured: true };
      case 'onSale':
        return { $expr: { $gt: ['$compareAtPrice', '$price'] } };
      default:
        return null;
    }
  }

  /** Build the product filter that resolves a collection's membership. */
  private productFilter(
    col: Pick<Collection, 'type' | 'productIds' | 'match' | 'conditions'>,
    activeOnly: boolean,
  ): Record<string, unknown> {
    const base: Record<string, unknown> = activeOnly ? { status: ProductStatus.ACTIVE } : {};
    if (col.type === 'manual') {
      return { ...base, _id: { $in: col.productIds ?? [] } };
    }
    const clauses = (col.conditions ?? []).map((c) => this.clause(c)).filter(Boolean) as Record<
      string,
      unknown
    >[];
    if (!clauses.length) return { ...base, _id: { $in: [] } }; // auto with no rules → empty
    return { ...base, [col.match === 'any' ? '$or' : '$and']: clauses };
  }

  /** Products belonging to a collection. */
  resolveProducts(col: CollectionDocument, activeOnly: boolean, limit?: number) {
    const q = this.products.find(this.productFilter(col, activeOnly)).sort({ createdAt: -1 });
    if (limit) q.limit(limit);
    return q.exec();
  }

  private countProducts(col: CollectionDocument, activeOnly: boolean): Promise<number> {
    return this.products.countDocuments(this.productFilter(col, activeOnly)).exec();
  }

  async create(dto: CreateCollectionDto): Promise<Collection> {
    const slug = slugify(dto.slug || dto.name);
    await this.assertSlugFree(slug);
    return this.model.create({ ...dto, slug });
  }

  async update(id: string, dto: UpdateCollectionDto): Promise<Collection> {
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

  async list(
    q: ListCollectionsQueryDto,
  ): Promise<{ data: CollectionWithCount[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'slug', 'description'], q.search),
    };
    if (q.type) filter.type = q.type;
    if (q.status === 'ACTIVE') filter.isActive = true;
    if (q.status === 'INACTIVE') filter.isActive = false;

    const result = await this.paginate({
      filter,
      sort: parseSort(q.sort, { sortOrder: 1, createdAt: -1 }),
      page: q.page,
      pageSize: q.pageSize,
    });
    const data = await Promise.all(
      result.data.map(async (c) => ({
        ...(c.toJSON() as unknown as Collection),
        _id: c._id,
        productCount: await this.countProducts(c, false),
      })),
    );
    return { data: data as CollectionWithCount[], meta: result.meta };
  }

  async getOne(id: string): Promise<CollectionWithCount> {
    const col = await this.findByIdOrThrow(id);
    return {
      ...(col.toJSON() as unknown as Collection),
      _id: col._id,
      productCount: await this.countProducts(col, false),
    } as CollectionWithCount;
  }

  /** Admin preview of the products a collection currently resolves to. */
  async preview(id: string, limit = 24): Promise<ProductDocument[]> {
    const col = await this.findByIdOrThrow(id);
    return this.resolveProducts(col, false, limit);
  }

  // ── Storefront (public) ──
  listPublic() {
    return this.model.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).exec();
  }

  listFeatured(limit = 4) {
    return this.model
      .find({ isActive: true, isFeatured: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getPublicBySlug(slug: string) {
    const col = await this.model.findOne({ slug, isActive: true }).exec();
    if (!col) throw new NotFoundException('Collection not found');
    const products = await this.resolveProducts(col, true);
    return { collection: col, products };
  }

  private async assertSlugFree(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.model.findOne({ slug }).exec();
    if (existing && existing._id !== excludeId) {
      throw new ConflictException(`Collection slug "${slug}" is already in use`);
    }
  }
}
