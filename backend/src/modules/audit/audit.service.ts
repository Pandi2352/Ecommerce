import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort } from '../../common/utils';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService extends BaseService<AuditLogDocument> {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) model: Model<AuditLogDocument>) {
    super(model, 'Audit log');
  }

  /** Fire-and-forget write — auditing must never block or break the request it records. */
  record(entry: Partial<AuditLog>): void {
    this.model.create(entry).catch((e) => this.logger.warn(`audit write failed: ${String(e)}`));
  }

  list(q: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
  }): Promise<{ data: AuditLogDocument[]; meta: PaginatedMeta }> {
    return this.paginate({
      filter: buildSearchFilter(['action', 'path', 'actor.email'], q.search),
      sort: parseSort(q.sort, { createdAt: -1 }),
      page: q.page,
      pageSize: q.pageSize,
    });
  }
}
