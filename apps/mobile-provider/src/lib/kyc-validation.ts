import type { SubmitKycDto, WashMethod } from '@carservice/shared-types';

export const KYC_STEPS = [1, 2, 3, 4, 5, 6, 7] as const;
export type KycStep = (typeof KYC_STEPS)[number];

export const KYC_FORMULAS = [
  {
    key: 'exterieur',
    slug: 'wash-exterior',
    label: 'Extérieur',
    hint: 'Carrosserie et jantes',
  },
  {
    key: 'interieur',
    slug: 'wash-interior',
    label: 'Intérieur',
    hint: 'Habitacle et vitres',
  },
  {
    key: 'complet',
    slug: 'wash-complete',
    label: 'Complet',
    hint: 'Extérieur + intérieur',
  },
  {
    key: 'detailing',
    slug: 'wash-premium',
    label: 'Detailing',
    hint: 'Finition premium',
  },
] as const;
export type KycFormulaKey = (typeof KYC_FORMULAS)[number]['key'];

export const WEEK_DAYS = [
  { key: 1, label: 'Lun' },
  { key: 2, label: 'Mar' },
  { key: 3, label: 'Mer' },
  { key: 4, label: 'Jeu' },
  { key: 5, label: 'Ven' },
  { key: 6, label: 'Sam' },
  { key: 0, label: 'Dim' },
] as const;

export const TIME_CHIPS = [
  { startTime: '08:00', endTime: '12:00', label: '8h-12h' },
  { startTime: '12:00', endTime: '14:00', label: '12h-14h' },
  { startTime: '14:00', endTime: '18:00', label: '14h-18h' },
  { startTime: '18:00', endTime: '20:00', label: '18h-20h' },
] as const;

export const MOCK_RC_FILE_URL = 'https://example.com/rc-pro.pdf';
export const MOCK_AVATAR_URL = 'https://example.com/avatar.jpg';
export const LYON_ZONE_ID = 'd1111111-1111-4111-8111-111111111401';
export const LYON_PIN = { lat: 45.764, lng: 4.8357, postalCode: '69002' };

export const MONTHS_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
] as const;

export const KYC_STEP_META: Record<
  KycStep,
  { title: string; subtitle: string; cta: string }
> = {
  1: {
    title: 'Votre société',
    subtitle: 'Ces informations apparaîtront sur vos factures.',
    cta: 'Continuer',
  },
  2: {
    title: 'Assurance RC Pro',
    subtitle: 'Attestation PDF ou JPG, et date d’expiration.',
    cta: 'Continuer',
  },
  3: {
    title: 'Vos méthodes de lavage',
    subtitle: 'Sélectionnez au moins une méthode que vous proposez.',
    cta: 'Continuer',
  },
  4: {
    title: 'Votre zone d’intervention',
    subtitle: 'Indiquez votre adresse de départ et le rayon que vous couvrez.',
    cta: 'Continuer',
  },
  5: {
    title: 'Vos formules',
    subtitle:
      'Cochez les formules que vous souhaitez proposer. Les tarifs sont fixés par la plateforme.',
    cta: 'Continuer',
  },
  6: {
    title: 'Vos disponibilités',
    subtitle: 'Sélectionnez les jours et créneaux où vous êtes disponible.',
    cta: 'Continuer',
  },
  7: {
    title: 'Votre profil public',
    subtitle: 'Une photo et une courte présentation rassurent vos clients.',
    cta: 'Envoyer mon dossier',
  },
};

export type KycDraft = {
  companyName: string;
  siret: string;
  rcSelected: boolean;
  rcExpiresAt: string;
  waterless: boolean;
  steam: boolean;
  zoneAddress: string;
  radiusKm: number;
  formulas: KycFormulaKey[];
  days: number[];
  timeChipIndexes: number[];
  hasPortrait: boolean;
  bio: string;
};

export const EMPTY_KYC_DRAFT: KycDraft = {
  companyName: '',
  siret: '',
  rcSelected: false,
  rcExpiresAt: '',
  waterless: false,
  steam: false,
  zoneAddress: '',
  radiusKm: 15,
  formulas: [],
  days: [1, 2, 4, 5],
  timeChipIndexes: [0, 2],
  hasPortrait: false,
  bio: '',
};

export function parseKycStep(
  raw: string | string[] | undefined,
): KycStep | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const step = Number(value);
  if (
    step === 1 ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    step === 5 ||
    step === 6 ||
    step === 7
  ) {
    return step;
  }
  return null;
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toIsoDate(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month);
  return `${year}-${pad2(month)}-${pad2(Math.min(day, maxDay))}`;
}

export function parseIsoDate(
  iso: string,
): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
}

export function formatFrDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) {
    return '';
  }
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}

export function defaultFutureExpiry(): {
  year: number;
  month: number;
  day: number;
} {
  const now = new Date();
  return {
    year: now.getFullYear() + 1,
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function expiryYearOptions(): number[] {
  const start = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => start + index);
}

export function clampRadiusKm(value: number): number {
  return Math.min(50, Math.max(5, Math.round(value)));
}

export function formatSiretDisplay(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 14);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidSiret(siret: string): boolean {
  return /^\d{14}$/.test(digitsOnly(siret));
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T23:59:59.999Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= Date.now();
}

export function selectedWashMethods(draft: KycDraft): WashMethod[] {
  const methods: WashMethod[] = [];
  if (draft.waterless) {
    methods.push('waterless');
  }
  if (draft.steam) {
    methods.push('steam');
  }
  return methods;
}

export function canContinueKycStep(step: KycStep, draft: KycDraft): boolean {
  switch (step) {
    case 1:
      return draft.companyName.trim().length >= 2 && isValidSiret(draft.siret);
    case 2:
      return draft.rcSelected && isValidIsoDate(draft.rcExpiresAt);
    case 3:
      return selectedWashMethods(draft).length >= 1;
    case 4:
      return draft.zoneAddress.trim().length >= 5 && draft.radiusKm >= 5;
    case 5:
      return draft.formulas.length >= 1;
    case 6:
      return draft.days.length >= 1 && draft.timeChipIndexes.length >= 1;
    case 7:
      return draft.hasPortrait;
    default:
      return false;
  }
}

export function canSubmitKyc(draft: KycDraft): boolean {
  return KYC_STEPS.every((step) => canContinueKycStep(step, draft));
}

export function formulaSlugs(draft: KycDraft): string[] {
  return draft.formulas.flatMap((key) => {
    const formula = KYC_FORMULAS.find((item) => item.key === key);
    return formula ? [formula.slug] : [];
  });
}

export function toSubmitKycDto(draft: KycDraft): SubmitKycDto {
  return {
    siret: digitsOnly(draft.siret),
    washMethods: selectedWashMethods(draft),
    documents: [
      {
        docType: 'rc_pro',
        fileUrl: MOCK_RC_FILE_URL,
        expiresAt: draft.rcExpiresAt,
      },
    ],
  };
}

export function toWeeklySlots(draft: KycDraft) {
  return draft.days.flatMap((dayOfWeek) =>
    draft.timeChipIndexes.map((index) => {
      const chip = TIME_CHIPS[index];
      return {
        dayOfWeek,
        startTime: chip?.startTime ?? '08:00',
        endTime: chip?.endTime ?? '12:00',
        isActive: true,
      };
    }),
  );
}
