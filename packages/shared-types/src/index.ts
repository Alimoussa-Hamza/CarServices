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

export const BookingActorTypeSchema = z.enum([
  'client',
  'provider',
  'admin',
  'system',
]);
export type BookingActorType = z.infer<typeof BookingActorTypeSchema>;

/** Délai max pour ouvrir un litige après `completed` (RG-BOOK). */
export const BOOKING_DISPUTE_WINDOW_HOURS = 48;

/** Commission plateforme figée au booking (RG-PAY-03). */
export const PLATFORM_COMMISSION_RATE = 0.2;

export const PaymentStatusSchema = z.enum([
  'authorized',
  'captured',
  'refunded',
  'failed',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  stripePaymentIntentId: z.string().min(1).max(255),
  amountCents: z.number().int().nonnegative(),
  commissionCents: z.number().int().nonnegative(),
  providerNetCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  status: PaymentStatusSchema,
  capturedAt: z.string().datetime().nullable(),
  refundedAt: z.string().datetime().nullable(),
  payoutFrozenAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Payment = z.infer<typeof PaymentSchema>;

/** Net pro = montant − commission% (RG-PAY-03). */
export function computePaymentSplit(
  amountCents: number,
  commissionRate = PLATFORM_COMMISSION_RATE,
): { commissionCents: number; providerNetCents: number } {
  const commissionCents = Math.round(amountCents * commissionRate);
  return {
    commissionCents,
    providerNetCents: amountCents - commissionCents,
  };
}

/** Taille du broadcast matching (RG-MATCH-03, top 5–10). */
export const MATCHING_BROADCAST_SIZE = 8;

/** Timeout matching T1 — élargir le rayon (RG-MATCH-04). */
export const MATCHING_TIMEOUT_T1_MINUTES = 30;

/** Timeout matching T2 — unassigned (RG-MATCH-05). */
export const MATCHING_TIMEOUT_T2_HOURS = 2;

/** Unassigned aussi à H-2 du créneau (RG-MATCH-05). */
export const MATCHING_UNASSIGNED_LEAD_HOURS = 2;

/** Facteur d’élargissement du rayon à T1 (RG-MATCH-04). */
export const MATCHING_RADIUS_EXPAND_FACTOR = 2;

/** Annulation gratuite au-delà de ce délai (RG-CANCEL). */
export const CANCEL_FREE_HOURS = 24;

/** Seuil «late » d’annulation (RG-CANCEL). */
export const CANCEL_LATE_HOURS = 2;

/** Frais client 2–24 h, en % du snapshot (RG-CANCEL). */
export const CANCEL_FEE_MID_PERCENT = 20;

/** Frais client < 2 h, en % du snapshot (RG-CANCEL). */
export const CANCEL_FEE_LATE_PERCENT = 50;

/** Pénalité acceptanceRate pro (mid / late). */
export const CANCEL_PROVIDER_PENALTY_MID = 2;
export const CANCEL_PROVIDER_PENALTY_LATE = 5;

/** Géofence optionnelle à l’arrivée (RG-BOOK-03, wireframe P04). */
export const BOOKING_GEOFENCE_METERS = 200;

/** Photos min avant/après du prestataire pour clôturer (RG-BOOK-04). */
export const BOOKING_MIN_BEFORE_PHOTOS = 2;
export const BOOKING_MIN_AFTER_PHOTOS = 2;

export const BookingPhotoTypeSchema = z.enum(['before', 'after', 'issue']);
export type BookingPhotoType = z.infer<typeof BookingPhotoTypeSchema>;

export const BookingPhotoUploaderSchema = z.enum(['client', 'provider']);
export type BookingPhotoUploader = z.infer<typeof BookingPhotoUploaderSchema>;

export const BookingReferenceSchema = z
  .string()
  .regex(/^CS-\d{8}-[A-Z0-9]{4}$/, 'Référence booking invalide.');
export type BookingReference = z.infer<typeof BookingReferenceSchema>;

export const AddressSnapshotSchema = z.object({
  street: z.string().min(1).max(255),
  complement: z.string().max(255).nullable(),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(4).max(10),
  country: z.string().length(2),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  instructions: z.string().nullable(),
  label: z.string().max(100).nullable().optional(),
});
export type AddressSnapshot = z.infer<typeof AddressSnapshotSchema>;

export const PricingSnapshotSchema = z.object({
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
});
export type PricingSnapshot = z.infer<typeof PricingSnapshotSchema>;

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
  email: z.string().email().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AdminLoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});
