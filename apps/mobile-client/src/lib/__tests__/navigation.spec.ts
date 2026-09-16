import { goBackOr } from '../navigation';

const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: () => back(),
    replace: (href: string) => replace(href),
    canGoBack: () => canGoBack(),
  },
}));

describe('goBackOr', () => {
  beforeEach(() => {
    back.mockReset();
    replace.mockReset();
    canGoBack.mockReset();
  });

  it('appelle back si historique disponible', () => {
    canGoBack.mockReturnValue(true);
    goBackOr('/(tabs)');
    expect(back).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('fallback replace sinon', () => {
    canGoBack.mockReturnValue(false);
    goBackOr('/(tabs)/bookings');
    expect(replace).toHaveBeenCalledWith('/(tabs)/bookings');
  });
});
