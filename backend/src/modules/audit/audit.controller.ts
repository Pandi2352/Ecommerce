import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** Paginated audit trail (search across action / path / actor email). */
  @RequirePermission('audit.read')
  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.audit.list(query);
  }
}
