import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../jwt-auth.guard';

function buildContext(request: { headers: { authorization?: string }; user?: unknown }) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('rejette une requête sans header Authorization', () => {
    const jwtService = { verify: jest.fn() };
    const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

    expect(() =>
      guard.canActivate(buildContext({ headers: {} })),
    ).toThrow(UnauthorizedException);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('rejette un header Authorization qui ne commence pas par Bearer', () => {
    const jwtService = { verify: jest.fn() };
    const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

    expect(() =>
      guard.canActivate(buildContext({ headers: { authorization: 'Basic abc' } })),
    ).toThrow(UnauthorizedException);
  });

  it('rejette un token JWT invalide', () => {
    const jwtService = {
      verify: jest.fn(() => {
        throw new Error('invalid token');
      }),
    };
    const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

    expect(() =>
      guard.canActivate(
        buildContext({ headers: { authorization: 'Bearer invalid.jwt' } }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('attache le payload vérifié à la requête', () => {
    const payload = {
      sub: '4e165206-73f4-4987-86dd-eafde885a323',
      role: UserRole.client,
    };
    const request = { headers: { authorization: 'Bearer valid.jwt' } };
    const jwtService = { verify: jest.fn().mockReturnValue(payload) };
    const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

    expect(guard.canActivate(buildContext(request))).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt');
    expect(request).toMatchObject({ user: payload });
  });
});
