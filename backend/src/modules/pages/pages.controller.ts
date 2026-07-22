import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PagesService } from './pages.service';
import { CreatePageDto, ListPagesQueryDto, UpdatePageDto } from './dto/page.dto';

@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @RequirePermission('content.read')
  @Get()
  list(@Query() query: ListPagesQueryDto) {
    return this.pages.list(query);
  }

  @RequirePermission('content.read')
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.pages.getOne(id);
  }

  @RequirePermission('content.write')
  @Post()
  create(@Body() dto: CreatePageDto) {
    return this.pages.create(dto);
  }

  @RequirePermission('content.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, dto);
  }

  @RequirePermission('content.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pages.remove(id);
  }
}
