export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** `acceptanceRate` est stocké 0–100. */
export function computeMatchingScore(input: {
  distanceKm: number;
  rating: number;
  acceptanceRate: number;
  lateCount?: number;
  cancelCount?: number;
}): number {
  return (
    input.distanceKm * -10 +
    input.rating * 20 +
    (input.acceptanceRate / 100) * 15 -
    (input.lateCount ?? 0) * 5 -
    (input.cancelCount ?? 0) * 10
  );
}

export function isRcProValid(expiresAt: Date | null | undefined, now: Date): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiresAtEndOfDay = new Date(expiresAt);
  expiresAtEndOfDay.setUTCHours(23, 59, 59, 999);
  return expiresAtEndOfDay.getTime() >= now.getTime();
}

export function minutesFromUtc(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function rangesOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
): boolean {
  return leftStart.getTime() < rightEnd.getTime() && leftEnd.getTime() > rightStart.getTime();
}

export function slotFitsWeeklyAvailability(
  slotStart: Date,
  slotEnd: Date,
  weekly: Array<{
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
  }>,
): boolean {
  if (slotEnd.getTime() <= slotStart.getTime()) {
    return false;
  }

  const day = slotStart.getUTCDay();
  const startMin = minutesFromUtc(slotStart);
  const endMin =
    slotStart.getUTCDay() === slotEnd.getUTCDay()
      ? minutesFromUtc(slotEnd)
      : 24 * 60;

  return weekly.some(
    (slot) =>
      slot.isActive &&
      slot.dayOfWeek === day &&
      minutesFromUtc(slot.startTime) <= startMin &&
      minutesFromUtc(slot.endTime) >= endMin,
  );
}
