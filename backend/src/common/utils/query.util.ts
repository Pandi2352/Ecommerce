import { NotFoundException } from '@nestjs/common';
import type { Model, SortOrder } from 'mongoose';
import { buildMeta, type PaginatedMeta } from '../dto/pagination.dto';

/**
 * Reusable Mongoose query helpers shared by every service.
 * Keep list/pagination/search logic here instead of hand-rolling it per module.
 */

export type SortSpec = Record<string, SortOrder>;

/** Find a document by id or throw a 404 with a consistent `<Entity> not found` message. */
export async function findByIdOrThrow<TDoc>(
  model: Model<TDoc>,
  id: string,
  entityName: string,
): Promise<TDoc> {
  const doc = await model.findById(id).exec();
  if (!doc) throw new NotFoundException(`${entityName} not found`);
  return doc as TDoc;
}

/**
 * Parse a `?sort=` string into a Mongoose sort object.
 * `"-createdAt,name"` → `{ createdAt: -1, name: 1 }`. Falls back when empty/invalid.
 */
export function parseSort(
  sort: string | undefined,
  fallback: SortSpec = { createdAt: -1 },
): SortSpec {
  if (!sort) return fallback;
  const out: SortSpec = {};
  for (const raw of sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (raw.includes(':')) {
      const [field, dir] = raw.split(':');
      out[field] = dir.toLowerCase() === 'desc' || dir === '-1' ? -1 : 1;
    } else if (raw.startsWith('-')) {
      out[raw.slice(1)] = -1;
    } else {
      out[raw] = 1;
    }
  }
  return Object.keys(out).length ? out : fallback;
}

/** Build a case-insensitive `$or` regex filter across the given fields (empty when no term). */
export function buildSearchFilter(fields: string[], term?: string): Record<string, unknown> {
  const q = term?.trim();
  if (!q) return {};
  return { $or: fields.map((field) => ({ [field]: { $regex: q, $options: 'i' } })) };
}

export interface PaginateOptions {
  filter?: Record<string, unknown>;
  sort?: SortSpec;
  page?: number;
  pageSize?: number;
}

/** Run a paginated `find` + `countDocuments` and return the standard `{ data, meta }` shape. */
export async function paginate<TDoc>(
  model: Model<TDoc>,
  opts: PaginateOptions = {},
): Promise<{ data: TDoc[]; meta: PaginatedMeta }> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 25;
  const filter = opts.filter ?? {};
  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort(opts.sort ?? { createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec(),
    model.countDocuments(filter).exec(),
  ]);
  return { data, meta: buildMeta(total, page, pageSize) };
}
