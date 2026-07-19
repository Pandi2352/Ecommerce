import type { Model } from 'mongoose';
import type { PaginatedMeta } from '../dto/pagination.dto';
import { findByIdOrThrow, paginate, type PaginateOptions } from '../utils/query.util';

/**
 * Base class for a Mongoose-backed service.
 *
 * Extend it to get `findByIdOrThrow` and `paginate` for free, so modules don't
 * re-implement the same 404-or-return and skip/limit/count boilerplate:
 *
 * ```ts
 * @Injectable()
 * export class WidgetsService extends BaseService<WidgetDocument> {
 *   constructor(@InjectModel(Widget.name) model: Model<WidgetDocument>) {
 *     super(model, 'Widget');
 *   }
 * }
 * ```
 *
 * `TDoc` is the hydrated document type (e.g. `UserDocument`).
 */
export abstract class BaseService<TDoc> {
  protected constructor(
    protected readonly model: Model<TDoc>,
    /** Human-readable name used in "<Entity> not found" errors. */
    protected readonly entityName: string,
  ) {}

  /** Fetch by id or throw a 404 with a consistent message. */
  protected findByIdOrThrow(id: string): Promise<TDoc> {
    return findByIdOrThrow(this.model, id, this.entityName);
  }

  /** Paginated list returning the standard `{ data, meta }` envelope shape. */
  protected paginate(opts: PaginateOptions = {}): Promise<{ data: TDoc[]; meta: PaginatedMeta }> {
    return paginate(this.model, opts);
  }
}
