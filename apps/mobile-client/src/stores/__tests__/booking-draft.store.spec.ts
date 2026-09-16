import { useBookingDraftStore } from '../booking-draft.store';

describe('booking draft store', () => {
  beforeEach(() => {
    useBookingDraftStore.getState().reset();
  });

  it('sélectionne une offre et reset les options', () => {
    useBookingDraftStore.getState().setOffer({
      id: 'a1111111-1111-4111-8111-111111111102',
      name: 'Confort',
      priceCents: 3900,
      durationMinutes: 75,
      options: [
        {
          id: 'b1111111-1111-4111-8111-111111111202',
          name: 'Poils',
          priceDeltaCents: 500,
          durationDeltaMinutes: 15,
        },
      ],
    });
    useBookingDraftStore.getState().toggleOption('b1111111-1111-4111-8111-111111111202');
    expect(useBookingDraftStore.getState().optionIds).toEqual([
      'b1111111-1111-4111-8111-111111111202',
    ]);
    useBookingDraftStore.getState().toggleOption('b1111111-1111-4111-8111-111111111202');
    expect(useBookingDraftStore.getState().optionIds).toEqual([]);
  });

  it('setAddressResult efface le créneau', () => {
    const store = useBookingDraftStore.getState();
    store.setSlot('2026-09-20T09:00:00.000Z', '2026-09-20T10:15:00.000Z');
    store.setAddressResult({
      address: {
        line1: 'x',
        city: 'Lyon',
        postalCode: '69001',
        lat: 45.76,
        lng: 4.83,
        addressId: 'c1111111-1111-4111-8111-111111111301',
      },
      covered: true,
      zoneSlug: 'lyon',
      zoneName: 'Lyon',
    });
    expect(useBookingDraftStore.getState().slotStart).toBeNull();
    expect(useBookingDraftStore.getState().covered).toBe(true);
  });
});
