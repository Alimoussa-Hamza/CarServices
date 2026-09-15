import { Injectable } from '@nestjs/common';
import { BookingStatus, DisputeStatus, KycStatus, PaymentStatus, Prisma } from '@prisma/client';
import { AdminDashboard } from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

const OPEN_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.open,
  DisputeStatus.under_review,
];

type GmvDayRow = {
  day: Date;
  amount_cents: bigint | number;
};

type MedianRow = {
  median_minutes: number | null;
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(now = new Date()): Promise<{ data: AdminDashboard }> {
    const dayStart = startOfUtcDay(now);
    const weekStart = new Date(dayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const monthStart = new Date(dayStart);
    monthStart.setUTCDate(monthStart.getUTCDate() - 29);
    const seriesStart = new Date(dayStart);
    seriesStart.setUTCDate(seriesStart.getUTCDate() - 29);

    const [
      dayCents,
      weekCents,
      monthCents,
      gmvRows,
      statusGroups,
      acceptanceAgg,
      medianRows,
      openDisputes,
      providersPendingKyc,
    ] = await Promise.all([
      this.sumCapturedGmv(dayStart, now),
      this.sumCapturedGmv(weekStart, now),
      this.sumCapturedGmv(monthStart, now),
      this.prisma.$queryRaw<GmvDayRow[]>`
        SELECT date_trunc('day', captured_at AT TIME ZONE 'UTC') AS day,
               COALESCE(SUM(amount_cents), 0)::bigint AS amount_cents
        FROM payments
        WHERE status = 'captured'
          AND captured_at >= ${seriesStart}
          AND captured_at <= ${now}
        GROUP BY 1
        ORDER BY 1
      `,
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.providerProfile.aggregate({
        where: { kycStatus: KycStatus.approved },
        _avg: { acceptanceRate: true },
      }),
      this.prisma.$queryRaw<MedianRow[]>`
        SELECT percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (accepted.created_at - pending.created_at)) / 60.0
        ) AS median_minutes
        FROM booking_status_history AS accepted
        INNER JOIN booking_status_history AS pending
          ON pending.booking_id = accepted.booking_id
         AND pending.to_status = 'pending_provider'
        WHERE accepted.to_status = 'accepted'
          AND accepted.created_at >= pending.created_at
      `,
      this.prisma.dispute.count({
        where: { status: { in: OPEN_DISPUTE_STATUSES } },
      }),
      this.prisma.providerProfile.count({
        where: { kycStatus: KycStatus.submitted },
      }),
    ]);

    const countsByStatus = new Map(
      statusGroups.map((row) => [row.status, row._count._all]),
    );
    const bookingsByStatus = Object.values(BookingStatus).map((status) => ({
      status,
      count: countsByStatus.get(status) ?? 0,
    }));

    const amountByDay = new Map(
      gmvRows.map((row) => [
        toUtcDateKey(row.day),
        Number(row.amount_cents),
      ]),
    );
    const gmvLast30Days = buildUtcDateSeries(seriesStart, dayStart).map(
      (date) => ({
        date,
        amountCents: amountByDay.get(date) ?? 0,
      }),
    );

    const acceptanceAvg = acceptanceAgg._avg.acceptanceRate;
    const providerAcceptanceRateAvg =
      acceptanceAvg === null || acceptanceAvg === undefined
        ? 0
        : Number(new Prisma.Decimal(acceptanceAvg).toFixed(2));

    const medianRaw = medianRows[0]?.median_minutes;
    const matchingDelayMedianMinutes =
      medianRaw === null || medianRaw === undefined
        ? null
        : Math.round(Number(medianRaw) * 10) / 10;

    return {
      data: {
        generatedAt: now.toISOString(),
        gmv: {
          dayCents,
          weekCents,
          monthCents,
          currency: 'EUR',
        },
        gmvLast30Days,
        bookingsByStatus,
        providerAcceptanceRateAvg,
        matchingDelayMedianMinutes,
        openDisputes,
        providersPendingKyc,
      },
    };
  }

  private async sumCapturedGmv(from: Date, to: Date): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.captured,
        capturedAt: { gte: from, lte: to },
      },
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0;
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function toUtcDateKey(value: Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

function buildUtcDateSeries(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    days.push(toUtcDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