export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;

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

const JsonObjectSchema = z
  .unknown()
  .refine(
    (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
    'Objet JSON requis.',
  );

const SlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug kebab-case invalide.')
  .max(100);

/** Admin catalog — CS-M10-S04 */
export const AdminCategorySchema = ServiceCategorySchema.extend({
  isEnabled: z.boolean(),
  sortOrder: z.number().int(),
});
export type AdminCategory = z.infer<typeof AdminCategorySchema>;

export const AdminUpdateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    icon: z.string().trim().max(100).nullable().optional(),
    isEnabled: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((dto) => Object.keys(dto).length > 0, 'Aucun champ à mettre à jour.');
export type AdminUpdateCategoryDto = z.infer<typeof AdminUpdateCategorySchema>;

export const AdminOfferOptionSchema = OfferOptionSchema.extend({
  isActive: z.boolean(),
});
export type AdminOfferOption = z.infer<typeof AdminOfferOptionSchema>;

export const AdminOfferSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  basePriceCents: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  formSchema: z.unknown(),
  checklistTemplate: z.unknown(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  category: ServiceCategorySchema.pick({ slug: true, name: true }),
  options: z.array(AdminOfferOptionSchema),
});
export type AdminOffer = z.infer<typeof AdminOfferSchema>;

export const AdminCreateOfferSchema = z.object({
  categoryId: z.string().uuid(),
  slug: SlugSchema,
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).nullable().optional(),
  basePriceCents: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  formSchema: JsonObjectSchema,
  checklistTemplate: JsonObjectSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});
export type AdminCreateOfferDto = z.infer<typeof AdminCreateOfferSchema>;
export type AdminCreateOfferInput = z.input<typeof AdminCreateOfferSchema>;

export const AdminUpdateOfferSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    slug: SlugSchema.optional(),
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    basePriceCents: z.number().int().nonnegative().optional(),
    durationMinutes: z.number().int().positive().max(24 * 60).optional(),
    formSchema: JsonObjectSchema.optional(),
    checklistTemplate: JsonObjectSchema.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((dto) => Object.keys(dto).length > 0, 'Aucun champ à mettre à jour.');
export type AdminUpdateOfferDto = z.infer<typeof AdminUpdateOfferSchema>;

export const AdminCreateOfferOptionSchema = z.object({
  slug: SlugSchema,
  name: z.string().trim().min(2).max(150),
  priceDeltaCents: z.number().int().default(0),
  durationDeltaMinutes: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type AdminCreateOfferOptionDto = z.infer<
  typeof AdminCreateOfferOptionSchema
>;
export type AdminCreateOfferOptionInput = z.input<
  typeof AdminCreateOfferOptionSchema
>;

export const AdminUpdateOfferOptionSchema = z
  .object({
    slug: SlugSchema.optional(),
    name: z.string().trim().min(2).max(150).optional(),
    priceDeltaCents: z.number().int().optional(),
    durationDeltaMinutes: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((dto) => Object.keys(dto).length > 0, 'Aucun champ à mettre à jour.');
export type AdminUpdateOfferOptionDto = z.infer<
  typeof AdminUpdateOfferOptionSchema
>;

/** Admin zones + pricing — CS-M10-S05 */
export const AdminGeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type AdminGeoPoint = z.infer<typeof AdminGeoPointSchema>;

export const AdminZonePolygonSchema = z
  .array(AdminGeoPointSchema)
  .min(3, 'Polygone : au moins 3 points.');
export type AdminZonePolygon = z.infer<typeof AdminZonePolygonSchema>;

export const AdminZoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  priceCoefficient: z.number().positive(),
  minBookingLeadHours: z.number().int().nonnegative(),
  polygon: AdminZonePolygonSchema,
  createdAt: z.string().datetime(),
});
export type AdminZone = z.infer<typeof AdminZoneSchema>;

export const AdminCreateZoneSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug kebab-case invalide.')
    .max(100),
  polygon: AdminZonePolygonSchema,
  isActive: z.boolean().default(false),
  priceCoefficient: z.number().positive().max(10).default(1),
  minBookingLeadHours: z.number().int().min(0).max(168).default(2),
});
export type AdminCreateZoneDto = z.infer<typeof AdminCreateZoneSchema>;
export type AdminCreateZoneInput = z.input<typeof AdminCreateZoneSchema>;

