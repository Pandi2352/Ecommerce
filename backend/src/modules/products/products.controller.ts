import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @RequirePermission('products.read')
  @Get()
  list(@Query() query: ListProductsQueryDto) {
    return this.products.list(query);
  }

  @RequirePermission('products.read')
  @Get('stats')
  stats() {
    return this.products.stats();
  }

  @RequirePermission('products.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @RequirePermission('products.write')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @RequirePermission('products.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @RequirePermission('products.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
