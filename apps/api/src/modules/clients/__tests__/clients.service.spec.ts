import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClientsService } from '../clients.service';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const profileId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function buildService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    clientProfile: {
      update: jest.fn(),
    },
    refreshToken: { updateMany: jest.fn() },
    pushToken: { deleteMany: jest.fn() },
    address: { updateMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(prisma),
    ),
  };
  return {
    service: new ClientsService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('ClientsService', () => {
  it('retourne le profil client', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      phone: '+33601020304',
      email: null,
      role: 'client',
      isActive: true,
      clientProfile: {
        id: profileId,
        firstName: 'Ada',
        lastName: 'Lovelace',
        createdAt: new Date('2026-09-16T10:00:00.000Z'),
        updatedAt: new Date('2026-09-16T10:00:00.000Z'),
      },
    });

    await expect(service.getMe(userId)).resolves.toMatchObject({
      data: { firstName: 'Ada', phone: '+33601020304' },
    });
  });

  it('anonymise le compte (RG-SEC-03)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      role: 'client',
      isActive: true,
      clientProfile: { id: profileId },
    });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.pushToken.deleteMany.mockResolvedValue({ count: 0 });
    prisma.address.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.update.mockResolvedValue({});

    const now = new Date('2026-09-16T12:00:00.000Z');
    await expect(service.deleteMe(userId, now)).resolves.toMatchObject({
      data: { deleted: true, userId },
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('404 si profil absent', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getMe(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
