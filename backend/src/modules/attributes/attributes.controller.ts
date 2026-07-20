import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { ApplyPresetDto, CreateAttributeDto, UpdateAttributeDto } from './dto/attribute.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributes: AttributesService) {}

  @RequirePermission('attributes.read')
  @Get()
  list(@Query('category') category?: string) {
    return this.attributes.findAll(category);
  }

  /** Declared before `:id` so it isn't captured as an id. */
  @RequirePermission('attributes.read')
  @Get('presets')
  presets() {
    return this.attributes.listPresets();
  }

  @RequirePermission('attributes.write')
  @Post('apply-preset')
  applyPreset(@Body() dto: ApplyPresetDto) {
    return this.attributes.applyPreset(dto.presetId);
  }

  @RequirePermission('attributes.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.attributes.findOne(id);
  }

  @RequirePermission('attributes.write')
  @Post()
  create(@Body() dto: CreateAttributeDto) {
    return this.attributes.create(dto);
  }

  @RequirePermission('attributes.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributes.update(id, dto);
  }

  @RequirePermission('attributes.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attributes.remove(id);
  }
}