export const AdminUpdateZoneSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug kebab-case invalide.')
      .max(100)
      .optional(),
    polygon: AdminZonePolygonSchema.optional(),
    isActive: z.boolean().optional(),
    priceCoefficient: z.number().positive().max(10).optional(),
    minBookingLeadHours: z.number().int().min(0).max(168).optional(),
  })
  .refine((dto) => Object.keys(dto).length > 0, 'Aucun champ à mettre à jour.');
export type AdminUpdateZoneDto = z.infer<typeof AdminUpdateZoneSchema>;

export const VehicleSurchargesSchema = z.object({
  citadine: z.number().int().nonnegative(),
  berline: z.number().int().nonnegative(),
  suv: z.number().int().nonnegative(),
  utilitaire: z.number().int().nonnegative(),
  moto: z.number().int().nonnegative(),
});
export type VehicleSurcharges = z.infer<typeof VehicleSurchargesSchema>;

export const AdminZonePricingSchema = z.object({
  zoneId: z.string().uuid(),
  offerId: z.string().uuid(),
  offerSlug: z.string(),
  offerName: z.string(),
  priceOverrideCents: z.number().int().nonnegative().nullable(),
  vehicleSurcharges: VehicleSurchargesSchema,
});
export type AdminZonePricing = z.infer<typeof AdminZonePricingSchema>;

export const AdminUpsertZonePricingSchema = z.object({
  priceOverrideCents: z.number().int().nonnegative().nullable().optional(),
  vehicleSurcharges: VehicleSurchargesSchema,
});
export type AdminUpsertZonePricingDto = z.infer<
  typeof AdminUpsertZonePricingSchema
>;

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
  chargesEnabled: z.boolean(),
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

export const RcProAlertKindSchema = z.enum(['expiring_soon', 'expired']);
export type RcProAlertKind = z.infer<typeof RcProAlertKindSchema>;

export const RcProAlertSchema = z.object({
  kind: RcProAlertKindSchema,
  expiresAt: z.string().date(),
  daysRemaining: z.number().int(),
});
export type RcProAlert = z.infer<typeof RcProAlertSchema>;

export const KycStatusResponseSchema = z.object({
  status: KycStatusSchema,
  rejectionReason: z.string().nullable(),
  documents: z.array(KycDocumentSchema),
  rcProAlert: RcProAlertSchema.nullable(),
});
export type KycStatusResponse = z.infer<typeof KycStatusResponseSchema>;

export const ProviderKycAlertsResponseSchema = z.object({
  alert: RcProAlertSchema.nullable(),
});
export type ProviderKycAlertsResponse = z.infer<
  typeof ProviderKycAlertsResponseSchema
>;

/** File KYC admin — GET /admin/providers/pending (CS-M10-S03). */
export const AdminPendingProviderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  companyName: z.string().nullable(),
  siret: z.string().nullable(),
  washMethods: z.array(WashMethodSchema),
  kycStatus: z.literal('submitted'),
  submittedAt: z.string().datetime(),
  phone: z.string(),
  email: z.string().email().nullable(),
  documents: z.array(KycDocumentSchema),
});
export type AdminPendingProvider = z.infer<typeof AdminPendingProviderSchema>;

export const AdminPendingProvidersResponseSchema = z.object({
  items: z.array(AdminPendingProviderSchema),
  total: z.number().int().nonnegative(),
});
export type AdminPendingProvidersResponse = z.infer<
  typeof AdminPendingProvidersResponseSchema
>;

export const AdminRejectKycSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});
export type AdminRejectKycDto = z.infer<typeof AdminRejectKycSchema>;

