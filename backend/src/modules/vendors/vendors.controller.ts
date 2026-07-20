import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateVendorDto, ListVendorsQueryDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @RequirePermission('vendors.read')
  @Get()
  list(@Query() query: ListVendorsQueryDto) {
    return this.vendors.list(query);
  }

  @RequirePermission('vendors.read')
  @Get('stats')
  stats() {
    return this.vendors.getStats();
  }

  @RequirePermission('vendors.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.vendors.findOne(id);
  }

  @RequirePermission('vendors.write')
  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendors.create(dto);
  }

  @RequirePermission('vendors.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendors.update(id, dto);
  }

  @RequirePermission('vendors.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vendors.remove(id);
  }
}
