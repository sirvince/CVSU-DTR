import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

// Opt-in: a route with no @Roles() at all is left untouched by RolesGuard
// (see auth/guards/roles.guard.ts) — this decorator only narrows access
// further for the routes that use it, never restricts anything by default.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
