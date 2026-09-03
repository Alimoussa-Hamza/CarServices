import { z } from 'zod';

export const UserRoleSchema = z.enum(['client', 'provider', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const OtpRoleSchema = z.enum(['client', 'provider']);
export type OtpRole = z.infer<typeof OtpRoleSchema>;

export const KycStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'rejected',
]);
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const WashMethodSchema = z.enum(['waterless', 'steam']);
export type WashMethod = z.infer<typeof WashMethodSchema>;

export const KycDocumentTypeSchema = z.enum(['rc_pro', 'identity', 'other']);
export type KycDocumentType = z.infer<typeof KycDocumentTypeSchema>;

export const BookingStatusSchema = z.enum([
  'draft',
  'payment_authorized',
  'pending_provider',
  'accepted',
  'en_route',
  'in_progress',
  'completed',
  'cancelled_by_client',
  'cancelled_by_provider',
  'cancelled_by_admin',
  'expired',
  'unassigned',
  'disputed',
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const VehicleTypeSchema = z.enum([
  'citadine',
  'berline',
  'suv',
  'utilitaire',
  'moto',
]);
export type VehicleType = z.infer<typeof VehicleTypeSchema>;

export const DirtLevelSchema = z.enum(['light', 'normal', 'heavy']);
export type DirtLevel = z.infer<typeof DirtLevelSchema>;

export const SendOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  role: OtpRoleSchema,
});
export type SendOtpDto = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
  acceptTerms: z.literal(true),
});
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  role: UserRoleSchema,
  phone: z.string(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const SendOtpResponseSchema = z.object({
  expiresIn: z.number().int().positive(),
  retryAfter: z.number().int().nullable(),
});
export type SendOtpResponse = z.infer<typeof SendOtpResponseSchema>;

export const AuthTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: AuthUserSchema,
});
export type AuthTokensResponse = z.infer<typeof AuthTokensResponseSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ServiceCategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
});
export type ServiceCategoryDto = z.infer<typeof ServiceCategorySchema>;

export const OfferOptionSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  priceDeltaCents: z.number().int(),
  durationDeltaMinutes: z.number().int(),
});
export type OfferOptionDto = z.infer<typeof OfferOptionSchema>;

export const ServiceOfferSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  basePriceCents: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  category: ServiceCategorySchema.pick({ slug: true, name: true }),
  options: z.array(OfferOptionSchema),
});
export type ServiceOfferDto = z.infer<typeof ServiceOfferSchema>;

export const CatalogQuoteSchema = z.object({
  offerId: z.string().uuid(),
  vehicleType: VehicleTypeSchema,
  optionIds: z.array(z.string().uuid()).default([]),
  zoneSlug: z.string().min(1),
  dirtLevel: DirtLevelSchema.default('normal'),
});
export type CatalogQuoteDto = z.infer<typeof CatalogQuoteSchema>;

export const CatalogQuoteResponseSchema = z.object({
  breakdown: z.object({
    base: z.number().int().nonnegative(),
    vehicleSurcharge: z.number().int().nonnegative(),
    options: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        amount: z.number().int(),
      }),
    ),
    serviceFee: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    currency: z.literal('EUR'),
  }),
  durationMinutes: z.number().int().positive(),
});
export type CatalogQuoteResponse = z.infer<typeof CatalogQuoteResponseSchema>;

export const ZoneSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});
export type ZoneSummaryDto = z.infer<typeof ZoneSummarySchema>;

export const ZoneCheckSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  postalCode: z.string().min(4).max(10).optional(),
});
export type ZoneCheckDto = z.infer<typeof ZoneCheckSchema>;

export const ZoneCheckResponseSchema = z.discriminatedUnion('covered', [
  z.object({ covered: z.literal(true), zone: ZoneSummarySchema }),
  z.object({ covered: z.literal(false), leadCaptured: z.boolean() }),
]);
export type ZoneCheckResponse = z.infer<typeof ZoneCheckResponseSchema>;

export const OutOfZoneLeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  addressText: z.string().min(5).max(500),
});
export type OutOfZoneLeadDto = z.infer<typeof OutOfZoneLeadSchema>;

export const ProviderProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  companyName: z.string().nullable(),
  siret: z.string().nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  kycStatus: KycStatusSchema,
  kycRejectionReason: z.string().nullable(),
  washMethods: z.array(WashMethodSchema),
  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  acceptanceRate: z.number().min(0).max(100),
  stripeAccountId: z.string().nullable(),
  baseAddressId: z.string().uuid().nullable(),
});
export type ProviderProfileDto = z.infer<typeof ProviderProfileSchema>;

export const UpdateProviderProfileSchema = z.object({
  companyName: z.string().min(2).max(255).optional(),
  siret: z.string().regex(/^\d{14}$/).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  washMethods: z.array(WashMethodSchema).max(2).optional(),
  baseAddressId: z.string().uuid().nullable().optional(),
});
export type UpdateProviderProfileDto = z.infer<
  typeof UpdateProviderProfileSchema
>;

export const SubmitKycDocumentSchema = z.object({
  docType: KycDocumentTypeSchema,
  fileUrl: z.string().url(),
  expiresAt: z.string().date().nullable().optional(),
});
export type SubmitKycDocumentDto = z.infer<typeof SubmitKycDocumentSchema>;

