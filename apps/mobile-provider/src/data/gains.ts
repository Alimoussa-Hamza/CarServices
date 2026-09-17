import { fetchCompletedMissions, type CompletedMissionModel } from './missions';

export type GainsFilter = 'all' | 'week' | 'month';

export type GainsModel = {
  transitLabel: string;
  weekLabel: string;
  monthLabel: string;
  items: CompletedMissionModel[];
};

function startOfWeek(now: Date): Date {
  const date = new Date(now);
  const jsDay = date.getDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function centsFromNetLabel(label: string): number {
  const match = label.replace(/\s/g, '').match(/(\d+),(\d+)/);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 100 + Number(match[2]);
}

export function filterGains(
  items: CompletedMissionModel[],
  filter: GainsFilter,
  now = new Date(),
): CompletedMissionModel[] {
  if (filter === 'week') {
    const from = startOfWeek(now).getTime();
    return items.filter((item) => new Date(item.completedAt).getTime() >= from);
  }
  if (filter === 'month') {
    const from = startOfMonth(now).getTime();
    return items.filter((item) => new Date(item.completedAt).getTime() >= from);
  }
  return items;
}

function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

export function toGainsModel(
  items: CompletedMissionModel[],
  now = new Date(),
): GainsModel {
  const pendingCents = items
    .filter((item) => item.payout === 'pending')
    .reduce((sum, item) => sum + centsFromNetLabel(item.netLabel), 0);
  const weekCents = filterGains(items, 'week', now).reduce(
    (sum, item) => sum + centsFromNetLabel(item.netLabel),
    0,
  );
  const monthCents = filterGains(items, 'month', now).reduce(
    (sum, item) => sum + centsFromNetLabel(item.netLabel),
    0,
  );
  return {
    transitLabel: formatEur(pendingCents),
    weekLabel: formatEur(weekCents),
    monthLabel: formatEur(monthCents),
    items,
  };
}

export async function fetchGains(): Promise<GainsModel> {
  const items = await fetchCompletedMissions();
  return toGainsModel(items);
}
