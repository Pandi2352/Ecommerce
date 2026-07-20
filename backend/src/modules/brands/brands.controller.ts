import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { BrandsService } from './brands.service';
import { CreateBrandDto, ListBrandsQueryDto, UpdateBrandDto } from './dto/brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @RequirePermission('brands.read')
  @Get()
  list(@Query() query: ListBrandsQueryDto) {
    return this.brands.list(query);
  }

  @RequirePermission('brands.read')
  @Get('stats')
  stats() {
    return this.brands.getStats();
  }

  @RequirePermission('brands.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.brands.findOne(id);
  }

  @RequirePermission('brands.write')
  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @RequirePermission('brands.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @RequirePermission('brands.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brands.remove(id);
  }
}
