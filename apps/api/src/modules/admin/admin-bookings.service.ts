import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import {
  AddressSnapshotSchema,
  AdminBookingDetail,
  AdminBookingListItem,
  AdminBookingsListResponse,
  AdminListBookingsQuery,
  BookingDetail,
  PricingSnapshotSchema,
  WashMethod,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminListBookingsQuery,
  ): Promise<{ data: AdminBookingsListResponse }> {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          items: true,
          zone: true,
          payment: true,
          client: { include: { user: { select: { phone: true } } } },
          provider: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      data: {
        items: rows.map((row) => this.toListItem(row)),
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  }

  async getById(bookingId: string): Promise<{ data: AdminBookingDetail }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        history: { orderBy: { createdAt: 'asc' } },
        photos: { orderBy: { createdAt: 'asc' } },
        zone: true,
        payment: true,
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

    return { data: this.toDetail(booking) };
  }

  private buildWhere(query: AdminListBookingsQuery): Prisma.BookingWhereInput {
    const statusFilter: Prisma.BookingWhereInput = query.status?.length
      ? { status: { in: query.status as BookingStatus[] } }
      : { status: { not: BookingStatus.draft } };

    if (!query.q) {
      return statusFilter;
    }

    const term = query.q;
    return {
      AND: [
        statusFilter,
        {
          OR: [
            { reference: { contains: term, mode: 'insensitive' } },
            {
              client: {
                user: { phone: { contains: term, mode: 'insensitive' } },
              },
            },
            {
              provider: {
                companyName: { contains: term, mode: 'insensitive' },
              },
            },
          ],
        },
      ],
    };
  }

  private toListItem(booking: {
    id: string;
    reference: string;
    status: BookingStatus;
    slotStart: Date;
    slotEnd: Date;
    categorySlug: string;
    addressSnapshot: Prisma.JsonValue;
    pricingSnapshot: Prisma.JsonValue;
    createdAt: Date;
    items: Array<{
      offerName: string;
      vehicleType: AdminBookingListItem['vehicleType'];
    }>;
    zone: { slug: string; name: string };
    payment: { status: AdminBookingListItem['paymentStatus'] } | null;
    client: {
      firstName: string | null;
      lastName: string | null;
      user: { phone: string };
    };
    provider: { id: string; companyName: string | null } | null;
  }): AdminBookingListItem {
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
      addressSnapshot: address.success ? address.data : null,
      paymentStatus: booking.payment?.status ?? null,
      client: {
        firstName: booking.client.firstName,
        lastName: booking.client.lastName,
        phone: booking.client.user.phone,
      },
      provider: booking.provider
        ? {
            id: booking.provider.id,
            companyName: booking.provider.companyName,
          }
        : null,
      createdAt: booking.createdAt.toISOString(),
    };
  }

  private toDetail(booking: {
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
    createdAt: Date;
    items: Array<{
      offerName: string;
      vehicleType: AdminBookingListItem['vehicleType'];
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
    payment: {
      amountCents: number;
      commissionCents: number;
      providerNetCents: number;
      status: NonNullable<AdminBookingDetail['paymentStatus']>;
      stripePaymentIntentId: string;
    } | null;
    client: {
      firstName: string | null;
      lastName: string | null;
      user: { phone: string };
    };
    provider: {
      id: string;
      companyName: string | null;
      avatarUrl: string | null;
      ratingAvg: Prisma.Decimal | number;
      washMethods: WashMethod[];
    } | null;
  }): AdminBookingDetail {
    const list = this.toListItem({
      ...booking,
      provider: booking.provider
        ? { id: booking.provider.id, companyName: booking.provider.companyName }
        : null,
    });
    const pricing = PricingSnapshotSchema.parse(booking.pricingSnapshot);
    const {
      provider: _listProvider,
      paymentStatus: _listPayment,
      createdAt: _createdAt,
      ...listBase
    } = list;

    return {
      ...listBase,
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
      provider: booking.provider
        ? {
            companyName: booking.provider.companyName,
            avatarUrl: booking.provider.avatarUrl,
            ratingAvg: Number(booking.provider.ratingAvg),
            washMethods: booking.provider.washMethods,
          }
        : null,
      client: list.client,
      paymentStatus: booking.payment?.status ?? null,
      payment: booking.payment
        ? {
            amountCents: booking.payment.amountCents,
            commissionCents: booking.payment.commissionCents,
            providerNetCents: booking.payment.providerNetCents,
            status: booking.payment.status,
            stripePaymentIntentId: booking.payment.stripePaymentIntentId,
          }
        : null,
    };
  }
}
