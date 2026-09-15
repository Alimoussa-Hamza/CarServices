import { ConflictException, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsQueueService } from '../../notifications/notifications-queue.service';
import { AdminKycService } from '../admin-kyc.service';

const providerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const adminId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const docId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function buildService() {
  const prisma = {
    providerProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    providerKycDocument: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        providerProfile: {
          update: prisma.providerProfile.update,
        },
        providerKycDocument: {
          updateMany: prisma.providerKycDocument.updateMany,
        },
      }),
    ),
  };
  const notifications = {
    enqueuePush: jest.fn().mockResolvedValue({ queued: false, sent: 1 }),
    enqueueEmail: jest.fn().mockResolvedValue({ queued: false, sent: 1 }),
  };

  return {
    service: new AdminKycService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsQueueService,
    ),
    prisma,
    notifications,
  };
}

describe('AdminKycService', () => {
  it('liste les pros submitted avec documents', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findMany.mockResolvedValue([
      {
        id: providerId,
        userId,
        companyName: null,
        siret: '12345678901234',
        washMethods: ['waterless'],
        kycStatus: KycStatus.submitted,
        updatedAt: new Date('2026-09-16T10:00:00.000Z'),
        user: { phone: '+33600000002', email: null },
        kycDocuments: [
          {
            id: docId,
            docType: 'rc_pro',
            fileUrl: 'https://cdn.example/rc.pdf',
            expiresAt: new Date('2027-12-31'),
            verifiedAt: null,
          },
        ],
      },
    ]);

    await expect(service.listPending()).resolves.toEqual({
      data: {
        total: 1,
        items: [
          expect.objectContaining({
            id: providerId,
            kycStatus: 'submitted',
            documents: [
              expect.objectContaining({
                docType: 'rc_pro',
                expiresAt: '2027-12-31',
              }),
            ],
          }),
        ],
      },
    });
  });

  it('approuve un dossier submitted et notifie le pro', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
      kycStatus: KycStatus.submitted,
      user: { email: 'pro@test.fr' },
    });
    prisma.providerProfile.update.mockResolvedValue({
      id: providerId,
      kycStatus: KycStatus.approved,
      kycRejectionReason: null,
    });
    prisma.providerKycDocument.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.approve(providerId, adminId)).resolves.toEqual({
      data: {
        providerId,
        kycStatus: 'approved',
        rejectionReason: null,
      },
    });
    expect(prisma.providerProfile.update).toHaveBeenCalledWith({
      where: { id: providerId },
      data: {
        kycStatus: KycStatus.approved,
        kycRejectionReason: null,
      },
    });
    expect(prisma.providerKycDocument.updateMany).toHaveBeenCalledWith({
      where: { providerId },
      data: expect.objectContaining({ verifiedBy: adminId }),
    });
    expect(notifications.enqueuePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        data: { type: 'kyc.approved' },
      }),
    );
    expect(notifications.enqueueEmail).toHaveBeenCalled();
  });

  it('rejette un dossier submitted avec motif', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
      kycStatus: KycStatus.submitted,
      user: { email: null },
    });
    prisma.providerProfile.update.mockResolvedValue({
      id: providerId,
      kycStatus: KycStatus.rejected,
      kycRejectionReason: 'RC Pro illisible',
    });

    await expect(
      service.reject(providerId, { reason: 'RC Pro illisible' }),
    ).resolves.toEqual({
      data: {
        providerId,
        kycStatus: 'rejected',
        rejectionReason: 'RC Pro illisible',
      },
    });
    expect(notifications.enqueuePush).toHaveBeenCalledWith(
      expect.objectContaining({ data: { type: 'kyc.rejected' } }),
    );
    expect(notifications.enqueueEmail).not.toHaveBeenCalled();
  });

  it('refuse d’approuver un dossier déjà approved', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue({
      id: providerId,
      userId,
      kycStatus: KycStatus.approved,
      user: { email: null },
    });

    await expect(service.approve(providerId, adminId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('404 si provider inconnu', async () => {
    const { service, prisma } = buildService();
    prisma.providerProfile.findUnique.mockResolvedValue(null);

    await expect(service.approve(providerId, adminId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
