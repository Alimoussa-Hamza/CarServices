import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus, Prisma } from '@prisma/client';
import {
  AdminDisputeListItem,
  AdminDisputesListResponse,
  AdminListDisputesQuery,
  AdminResolveDisputeDto,
  AdminResolvedDispute,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

const OPEN_STATUSES: DisputeStatus[] = [
  DisputeStatus.open,
  DisputeStatus.under_review,
];

@Injectable()
export class AdminDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async list(
    query: AdminListDisputesQuery,
  ): Promise<{ data: AdminDisputesListResponse }> {
    const statuses = query.status?.length
      ? (query.status as DisputeStatus[])
      : OPEN_STATUSES;
    const where: Prisma.DisputeWhereInput = { status: { in: statuses } };
    const skip = (query.page - 1) * query.pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where,
        include: {
          booking: {
            select: {
              reference: true,
              payment: { select: { payoutFrozenAt: true } },
            },
          },
          client: {
            select: {
              firstName: true,
              lastName: true,
              user: { select: { phone: true } },
            },
          },
          provider: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'asc' },
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

  async resolve(
    disputeId: string,
    dto: AdminResolveDisputeDto,
    adminUserId: string,
    now = new Date(),
  ): Promise<{ data: AdminResolvedDispute }> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: { payment: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Litige introuvable.',
        details: [],
      });
    }

    if (!OPEN_STATUSES.includes(dispute.status)) {
      throw new ConflictException({
        code: 'DISPUTE_ALREADY_RESOLVED',
        message: 'Ce litige est déjà résolu.',
        details: [{ status: dispute.status }],
      });
    }

    let paymentAction: AdminResolvedDispute['paymentAction'] = 'noop';
    let refundCents = 0;
    let paymentStatus = dispute.booking.payment?.status ?? null;

    if (dto.decision === 'resolved_client') {
      const released = await this.payments.releaseOrRefund(
        dispute.bookingId,
        dispute.booking.payment?.amountCents ?? 0,
        now,
        { required: true },
      );
      paymentAction = released.action;
      refundCents = released.refundCents;
      paymentStatus = released.paymentStatus;
      await this.payments.unfreezePayout(dispute.bookingId);
    } else if (
      dto.decision === 'resolved_provider' ||
      dto.decision === 'resolved_split'
    ) {
      await this.payments.unfreezePayout(dispute.bookingId);
      paymentAction = 'unfrozen';
      paymentStatus = dispute.booking.payment?.status ?? null;
    } else {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Décision de litige invalide.',
        details: [],
      });
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.decision,
        resolutionNotes: dto.notes ?? null,
        resolvedBy: adminUserId,
        resolvedAt: now,
      },
    });

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId: dispute.bookingId },
      select: { payoutFrozenAt: true, status: true },
    });

    return {
      data: {
        id: updated.id,
        bookingId: updated.bookingId,
        status: dto.decision,
        resolutionNotes: updated.resolutionNotes,
        resolvedAt: (updated.resolvedAt ?? now).toISOString(),
        payoutFrozen: Boolean(payment?.payoutFrozenAt),
        paymentStatus: payment?.status ?? paymentStatus,
        refundCents,
        paymentAction,
      },
    };
  }

  private toListItem(row: {
    id: string;
    bookingId: string;
    openedBy: AdminDisputeListItem['openedBy'];
    reason: AdminDisputeListItem['reason'];
    description: string;
    status: AdminDisputeListItem['status'];
    createdAt: Date;
    booking: {
      reference: string;
      payment: { payoutFrozenAt: Date | null } | null;
    };
    client: {
      firstName: string | null;
      lastName: string | null;
      user: { phone: string };
    };
    provider: { id: string; companyName: string | null };
  }): AdminDisputeListItem {
    return {
      id: row.id,
      bookingId: row.bookingId,
      bookingReference: row.booking.reference,
      openedBy: row.openedBy,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      payoutFrozen: Boolean(row.booking.payment?.payoutFrozenAt),
      client: {
        firstName: row.client.firstName,
        lastName: row.client.lastName,
        phone: row.client.user.phone,
      },
      provider: {
        id: row.provider.id,
        companyName: row.provider.companyName,
      },
    };
  }
}
