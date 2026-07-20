import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { slugify } from '../../common/utils';
import { BaseService } from '../../common/services/base.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export interface CategoryNode extends Record<string, unknown> {
  id: string;
  productCount: number;
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService extends BaseService<CategoryDocument> {
  constructor(
    @InjectModel(Category.name) model: Model<CategoryDocument>,
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
  ) {
    super(model, 'Category');
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    await this.assertSlugFree(slug);
    return this.model.create({ ...dto, slug });
  }

  /** Raw docs, sorted for hierarchy building. */
  findAll(): Promise<CategoryDocument[]> {
    return this.model.find().sort({ sortOrder: 1, name: 1 }).exec();
  }

  /** Flat list with product counts (used by the product form + admin). */
  async list(): Promise<Array<Record<string, unknown>>> {
    const [all, counts] = await Promise.all([this.findAll(), this.productCounts()]);
    return all.map((c) => ({
      ...(c.toJSON() as unknown as Record<string, unknown>),
      productCount: counts[String(c._id)] ?? 0,
    }));
  }

  /** Nested tree with product counts. */
  async tree(): Promise<CategoryNode[]> {
    const [all, counts] = await Promise.all([this.findAll(), this.productCounts()]);
    const byId = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    for (const c of all) {
      const node = c.toJSON() as unknown as CategoryNode;
      node.children = [];
      node.productCount = counts[node.id] ?? 0;
      byId.set(node.id, node);
    }
    for (const node of byId.values()) {
      const parentId = node.parent ? String(node.parent) : null;
      if (parentId && byId.has(parentId)) byId.get(parentId)!.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  findOne(id: string): Promise<CategoryDocument> {
    return this.findByIdOrThrow(id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findByIdOrThrow(id);
    if (dto.parent) {
      if (dto.parent === id) throw new BadRequestException('A category cannot be its own parent');
      const descendants = await this.descendantIds(id);
      if (descendants.has(dto.parent)) {
        throw new BadRequestException('Cannot move a category under one of its own descendants');
      }
    }
    const patch: Record<string, unknown> = { ...dto };
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!);
      await this.assertSlugFree(slug, id);
      patch.slug = slug;
    }
    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string }> {
    const doc = await this.findByIdOrThrow(id);
    const newParent = doc.parent ?? null;
    // No orphans: move child categories AND this category's products up to the parent.
    await this.model.updateMany({ parent: doc._id }, { $set: { parent: newParent } }).exec();
    await this.products.updateMany({ category: doc._id }, { $set: { category: newParent } }).exec();
    await this.model.findByIdAndDelete(id).exec();
    return { id };
  }

  /** Move a category up/down among its siblings (normalizes sibling sortOrder). */
  async reorder(id: string, direction: 'up' | 'down'): Promise<void> {
    const cat = await this.findByIdOrThrow(id);
    const siblings = await this.model
      .find({ parent: cat.parent ?? null })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
    siblings.forEach((s, i) => (s.sortOrder = i));
    const idx = siblings.findIndex((s) => String(s._id) === id);
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap >= 0 && swap < siblings.length) {
      const tmp = siblings[idx].sortOrder;
      siblings[idx].sortOrder = siblings[swap].sortOrder;
      siblings[swap].sortOrder = tmp;
    }
    await Promise.all(
      siblings.map((s) => this.model.updateOne({ _id: s._id }, { sortOrder: s.sortOrder }).exec()),
    );
  }

  /** Product counts keyed by category id (direct products only). */
  private async productCounts(): Promise<Record<string, number>> {
    const rows = await this.products.aggregate<{ _id: string | null; count: number }>([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.filter((r) => r._id).map((r) => [String(r._id), r.count]));
  }

  private async descendantIds(id: string): Promise<Set<string>> {
    const all = await this.model.find().select('_id parent').exec();
    const childrenOf = new Map<string, string[]>();
    for (const c of all) {
      const p = c.parent ? String(c.parent) : null;
      if (p) {
        if (!childrenOf.has(p)) childrenOf.set(p, []);
        childrenOf.get(p)!.push(String(c._id));
      }
    }
    const out = new Set<string>();
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const child of childrenOf.get(cur) ?? []) {
        if (!out.has(child)) {
          out.add(child);
          stack.push(child);
        }
      }
    }
    return out;
  }

  private async assertSlugFree(slug: string, exceptId?: string): Promise<void> {
    const existing = await this.model.findOne({ slug }).exec();
    if (existing && String(existing._id) !== exceptId) {
      throw new ConflictException(`A category with slug "${slug}" already exists`);
    }
  }
}