export const AdminKycDecisionResponseSchema = z.object({
  providerId: z.string().uuid(),
  kycStatus: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().nullable(),
});
export type AdminKycDecisionResponse = z.infer<
  typeof AdminKycDecisionResponseSchema
>;

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

export const ProviderZoneSchema = z.object({
  zoneId: z.string().uuid(),
  zoneSlug: z.string(),
  zoneName: z.string(),
  radiusKm: z.number().positive().max(100).nullable(),
});
export type ProviderZoneDto = z.infer<typeof ProviderZoneSchema>;

export const ProviderZonesResponseSchema = z.object({
  zones: z.array(ProviderZoneSchema),
});
export type ProviderZonesResponse = z.infer<
  typeof ProviderZonesResponseSchema
>;

export const UpdateProviderZoneSchema = z.object({
  zoneId: z.string().uuid(),
  radiusKm: z.number().positive().max(100).nullable().optional(),
});
export type UpdateProviderZoneDto = z.infer<typeof UpdateProviderZoneSchema>;

export const UpdateProviderZonesSchema = z
  .object({
    zones: z.array(UpdateProviderZoneSchema).min(1).max(20),
  })
  .superRefine((dto, ctx) => {
    const zoneIds = new Set<string>();

    dto.zones.forEach((zone, index) => {
      if (zoneIds.has(zone.zoneId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['zones', index, 'zoneId'],
          message: 'Zone dupliquée.',
        });
      }

      zoneIds.add(zone.zoneId);
    });
  });
export type UpdateProviderZonesDto = z.infer<
  typeof UpdateProviderZonesSchema
>;

export const CreateStripeOnboardingLinkSchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});
export type CreateStripeOnboardingLinkDto = z.infer<
  typeof CreateStripeOnboardingLinkSchema
>;

export const StripeOnboardingLinkResponseSchema = z.object({
  url: z.string().url(),
  stripeAccountId: z.string().min(1),
});
export type StripeOnboardingLinkResponse = z.infer<
  typeof StripeOnboardingLinkResponseSchema
>;

export const ProviderMissionEligibilitySchema = z.object({
  eligible: z.literal(true),
  kycStatus: z.literal('approved'),
});
export type ProviderMissionEligibility = z.infer<
  typeof ProviderMissionEligibilitySchema
>;

export const CreateBookingSchema = z.object({
  offerId: z.string().uuid(),
  vehicleType: VehicleTypeSchema,
  optionIds: z.array(z.string().uuid()).default([]),
  addressId: z.string().uuid(),
  slotStart: z.string().datetime(),
  clientComment: z.string().max(300).optional(),
  clientPhotoIds: z.array(z.string().uuid()).default([]),
});
export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;

export const BookingPaymentSchema = z.object({
  clientSecret: z.string().min(1),
  paymentIntentId: z.string().min(1),
});
export type BookingPayment = z.infer<typeof BookingPaymentSchema>;

export const CreateBookingResponseSchema = z.object({
  booking: z.object({
    id: z.string().uuid(),
    reference: BookingReferenceSchema,
    status: z.enum(['payment_authorized', 'pending_provider']),
    pricingSnapshot: PricingSnapshotSchema,
    slotStart: z.string().datetime(),
    slotEnd: z.string().datetime(),
  }),
  payment: BookingPaymentSchema,
  matching: z.object({
    broadcastCount: z.number().int().nonnegative(),
  }),
});
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;

export const AvailableBookingSchema = z.object({
  id: z.string().uuid(),
  reference: BookingReferenceSchema,
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  offerName: z.string(),
  totalCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  score: z.number(),
  zone: z.object({
    slug: z.string(),
    name: z.string(),
  }),
});
export type AvailableBooking = z.infer<typeof AvailableBookingSchema>;

export const DeclineBookingSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    reason: z.string().max(300).optional(),
  }),
);
export type DeclineBookingDto = z.infer<typeof DeclineBookingSchema>;

