import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddressSnapshotSchema,
  MATCHING_BROADCAST_SIZE,
  MATCHING_RADIUS_EXPAND_FACTOR,
  PricingSnapshotSchema,
} from '@carservice/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { BookingStateMachine } from './booking-state.machine';
import {
  MATCHING_BUSY_STATUSES,
  computeMatchingScore,
  haversineKm,
  isRcProValid,
  providerCanTakeSlot,
} from './matching-rules';

const FALLBACK_DISTANCE_KM = 15;

export type CapacityCandidate = {
  availability: Array<{
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
  }>;
  blockedSlots: Array<{ startAt: Date; endAt: Date }>;
  busyRanges: Array<{ start: Date; end: Date }>;
  distanceKm: number;
  radiusKm: number | null;
};

export type MatchingBroadcastResult = {
  broadcastCount: number;
  status: 'payment_authorized' | 'pending_provider';
};

type EligibleCandidate = {
  providerId: string;
  score: number;
};

@Injectable()
export class BookingMatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: BookingStateMachine,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async broadcast(
    bookingId: string,
    now = new Date(),
    options: { radiusMultiplier?: number } = {},
  ): Promise<MatchingBroadcastResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true, zone: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    const offerId = booking.items[0]?.offerId;
    if (!offerId || booking.status !== 'payment_authorized') {
      return { broadcastCount: 0, status: booking.status as MatchingBroadcastResult['status'] };
    }

    const address = AddressSnapshotSchema.safeParse(booking.addressSnapshot);
    const destination = address.success
      ? { lat: address.data.lat, lng: address.data.lng }
      : null;

    const candidates = await this.findEligible({
      offerId,
      zoneId: booking.zoneId,
      slotStart: booking.slotStart,
      slotEnd: booking.slotEnd,
      destination,
      now,
      radiusMultiplier: options.radiusMultiplier,
    });

    const limit = this.broadcastSize();
    const selected = candidates.slice(0, limit);

    if (selected.length === 0) {
      return { broadcastCount: 0, status: 'payment_authorized' };
    }

    this.stateMachine.assertCanTransition(
      'payment_authorized',
      'pending_provider',
      'system',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.bookingBroadcast.deleteMany({ where: { bookingId } });
      await tx.bookingBroadcast.createMany({
        data: selected.map((candidate, index) => ({
          bookingId,
          providerId: candidate.providerId,
          score: new Prisma.Decimal(candidate.score.toFixed(2)),
          rank: index + 1,
        })),
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'pending_provider' },
      });

      const history = this.stateMachine.buildHistoryEntry(
        'payment_authorized',
        'pending_provider',
        'system',
      );
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          actorType: history.actorType,
        },
      });
    });

    await this.enqueuePushNotifications(bookingId, selected);

    return { broadcastCount: selected.length, status: 'pending_provider' };
  }

  async findEligible(input: {
    offerId: string;
    zoneId: string;
    slotStart: Date;
    slotEnd: Date;
    destination: { lat: number; lng: number } | null;
    now?: Date;
    radiusMultiplier?: number;
  }): Promise<EligibleCandidate[]> {
    const now = input.now ?? new Date();
    const providers = await this.prisma.providerProfile.findMany({
      where: {
        kycStatus: 'approved',
        capabilities: {
          some: { offerId: input.offerId, isActive: true },
        },
        providerZones: {
          some: { zoneId: input.zoneId },
        },
      },
      include: {
        baseAddress: true,
        availability: true,
        blockedSlots: true,
        providerZones: { where: { zoneId: input.zoneId } },
        kycDocuments: {
          where: { docType: 'rc_pro' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
        bookings: {
          where: {
            status: { in: [...MATCHING_BUSY_STATUSES] },
            slotStart: { lt: input.slotEnd },
            slotEnd: { gt: input.slotStart },
          },
          select: { id: true, slotStart: true, slotEnd: true },
        },
      },
    });

    const eligible: EligibleCandidate[] = [];

    for (const provider of providers) {
      if (!isRcProValid(provider.kycDocuments[0]?.expiresAt ?? null, now)) {
        continue;
      }

      const distanceKm = this.distanceKm(provider.baseAddress, input.destination);
      const radiusKm = this.toNumber(provider.providerZones[0]?.radiusKm);

      if (
        !providerCanTakeSlot({
          slotStart: input.slotStart,
          slotEnd: input.slotEnd,
          availability: provider.availability,
          blockedSlots: provider.blockedSlots,
          busyRanges: provider.bookings.map((booking) => ({
            start: booking.slotStart,
            end: booking.slotEnd,
          })),
          distanceKm,
          radiusKm,
          radiusMultiplier: input.radiusMultiplier,
        })
      ) {
        continue;
      }

      eligible.push({
        providerId: provider.id,
        score: computeMatchingScore({
          distanceKm,
          rating: this.toNumber(provider.ratingAvg) ?? 0,
          acceptanceRate: this.toNumber(provider.acceptanceRate) ?? 0,
        }),
      });
    }

    return eligible.sort((left, right) => right.score - left.score);
  }

  async loadCapacityPool(input: {
    offerId: string;
    zoneId: string;
    destination: { lat: number; lng: number };
    horizonStart: Date;
    horizonEnd: Date;
    now?: Date;
  }): Promise<CapacityCandidate[]> {
    const now = input.now ?? new Date();
    const providers = await this.prisma.providerProfile.findMany({
      where: {
        kycStatus: 'approved',
        capabilities: {
          some: { offerId: input.offerId, isActive: true },
        },
        providerZones: {
          some: { zoneId: input.zoneId },
        },
      },
      include: {
        baseAddress: true,
        availability: true,
        blockedSlots: true,
        providerZones: { where: { zoneId: input.zoneId } },
        kycDocuments: {
          where: { docType: 'rc_pro' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
        bookings: {
          where: {
            status: { in: [...MATCHING_BUSY_STATUSES] },
            slotStart: { lt: input.horizonEnd },
            slotEnd: { gt: input.horizonStart },
          },
          select: { slotStart: true, slotEnd: true },
        },
      },
    });

    return providers
      .filter((provider) =>
        isRcProValid(provider.kycDocuments[0]?.expiresAt ?? null, now),
      )
      .map((provider) => ({
        availability: provider.availability,
        blockedSlots: provider.blockedSlots,
        busyRanges: provider.bookings.map((booking) => ({
          start: booking.slotStart,
          end: booking.slotEnd,
        })),
        distanceKm: this.distanceKm(provider.baseAddress, input.destination),
        radiusKm: this.toNumber(provider.providerZones[0]?.radiusKm),
      }));
  }

  async listAvailable(userId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!provider) {
      return { data: [] };
    }

    const rows = await this.prisma.bookingBroadcast.findMany({
      where: {
        providerId: provider.id,
        booking: { status: 'pending_provider' },
      },
      include: {
        booking: {
          include: {
            items: true,
            zone: true,
          },
        },
      },
      orderBy: [{ score: 'desc' }, { rank: 'asc' }],
    });

    return {
      data: rows.map((row) => {
        const pricing = PricingSnapshotSchema.safeParse(
          row.booking.pricingSnapshot,
        );

        return {
          id: row.booking.id,
          reference: row.booking.reference,
          slotStart: row.booking.slotStart.toISOString(),
          slotEnd: row.booking.slotEnd.toISOString(),
          offerName: row.booking.items[0]?.offerName ?? row.booking.categorySlug,
          totalCents: pricing.success ? pricing.data.totalCents : 0,
          currency: 'EUR' as const,
          score: this.toNumber(row.score) ?? 0,
          zone: {
            slug: row.booking.zone.slug,
            name: row.booking.zone.name,
          },
        };
      }),
    };
  }

  async tryClaim(bookingId: string, providerUserId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId: providerUserId },
    });

    if (!provider) {
      throw new ForbiddenException({
        code: 'PROVIDER_PROFILE_REQUIRED',
        message: 'Profil prestataire introuvable.',
        details: [],
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE
      `;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { items: true, broadcasts: true },
      });

      if (!booking) {
        throw new NotFoundException({
          code: 'BOOKING_NOT_FOUND',
          message: 'Réservation introuvable.',
          details: [],
        });
      }

      if (booking.status !== 'pending_provider') {
        throw new ConflictException({
          code: 'BOOKING_ALREADY_ACCEPTED',
          message: 'Cette mission n’est plus disponible.',
          details: { status: booking.status },
        });
      }

      const invited = booking.broadcasts.some(
        (row) => row.providerId === provider.id,
      );
      if (!invited) {
        throw new ForbiddenException({
          code: 'BOOKING_NOT_OFFERED',
          message: 'Cette mission ne vous a pas été proposée.',
          details: [],
        });
      }

      const offerId = booking.items[0]?.offerId;
      const capability = offerId
        ? await tx.providerCapability.findUnique({
            where: {
              providerId_offerId: { providerId: provider.id, offerId },
            },
          })
        : null;

      if (!capability?.isActive) {
        throw new ForbiddenException({
          code: 'CAPABILITY_REQUIRED',
          message: 'Cette offre n’est plus dans vos capabilities.',
          details: [],
        });
      }

      this.stateMachine.assertCanTransition(
        'pending_provider',
        'accepted',
        'provider',
      );

      const history = this.stateMachine.buildHistoryEntry(
        'pending_provider',
        'accepted',
        'provider',
        { actorId: provider.userId },
      );

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          providerId: provider.id,
          status: 'accepted',
          history: {
            create: {
              fromStatus: history.fromStatus,
              toStatus: history.toStatus,
              actorType: history.actorType,
              actorId: history.actorId,
            },
          },
        },
        include: { items: true },
      });
    });
  }

  async decline(bookingId: string, providerUserId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId: providerUserId },
    });

    if (!provider) {
      throw new ForbiddenException({
        code: 'PROVIDER_PROFILE_REQUIRED',
        message: 'Profil prestataire introuvable.',
        details: [],
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE
      `;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { broadcasts: true },
      });

      if (!booking) {
        throw new NotFoundException({
          code: 'BOOKING_NOT_FOUND',
          message: 'Réservation introuvable.',
          details: [],
        });
      }

      if (booking.status !== 'pending_provider') {
        throw new ConflictException({
          code: 'BOOKING_ALREADY_ACCEPTED',
          message: 'Cette mission n’est plus disponible.',
          details: { status: booking.status },
        });
      }

      const invited = booking.broadcasts.some(
        (row) => row.providerId === provider.id,
      );
      if (!invited) {
        throw new ForbiddenException({
          code: 'BOOKING_NOT_OFFERED',
          message: 'Cette mission ne vous a pas été proposée.',
          details: [],
        });
      }

      await tx.bookingBroadcast.delete({
        where: {
          bookingId_providerId: {
            bookingId,
            providerId: provider.id,
          },
        },
      });

      const currentRate = this.toNumber(provider.acceptanceRate) ?? 0;
      await tx.providerProfile.update({
        where: { id: provider.id },
        data: {
          acceptanceRate: new Prisma.Decimal(
            Math.max(0, currentRate - 1).toFixed(2),
          ),
        },
      });

      return {
        remainingBroadcasts: booking.broadcasts.length - 1,
      };
    });

    try {
      await this.redis.client.lpush(
        'notifications:push',
        JSON.stringify({
          type: 'booking.declined',
          bookingId,
          providerId: provider.id,
        }),
      );
    } catch {
      // Push réelle = module notifications.
    }

    return {
      declined: true as const,
      bookingId,
      remainingBroadcasts: result.remainingBroadcasts,
    };
  }

  /** T1 : élargir le rayon et notifier plus de pros (RG-MATCH-04). Idempotent. */
  async expandRadius(bookingId: string, now = new Date()) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true, zone: true, broadcasts: true },
    });

    if (!booking) {
      return { skipped: true as const, reason: 'not_found', added: 0 };
    }

    if (booking.status === 'payment_authorized') {
      const result = await this.broadcast(bookingId, now, {
        radiusMultiplier: this.expandFactor(),
      });
      return {
        skipped: false as const,
        reason: 'rebroadcast',
        added: result.broadcastCount,
        status: result.status,
      };
    }

    if (booking.status !== 'pending_provider') {
      return { skipped: true as const, reason: 'not_pending', added: 0 };
    }

    const offerId = booking.items[0]?.offerId;
    if (!offerId) {
      return { skipped: true as const, reason: 'no_offer', added: 0 };
    }

    const address = AddressSnapshotSchema.safeParse(booking.addressSnapshot);
    const destination = address.success
      ? { lat: address.data.lat, lng: address.data.lng }
      : null;

    const candidates = await this.findEligible({
      offerId,
      zoneId: booking.zoneId,
      slotStart: booking.slotStart,
      slotEnd: booking.slotEnd,
      destination,
      now,
      radiusMultiplier: this.expandFactor(),
    });

    const already = new Set(booking.broadcasts.map((row) => row.providerId));
    const newcomers = candidates
      .filter((candidate) => !already.has(candidate.providerId))
      .slice(0, this.broadcastSize());

    if (newcomers.length === 0) {
      return { skipped: false as const, reason: 'no_newcomers', added: 0 };
    }

    const nextRank =
      booking.broadcasts.reduce((max, row) => Math.max(max, row.rank), 0) + 1;

    await this.prisma.bookingBroadcast.createMany({
      data: newcomers.map((candidate, index) => ({
        bookingId,
        providerId: candidate.providerId,
        score: new Prisma.Decimal(candidate.score.toFixed(2)),
        rank: nextRank + index,
      })),
    });

    await this.enqueuePushNotifications(bookingId, newcomers);

    return {
      skipped: false as const,
      reason: 'expanded',
      added: newcomers.length,
    };
  }

  /** T2 : aucun accept → unassigned (RG-MATCH-05). Idempotent. */
  async timeoutUnassigned(bookingId: string) {
    const exists = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true },
    });

    if (!exists) {
      return { skipped: true as const, reason: 'not_found' };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE
      `;

      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        return { skipped: true as const, reason: 'not_found' };
      }

      if (
        booking.status !== 'pending_provider' &&
        booking.status !== 'payment_authorized'
      ) {
        return { skipped: true as const, reason: 'not_pending' };
      }

      this.stateMachine.assertCanTransition(
        booking.status,
        'unassigned',
        'system',
      );
      const history = this.stateMachine.buildHistoryEntry(
        booking.status,
        'unassigned',
        'system',
        { reason: 'matching_timeout_t2' },
      );

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'unassigned' },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          actorType: history.actorType,
          reason: history.reason,
        },
      });

      return { skipped: false as const, status: 'unassigned' as const };
    });

    if (!result.skipped) {
      try {
        await this.redis.client.lpush(
          'notifications:push',
          JSON.stringify({ type: 'booking.unassigned', bookingId }),
        );
      } catch {
        // Push réelle = module notifications.
      }
    }

    return result;
  }

  private broadcastSize(): number {
    const configured = Number(this.config.get<string>('MATCHING_BROADCAST_SIZE'));
    if (Number.isInteger(configured) && configured >= 5 && configured <= 10) {
      return configured;
    }

    return MATCHING_BROADCAST_SIZE;
  }

  private expandFactor(): number {
    const configured = Number(
      this.config.get<string>('MATCHING_RADIUS_EXPAND_FACTOR'),
    );
    if (Number.isFinite(configured) && configured >= 1) {
      return configured;
    }
    return MATCHING_RADIUS_EXPAND_FACTOR;
  }

  private distanceKm(
    baseAddress: { lat: unknown; lng: unknown } | null,
    destination: { lat: number; lng: number } | null,
  ): number {
    if (!baseAddress || !destination) {
      return FALLBACK_DISTANCE_KM;
    }

    const lat = this.toNumber(baseAddress.lat);
    const lng = this.toNumber(baseAddress.lng);
    if (lat === null || lng === null) {
      return FALLBACK_DISTANCE_KM;
    }

    return haversineKm(lat, lng, destination.lat, destination.lng);
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === 'object' &&
      value &&
      'toNumber' in value &&
      typeof value.toNumber === 'function'
    ) {
      return value.toNumber();
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private async enqueuePushNotifications(
    bookingId: string,
    selected: EligibleCandidate[],
  ) {
    try {
      if (selected.length === 0) {
        return;
      }

      await this.redis.client.lpush(
        'notifications:push',
        ...selected.map((candidate) =>
          JSON.stringify({
            type: 'booking.broadcast',
            bookingId,
            providerId: candidate.providerId,
          }),
        ),
      );
    } catch {
      // Push réelle = module notifications. Le matching ne doit pas échouer.
    }
  }
}
