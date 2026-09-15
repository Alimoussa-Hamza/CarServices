import { UserRole } from '@prisma/client';
import { AdminController } from '../admin.controller';
import { AdminDashboardService } from '../admin-dashboard.service';

describe('AdminController', () => {
  it('délègue GET /admin/dashboard', async () => {
    const dashboard = {
      getDashboard: jest.fn().mockResolvedValue({
        data: {
          generatedAt: '2026-09-16T12:00:00.000Z',
          gmv: {
            dayCents: 0,
            weekCents: 0,
            monthCents: 0,
            currency: 'EUR',
          },
          gmvLast30Days: [],
          bookingsByStatus: [],
          providerAcceptanceRateAvg: 0,
          matchingDelayMedianMinutes: null,
          openDisputes: 0,
          providersPendingKyc: 0,
        },
      }),
    };

    const controller = new AdminController(
      dashboard as unknown as AdminDashboardService,
    );
    await expect(controller.getDashboard()).resolves.toMatchObject({
      data: { openDisputes: 0 },
    });
    expect(dashboard.getDashboard).toHaveBeenCalled();
    expect(UserRole.admin).toBe('admin');
  });
});
