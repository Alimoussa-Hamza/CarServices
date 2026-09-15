import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUsersService } from '../admin-users.service';

const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const targetId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildService() {
  const prisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      return Promise.all(arg as Promise<unknown>[]);
    },
  );
  return {
    service: new AdminUsersService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('AdminUsersService', () => {
  it('liste les users avec pagination', async () => {
    const { service, prisma } = buildService();
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([
      {
        id: targetId,
        phone: '+33601020304',
        email: null,
        role: 'client',
        isActive: true,
        createdAt: new Date('2026-09-16T10:00:00.000Z'),
        clientProfile: { firstName: 'Ada', lastName: null },
        providerProfile: null,
      },
    ]);

    await expect(
      service.list({ page: 1, pageSize: 20 }),
    ).resolves.toMatchObject({
      data: { total: 1, items: [{ phone: '+33601020304', role: 'client' }] },
    });
  });

  it('désactive un user et révoque les refresh tokens', async () => {
    const { service, prisma } = buildService();
    const row = {
      id: targetId,
      phone: '+33601020304',
      email: null,
      role: 'client',
      isActive: true,
      createdAt: new Date('2026-09-16T10:00:00.000Z'),
      clientProfile: null,
      providerProfile: null,
    };
    prisma.user.findUnique.mockResolvedValue(row);
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
    prisma.user.update.mockResolvedValue({ ...row, isActive: false });

    await expect(
      service.update(targetId, { isActive: false }, adminId),
    ).resolves.toMatchObject({ data: { isActive: false } });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('refuse l’auto-désactivation', async () => {
    const { service } = buildService();
    await expect(
      service.update(adminId, { isActive: false }, adminId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404 si user absent', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.update(targetId, { isActive: false }, adminId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
