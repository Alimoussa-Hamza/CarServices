import { UserRole } from '@prisma/client';
import { ProvidersController } from '../providers.controller';
import { ProvidersService } from '../providers.service';

const user = {
  sub: '22222222-2222-4222-8222-222222222222',
  role: UserRole.provider,
};

const stripeDto = {
  returnUrl: 'https://pro.carservice.test/stripe/return',
  refreshUrl: 'https://pro.carservice.test/stripe/refresh',
};

function buildController() {
  const providersService = {
    getMe: jest.fn(),
    updateMe: jest.fn(),
    submitKyc: jest.fn(),
    getKycStatus: jest.fn(),
    getKycAlerts: jest.fn(),
    listCapabilities: jest.fn(),
    updateCapabilities: jest.fn(),
    getAvailability: jest.fn(),
    updateAvailability: jest.fn(),
    listZones: jest.fn(),
    updateZones: jest.fn(),
    createStripeOnboardingLink: jest.fn(),
    getMissionEligibility: jest.fn(),
  };

  return {
    controller: new ProvidersController(
      providersService as unknown as ProvidersService,
    ),
    providersService,
  };
}

describe('ProvidersController', () => {
  it('délègue GET /providers/me au service avec user.sub', async () => {
    const { controller, providersService } = buildController();
    const result = { data: { id: 'provider-id' } };
    providersService.getMe.mockResolvedValue(result);

    await expect(controller.getMe(user)).resolves.toEqual(result);
    expect(providersService.getMe).toHaveBeenCalledWith(user.sub);
  });

  it('délègue POST /providers/stripe/onboard au service', async () => {
    const { controller, providersService } = buildController();
    const result = {
      data: {
        url: 'https://connect.stripe.com/setup/s/acct_123',
        stripeAccountId: 'acct_123',
      },
    };
    providersService.createStripeOnboardingLink.mockResolvedValue(result);

    await expect(
      controller.createStripeOnboardingLink(user, stripeDto),
    ).resolves.toEqual(result);
    expect(providersService.createStripeOnboardingLink).toHaveBeenCalledWith(
      user.sub,
      stripeDto,
    );
  });

  it('délègue GET /providers/kyc/alerts au service', async () => {
    const { controller, providersService } = buildController();
    const result = {
      data: {
        alert: {
          kind: 'expiring_soon',
          expiresAt: '2026-10-01',
          daysRemaining: 27,
        },
      },
    };
    providersService.getKycAlerts.mockResolvedValue(result);

    await expect(controller.getKycAlerts(user)).resolves.toEqual(result);
    expect(providersService.getKycAlerts).toHaveBeenCalledWith(user.sub);
  });

  it('délègue GET /providers/missions/eligibility au service', async () => {
    const { controller, providersService } = buildController();
    const result = { data: { eligible: true, kycStatus: 'approved' } };
    providersService.getMissionEligibility.mockResolvedValue(result);

    await expect(controller.getMissionEligibility(user)).resolves.toEqual(
      result,
    );
    expect(providersService.getMissionEligibility).toHaveBeenCalledWith(
      user.sub,
    );
  });

  it('propage KYC_NOT_APPROVED depuis l’éligibilité missions', async () => {
    const { controller, providersService } = buildController();
    providersService.getMissionEligibility.mockRejectedValue({
      response: { code: 'KYC_NOT_APPROVED' },
    });

    await expect(controller.getMissionEligibility(user)).rejects.toMatchObject({
      response: { code: 'KYC_NOT_APPROVED' },
    });
  });

  it('propage l’erreur Stripe du service sans la masquer', async () => {
    const { controller, providersService } = buildController();
    providersService.createStripeOnboardingLink.mockRejectedValue({
      response: { code: 'STRIPE_REQUEST_FAILED' },
    });

    await expect(
      controller.createStripeOnboardingLink(user, stripeDto),
    ).rejects.toMatchObject({
      response: { code: 'STRIPE_REQUEST_FAILED' },
    });
  });
});
