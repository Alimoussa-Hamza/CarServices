import type { VehicleType, DirtLevel } from '@carservice/shared-types';
import type { CatalogQuoteResponse } from '@carservice/shared-types';
import { create } from 'zustand';

export type DraftAddress = {
  line1: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  /** Mock or API address id once validated */
  addressId: string | null;
};

export type DraftOfferOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  durationDeltaMinutes: number;
};

type BookingDraftState = {
  offerId: string | null;
  offerName: string | null;
  offerBasePriceCents: number | null;
  offerDurationMinutes: number | null;
  offerOptions: DraftOfferOption[];
  vehicleType: VehicleType;
  dirtLevel: DirtLevel;
  optionIds: string[];
  zoneSlug: string;
  zoneName: string | null;
  address: DraftAddress | null;
  covered: boolean | null;
  slotStart: string | null;
  slotEnd: string | null;
  quote: CatalogQuoteResponse | null;
  setOffer: (input: {
    id: string;
    name: string;
    priceCents: number;
    durationMinutes: number;
    options: DraftOfferOption[];
  }) => void;
  setVehicleType: (vehicleType: VehicleType) => void;
  setDirtLevel: (dirtLevel: DirtLevel) => void;
  toggleOption: (optionId: string) => void;
  setQuote: (quote: CatalogQuoteResponse | null) => void;
  setAddressResult: (input: {
    address: DraftAddress;
    covered: boolean;
    zoneSlug?: string;
    zoneName?: string;
  }) => void;
  setSlot: (slotStart: string, slotEnd: string) => void;
  reset: () => void;
};

const initial = {
  offerId: null as string | null,
  offerName: null as string | null,
  offerBasePriceCents: null as number | null,
  offerDurationMinutes: null as number | null,
  offerOptions: [] as DraftOfferOption[],
  vehicleType: 'citadine' as VehicleType,
  dirtLevel: 'normal' as DirtLevel,
  optionIds: [] as string[],
  zoneSlug: 'lyon',
  zoneName: null as string | null,
  address: null as DraftAddress | null,
  covered: null as boolean | null,
  slotStart: null as string | null,
  slotEnd: null as string | null,
  quote: null as CatalogQuoteResponse | null,
};

export const useBookingDraftStore = create<BookingDraftState>((set, get) => ({
  ...initial,

  setOffer: (input) =>
    set({
      offerId: input.id,
      offerName: input.name,
      offerBasePriceCents: input.priceCents,
      offerDurationMinutes: input.durationMinutes,
      offerOptions: input.options,
      optionIds: [],
      quote: null,
      slotStart: null,
      slotEnd: null,
    }),

  setVehicleType: (vehicleType) => set({ vehicleType, quote: null }),

  setDirtLevel: (dirtLevel) => set({ dirtLevel, quote: null }),

  toggleOption: (optionId) => {
    const current = get().optionIds;
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    set({ optionIds: next, quote: null });
  },

  setQuote: (quote) => set({ quote }),

  setAddressResult: ({ address, covered, zoneSlug, zoneName }) =>
    set({
      address,
      covered,
      zoneSlug: zoneSlug ?? get().zoneSlug,
      zoneName: zoneName ?? null,
      slotStart: null,
      slotEnd: null,
    }),

  setSlot: (slotStart, slotEnd) => set({ slotStart, slotEnd }),

  reset: () => set({ ...initial }),
}));

export function selectHasOffer(state: BookingDraftState): boolean {
  return Boolean(state.offerId);
}

export function selectCanOpenSlots(state: BookingDraftState): boolean {
  return Boolean(state.offerId && state.address?.addressId && state.covered);
}
