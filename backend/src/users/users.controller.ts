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
import { UserRole, UserStatus } from '@ecommerce/shared';
import { UsersService } from './users.service';
import { ListUsersQueryDto, SetRoleDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

/** Admin user management. ADMIN-only; admins cannot lock themselves out. */
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Patch(':id')
  update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    this.guardSelf(me, id, 'update your own role/status here');
    return this.users.adminUpdate(id, dto);
  }

  @Patch(':id/role')
  setRole(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: SetRoleDto) {
    this.guardSelf(me, id, 'change your own role');
    return this.users.adminUpdate(id, { role: dto.role });
  }

  @Post(':id/ban')
  ban(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    this.guardSelf(me, id, 'ban yourself');
    return this.users.setStatus(id, UserStatus.BANNED);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.users.setStatus(id, UserStatus.ACTIVE);
  }

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
