import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  CreateWarehouseDto,
  ListWarehousesQueryDto,
  UpdateWarehouseDto,
} from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';

@Controller('inventory/warehouses')
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @RequirePermission('inventory.read')
  @Get()
  list(@Query() query: ListWarehousesQueryDto) {
    return this.warehouses.list(query);
  }

  @RequirePermission('inventory.read')
  @Get('stats')
  stats() {
    return this.warehouses.getStats();
  }

  @RequirePermission('inventory.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.warehouses.findById(id);
  }

  @RequirePermission('inventory.write')
  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehouses.create(dto);
  }

  @RequirePermission('inventory.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouses.update(id, dto);
  }

  @RequirePermission('inventory.write')
  @Patch(':id/primary')
  setPrimary(@Param('id') id: string) {
    return this.warehouses.setPrimary(id);
  }

  @RequirePermission('inventory.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouses.remove(id);
  }
}
