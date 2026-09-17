import { computePaymentSplit } from '@carservice/shared-types';

export function formatNetEur(totalCents: number): string {
  const { providerNetCents } = computePaymentSplit(totalCents);
  return `${(providerNetCents / 100).toFixed(2).replace('.', ',')} € net`;
}

export function formatDurationLabel(slotStart: string, slotEnd: string): string {
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(slotEnd).getTime() - new Date(slotStart).getTime()) / 60_000,
    ),
  );
  return `${minutes} min`;
}

export function formatSlotLabel(slotStart: string, now = new Date()): string {
  const slot = new Date(slotStart);
  const time = `${String(slot.getHours()).padStart(2, '0')}h${String(slot.getMinutes()).padStart(2, '0')}`;
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDay = new Date(slot.getFullYear(), slot.getMonth(), slot.getDate());
  const dayDiff = Math.round(
    (slotDay.getTime() - startDay.getTime()) / 86_400_000,
  );
  if (dayDiff === 0) {
    return `Aujourd'hui, ${time}`;
  }
  if (dayDiff === 1) {
    return `Demain, ${time}`;
  }
  return `${slot.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}

/** RG-SEC-02: liste = zone / quartier, jamais la rue. */
export function quartierLabel(zoneName: string): string {
  return zoneName.trim();
}

/** RG-SEC-02: rue seulement après accept. */
export function missionLocationCopy(input: {
  quartier: string;
  street: string | null;
}): { title: string; hint: string } {
  return {
    title: quartierLabel(input.quartier),
    hint: input.street ?? 'Adresse exacte après acceptation',
  };
}

export function detectNewMissions(
  previousIds: string[],
  nextIds: string[],
): boolean {
  const previous = new Set(previousIds);
  return nextIds.some((id) => !previous.has(id));
}

/** Maps système (pas de turn-by-turn in-app). react-native-maps = EAS plus tard. */
export function mapsDirectionsUrl(input: {
  lat: number;
  lng: number;
  label: string;
  platform: 'ios' | 'android';
}): string {
  const dest = `${input.lat},${input.lng}`;
  const q = encodeURIComponent(input.label);
  if (input.platform === 'ios') {
    return `http://maps.apple.com/?daddr=${dest}&q=${q}`;
  }
  return `geo:${dest}?q=${dest}(${q})`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export function enRouteCtaLabel(
  status: 'accepted' | 'en_route' | 'in_progress' | string,
): string | null {
  if (status === 'accepted') {
    return 'Je suis en route';
  }
  if (status === 'en_route') {
    return 'Je suis arrivé';
  }
  return null;
}
