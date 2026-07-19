import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

/** Role & permission management (guarded by the `roles` permission → Super Admin). */
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermission('roles.read')
  @Get()
  list() {
    return this.roles.findAll();
  }

  @RequirePermission('roles.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.roles.findOne(id);
  }

  @RequirePermission('roles.write')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @RequirePermission('roles.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @RequirePermission('roles.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roles.remove(id);
  }
}
