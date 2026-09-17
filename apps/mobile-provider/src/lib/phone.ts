/** Normalize FR mobile input to E.164 (+33…). */
export function normalizeFrPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('33') && digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+33${digits.slice(1)}`;
  }
  if (input.trim().startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }
  return input.trim();
}

export function isValidFrMobile(phone: string): boolean {
  const normalized = normalizeFrPhone(phone);
  return /^\+33[67]\d{8}$/.test(normalized);
}
