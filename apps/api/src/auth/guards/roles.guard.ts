import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../strategies/jwt.strategy';

// Must run after JwtAuthGuard (i.e. `@UseGuards(JwtAuthGuard, RolesGuard)`,
// in that order — Nest runs guards left-to-right) so request.user is
// already populated. A route with no @Roles() metadata is allowed through
// unchanged, so adding this guard's import never affects any existing
// JwtAuthGuard-only route.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return requiredRoles.includes(request.user.role);
  }
}
