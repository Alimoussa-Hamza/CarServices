import {
  createAddress,
  deleteAddress,
  listAddresses,
  resetMockAddressesForTests,
} from '../addresses';

describe('addresses (mock)', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    resetMockAddressesForTests();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original;
  });

  it('liste les adresses mock', async () => {
    const list = await listAddresses();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0]?.city).toBe('Lyon');
  });

  it('crée puis supprime une adresse', async () => {
    const created = await createAddress({
      label: 'Test',
      street: '1 rue Test',
      city: 'Lyon',
      postalCode: '69001',
      lat: 45.76,
      lng: 4.83,
      country: 'FR',
    });
    expect(created.id).toBeTruthy();
    await deleteAddress(created.id);
    const list = await listAddresses();
    expect(list.find((a) => a.id === created.id)).toBeUndefined();
  });
});
