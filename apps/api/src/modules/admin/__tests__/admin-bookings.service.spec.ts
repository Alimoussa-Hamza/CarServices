import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminBookingsService } from '../admin-bookings.service';

const bookingId = '77777777-7777-4777-8777-777777777777';
const zoneId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const providerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const addressSnapshot = {
  street: '1 rue de la République',
  complement: null,
  city: 'Lyon',
  postalCode: '69001',
  country: 'FR',
  lat: 45.764,
  lng: 4.8357,
  instructions: null,
};

const pricingSnapshot = {
  base: 8500,
  vehicleSurcharge: 1000,
  options: [],
  serviceFee: 0,
  totalCents: 9500,
  currency: 'EUR',
};

function buildService() {
  const prisma = {
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    ),
  };

  return {
    service: new AdminBookingsService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('AdminBookingsService', () => {
  it('liste avec pagination et filtre statut', async () => {
    const { service, prisma } = buildService();
    prisma.booking.count.mockResolvedValue(1);
    prisma.booking.findMany.mockResolvedValue([
      {
        id: bookingId,
        reference: 'CS-20260916-ABCD',
        status: 'accepted',
        slotStart: new Date('2026-09-20T10:00:00.000Z'),
        slotEnd: new Date('2026-09-20T11:30:00.000Z'),
        categorySlug: 'wash',
        addressSnapshot,
        pricingSnapshot,
        createdAt: new Date('2026-09-16T08:00:00.000Z'),
        items: [{ offerName: 'Lavage complet', vehicleType: 'suv' }],
        zone: { id: zoneId, slug: 'lyon', name: 'Lyon' },
        payment: { status: 'authorized' },
        client: {
          firstName: 'Alice',
          lastName: 'Martin',
          user: { phone: '+33601020304' },
        },
        provider: { id: providerId, companyName: 'Pro Wash' },
      },
    ]);

    const result = await service.list({
      status: ['accepted'],
      page: 1,
      pageSize: 20,
    });

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['accepted'] } },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.data).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 20,
      items: [
        {
          reference: 'CS-20260916-ABCD',
          paymentStatus: 'authorized',
          client: { phone: '+33601020304' },
          provider: { companyName: 'Pro Wash' },
        },
      ],
    });
  });

  it('recherche par référence / téléphone / société', async () => {
    const { service, prisma } = buildService();
    prisma.booking.count.mockResolvedValue(0);
    prisma.booking.findMany.mockResolvedValue([]);

    await service.list({ q: 'CS-2026', page: 1, pageSize: 10 });

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { status: { not: 'draft' } },
            {
              OR: [
                { reference: { contains: 'CS-2026', mode: 'insensitive' } },
                {
                  client: {
                    user: {
                      phone: { contains: 'CS-2026', mode: 'insensitive' },
                    },
                  },
                },
                {
                  provider: {
                    companyName: {
                      contains: 'CS-2026',
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
  });

  it('détail admin révèle client + paiement', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue({
      id: bookingId,
      reference: 'CS-20260916-ABCD',
      status: 'accepted',
      slotStart: new Date('2026-09-20T10:00:00.000Z'),
      slotEnd: new Date('2026-09-20T11:30:00.000Z'),
      categorySlug: 'wash',
      addressSnapshot,
      pricingSnapshot,
      clientComment: null,
      providerNotes: null,
      createdAt: new Date('2026-09-16T08:00:00.000Z'),
      items: [{ offerName: 'Lavage complet', vehicleType: 'suv' }],
      zone: { slug: 'lyon', name: 'Lyon' },
      history: [],
      photos: [],
      payment: {
        amountCents: 9500,
        commissionCents: 1900,
        providerNetCents: 7600,
        status: 'authorized',
        stripePaymentIntentId: 'pi_mock_1',
      },
      client: {
        firstName: 'Alice',
        lastName: 'Martin',
        user: { phone: '+33601020304' },
      },
      provider: {
        id: providerId,
        companyName: 'Pro Wash',
        avatarUrl: null,
        ratingAvg: 4.5,
        washMethods: ['waterless'],
      },
    });

    await expect(service.getById(bookingId)).resolves.toMatchObject({
      data: {
        reference: 'CS-20260916-ABCD',
        paymentStatus: 'authorized',
        payment: { stripePaymentIntentId: 'pi_mock_1' },
        client: { phone: '+33601020304' },
      },
    });
  });

  it('404 si booking absent', async () => {
    const { service, prisma } = buildService();
    prisma.booking.findUnique.mockResolvedValue(null);

    await expect(service.getById(bookingId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
