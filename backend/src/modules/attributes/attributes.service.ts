import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OPTION_ATTRIBUTE_TYPES } from '@ecommerce/shared';
import { BaseService } from '../../common/services/base.service';
import { Attribute, AttributeDocument } from './schemas/attribute.schema';
import { CreateAttributeDto, UpdateAttributeDto } from './dto/attribute.dto';
import { SHOP_PRESETS, getPreset } from './presets';

@Injectable()
export class AttributesService extends BaseService<AttributeDocument> {
  constructor(@InjectModel(Attribute.name) model: Model<AttributeDocument>) {
    super(model, 'Attribute');
  }

  /** All definitions, or only those applicable to a category, sorted for the form. */
  findAll(categoryId?: string): Promise<AttributeDocument[]> {
    const filter: Record<string, unknown> = categoryId
      ? { isActive: true, $or: [{ scope: 'all' }, { categoryIds: categoryId }] }
      : {};
    return this.model.find(filter).sort({ sortOrder: 1, label: 1 }).exec();
  }

  findOne(id: string): Promise<AttributeDocument> {
    return this.findByIdOrThrow(id);
  }

  /** Active definitions that apply to a product (scope `all` + optionally its category). */
  applicableFor(categoryId?: string | null): Promise<AttributeDocument[]> {
    const or: Record<string, unknown>[] = [{ scope: 'all' }];
    if (categoryId) or.push({ categoryIds: categoryId });
    return this.model
      .find({ isActive: true, $or: or })
      .sort({ sortOrder: 1, label: 1 })
      .exec();
  }

  async create(dto: CreateAttributeDto): Promise<Attribute> {
    this.assertOptions(dto.type, dto.options);
    if (await this.model.exists({ key: dto.key.toLowerCase() })) {
      throw new ConflictException(`A field with key "${dto.key}" already exists`);
    }
    return this.model.create(dto);
  }

  async update(id: string, dto: UpdateAttributeDto): Promise<Attribute> {
    const current = await this.findByIdOrThrow(id);
    this.assertOptions(dto.type ?? current.type, dto.options ?? current.options);
    return (await this.model.findByIdAndUpdate(id, dto, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.findByIdOrThrow(id);
    await this.model.findByIdAndDelete(id).exec();
    return { id };
  }

  // ── Shop presets ──

  listPresets() {
    return SHOP_PRESETS.map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      variantOptions: p.variantOptions,
      fieldCount: p.attributes.length,
    }));
  }

  /** Seed a preset's fields (idempotent — existing keys are left untouched). */
  async applyPreset(presetId: string): Promise<{ added: number }> {
    const preset = getPreset(presetId);
    if (!preset) throw new BadRequestException(`Unknown preset: ${presetId}`);
    let added = 0;
    for (let i = 0; i < preset.attributes.length; i++) {
      const a = preset.attributes[i];
      const res = await this.model
        .updateOne(
          { key: a.key },
          { $setOnInsert: { ...a, options: a.options ?? [], sortOrder: i, isActive: true, scope: 'all' } },
          { upsert: true },
        )
        .exec();
      if (res.upsertedCount) added += 1;
    }
    return { added };
  }

  private assertOptions(type: string, options?: string[]): void {
    if (OPTION_ATTRIBUTE_TYPES.includes(type as never) && (!options || options.length === 0)) {
      throw new BadRequestException(`"${type}" fields need at least one option`);
    }
  }
}
