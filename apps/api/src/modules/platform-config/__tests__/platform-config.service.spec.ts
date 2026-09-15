import { PrismaService } from '../../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config.service';

function buildService() {
  const prisma = {
    platformConfig: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    ),
  };
  return {
    service: new PlatformConfigService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('PlatformConfigService', () => {
  it('retourne les defaults si table vide', async () => {
    const { service, prisma } = buildService();
    prisma.platformConfig.findMany.mockResolvedValue([]);

    await expect(service.getPublicConfig()).resolves.toMatchObject({
      commissionRate: 0.2,
      matchingTimeoutT1Minutes: 30,
      matchingTimeoutT2Hours: 2,
      updatedAt: null,
    });
  });

  it('upsert les clés patchées et relit la config', async () => {
    const { service, prisma } = buildService();
    prisma.platformConfig.upsert.mockResolvedValue({});
    prisma.platformConfig.findMany.mockResolvedValue([
      {
        key: 'commission_rate',
        value: 0.25,
        updatedAt: new Date('2026-09-16T15:00:00.000Z'),
      },
    ]);

    await expect(
      service.update({ commissionRate: 0.25 }),
    ).resolves.toMatchObject({
      data: {
        commissionRate: 0.25,
        updatedAt: '2026-09-16T15:00:00.000Z',
      },
    });
    expect(prisma.platformConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'commission_rate' },
        create: { key: 'commission_rate', value: 0.25 },
      }),
    );
  });
});
