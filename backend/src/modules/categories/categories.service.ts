import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { slugify } from '../../common/utils';
import { BaseService } from '../../common/services/base.service';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export interface CategoryNode extends Record<string, unknown> {
  id: string;
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService extends BaseService<CategoryDocument> {
  constructor(@InjectModel(Category.name) model: Model<CategoryDocument>) {
    super(model, 'Category');
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    await this.assertSlugFree(slug);
    return this.model.create({ ...dto, slug });
  }

  /** Flat list, sorted. */
  findAll(): Promise<CategoryDocument[]> {
    return this.model.find().sort({ sortOrder: 1, name: 1 }).exec();
  }

  /** Nested tree built from the flat list. */
  async findTree(): Promise<CategoryNode[]> {
    const all = await this.findAll();
    const byId = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const c of all) {
      const json = c.toJSON() as unknown as CategoryNode;
      json.children = [];
      byId.set(json.id, json);
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
    await this.findByIdOrThrow(id); // 404 if missing
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
    // Reparent children to this node's parent so no orphans are left behind.
    await this.model
      .updateMany({ parent: doc._id }, { $set: { parent: doc.parent ?? null } })
      .exec();
    await this.model.findByIdAndDelete(id).exec();
    return { id };
  }

  private async assertSlugFree(slug: string, exceptId?: string): Promise<void> {
    const existing = await this.model.findOne({ slug }).exec();
    if (existing && String(existing._id) !== exceptId) {
      throw new ConflictException(`A category with slug "${slug}" already exists`);
    }
  }
}
