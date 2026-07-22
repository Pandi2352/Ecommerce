import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CustomersService } from './customers.service';
import { ListCustomersQueryDto } from './dto/customer-list.dto';

/** Admin view of storefront customers (role = Customer). Read-only for now. */
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @RequirePermission('customers.read')
  @Get()
  list(@Query() query: ListCustomersQueryDto) {
    return this.customers.list(query);
  }

  @RequirePermission('customers.read')
  @Get('stats')
  stats() {
    return this.customers.stats();
  }

  @RequirePermission('customers.read')
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.customers.getOne(id);
  }
}