export const AcceptedBookingSchema = z.object({
  id: z.string().uuid(),
  reference: BookingReferenceSchema,
  status: z.literal('accepted'),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  offerName: z.string(),
  totalCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  addressSnapshot: AddressSnapshotSchema,
});
export type AcceptedBooking = z.infer<typeof AcceptedBookingSchema>;

export const DeclinedBookingSchema = z.object({
  declined: z.literal(true),
  bookingId: z.string().uuid(),
  remainingBroadcasts: z.number().int().nonnegative(),
});
export type DeclinedBooking = z.infer<typeof DeclinedBookingSchema>;

export const ProviderMissionStatusSchema = z.enum([
  'en_route',
  'in_progress',
  'completed',
]);
export type ProviderMissionStatus = z.infer<typeof ProviderMissionStatusSchema>;

export const PatchBookingStatusSchema = z
  .object({
    status: ProviderMissionStatusSchema,
    providerNotes: z.string().max(500).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .superRefine((dto, ctx) => {
    if ((dto.lat === undefined) !== (dto.lng === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'lat et lng doivent être fournis ensemble.',
      });
    }
  });
export type PatchBookingStatusDto = z.infer<typeof PatchBookingStatusSchema>;

export const BookingStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  reference: BookingReferenceSchema,
  status: ProviderMissionStatusSchema,
  providerNotes: z.string().nullable(),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
});
export type BookingStatusUpdate = z.infer<typeof BookingStatusUpdateSchema>;

export const CancelWindowSchema = z.enum(['free', 'mid', 'late']);
export type CancelWindow = z.infer<typeof CancelWindowSchema>;

export const CancelBookingSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    reason: z.string().trim().min(3).max(300).optional(),
  }),
);
export type CancelBookingDto = z.infer<typeof CancelBookingSchema>;

export const CancelledBookingSchema = z.object({
  id: z.string().uuid(),
  reference: BookingReferenceSchema,
  status: z.enum(['cancelled_by_client', 'cancelled_by_provider']),
  reason: z.string().nullable(),
  window: CancelWindowSchema,
  feeCents: z.number().int().nonnegative(),
  refundCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  providerPenalty: z.number().int().nonnegative(),
  rematchUrgent: z.boolean(),
});
export type CancelledBooking = z.infer<typeof CancelledBookingSchema>;

export const BookingListGroupSchema = z.enum([
  'upcoming',
  'past',
  'cancelled',
]);
export type BookingListGroup = z.infer<typeof BookingListGroupSchema>;

export const BOOKING_LIST_LIMIT = 50;

export const BOOKING_LIST_GROUP_STATUSES: Record<
  BookingListGroup,
  BookingStatus[]
> = {
  upcoming: [
    'payment_authorized',
    'pending_provider',
    'accepted',
    'en_route',
    'in_progress',
  ],
  past: ['completed', 'disputed'],
  cancelled: [
    'cancelled_by_client',
    'cancelled_by_provider',
    'cancelled_by_admin',
    'expired',
    'unassigned',
  ],
};

export const ListBookingsQuerySchema = z.object({
  status: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return value;
  }, z.array(BookingStatusSchema).min(1).optional()),
  group: BookingListGroupSchema.optional(),
});
export type ListBookingsQuery = z.infer<typeof ListBookingsQuerySchema>;

export function resolveBookingListStatuses(
  query: ListBookingsQuery,
): BookingStatus[] | undefined {
  if (query.status && query.status.length > 0) {
    return query.status;
  }
  if (query.group) {
    return BOOKING_LIST_GROUP_STATUSES[query.group];
  }
  return undefined;
}

export const BookingListItemSchema = z.object({
  id: z.string().uuid(),
  reference: BookingReferenceSchema,
  status: BookingStatusSchema,
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  offerName: z.string(),
  vehicleType: VehicleTypeSchema.nullable(),
  totalCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  zone: z.object({
    slug: z.string(),
    name: z.string(),
  }),
  addressSnapshot: AddressSnapshotSchema.nullable(),
});
export type BookingListItem = z.infer<typeof BookingListItemSchema>;

