import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ProvidersService } from '../../../modules/providers/providers.service';
import { KycApprovedGuard } from '../kyc-approved.guard';

function buildContext(user?: { sub: string; role: UserRole }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function buildGuard() {
  const providersService = {
    assertCanReceiveMissions: jest.fn().mockResolvedValue(undefined),
  };

  return {
    guard: new KycApprovedGuard(
      providersService as unknown as ProvidersService,
    ),
    providersService,
  };
}

describe('KycApprovedGuard', () => {
  it('rejette une requête sans utilisateur authentifié', async () => {
    const { guard, providersService } = buildGuard();

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(providersService.assertCanReceiveMissions).not.toHaveBeenCalled();
  });

  it('laisse passer un rôle non provider sans vérifier le KYC', async () => {
    const { guard, providersService } = buildGuard();

    await expect(
      guard.canActivate(
        buildContext({
          sub: 'client-id',
          role: UserRole.client,
        }),
      ),
    ).resolves.toBe(true);
    expect(providersService.assertCanReceiveMissions).not.toHaveBeenCalled();
  });

  it('autorise un provider dont le KYC est éligible aux missions', async () => {
    const { guard, providersService } = buildGuard();

    await expect(
      guard.canActivate(
        buildContext({
          sub: 'provider-id',
          role: UserRole.provider,
        }),
      ),
    ).resolves.toBe(true);
    expect(providersService.assertCanReceiveMissions).toHaveBeenCalledWith(
      'provider-id',
    );
  });

  it('propage KYC_NOT_APPROVED quand le provider n’est pas validé', async () => {
    const { guard, providersService } = buildGuard();
    providersService.assertCanReceiveMissions.mockRejectedValue(
      new ForbiddenException({
        code: 'KYC_NOT_APPROVED',
        message: "Le dossier KYC n'est pas encore approuvé.",
        details: { kycStatus: 'draft' },
      }),
    );

    await expect(
      guard.canActivate(
        buildContext({
          sub: 'provider-id',
          role: UserRole.provider,
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: 'KYC_NOT_APPROVED' },
    });
  });

  it('propage RC_PRO_EXPIRED quand la RC Pro n’est plus valide', async () => {
    const { guard, providersService } = buildGuard();
    providersService.assertCanReceiveMissions.mockRejectedValue(
      new ForbiddenException({
        code: 'RC_PRO_EXPIRED',
        message: 'La RC Pro est expirée. Les missions sont bloquées.',
        details: { expiresAt: '2020-01-01' },
      }),
    );

    await expect(
      guard.canActivate(
        buildContext({
          sub: 'provider-id',
          role: UserRole.provider,
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: 'RC_PRO_EXPIRED' },
    });
  });
});
