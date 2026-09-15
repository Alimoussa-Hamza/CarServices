import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import {
  AdminKycDecisionResponse,
  AdminPendingProvidersResponse,
  AdminRejectKycDto,
} from '@carservice/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';

@Injectable()
export class AdminKycService {
  private readonly logger = new Logger(AdminKycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsQueueService,
  ) {}

  async listPending(): Promise<{ data: AdminPendingProvidersResponse }> {
    const providers = await this.prisma.providerProfile.findMany({
      where: { kycStatus: KycStatus.submitted },
      orderBy: { updatedAt: 'asc' },
      include: {
        user: { select: { phone: true, email: true } },
        kycDocuments: { orderBy: { createdAt: 'asc' } },
      },
    });

    const items = providers.map((provider) => ({
      id: provider.id,
      userId: provider.userId,
      companyName: provider.companyName,
      siret: provider.siret,
      washMethods: provider.washMethods,
      kycStatus: 'submitted' as const,
      submittedAt: provider.updatedAt.toISOString(),
      phone: provider.user.phone,
      email: provider.user.email,
      documents: provider.kycDocuments.map((document) => ({
        id: document.id,
        docType: document.docType,
        fileUrl: document.fileUrl,
        expiresAt: document.expiresAt
          ? document.expiresAt.toISOString().slice(0, 10)
          : null,
        verifiedAt: document.verifiedAt?.toISOString() ?? null,
      })),
    }));

    return { data: { items, total: items.length } };
  }

  async approve(
    providerId: string,
    adminUserId: string,
  ): Promise<{ data: AdminKycDecisionResponse }> {
    const provider = await this.loadProviderOrThrow(providerId);
    this.assertSubmitted(provider.kycStatus);

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.providerProfile.update({
        where: { id: providerId },
        data: {
          kycStatus: KycStatus.approved,
          kycRejectionReason: null,
        },
      });

      await tx.providerKycDocument.updateMany({
        where: { providerId },
        data: {
          verifiedAt: now,
          verifiedBy: adminUserId,
        },
      });

      return next;
    });

    await this.notifyKycDecision(provider.userId, provider.user.email, 'approved');

    return {
      data: {
        providerId: updated.id,
        kycStatus: 'approved',
        rejectionReason: null,
      },
    };
  }

  async reject(
    providerId: string,
    dto: AdminRejectKycDto,
  ): Promise<{ data: AdminKycDecisionResponse }> {
    const provider = await this.loadProviderOrThrow(providerId);
    this.assertSubmitted(provider.kycStatus);

    const updated = await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        kycStatus: KycStatus.rejected,
        kycRejectionReason: dto.reason,
      },
    });

    await this.notifyKycDecision(
      provider.userId,
      provider.user.email,
      'rejected',
      dto.reason,
    );

    return {
      data: {
        providerId: updated.id,
        kycStatus: 'rejected',
        rejectionReason: updated.kycRejectionReason,
      },
    };
  }

  private async loadProviderOrThrow(providerId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        userId: true,
        kycStatus: true,
        user: { select: { email: true } },
      },
    });

    if (!provider) {
      throw new NotFoundException({
        code: 'PROVIDER_NOT_FOUND',
        message: 'Prestataire introuvable.',
        details: [],
      });
    }

    return provider;
  }

  private assertSubmitted(status: KycStatus) {
    if (status === KycStatus.submitted) {
      return;
    }

    if (status === KycStatus.approved) {
      throw new ConflictException({
        code: 'KYC_ALREADY_APPROVED',
        message: 'Le dossier KYC est déjà approuvé.',
        details: [],
      });
    }

    if (status === KycStatus.rejected) {
      throw new ConflictException({
        code: 'KYC_ALREADY_REJECTED',
        message: 'Le dossier KYC est déjà rejeté.',
        details: [],
      });
    }

    throw new BadRequestException({
      code: 'KYC_NOT_SUBMITTED',
      message: 'Le dossier KYC n’est pas en attente de validation.',
      details: [{ kycStatus: status }],
    });
  }

  private async notifyKycDecision(
    userId: string,
    email: string | null,
    decision: 'approved' | 'rejected',
    reason?: string,
  ) {
    const approved = decision === 'approved';
    const title = approved ? 'KYC approuvé' : 'KYC rejeté';
    const body = approved
      ? 'Votre dossier prestataire est validé. Vous pouvez recevoir des missions.'
      : `Votre dossier a été rejeté${reason ? ` : ${reason}` : '.'}`;

    try {
      await this.notifications.enqueuePush({
        userId,
        title,
        body,
        data: { type: approved ? 'kyc.approved' : 'kyc.rejected' },
        dedupeKey: `kyc_${decision}_${userId}`,
      });

      if (email) {
        await this.notifications.enqueueEmail({
          to: email,
          subject: `CARSERVICE — ${title}`,
          html: `<p>${body}</p>`,
          text: body,
          dedupeKey: `kyc_${decision}_${userId}_email`,
        });
      }
    } catch (error) {
      this.logger.warn(
        `notify kyc ${decision} ${userId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }
}
