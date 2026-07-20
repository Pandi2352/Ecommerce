import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, MoveCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

/** Category CRUD. Reads are public (storefront); mutations are ADMIN-only. */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  list(@Query('tree') tree?: string) {
    return tree === 'true' ? this.categories.tree() : this.categories.list();
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.categories.findOne(id);
  }

  @RequirePermission('categories.write')
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @RequirePermission('categories.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @RequirePermission('categories.write')
  @Patch(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveCategoryDto) {
    return this.categories.reorder(id, dto.direction);
  }

  @RequirePermission('categories.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
