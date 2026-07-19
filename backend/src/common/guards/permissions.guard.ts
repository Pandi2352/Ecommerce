import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '@ecommerce/shared';
import { RolesService } from '../../modules/roles/roles.service';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

/** Enforces @RequirePermission(...) by resolving the user's role → permission set. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as { role?: string } | undefined;
    if (!user?.role) throw new ForbiddenException('No role assigned');

    const granted = await this.roles.permissionsFor(user.role);
    if (!required.every((p) => hasPermission(granted, p))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
