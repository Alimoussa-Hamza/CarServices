import { UserRole } from '@prisma/client';
import { AdminController } from '../admin.controller';
import { AdminDashboardService } from '../admin-dashboard.service';
import { AdminKycService } from '../admin-kyc.service';

describe('AdminController', () => {
  it('délègue GET /admin/dashboard', async () => {
    const dashboard = {
      getDashboard: jest.fn().mockResolvedValue({ data: { openDisputes: 0 } }),
    };
    const kyc = {
      listPending: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    };

    const controller = new AdminController(
      dashboard as unknown as AdminDashboardService,
      kyc as unknown as AdminKycService,
    );
    await expect(controller.getDashboard()).resolves.toMatchObject({
      data: { openDisputes: 0 },
    });
    expect(dashboard.getDashboard).toHaveBeenCalled();
  });

  it('délègue pending / approve / reject KYC', async () => {
    const dashboard = { getDashboard: jest.fn() };
    const kyc = {
      listPending: jest
        .fn()
        .mockResolvedValue({ data: { items: [], total: 0 } }),
      approve: jest.fn().mockResolvedValue({
        data: {
          providerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          kycStatus: 'approved',
          rejectionReason: null,
        },
      }),
      reject: jest.fn().mockResolvedValue({
        data: {
          providerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          kycStatus: 'rejected',
          rejectionReason: 'Motif',
        },
      }),
    };
    const controller = new AdminController(
      dashboard as unknown as AdminDashboardService,
      kyc as unknown as AdminKycService,
    );

    await controller.listPendingProviders();
    await controller.approveProvider(
      { sub: 'admin-1', role: UserRole.admin },
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    await controller.rejectProvider('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
      reason: 'Documents incomplets',
    });

    expect(kyc.listPending).toHaveBeenCalled();
    expect(kyc.approve).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'admin-1',
    );
    expect(kyc.reject).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      { reason: 'Documents incomplets' },
    );
  });
});