export const SubmitKycSchema = z
  .object({
    siret: z.string().regex(/^\d{14}$/),
    washMethods: z.array(WashMethodSchema).min(1).max(2),
    documents: z.array(SubmitKycDocumentSchema).min(1),
  })
  .superRefine((dto, ctx) => {
    const rcPro = dto.documents.find(
      (document) => document.docType === 'rc_pro',
    );

    if (!rcPro) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documents'],
        message: 'RC Pro obligatoire.',
      });
      return;
    }

    if (!rcPro.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documents'],
        message: "Date d'expiration RC Pro obligatoire.",
      });
      return;
    }

    const expiresAtEndOfDay = new Date(`${rcPro.expiresAt}T23:59:59.999Z`);
    if (expiresAtEndOfDay.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documents'],
        message: 'RC Pro expirée.',
      });
    }
  });
export type SubmitKycDto = z.infer<typeof SubmitKycSchema>;

export const KycDocumentSchema = z.object({
  id: z.string().uuid(),
  docType: KycDocumentTypeSchema,
  fileUrl: z.string().url(),
  expiresAt: z.string().date().nullable(),
  verifiedAt: z.string().datetime().nullable(),
});
export type KycDocumentDto = z.infer<typeof KycDocumentSchema>;

export const KycStatusResponseSchema = z.object({
  status: KycStatusSchema,
  rejectionReason: z.string().nullable(),
  documents: z.array(KycDocumentSchema),
});
export type KycStatusResponse = z.infer<typeof KycStatusResponseSchema>;

export const ProviderCapabilitySchema = z.object({
  offerId: z.string().uuid(),
  offerSlug: z.string(),
  offerName: z.string(),
  categorySlug: z.literal('wash'),
  isActive: z.boolean(),
});
export type ProviderCapabilityDto = z.infer<typeof ProviderCapabilitySchema>;

export const ProviderCapabilitiesResponseSchema = z.object({
  capabilities: z.array(ProviderCapabilitySchema),
});
export type ProviderCapabilitiesResponse = z.infer<
  typeof ProviderCapabilitiesResponseSchema
>;

export const UpdateProviderCapabilitiesSchema = z.object({
  offerIds: z.array(z.string().uuid()).min(1).max(50),
});
export type UpdateProviderCapabilitiesDto = z.infer<
  typeof UpdateProviderCapabilitiesSchema
>;

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);

function minutesFromTime(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}

export const ProviderAvailabilitySlotSchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: TimeSchema,
  endTime: TimeSchema,
  isActive: z.boolean(),
});
export type ProviderAvailabilitySlotDto = z.infer<
  typeof ProviderAvailabilitySlotSchema
>;

export const ProviderBlockedSlotSchema = z.object({
  id: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(255).nullable(),
});
export type ProviderBlockedSlotDto = z.infer<
  typeof ProviderBlockedSlotSchema
>;

export const UpdateProviderAvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: TimeSchema,
  endTime: TimeSchema,
  isActive: z.boolean().default(true),
});
export type UpdateProviderAvailabilitySlotDto = z.infer<
  typeof UpdateProviderAvailabilitySlotSchema
>;

export const UpdateProviderBlockedSlotSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(255).nullable().optional(),
});
export type UpdateProviderBlockedSlotDto = z.infer<
  typeof UpdateProviderBlockedSlotSchema
>;

export const UpdateProviderAvailabilitySchema = z
  .object({
    weeklySlots: z.array(UpdateProviderAvailabilitySlotSchema).min(1).max(50),
    blockedSlots: z.array(UpdateProviderBlockedSlotSchema).max(100).default([]),
  })
  .superRefine((dto, ctx) => {
    dto.weeklySlots.forEach((slot, index) => {
      if (minutesFromTime(slot.endTime) <= minutesFromTime(slot.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weeklySlots', index, 'endTime'],
          message: 'endTime doit être après startTime.',
        });
      }
    });

    const activeSlotsByDay = new Map<number, typeof dto.weeklySlots>();
    dto.weeklySlots
      .filter((slot) => slot.isActive)
      .forEach((slot) => {
        activeSlotsByDay.set(slot.dayOfWeek, [
          ...(activeSlotsByDay.get(slot.dayOfWeek) ?? []),
          slot,
        ]);
      });

    for (const [dayOfWeek, slots] of activeSlotsByDay.entries()) {
      const sortedSlots = [...slots].sort(
        (left, right) =>
          minutesFromTime(left.startTime) - minutesFromTime(right.startTime),
      );

      for (let index = 1; index < sortedSlots.length; index += 1) {
        const currentSlot = sortedSlots[index];
        const previousSlot = sortedSlots[index - 1];
        if (!currentSlot || !previousSlot) {
          continue;
        }

        if (
          minutesFromTime(currentSlot.startTime) <
          minutesFromTime(previousSlot.endTime)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['weeklySlots'],
            message: `Chevauchement de disponibilité le jour ${dayOfWeek}.`,
          });
        }
      }
    }

    dto.blockedSlots.forEach((slot, index) => {
      if (new Date(slot.endAt).getTime() <= new Date(slot.startAt).getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['blockedSlots', index, 'endAt'],
          message: 'endAt doit être après startAt.',
        });
      }
    });
  });
export type UpdateProviderAvailabilityDto = z.infer<
  typeof UpdateProviderAvailabilitySchema
>;

export const ProviderAvailabilityResponseSchema = z.object({
  weeklySlots: z.array(ProviderAvailabilitySlotSchema),
  blockedSlots: z.array(ProviderBlockedSlotSchema),
});
export type ProviderAvailabilityResponse = z.infer<
  typeof ProviderAvailabilityResponseSchema
>;
