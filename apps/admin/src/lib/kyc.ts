import type { KycDocumentType } from '@carservice/shared-types';

const DOC_TYPE_FR: Record<KycDocumentType, string> = {
  rc_pro: 'RC Pro',
  identity: 'Pièce d’identité',
  other: 'Autre',
};

const WASH_METHOD_FR: Record<string, string> = {
  waterless: 'Sans eau',
  steam: 'Vapeur',
};

export function formatKycDocType(docType: KycDocumentType): string {
  return DOC_TYPE_FR[docType] ?? docType;
}

export function formatWashMethods(methods: string[]): string {
  if (methods.length === 0) {
    return '—';
  }
  return methods.map((method) => WASH_METHOD_FR[method] ?? method).join(', ');
}

export function parseKycRejectReason(raw: string): string | null {
  const reason = raw.trim();
  if (reason.length < 5 || reason.length > 500) {
    return null;
  }
  return reason;
}

export function isImageDocumentUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(png|jpe?g|webp|gif)$/.test(path);
  } catch {
    return false;
  }
}
