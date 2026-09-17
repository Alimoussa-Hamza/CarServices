import { api, ApiError } from '@carservice/api-client';
import type { KycStatus } from '@carservice/shared-types';
import { env, parseUseMocks } from '../config/env';
import {
  canSubmitKyc,
  digitsOnly,
  formulaSlugs,
  LYON_PIN,
  LYON_ZONE_ID,
  MOCK_AVATAR_URL,
  selectedWashMethods,
  toSubmitKycDto,
  toWeeklySlots,
  type KycDraft,
} from '../lib/kyc-validation';
import { bootstrapApiClient } from './api-bootstrap';

export type KycGate = {
  kycStatus: KycStatus;
  chargesEnabled: boolean;
  rejectionReason: string | null;
};

const DRAFT_GATE: KycGate = {
  kycStatus: 'draft',
  chargesEnabled: false,
  rejectionReason: null,
};

let mockKycGate: KycGate = { ...DRAFT_GATE };

function useMocksNow(): boolean {
  return parseUseMocks(process.env.EXPO_PUBLIC_USE_MOCKS, env.useMocks);
}

export function resetMockKycGate(): void {
  mockKycGate = { ...DRAFT_GATE };
}

export function setMockKycGate(gate: KycGate): void {
  mockKycGate = { ...gate };
}

/** Mock = in-memory status after submit. API = kyc/status + me.chargesEnabled. */
export async function fetchKycGate(): Promise<KycGate> {
  if (useMocksNow()) {
    return { ...mockKycGate };
  }

  bootstrapApiClient();
  const [status, me] = await Promise.all([
    api.providers.kycStatus(),
    api.providers.me(),
  ]);
  return {
    kycStatus: status.status,
    chargesEnabled: me.chargesEnabled,
    rejectionReason: status.rejectionReason ?? me.kycRejectionReason,
  };
}

/** Mock only: Actualiser simule la revue admin → approved, sans Connect. */
export async function refreshKycStatus(): Promise<KycGate> {
  if (useMocksNow() && mockKycGate.kycStatus === 'submitted') {
    mockKycGate = {
      kycStatus: 'approved',
      chargesEnabled: false,
      rejectionReason: null,
    };
    return { ...mockKycGate };
  }
  return fetchKycGate();
}

export function enableMockCharges(): void {
  if (mockKycGate.kycStatus === 'approved') {
    mockKycGate = { ...mockKycGate, chargesEnabled: true };
  }
}

export async function submitKycDossier(draft: KycDraft): Promise<KycGate> {
  if (!canSubmitKyc(draft)) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Complétez les 7 étapes avant d’envoyer le dossier.',
      400,
    );
  }

  if (useMocksNow()) {
    mockKycGate = {
      kycStatus: 'submitted',
      chargesEnabled: false,
      rejectionReason: null,
    };
    return { ...mockKycGate };
  }

  bootstrapApiClient();

  await api.providers.updateMe({
    companyName: draft.companyName.trim(),
    siret: digitsOnly(draft.siret),
    bio: draft.bio.trim() || null,
    avatarUrl: draft.hasPortrait ? MOCK_AVATAR_URL : null,
    washMethods: selectedWashMethods(draft),
  });

  const offers = await api.catalog.offers();
  const slugs = formulaSlugs(draft);
  const offerIds = slugs.flatMap((slug) => {
    const offer = offers.find((item) => item.slug === slug);
    return offer ? [offer.id] : [];
  });
  if (offerIds.length === 0) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Choisissez au moins une formule proposée par la plateforme.',
      400,
    );
  }
  await api.providers.updateCapabilities({ offerIds });

  await api.providers.updateAvailability({
    weeklySlots: toWeeklySlots(draft),
    blockedSlots: [],
  });

  const check = await api.zones.check(LYON_PIN);
  if (!check.covered) {
    throw new ApiError(
      'ZONE_UNCOVERED',
      'Cette adresse n’est pas encore couverte.',
      400,
    );
  }
  await api.providers.updateZones({
    zones: [{ zoneId: check.zone.id ?? LYON_ZONE_ID, radiusKm: draft.radiusKm }],
  });

  await api.providers.submitKyc(toSubmitKycDto(draft));
  return fetchKycGate();
}