export const BookingTimelineEventSchema = z.object({
  fromStatus: BookingStatusSchema.nullable(),
  toStatus: BookingStatusSchema,
  actorType: BookingActorTypeSchema,
  reason: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type BookingTimelineEvent = z.infer<typeof BookingTimelineEventSchema>;

export const BookingPhotoPublicSchema = z.object({
  photoType: BookingPhotoTypeSchema,
  uploadedBy: BookingPhotoUploaderSchema,
  fileUrl: z.string().min(1),
  createdAt: z.string().datetime(),
});
export type BookingPhotoPublic = z.infer<typeof BookingPhotoPublicSchema>;

export const BookingDetailProviderSchema = z.object({
  companyName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  ratingAvg: z.number(),
  washMethods: z.array(WashMethodSchema),
});
export type BookingDetailProvider = z.infer<typeof BookingDetailProviderSchema>;

export const BookingDetailClientSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
});
export type BookingDetailClient = z.infer<typeof BookingDetailClientSchema>;

export const BookingDetailSchema = BookingListItemSchema.extend({
  clientComment: z.string().nullable(),
  providerNotes: z.string().nullable(),
  pricingSnapshot: PricingSnapshotSchema,
  timeline: z.array(BookingTimelineEventSchema),
  photos: z.array(BookingPhotoPublicSchema),
  provider: BookingDetailProviderSchema.nullable(),
  client: BookingDetailClientSchema.nullable(),
});
export type BookingDetail = z.infer<typeof BookingDetailSchema>;

/** Calendrier C07 : de J à J+14 inclus. */
export const SLOT_PICKER_HORIZON_DAYS = 14;
/** Grille horaire 1 h (CDC C07). */
export const SLOT_PICKER_INTERVAL_MINUTES = 60;
/** Première heure de début (UTC), alignée sur les plages pro. */
export const SLOT_PICKER_WINDOW_START_MINUTES = 8 * 60;
/** Fin exclusive de la fenêtre de début (UTC). */
export const SLOT_PICKER_WINDOW_END_MINUTES = 20 * 60;

export const SlotPickerRequestSchema = z.object({
  offerId: z.string().uuid(),
  vehicleType: VehicleTypeSchema,
  optionIds: z.array(z.string().uuid()).default([]),
  addressId: z.string().uuid(),
});
export type SlotPickerRequest = z.infer<typeof SlotPickerRequestSchema>;

export const SlotPickerSlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  available: z.boolean(),
});
export type SlotPickerSlot = z.infer<typeof SlotPickerSlotSchema>;

export const SlotPickerDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(SlotPickerSlotSchema),
});
export type SlotPickerDay = z.infer<typeof SlotPickerDaySchema>;

export const SlotPickerResponseSchema = z.object({
  durationMinutes: z.number().int().positive(),
  minBookingLeadHours: z.number().int().nonnegative(),
  horizonDays: z.literal(SLOT_PICKER_HORIZON_DAYS),
  zone: z.object({
    slug: z.string(),
    name: z.string(),
  }),
  days: z.array(SlotPickerDaySchema),
});
export type SlotPickerResponse = z.infer<typeof SlotPickerResponseSchema>;

export const StripeWebhookEventSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});
export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>;

export const AdminRefundBookingSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    reason: z.string().trim().min(3).max(300).optional(),
  }),
);
export type AdminRefundBookingDto = z.infer<typeof AdminRefundBookingSchema>;

export const AdminRefundResponseSchema = z.object({
  bookingId: z.string().uuid(),
  status: BookingStatusSchema,
  paymentStatus: PaymentStatusSchema,
  refundCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  action: z.enum([
    'canceled_authorization',
    'refunded',
    'partial_capture',
    'noop',
  ]),
});
export type AdminRefundResponse = z.infer<typeof AdminRefundResponseSchema>;

/** Admin bookings search — CS-M10-S06 */
export const AdminListBookingsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  status: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return value;
  }, z.array(BookingStatusSchema).min(1).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminListBookingsQuery = z.infer<typeof AdminListBookingsQuerySchema>;

