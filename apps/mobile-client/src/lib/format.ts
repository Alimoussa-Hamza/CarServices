export function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

export function formatSlotFr(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTimeFr(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
