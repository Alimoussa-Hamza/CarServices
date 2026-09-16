import { api, ApiError } from '@carservice/api-client';
import type {
  CreateBookingDto,
  CreateBookingResponse,
} from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export type CheckoutDraftInput = {
  offerId: string;
  vehicleType: CreateBookingDto['vehicleType'];
  optionIds: string[];
  addressId: string;
  slotStart: string;
  slotEnd: string;
  totalCents: number;
  pricing: CreateBookingResponse['booking']['pricingSnapshot'];
  durationMinutes: number;
  forceFail?: boolean;
};

export type CreateBookingPayload = {
  offerId: string;
  vehicleType: CreateBookingDto['vehicleType'];
  optionIds?: string[];
  addressId: string;
  slotStart: string;
  clientComment?: string;
  clientPhotoIds?: string[];
};

export function buildMockCreateBookingResponse(
  input: CheckoutDraftInput,
): CreateBookingResponse {
  const id = 'e1111111-1111-4111-8111-111111111501';
  return {
    booking: {
      id,
      reference: 'CS-20260916-MOCK',
      status: 'pending_provider',
      pricingSnapshot: input.pricing,
      slotStart: input.slotStart,
      slotEnd: input.slotEnd,
    },
    payment: {
      clientSecret: 'pi_mock_secret_client',
      paymentIntentId: 'pi_mock_intent',
    },
    matching: { broadcastCount: 0 },
  };
}

export async function createBooking(
  payload: CreateBookingPayload,
  extras?: {
    pricing: CreateBookingResponse['booking']['pricingSnapshot'];
    slotEnd: string;
    durationMinutes: number;
    forceFail?: boolean;
  },
): Promise<CreateBookingResponse> {
  const dto: CreateBookingDto = {
    offerId: payload.offerId,
    vehicleType: payload.vehicleType,
    optionIds: payload.optionIds ?? [],
    addressId: payload.addressId,
    slotStart: payload.slotStart,
    clientComment: payload.clientComment,
    clientPhotoIds: payload.clientPhotoIds ?? [],
  };

  if (useMocksNow()) {
    if (extras?.forceFail) {
      throw new ApiError('PAYMENT_FAILED', 'Paiement refusé.', 402);
    }
    if (!extras) {
      throw new ApiError('VALIDATION_ERROR', 'Pricing mock requis', 400);
    }
    return buildMockCreateBookingResponse({
      offerId: dto.offerId,
      vehicleType: dto.vehicleType,
      optionIds: dto.optionIds,
      addressId: dto.addressId,
      slotStart: dto.slotStart,
      slotEnd: extras.slotEnd,
      totalCents: extras.pricing.totalCents,
      pricing: extras.pricing,
      durationMinutes: extras.durationMinutes,
    });
  }

  bootstrapApiClient();
  return api.bookings.create(dto);
}
