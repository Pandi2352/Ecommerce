import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort, slugify } from '../../common/utils';
import { CreatePageDto, ListPagesQueryDto, UpdatePageDto } from './dto/page.dto';
import { Page, PageDocument } from './schemas/page.schema';

/**
 * Strip dangerous markup from admin-authored HTML before it is stored and later
 * rendered on the public storefront. Defense-in-depth for stored XSS: removes
 * <script>/<style>/<iframe>, inline event handlers and javascript: URLs.
 */
function sanitizeHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"');
}

@Injectable()
export class PagesService extends BaseService<PageDocument> {
  constructor(@InjectModel(Page.name) model: Model<PageDocument>) {
    super(model, 'Page');
  }

  async create(dto: CreatePageDto): Promise<Page> {
    const slug = slugify(dto.slug || dto.title);
    await this.assertSlugFree(slug);
    return this.model.create({ ...dto, slug, body: sanitizeHtml(dto.body) });
  }

  async update(id: string, dto: UpdatePageDto): Promise<Page> {
    await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };
    if (dto.body !== undefined) patch.body = sanitizeHtml(dto.body);
    if (dto.slug || dto.title) {
      const slug = slugify(dto.slug ?? dto.title!);
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

  async list(q: ListPagesQueryDto): Promise<{ data: Page[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['title', 'slug', 'excerpt'], q.search),
    };
    if (q.status === 'published' || q.status === 'draft') filter.status = q.status;

    return this.paginate({
      filter,
      sort: parseSort(q.sort, { sortOrder: 1, updatedAt: -1 }),
      page: q.page,
      pageSize: q.pageSize,
    });
  }

  getOne(id: string): Promise<PageDocument> {
    return this.findByIdOrThrow(id);
  }

  // ── Storefront (public) ──
  /** Published pages, ordered — used for the footer nav. */
  listPublic() {
    return this.model
      .find({ status: 'published' })
      .select('title slug excerpt showInFooter sortOrder')
      .sort({ sortOrder: 1, title: 1 })
      .exec();
  }

  async getPublicBySlug(slug: string): Promise<PageDocument> {
    const page = await this.model.findOne({ slug, status: 'published' }).exec();
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  private async assertSlugFree(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.model.findOne({ slug }).exec();
    if (existing && existing._id !== excludeId) {
      throw new ConflictException(`Page slug "${slug}" is already in use`);
    }
  }
}
