import { BookingStatus, KycStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminDashboardService } from '../admin-dashboard.service';

function buildPrisma() {
  return {
    payment: {
      aggregate: jest.fn(),
    },
    booking: {
      groupBy: jest.fn(),
    },
    providerProfile: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    dispute: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
}

describe('AdminDashboardService', () => {
  const now = new Date('2026-09-16T12:00:00.000Z');

  it('agrège GMV, bookings, acceptation, litiges et KYC pending', async () => {
    const prisma = buildPrisma();
    prisma.payment.aggregate
      .mockResolvedValueOnce({ _sum: { amountCents: 11200 } })
      .mockResolvedValueOnce({ _sum: { amountCents: 33600 } })
      .mockResolvedValueOnce({ _sum: { amountCents: 112000 } });
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { day: new Date('2026-09-15T00:00:00.000Z'), amount_cents: 11200n },
      ])
      .mockResolvedValueOnce([{ median_minutes: 18.45 }]);
    prisma.booking.groupBy.mockResolvedValue([
      { status: BookingStatus.completed, _count: { _all: 2 } },
      { status: BookingStatus.pending_provider, _count: { _all: 1 } },
    ]);
    prisma.providerProfile.aggregate.mockResolvedValue({
      _avg: { acceptanceRate: 92.5 },
    });
    prisma.dispute.count.mockResolvedValue(3);
    prisma.providerProfile.count.mockResolvedValue(4);

    const service = new AdminDashboardService(
      prisma as unknown as PrismaService,
    );
    const result = await service.getDashboard(now);

    expect(result.data.gmv).toEqual({
      dayCents: 11200,
      weekCents: 33600,
      monthCents: 112000,
      currency: 'EUR',
    });
    expect(result.data.gmvLast30Days).toHaveLength(30);
    expect(result.data.gmvLast30Days.at(-1)).toEqual({
      date: '2026-09-16',
      amountCents: 0,
    });
    expect(
      result.data.gmvLast30Days.find((row) => row.date === '2026-09-15'),
    ).toEqual({ date: '2026-09-15', amountCents: 11200 });
    expect(
      result.data.bookingsByStatus.find(
        (row) => row.status === BookingStatus.completed,
      )?.count,
    ).toBe(2);
    expect(
      result.data.bookingsByStatus.find(
        (row) => row.status === BookingStatus.draft,
      )?.count,
    ).toBe(0);
    expect(result.data.providerAcceptanceRateAvg).toBe(92.5);
    expect(result.data.matchingDelayMedianMinutes).toBe(18.5);
    expect(result.data.openDisputes).toBe(3);
    expect(result.data.providersPendingKyc).toBe(4);
    expect(prisma.providerProfile.count).toHaveBeenCalledWith({
      where: { kycStatus: KycStatus.submitted },
    });
    expect(prisma.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: PaymentStatus.captured }),
      }),
    );
  });

  it('retourne médiane null et acceptation 0 sans données', async () => {
    const prisma = buildPrisma();
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amountCents: null } });
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{}]);
    prisma.booking.groupBy.mockResolvedValue([]);
    prisma.providerProfile.aggregate.mockResolvedValue({
      _avg: { acceptanceRate: null },
    });
    prisma.dispute.count.mockResolvedValue(0);
    prisma.providerProfile.count.mockResolvedValue(0);

    const service = new AdminDashboardService(
      prisma as unknown as PrismaService,
    );
    const result = await service.getDashboard(now);

    expect(result.data.gmv.dayCents).toBe(0);
    expect(result.data.providerAcceptanceRateAvg).toBe(0);
    expect(result.data.matchingDelayMedianMinutes).toBeNull();
  });
});
