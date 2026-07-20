import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  ListOrdersQueryDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @RequirePermission('orders.read')
  @Get()
  list(@Query() query: ListOrdersQueryDto) {
    return this.orders.list(query);
  }

  @RequirePermission('orders.read')
  @Get('stats')
  stats() {
    return this.orders.stats();
  }

  @RequirePermission('orders.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @RequirePermission('orders.write')
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @RequirePermission('orders.write')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto);
  }

  @RequirePermission('orders.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }
}
