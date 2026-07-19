import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserStatus } from '@ecommerce/shared';
import { UsersService } from './users.service';
import { ListUsersQueryDto, SetRoleDto, UpdateUserDto } from './dto/user.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

/** Admin user management. Admins cannot lock themselves out. */
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequirePermission('users.read')
  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @RequirePermission('users.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @RequirePermission('users.write')
  @Patch(':id')
  update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    this.guardSelf(me, id, 'update your own role/status here');
    return this.users.adminUpdate(id, dto);
  }

  @RequirePermission('users.write')
  @Patch(':id/role')
  setRole(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: SetRoleDto) {
    this.guardSelf(me, id, 'change your own role');
    return this.users.adminUpdate(id, { role: dto.role });
  }

  @RequirePermission('users.write')
  @Post(':id/ban')
  ban(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    this.guardSelf(me, id, 'ban yourself');
    return this.users.setStatus(id, UserStatus.BANNED);
  }

  @RequirePermission('users.write')
  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.users.setStatus(id, UserStatus.ACTIVE);
  }

  @RequirePermission('users.write')
  @Delete(':id')
  remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    this.guardSelf(me, id, 'delete yourself');
    // Soft delete — keep the record for audit/order history.
    return this.users.setStatus(id, UserStatus.DELETED);
  }

  private guardSelf(me: AuthUser, id: string, action: string) {
    if (me.id === id) throw new BadRequestException(`You cannot ${action}`);
  }
}
