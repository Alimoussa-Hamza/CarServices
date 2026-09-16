import { isMockZoneCovered } from '../zones';

describe('isMockZoneCovered', () => {
  it('couvre Lyon CP 69', () => {
    expect(
      isMockZoneCovered({ lat: 45.76, lng: 4.83, postalCode: '69001' }),
    ).toBe(true);
  });

  it('refuse Paris CP 75', () => {
    expect(
      isMockZoneCovered({ lat: 48.85, lng: 2.35, postalCode: '75001' }),
    ).toBe(false);
  });
});
