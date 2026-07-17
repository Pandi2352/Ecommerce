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
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * Category CRUD. Reads are public (storefront); mutations will be gated to ADMIN once
 * the auth module lands in Sprint 2 (@Roles('ADMIN')).
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Query('tree') tree?: string) {
    return tree === 'true' ? this.categories.findTree() : this.categories.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.categories.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