export const AdminBookingListItemSchema = BookingListItemSchema.extend({
  paymentStatus: PaymentStatusSchema.nullable(),
  client: BookingDetailClientSchema,
  provider: z
    .object({
      id: z.string().uuid(),
      companyName: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string().datetime(),
});
export type AdminBookingListItem = z.infer<typeof AdminBookingListItemSchema>;

export const AdminBookingsListResponseSchema = z.object({
  items: z.array(AdminBookingListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type AdminBookingsListResponse = z.infer<
  typeof AdminBookingsListResponseSchema
>;

export const AdminBookingDetailSchema = BookingDetailSchema.extend({
  paymentStatus: PaymentStatusSchema.nullable(),
  payment: z
    .object({
      amountCents: z.number().int().nonnegative(),
      commissionCents: z.number().int().nonnegative(),
      providerNetCents: z.number().int().nonnegative(),
      status: PaymentStatusSchema,
      stripePaymentIntentId: z.string().min(1),
    })
    .nullable(),
});
export type AdminBookingDetail = z.infer<typeof AdminBookingDetailSchema>;

/** KPIs back-office A02 — GET /admin/dashboard (CS-M10-S02). */
export const AdminDashboardGmvDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountCents: z.number().int().nonnegative(),
});
export type AdminDashboardGmvDay = z.infer<typeof AdminDashboardGmvDaySchema>;

export const AdminDashboardSchema = z.object({
  generatedAt: z.string().datetime(),
  gmv: z.object({
    dayCents: z.number().int().nonnegative(),
    weekCents: z.number().int().nonnegative(),
    monthCents: z.number().int().nonnegative(),
    currency: z.literal('EUR'),
  }),
  gmvLast30Days: z.array(AdminDashboardGmvDaySchema),
  bookingsByStatus: z.array(
    z.object({
      status: BookingStatusSchema,
      count: z.number().int().nonnegative(),
    }),
  ),
  providerAcceptanceRateAvg: z.number().min(0).max(100),
  matchingDelayMedianMinutes: z.number().nonnegative().nullable(),
  openDisputes: z.number().int().nonnegative(),
  providersPendingKyc: z.number().int().nonnegative(),
});
export type AdminDashboard = z.infer<typeof AdminDashboardSchema>;

export const MEDIA_UPLOAD_TTL_SECONDS = 900;
export const MEDIA_MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MediaMimeTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
export type MediaMimeType = z.infer<typeof MediaMimeTypeSchema>;
export const MediaUploadContextSchema = z.enum([
  'booking_photo',
  'kyc_document',
]);
export type MediaUploadContext = z.infer<typeof MediaUploadContextSchema>;

export const CreateMediaUploadUrlSchema = z
  .object({
    mimeType: MediaMimeTypeSchema,
    context: MediaUploadContextSchema,
    bookingId: z.string().uuid().optional(),
    photoType: BookingPhotoTypeSchema.optional(),
    sizeBytes: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.context === 'booking_photo') {
      if (!value.bookingId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bookingId'],
          message: 'bookingId requis pour une photo de mission.',
        });
      }
      if (!value.photoType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['photoType'],
          message: 'photoType requis pour une photo de mission.',
        });
      }
      if (value.mimeType === 'application/pdf') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mimeType'],
          message: 'Les photos de mission doivent être jpeg, png ou webp.',
        });
      }
    }

    const maxBytes =
      value.mimeType === 'application/pdf'
        ? MEDIA_MAX_DOCUMENT_BYTES
        : MEDIA_MAX_PHOTO_BYTES;
    if (value.sizeBytes && value.sizeBytes > maxBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sizeBytes'],
        message: `Fichier trop volumineux (max ${maxBytes} octets).`,
      });
    }
  });
export type CreateMediaUploadUrlDto = z.infer<typeof CreateMediaUploadUrlSchema>;

export const MediaUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  fileKey: z.string().min(1).max(500),
  expiresAt: z.string().datetime(),
});
export type MediaUploadUrlResponse = z.infer<typeof MediaUploadUrlResponseSchema>;

export const ConfirmMediaUploadSchema = z.object({
  fileKey: z.string().min(1).max(500),
});
export type ConfirmMediaUploadDto = z.infer<typeof ConfirmMediaUploadSchema>;

