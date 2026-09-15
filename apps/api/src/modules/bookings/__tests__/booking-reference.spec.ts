import { BookingReferenceSchema } from '@carservice/shared-types';
import { generateBookingReference } from '../booking-reference';

describe('generateBookingReference', () => {
  it('produit CS-YYYYMMDD-XXXX en UTC', () => {
    const reference = generateBookingReference(
      new Date('2026-09-06T08:00:00.000Z'),
    );

    expect(BookingReferenceSchema.parse(reference)).toBe(reference);
    expect(reference.startsWith('CS-20260906-')).toBe(true);
  });

  it('génère un suffixe différent à chaque appel', () => {
    const at = new Date('2026-09-06T08:00:00.000Z');
    expect(generateBookingReference(at)).not.toBe(generateBookingReference(at));
  });
});
