import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddressesService } from '../addresses.service';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const addressId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildService() {
  const prisma = {
    address: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    providerProfile: {
      findFirst: jest.fn(),
    },
  };
  return {
    service: new AddressesService(prisma as unknown as PrismaService),
    prisma,
  };
}

const row = {
  id: addressId,
  label: 'Maison',
  street: '10 rue de la République',
  complement: null,
  city: 'Lyon',
  postalCode: '69002',
  country: 'FR',
  lat: 45.764,
  lng: 4.8357,
  instructions: null,
  createdAt: new Date('2026-09-16T10:00:00.000Z'),
  updatedAt: new Date('2026-09-16T10:00:00.000Z'),
};

describe('AddressesService', () => {
  it('liste les adresses du client', async () => {
    const { service, prisma } = buildService();
    prisma.address.findMany.mockResolvedValue([row]);
    await expect(service.list(userId)).resolves.toMatchObject({
      data: [{ id: addressId, city: 'Lyon' }],
    });
  });

  it('crée une adresse', async () => {
    const { service, prisma } = buildService();
    prisma.address.create.mockResolvedValue(row);
    await expect(
      service.create(userId, {
        street: row.street,
        city: row.city,
        postalCode: row.postalCode,
        country: 'FR',
        lat: 45.764,
        lng: 4.8357,
      }),
    ).resolves.toMatchObject({ data: { id: addressId } });
  });

  it('404 si update hors ownership', async () => {
    const { service, prisma } = buildService();
    prisma.address.findFirst.mockResolvedValue(null);
    await expect(
      service.update(userId, addressId, { city: 'Villeurbanne' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('409 si delete adresse base pro', async () => {
    const { service, prisma } = buildService();
    prisma.address.findFirst.mockResolvedValue({ id: addressId });
    prisma.providerProfile.findFirst.mockResolvedValue({ id: 'pro-1' });
    await expect(service.remove(userId, addressId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
