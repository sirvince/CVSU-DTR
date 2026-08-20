import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from './roles.guard';

const createContext = (role: UserRole | undefined): ExecutionContext =>
  ({
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  it('allows the request through when the route has no @Roles() metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(UserRole.TEACHER))).toBe(true);
  });

  it('allows the request through when required roles is an empty array', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(UserRole.TEACHER))).toBe(true);
  });

  it('allows the request through when the user has a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });

  it('rejects the request when the user lacks a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(UserRole.TEACHER))).toBe(false);
  });
});
