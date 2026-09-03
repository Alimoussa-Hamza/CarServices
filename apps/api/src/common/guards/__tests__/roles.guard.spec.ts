import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../roles.guard';

function buildContext(user?: { sub: string; role: UserRole }) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function buildGuard(requiredRoles?: UserRole[]) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  };

  return {
    guard: new RolesGuard(reflector as unknown as Reflector),
    reflector,
  };
}

describe('RolesGuard', () => {
  it('autorise quand aucun rôle spécifique n’est requis', () => {
    const { guard, reflector } = buildGuard(undefined);

    expect(guard.canActivate(buildContext())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      'handler',
      'class',
    ]);
  });

  it('autorise un utilisateur dont le rôle est requis', () => {
    const { guard } = buildGuard([UserRole.provider]);

    expect(
      guard.canActivate(
        buildContext({
          sub: 'provider-id',
          role: UserRole.provider,
        }),
      ),
    ).toBe(true);
  });

  it('rejette quand l’utilisateur est absent', () => {
    const { guard } = buildGuard([UserRole.client]);

    expect(() => guard.canActivate(buildContext())).toThrow(ForbiddenException);
  });

  it('rejette quand le rôle utilisateur ne correspond pas', () => {
    const { guard } = buildGuard([UserRole.admin]);

    expect(() =>
      guard.canActivate(
        buildContext({
          sub: 'client-id',
          role: UserRole.client,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('autorise si un des rôles requis correspond', () => {
    const { guard } = buildGuard([UserRole.admin, UserRole.provider]);

    expect(
      guard.canActivate(
        buildContext({
          sub: 'provider-id',
          role: UserRole.provider,
        }),
      ),
    ).toBe(true);
  });
});
