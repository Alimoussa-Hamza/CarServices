import { z } from 'zod';

export const UserRoleSchema = z.enum(['client', 'provider', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const OtpRoleSchema = z.enum(['client', 'provider']);
export type OtpRole = z.infer<typeof OtpRoleSchema>;

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