export const ConfirmedMediaUploadSchema = z.object({
  id: z.string().uuid().nullable(),
  bookingId: z.string().uuid().nullable(),
  photoType: BookingPhotoTypeSchema.nullable(),
  uploadedBy: BookingPhotoUploaderSchema.nullable(),
  fileKey: z.string().min(1).max(500),
  fileUrl: z.string().url(),
  createdAt: z.string().datetime(),
});
export type ConfirmedMediaUpload = z.infer<typeof ConfirmedMediaUploadSchema>;

/** Fenêtre pour laisser un avis après `completed` (RG-QUAL-05). */
export const REVIEW_WINDOW_HOURS = 72;

export const ReviewTagSchema = z.enum([
  'punctuality',
  'quality',
  'cleanliness',
  'friendliness',
]);
export type ReviewTag = z.infer<typeof ReviewTagSchema>;

export const CreateReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  tags: z
    .array(ReviewTagSchema)
    .max(4)
    .default([])
    .superRefine((tags, ctx) => {
      if (new Set(tags).size !== tags.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tags en double.',
        });
      }
    }),
});
export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

export const CreatedReviewSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  tags: z.array(ReviewTagSchema),
  createdAt: z.string().datetime(),
  provider: z.object({
    ratingAvg: z.number(),
    ratingCount: z.number().int().nonnegative(),
  }),
});
export type CreatedReview = z.infer<typeof CreatedReviewSchema>;

export const ListProviderReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListProviderReviewsQuery = z.infer<
  typeof ListProviderReviewsQuerySchema
>;

export const PublicReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  tags: z.array(ReviewTagSchema),
  createdAt: z.string().datetime(),
});
export type PublicReview = z.infer<typeof PublicReviewSchema>;

export const ProviderReviewsResponseSchema = z.object({
  provider: z.object({
    id: z.string().uuid(),
    ratingAvg: z.number(),
    ratingCount: z.number().int().nonnegative(),
  }),
  items: z.array(PublicReviewSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
});
export type ProviderReviewsResponse = z.infer<
  typeof ProviderReviewsResponseSchema
>;

export const DisputeReasonSchema = z.enum([
  'quality',
  'delay',
  'damage',
  'no_show',
  'other',
]);
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;

export const DisputeStatusSchema = z.enum([
  'open',
  'under_review',
  'resolved_client',
  'resolved_provider',
  'resolved_split',
  'closed',
]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const DisputeOpenedBySchema = z.enum(['client', 'provider']);
export type DisputeOpenedBy = z.infer<typeof DisputeOpenedBySchema>;

export const CreateDisputeSchema = z.object({
  bookingId: z.string().uuid(),
  reason: DisputeReasonSchema,
  description: z.string().trim().min(10).max(2000),
});
export type CreateDisputeDto = z.infer<typeof CreateDisputeSchema>;

export const CreatedDisputeSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  openedBy: DisputeOpenedBySchema,
  reason: DisputeReasonSchema,
  description: z.string(),
  status: DisputeStatusSchema,
  bookingStatus: z.literal('disputed'),
  payoutFrozen: z.literal(true),
  payoutFrozenAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type CreatedDispute = z.infer<typeof CreatedDisputeSchema>;

/** Formats Expo : ExponentPushToken[...] ou ExpoPushToken[...] */
export const ExpoPushTokenSchema = z
  .string()
  .trim()
  .regex(
    /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/,
    'Token Expo push invalide.',
  );
export type ExpoPushToken = z.infer<typeof ExpoPushTokenSchema>;

export const PushPlatformSchema = z.enum(['ios', 'android']);
export type PushPlatform = z.infer<typeof PushPlatformSchema>;

export const RegisterPushTokenSchema = z.object({
  token: ExpoPushTokenSchema,
  platform: PushPlatformSchema.optional(),
});
export type RegisterPushTokenDto = z.infer<typeof RegisterPushTokenSchema>;

export const RegisteredPushTokenSchema = z.object({
  id: z.string().uuid(),
  token: ExpoPushTokenSchema,
  platform: PushPlatformSchema.nullable(),
  updatedAt: z.string().datetime(),
});
export type RegisteredPushToken = z.infer<typeof RegisteredPushTokenSchema>;
