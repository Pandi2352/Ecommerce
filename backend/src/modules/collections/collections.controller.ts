import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  ListCollectionsQueryDto,
  UpdateCollectionDto,
} from './dto/collection.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @RequirePermission('products.read')
  @Get()
  list(@Query() query: ListCollectionsQueryDto) {
    return this.collections.list(query);
  }

  @RequirePermission('products.read')
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.collections.getOne(id);
  }

  @RequirePermission('products.read')
  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.collections.preview(id);
  }

  @RequirePermission('products.write')
  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collections.create(dto);
  }

  @RequirePermission('products.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collections.update(id, dto);
  }

  @RequirePermission('products.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collections.remove(id);
  }
}
