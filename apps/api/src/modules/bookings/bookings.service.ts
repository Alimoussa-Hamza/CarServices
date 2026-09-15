import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddressSnapshotSchema,
  BOOKING_GEOFENCE_METERS,
  PLATFORM_COMMISSION_RATE,
  PricingSnapshotSchema,
  BOOKING_LIST_LIMIT,
  resolveBookingListStatuses,
  type AddressSnapshot,
  type BookingDetail,
  type BookingListItem,
  type BookingStatus,
  type CancelBookingDto,
  type CreateBookingDto,
  type ListBookingsQuery,
  type PatchBookingStatusDto,
  type PricingSnapshot,
  type WashMethod,
} from '@carservice/shared-types';
import { Prisma, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { RedisService } from '../redis/redis.service';
import { ZonesService } from '../zones/zones.service';
import {
  clientCancelFeeCents,
  hoursUntilSlot,
  providerCancelPenalty,
  resolveCancelWindow,
} from './booking-cancel';
import {
  hasMinCompletionPhotos,
  isWithinGeofence,
} from './booking-execution';
import { BookingMatchingService } from './booking-matching.service';
import { generateBookingReference } from './booking-reference';
import { BookingStateMachine } from './booking-state.machine';
import { MatchingQueueService } from './matching-queue.service';

const REFERENCE_RETRY_MAX = 5;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
    private readonly zonesService: ZonesService,
    private readonly stateMachine: BookingStateMachine,
    private readonly matchingService: BookingMatchingService,
    private readonly matchingQueue: MatchingQueueService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, dto: CreateBookingDto, now = new Date()) {
    const client = await this.prisma.clientProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Adresse introuvable.',
        details: [],
      });
    }

    const lat = Number(address.lat);
    const lng = Number(address.lng);
    const zone = await this.zonesService.findCoveringZone(lat, lng);

    if (!zone) {
      throw new BadRequestException({
        code: 'ZONE_NOT_COVERED',
        message: "Cette adresse n'est pas encore couverte.",
        details: [],
      });
    }

    const slotStart = new Date(dto.slotStart);
    const minStart = new Date(
      now.getTime() + zone.minBookingLeadHours * 60 * 60 * 1000,
    );

    if (slotStart.getTime() < minStart.getTime()) {
      throw new ConflictException({
        code: 'SLOT_UNAVAILABLE',
        message: 'Ce créneau est trop proche ou déjà passé.',
        details: { minBookingLeadHours: zone.minBookingLeadHours },
      });
    }

    const quote = await this.catalogService.computeQuote({
      offerId: dto.offerId,
      vehicleType: dto.vehicleType,
      optionIds: dto.optionIds,
      zoneSlug: zone.slug,
      dirtLevel: 'normal',
    });

    const slotEnd = new Date(
      slotStart.getTime() + quote.durationMinutes * 60 * 1000,
    );
    const addressSnapshot = this.toAddressSnapshot(address, lat, lng);
    const pricingSnapshot = quote.breakdown;
    const commissionRate = this.commissionRate();
    const payment = this.createMockPaymentAuthorization();
    const optionsTotal = pricingSnapshot.options.reduce(
      (total, option) => total + option.amount,
      0,
    );

    this.stateMachine.assertCanTransition(
      'draft',
      'payment_authorized',
      'system',
    );

    const draftHistory = this.stateMachine.buildHistoryEntry(
      null,
      'draft',
      'system',
    );
    const authorizedHistory = this.stateMachine.buildHistoryEntry(
      'draft',
      'payment_authorized',
      'system',
    );

    const booking = await this.createWithUniqueReference({
      clientId: client.id,
      categorySlug: quote.offer.categorySlug,
      addressSnapshot,
      pricingSnapshot,
      commissionRate,
      slotStart,
      slotEnd,
      clientComment: dto.clientComment ?? null,
      zoneId: zone.id,
      offerId: quote.offer.id,
      offerName: quote.offer.name,
      vehicleType: dto.vehicleType,
      optionsSnapshot: pricingSnapshot.options,
      unitPriceCents:
        pricingSnapshot.base + pricingSnapshot.vehicleSurcharge + optionsTotal,
      totalPriceCents: pricingSnapshot.totalCents,
      draftHistory,
      authorizedHistory,
    });

    const matching = await this.matchingService.broadcast(booking.id, now);

    try {
      await this.matchingQueue.scheduleTimeouts(
        booking.id,
        booking.slotStart,
        now,
      );
    } catch {
      // Redis/BullMQ down : le booking reste créé, les jobs pourront être rejoués.
    }

    return {
      data: {
        booking: {
          id: booking.id,
          reference: booking.reference,
          status: matching.status,
          pricingSnapshot,
          slotStart: booking.slotStart.toISOString(),
          slotEnd: booking.slotEnd.toISOString(),
        },
        payment,
        matching: { broadcastCount: matching.broadcastCount },
      },
    };
  }

  listAvailable(userId: string) {
    return this.matchingService.listAvailable(userId);
  }

  async list(userId: string, role: UserRole, query: ListBookingsQuery) {
    const statuses = resolveBookingListStatuses(query);
    const statusFilter = statuses
      ? { status: { in: statuses } }
      : { status: { not: 'draft' as const } };

    if (role === UserRole.provider) {
      const provider = await this.prisma.providerProfile.findUnique({
        where: { userId },
      });
      if (!provider) {
        return { data: [] };
      }

      const rows = await this.prisma.booking.findMany({
        where: { providerId: provider.id, ...statusFilter },
        include: { items: true, zone: true },
        orderBy: { slotStart: 'desc' },
        take: BOOKING_LIST_LIMIT,
      });

      return {
        data: rows.map((row) => this.toListItem(row, true)),
      };
    }

    const client = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!client) {
      return { data: [] };
    }

    const rows = await this.prisma.booking.findMany({
      where: { clientId: client.id, ...statusFilter },
      include: { items: true, zone: true },
      orderBy: { slotStart: 'desc' },
      take: BOOKING_LIST_LIMIT,
    });

    return {
      data: rows.map((row) => this.toListItem(row, true)),
    };
  }

  async getById(userId: string, role: UserRole, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        history: { orderBy: { createdAt: 'asc' } },
        photos: { orderBy: { createdAt: 'asc' } },
        zone: true,
        client: { include: { user: { select: { phone: true } } } },
        provider: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    const isClientOwner =
      role === UserRole.client && booking.client.userId === userId;
    const isAssignedProvider =
      role === UserRole.provider && booking.provider?.userId === userId;

    let isBroadcastProvider = false;
    if (
      role === UserRole.provider &&
      !isAssignedProvider &&
      booking.status === 'pending_provider'
    ) {
      const hit = await this.prisma.bookingBroadcast.findFirst({
        where: { bookingId, provider: { userId } },
        select: { id: true },
      });
      isBroadcastProvider = Boolean(hit);
    }

    if (role === UserRole.client && !isClientOwner) {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Cette réservation ne vous appartient pas.',
        details: [],
      });
    }

    if (
      role === UserRole.provider &&
      !isAssignedProvider &&
      !isBroadcastProvider
    ) {
      throw new ForbiddenException({
        code: 'BOOKING_NOT_ASSIGNED',
        message: 'Cette mission ne vous est pas assignée.',
        details: [],
      });
    }

    return {
      data: this.toDetail(booking, {
        revealAddress: isClientOwner || isAssignedProvider,
        revealClient: isAssignedProvider,
        revealProvider: isClientOwner && Boolean(booking.providerId),
      }),
    };
  }

  async accept(userId: string, bookingId: string) {
    const booking = await this.matchingService.tryClaim(bookingId, userId);
    const address = AddressSnapshotSchema.parse(booking.addressSnapshot);
    const pricing = PricingSnapshotSchema.safeParse(booking.pricingSnapshot);

    return {
      data: {
        id: booking.id,
        reference: booking.reference,
        status: 'accepted' as const,
        slotStart: booking.slotStart.toISOString(),
        slotEnd: booking.slotEnd.toISOString(),
        offerName: booking.items[0]?.offerName ?? booking.categorySlug,
        totalCents: pricing.success ? pricing.data.totalCents : 0,
        currency: 'EUR' as const,
        addressSnapshot: address,
      },
    };
  }

  async decline(userId: string, bookingId: string) {
    return {
      data: await this.matchingService.decline(bookingId, userId),
    };
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    dto: PatchBookingStatusDto,
  ) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new ForbiddenException({
        code: 'PROVIDER_PROFILE_REQUIRED',
        message: 'Profil prestataire introuvable.',
        details: [],
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { photos: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    if (booking.providerId !== provider.id) {
      throw new ForbiddenException({
        code: 'BOOKING_NOT_ASSIGNED',
        message: 'Cette mission ne vous est pas assignée.',
        details: [],
      });
    }

    const fromStatus = booking.status as BookingStatus;
    this.stateMachine.assertCanTransition(fromStatus, dto.status, 'provider');

    if (
      dto.status === 'in_progress' &&
      dto.lat !== undefined &&
      dto.lng !== undefined
    ) {
      const address = AddressSnapshotSchema.parse(booking.addressSnapshot);
      if (
        !isWithinGeofence(
          { lat: dto.lat, lng: dto.lng },
          { lat: address.lat, lng: address.lng },
          this.geofenceMeters(),
        )
      ) {
        throw new BadRequestException({
          code: 'BOOKING_GEOFENCE_FAILED',
          message: `Vous devez être à moins de ${this.geofenceMeters()} m de l’adresse pour démarrer.`,
          details: [],
        });
      }
    }

    if (
      dto.status === 'completed' &&
      !hasMinCompletionPhotos(booking.photos)
    ) {
      throw new BadRequestException({
        code: 'BOOKING_PHOTOS_REQUIRED',
        message: 'Photos avant et après obligatoires pour clôturer.',
        details: [],
      });
    }

    const history = this.stateMachine.buildHistoryEntry(
      fromStatus,
      dto.status,
      'provider',
      {
        actorId: provider.id,
        reason: dto.providerNotes,
      },
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: dto.status,
          ...(dto.providerNotes !== undefined
            ? { providerNotes: dto.providerNotes }
            : {}),
        },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          actorType: history.actorType,
          actorId: history.actorId,
          reason: history.reason,
        },
      });
      return next;
    });

    return {
      data: {
        id: updated.id,
        reference: updated.reference,
        status: dto.status,
        providerNotes: updated.providerNotes,
        slotStart: updated.slotStart.toISOString(),
        slotEnd: updated.slotEnd.toISOString(),
      },
    };
  }

  async cancel(
    userId: string,
    role: UserRole,
    bookingId: string,
    dto: CancelBookingDto,
    now = new Date(),
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, provider: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Réservation introuvable.',
        details: [],
      });
    }

    const actor: 'client' | 'provider' =
      role === UserRole.provider ? 'provider' : 'client';
    const toStatus =
      actor === 'provider' ? 'cancelled_by_provider' : 'cancelled_by_client';

    if (actor === 'client' && booking.client.userId !== userId) {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Cette réservation ne vous appartient pas.',
        details: [],
      });
    }

    if (actor === 'provider') {
      if (!booking.provider || booking.provider.userId !== userId) {
        throw new ForbiddenException({
          code: 'BOOKING_NOT_ASSIGNED',
          message: 'Cette mission ne vous est pas assignée.',
          details: [],
        });
      }
      if (!dto.reason) {
        throw new BadRequestException({
          code: 'BOOKING_CANCEL_REASON_REQUIRED',
          message: 'Un motif est obligatoire pour annuler une mission.',
          details: [],
        });
      }
    }

    if (
      booking.status === 'in_progress' ||
      booking.status === 'completed' ||
      booking.status === 'disputed'
    ) {
      throw new ConflictException({
        code: 'BOOKING_CANCEL_VIA_DISPUTE',
        message:
          'Annulation impossible à ce stade — ouvrez un litige si besoin.',
        details: { status: booking.status },
      });
    }

    const fromStatus = booking.status as BookingStatus;
    this.stateMachine.assertCanTransition(fromStatus, toStatus, actor);

    const window = resolveCancelWindow(hoursUntilSlot(booking.slotStart, now));
    const pricing = PricingSnapshotSchema.safeParse(booking.pricingSnapshot);
    const totalCents = pricing.success ? pricing.data.totalCents : 0;
    const feeCents =
      actor === 'client' ? clientCancelFeeCents(totalCents, window) : 0;
    const refundCents = Math.max(0, totalCents - feeCents);
    const penalty =
      actor === 'provider' ? providerCancelPenalty(window) : 0;
    const rematchUrgent = actor === 'provider' && window === 'late';

    const history = this.stateMachine.buildHistoryEntry(
      fromStatus,
      toStatus,
      actor,
      {
        actorId: actor === 'provider' ? booking.providerId ?? undefined : booking.clientId,
        reason: dto.reason,
      },
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.booking.update({
        where: { id: bookingId },
        data: { status: toStatus },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          actorType: history.actorType,
          actorId: history.actorId,
          reason: history.reason,
        },
      });

      if (penalty > 0 && booking.provider) {
        const rate = Number.parseFloat(String(booking.provider.acceptanceRate));
        const current = Number.isFinite(rate) ? rate : 100;
        await tx.providerProfile.update({
          where: { id: booking.provider.id },
          data: {
            acceptanceRate: new Prisma.Decimal(
              Math.max(0, current - penalty).toFixed(2),
            ),
          },
        });
      }

      return next;
    });

    try {
      await this.redis.client.lpush(
        'notifications:push',
        JSON.stringify({
          type: rematchUrgent
            ? 'booking.rematch_urgent'
            : 'booking.cancelled',
          bookingId,
          status: toStatus,
          window,
        }),
      );
    } catch {
      // Push réelle = module notifications.
    }

    return {
      data: {
        id: updated.id,
        reference: updated.reference,
        status: toStatus,
        reason: dto.reason ?? null,
        window,
        feeCents,
        refundCents,
        currency: 'EUR' as const,
        providerPenalty: penalty,
        rematchUrgent,
      },
    };
  }

  private geofenceMeters(): number {
    const configured = Number(this.config.get<string>('BOOKING_GEOFENCE_METERS'));
    if (Number.isFinite(configured) && configured > 0) {
      return configured;
    }
    return BOOKING_GEOFENCE_METERS;
  }

  private commissionRate(): Prisma.Decimal {
    const configured = this.config.get<string>('PLATFORM_COMMISSION_RATE');
    const parsed = configured ? Number(configured) : PLATFORM_COMMISSION_RATE;
    const rate =
      Number.isFinite(parsed) && parsed > 0 && parsed < 1
        ? parsed
        : PLATFORM_COMMISSION_RATE;
    return new Prisma.Decimal(rate.toFixed(2));
  }

  private createMockPaymentAuthorization() {
    const paymentIntentId = `pi_mock_${randomBytes(8).toString('hex')}`;
    return {
      paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_${randomBytes(8).toString('hex')}`,
    };
  }

  private toListItem(
    booking: {
      id: string;
      reference: string;
      status: BookingStatus;
      slotStart: Date;
      slotEnd: Date;
      categorySlug: string;
      addressSnapshot: Prisma.JsonValue;
      pricingSnapshot: Prisma.JsonValue;
      items: Array<{
        offerName: string;
        vehicleType: BookingListItem['vehicleType'];
      }>;
      zone: { slug: string; name: string };
    },
    revealAddress: boolean,
  ): BookingListItem {
    const pricing = PricingSnapshotSchema.safeParse(booking.pricingSnapshot);
    const address = AddressSnapshotSchema.safeParse(booking.addressSnapshot);

    return {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      slotStart: booking.slotStart.toISOString(),
      slotEnd: booking.slotEnd.toISOString(),
      offerName: booking.items[0]?.offerName ?? booking.categorySlug,
      vehicleType: booking.items[0]?.vehicleType ?? null,
      totalCents: pricing.success ? pricing.data.totalCents : 0,
      currency: 'EUR',
      zone: {
        slug: booking.zone.slug,
        name: booking.zone.name,
      },
      addressSnapshot: revealAddress && address.success ? address.data : null,
    };
  }

  private toDetail(
    booking: {
      id: string;
      reference: string;
      status: BookingStatus;
      slotStart: Date;
      slotEnd: Date;
      categorySlug: string;
      addressSnapshot: Prisma.JsonValue;
      pricingSnapshot: Prisma.JsonValue;
      clientComment: string | null;
      providerNotes: string | null;
      items: Array<{
        offerName: string;
        vehicleType: BookingListItem['vehicleType'];
      }>;
      zone: { slug: string; name: string };
      history: Array<{
        fromStatus: BookingStatus | null;
        toStatus: BookingStatus;
        actorType: BookingDetail['timeline'][number]['actorType'];
        reason: string | null;
        createdAt: Date;
      }>;
      photos: Array<{
        photoType: BookingDetail['photos'][number]['photoType'];
        uploadedBy: BookingDetail['photos'][number]['uploadedBy'];
        fileUrl: string;
        createdAt: Date;
      }>;
      client: {
        firstName: string | null;
        lastName: string | null;
        user: { phone: string };
      };
      provider: {
        companyName: string | null;
        avatarUrl: string | null;
        ratingAvg: Prisma.Decimal | number;
        washMethods: WashMethod[];
      } | null;
    },
    flags: {
      revealAddress: boolean;
      revealClient: boolean;
      revealProvider: boolean;
    },
  ): BookingDetail {
    const pricing = PricingSnapshotSchema.parse(booking.pricingSnapshot);

    return {
      ...this.toListItem(booking, flags.revealAddress),
      clientComment: booking.clientComment,
      providerNotes: booking.providerNotes,
      pricingSnapshot: pricing,
      timeline: booking.history.map((row) => ({
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        actorType: row.actorType,
        reason: row.reason,
        createdAt: row.createdAt.toISOString(),
      })),
      photos: booking.photos.map((row) => ({
        photoType: row.photoType,
        uploadedBy: row.uploadedBy,
        fileUrl: row.fileUrl,
        createdAt: row.createdAt.toISOString(),
      })),
      provider:
        flags.revealProvider && booking.provider
          ? {
              companyName: booking.provider.companyName,
              avatarUrl: booking.provider.avatarUrl,
              ratingAvg: Number(booking.provider.ratingAvg),
              washMethods: booking.provider.washMethods,
            }
          : null,
      client: flags.revealClient
        ? {
            firstName: booking.client.firstName,
            lastName: booking.client.lastName,
            phone: booking.client.user.phone,
          }
        : null,
    };
  }

  private toAddressSnapshot(
    address: {
      street: string;
      complement: string | null;
      city: string;
      postalCode: string;
      country: string;
      instructions: string | null;
      label: string | null;
    },
    lat: number,
    lng: number,
  ): AddressSnapshot {
    return {
      street: address.street,
      complement: address.complement,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      lat,
      lng,
      instructions: address.instructions,
      label: address.label,
    };
  }

  private async createWithUniqueReference(input: {
    clientId: string;
    categorySlug: string;
    addressSnapshot: AddressSnapshot;
    pricingSnapshot: PricingSnapshot;
    commissionRate: Prisma.Decimal;
    slotStart: Date;
    slotEnd: Date;
    clientComment: string | null;
    zoneId: string;
    offerId: string;
    offerName: string;
    vehicleType: CreateBookingDto['vehicleType'];
    optionsSnapshot: PricingSnapshot['options'];
    unitPriceCents: number;
    totalPriceCents: number;
    draftHistory: ReturnType<BookingStateMachine['buildHistoryEntry']>;
    authorizedHistory: ReturnType<BookingStateMachine['buildHistoryEntry']>;
  }) {
    for (let attempt = 0; attempt < REFERENCE_RETRY_MAX; attempt += 1) {
      const reference = generateBookingReference(input.slotStart);

      try {
        return await this.prisma.$transaction(async (tx) => {
          const booking = await tx.booking.create({
            data: {
              reference,
              clientId: input.clientId,
              categorySlug: input.categorySlug,
              status: 'payment_authorized',
              addressSnapshot: input.addressSnapshot,
              slotStart: input.slotStart,
              slotEnd: input.slotEnd,
              pricingSnapshot: input.pricingSnapshot,
              commissionRate: input.commissionRate,
              clientComment: input.clientComment,
              zoneId: input.zoneId,
              items: {
                create: {
                  offerId: input.offerId,
                  offerName: input.offerName,
                  vehicleType: input.vehicleType,
                  optionsSnapshot: input.optionsSnapshot,
                  formData: {},
                  unitPriceCents: input.unitPriceCents,
                  totalPriceCents: input.totalPriceCents,
                },
              },
              history: {
                create: [
                  {
                    fromStatus: input.draftHistory.fromStatus,
                    toStatus: input.draftHistory.toStatus,
                    actorType: input.draftHistory.actorType,
                  },
                  {
                    fromStatus: input.authorizedHistory.fromStatus,
                    toStatus: input.authorizedHistory.toStatus,
                    actorType: input.authorizedHistory.actorType,
                  },
                ],
              },
            },
          });

          return booking;
        });
      } catch (error) {
        if (!this.isReferenceConflict(error) || attempt === REFERENCE_RETRY_MAX - 1) {
          throw error;
        }
      }
    }

    throw new ConflictException({
      code: 'BOOKING_REFERENCE_CONFLICT',
      message: 'Impossible de générer une référence booking unique.',
      details: [],
    });
  }

  private isReferenceConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
